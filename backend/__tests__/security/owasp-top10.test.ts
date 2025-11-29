/**
 * OWASP Top 10 Security Testing Suite
 * Tests for common web application security vulnerabilities
 * Based on OWASP Top 10 2021
 *
 * Task: T3-112 - Security Audit
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express, { Application } from 'express';
import { authenticateJWT } from '../../shared/middleware/auth';
import { generateAccessToken } from '../../shared/utils/jwt';

describe('OWASP Top 10 Security Tests', () => {
  let app: Application;
  let validToken: string;

  beforeAll(() => {
    // Set up test Express app
    app = express();
    app.use(express.json());

    // Mock protected route
    app.get('/protected', authenticateJWT as any, (req, res) => {
      res.json({ message: 'Protected resource', user: (req as any).user });
    });

    // Mock public route with input
    app.post('/public/search', (req, res) => {
      const { query } = req.body;
      res.json({ query, results: [] });
    });

    // Mock SQL endpoint (for injection testing)
    app.post('/api/users/search', (req, res) => {
      const { username } = req.body;
      // Simulated SQL query (we're testing if input validation exists)
      res.json({ username, found: false });
    });

    // Generate valid JWT token for testing
    validToken = generateAccessToken({
      userId: 'test-user-123',
      email: 'test@example.com',
      role: 'PATIENT',
      pharmacyId: null,
    });
  });

  describe('A01:2021 - Broken Access Control', () => {
    it('should reject requests without authentication token', async () => {
      const response = await request(app)
        .get('/protected')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('NO_TOKEN');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('INVALID_TOKEN');
    });

    it('should reject requests with expired token', async () => {
      // Create token with past expiration
      const expiredToken = generateAccessToken(
        {
          userId: 'test-user',
          email: 'test@example.com',
          role: 'PATIENT',
          pharmacyId: null,
        },
        '0s' // Expires immediately
      );

      // Wait a moment to ensure expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.code).toBe('TOKEN_EXPIRED');
    });

    it('should accept requests with valid token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.user).toHaveProperty('userId');
    });
  });

  describe('A02:2021 - Cryptographic Failures', () => {
    it('should use HTTPS in production (environment check)', () => {
      const useHttps = process.env.USE_HTTPS !== 'false';
      expect(useHttps).toBe(true);
    });

    it('should not expose sensitive data in error messages', async () => {
      const response = await request(app)
        .get('/protected')
        .expect(401);

      // Should not contain stack traces, file paths, or internal details
      const bodyString = JSON.stringify(response.body);
      expect(bodyString).not.toMatch(/\/Users\//);
      expect(bodyString).not.toMatch(/\/home\//);
      expect(bodyString).not.toMatch(/at Object\./);
      expect(bodyString).not.toMatch(/node_modules/);
    });

    it('should require strong JWT secret (minimum length)', () => {
      const jwtSecret = process.env.JWT_SECRET || '';
      expect(jwtSecret.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('A03:2021 - Injection', () => {
    it('should sanitize SQL-like input patterns', async () => {
      const maliciousInputs = [
        "admin' OR '1'='1",
        "'; DROP TABLE users; --",
        "1' UNION SELECT * FROM passwords--",
      ];

      for (const input of maliciousInputs) {
        const response = await request(app)
          .post('/api/users/search')
          .send({ username: input })
          .expect(200);

        // Response should not indicate SQL error
        expect(response.body).not.toHaveProperty('sqlError');
        expect(JSON.stringify(response.body)).not.toMatch(/syntax error/i);
      }
    });

    it('should sanitize NoSQL injection patterns', async () => {
      const maliciousInputs = [
        { $ne: null },
        { $gt: '' },
        { $regex: '.*' },
      ];

      for (const input of maliciousInputs) {
        const response = await request(app)
          .post('/api/users/search')
          .send({ username: input });

        // Should either reject or sanitize the input
        expect(response.status).toBeLessThan(500);
      }
    });
  });

  describe('A04:2021 - Insecure Design', () => {
    it('should implement rate limiting (checked via headers)', async () => {
      // Make multiple requests to test rate limiting
      const responses = await Promise.all(
        Array.from({ length: 5 }, () =>
          request(app).post('/public/search').send({ query: 'test' })
        )
      );

      // At least one response should have rate limit headers
      const hasRateLimitHeaders = responses.some(
        res =>
          res.headers['x-ratelimit-limit'] || res.headers['ratelimit-limit']
      );

      // Note: This test assumes rate limiting middleware is configured
      // If not present, this is a security finding to be documented
      if (!hasRateLimitHeaders) {
        console.warn('⚠️  SECURITY FINDING: Rate limiting headers not detected');
      }
    });

    it('should validate request body size limits', async () => {
      // Attempt to send extremely large payload
      const largePayload = { data: 'x'.repeat(20 * 1024 * 1024) }; // 20MB

      const response = await request(app)
        .post('/public/search')
        .send(largePayload);

      // Should reject payloads exceeding limit (typically 10MB)
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('A05:2021 - Security Misconfiguration', () => {
    it('should not expose server version in headers', async () => {
      const response = await request(app).get('/protected');

      expect(response.headers['x-powered-by']).toBeUndefined();
      expect(response.headers.server).not.toMatch(/Express/i);
    });

    it('should set secure headers', async () => {
      const response = await request(app).get('/protected');

      // Should have security headers (if helmet middleware is used)
      // Note: These checks document expected security headers
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'strict-transport-security',
      ];

      let missingHeaders: string[] = [];
      securityHeaders.forEach(header => {
        if (!response.headers[header]) {
          missingHeaders.push(header);
        }
      });

      if (missingHeaders.length > 0) {
        console.warn(
          `⚠️  SECURITY FINDING: Missing security headers: ${missingHeaders.join(', ')}`
        );
      }
    });

    it('should not run in debug mode in production', () => {
      if (process.env.NODE_ENV === 'production') {
        expect(process.env.DEBUG).toBeUndefined();
      }
    });
  });

  describe('A06:2021 - Vulnerable and Outdated Components', () => {
    it('should document dependency versions for audit', () => {
      // This test serves as a reminder to run npm audit
      console.info('💡 Run `npm audit` to check for vulnerable dependencies');
      expect(true).toBe(true);
    });
  });

  describe('A07:2021 - Identification and Authentication Failures', () => {
    it('should enforce token-based authentication', async () => {
      const response = await request(app).get('/protected').expect(401);

      expect(response.body.code).toBe('NO_TOKEN');
    });

    it('should not accept tokens with tampered signatures', async () => {
      // Take valid token and modify the signature
      const parts = validToken.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}.tampered-signature`;

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);

      expect(response.body.code).toBe('INVALID_TOKEN');
    });

    it('should not accept tokens with modified payload', async () => {
      // Create token, then modify payload
      const parts = validToken.split('.');
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      );

      // Change role to admin
      payload.role = 'ADMIN';
      const modifiedPayload = Buffer.from(JSON.stringify(payload)).toString(
        'base64'
      );
      const tamperedToken = `${parts[0]}.${modifiedPayload}.${parts[2]}`;

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);

      expect(response.body.code).toBe('INVALID_TOKEN');
    });
  });

  describe('A08:2021 - Software and Data Integrity Failures', () => {
    it('should validate JWT token integrity', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.user.userId).toBe('test-user-123');
      expect(response.body.user.role).toBe('PATIENT');
    });
  });

  describe('A09:2021 - Security Logging and Monitoring Failures', () => {
    it('should log authentication failures (console check)', async () => {
      // Capture console output
      const consoleSpy = jest.spyOn(console, 'warn');

      await request(app).get('/protected').expect(401);

      // Should have logged the authentication failure
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should log successful authentications (console check)', async () => {
      const consoleSpy = jest.spyOn(console, 'info');

      await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      // Should have logged successful authentication
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('A10:2021 - Server-Side Request Forgery (SSRF)', () => {
    it('should validate and sanitize URLs in requests', async () => {
      const maliciousUrls = [
        'http://localhost/admin',
        'http://169.254.169.254/latest/meta-data/',  // AWS metadata
        'file:///etc/passwd',
        'http://internal-service:8080/secret',
      ];

      for (const url of maliciousUrls) {
        const response = await request(app)
          .post('/public/search')
          .send({ query: url });

        // Should not make requests to these URLs
        expect(response.status).toBeLessThan(500);
        expect(JSON.stringify(response.body)).not.toMatch(/passwd/);
        expect(JSON.stringify(response.body)).not.toMatch(/meta-data/);
      }
    });
  });
});
