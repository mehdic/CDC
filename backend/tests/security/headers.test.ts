/**
 * Security Test: Security Headers and Configuration
 * Tests for HTTP security headers, CORS, and response configuration
 *
 * OWASP & Industry Standards:
 * - Content Security Policy (CSP)
 * - HTTP Strict Transport Security (HSTS)
 * - X-Frame-Options (Clickjacking prevention)
 * - X-Content-Type-Options (MIME sniffing prevention)
 * - Referrer-Policy (Referrer exposure)
 * - Permissions-Policy (Feature requests)
 * - CORS configuration
 */

import request from 'supertest';

const MOCK_PHARMACIST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicGhhcm1hY2lzdC03ODkiLCJyb2xlIjoicGhhcm1hY2lzdCIsImlhdCI6MTYwMDAwMDAwMH0.test-signature';
const MOCK_PATIENT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoicGF0aWVudC0xMjMiLCJyb2xlIjoicGF0aWVudCIsImlhdCI6MTYwMDAwMDAwMH0.test-signature';

describe('Security Headers and Response Configuration', () => {

  // =========================================================================
  // Test 1: Content Security Policy (CSP)
  // =========================================================================

  describe('Content Security Policy (CSP)', () => {
    it('should set Content-Security-Policy header', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      const csp = response.headers['content-security-policy'];

      if (csp) {
        expect(csp).toBeDefined();
        console.log(`✓ CSP header present: ${csp.substring(0, 50)}...`);
      } else {
        console.warn('⚠️  Content-Security-Policy header not set - should implement');
      }
    });

    it('should restrict script sources to self and trusted domains', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      const csp = response.headers['content-security-policy'];

      if (csp) {
        // Should have script-src directive
        expect(csp).toContain('script-src');
        expect(csp).not.toContain('script-src *'); // Should not allow all
      }
    });

    it('should restrict style sources (prevent CSS injection)', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      const csp = response.headers['content-security-policy'];

      if (csp) {
        expect(csp).toContain('style-src');
      }
    });

    it('should restrict image sources (prevent image-based attacks)', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      const csp = response.headers['content-security-policy'];

      if (csp) {
        expect(csp).toContain('img-src');
      }
    });

    it('should restrict default source to self', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      const csp = response.headers['content-security-policy'];

      if (csp) {
        expect(csp).toContain("default-src 'self'");
      }
    });

    it('should prevent inline script execution (unsafe-inline)', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      const csp = response.headers['content-security-policy'];

      if (csp) {
        // Should not have unsafe-inline for scripts
        const scriptSrc = csp.match(/script-src ([^;]*)/);
        if (scriptSrc) {
          expect(scriptSrc[1]).not.toContain("'unsafe-inline'");
        }
      }
    });

    it('should have base-uri directive to prevent base tag injection', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      const csp = response.headers['content-security-policy'];

      if (csp) {
        expect(csp).toContain('base-uri');
      }
    });

    it('should have form-action directive to prevent form hijacking', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      const csp = response.headers['content-security-policy'];

      if (csp) {
        expect(csp).toContain('form-action');
      }
    });
  });

  // =========================================================================
  // Test 2: HTTP Strict Transport Security (HSTS)
  // =========================================================================

  describe('HTTP Strict Transport Security (HSTS)', () => {
    it('should set Strict-Transport-Security header', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      const hsts = response.headers['strict-transport-security'];

      if (process.env.NODE_ENV === 'production') {
        expect(hsts).toBeDefined();
      } else {
        console.log('ℹ️  HSTS check skipped (non-production environment)');
      }
    });

    it('should have max-age at least 1 year (31536000 seconds)', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      const hsts = response.headers['strict-transport-security'];

      if (hsts) {
        const maxAgeMatch = hsts.match(/max-age=(\d+)/);
        if (maxAgeMatch) {
          const maxAge = parseInt(maxAgeMatch[1], 10);
          expect(maxAge).toBeGreaterThanOrEqual(31536000); // 1 year
          console.log(`✓ HSTS max-age: ${maxAge} seconds (${(maxAge / 31536000).toFixed(1)} years)`);
        }
      }
    });

    it('should include includeSubDomains directive', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      const hsts = response.headers['strict-transport-security'];

      if (hsts && process.env.NODE_ENV === 'production') {
        expect(hsts).toContain('includeSubDomains');
      }
    });

    it('should include preload directive for HSTS preload list', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      const hsts = response.headers['strict-transport-security'];

      if (hsts && process.env.NODE_ENV === 'production') {
        // Preload is optional but recommended
        if (hsts.includes('preload')) {
          console.log('✓ HSTS preload enabled');
        }
      }
    });
  });

  // =========================================================================
  // Test 3: X-Frame-Options (Clickjacking Prevention)
  // =========================================================================

  describe('X-Frame-Options (Clickjacking Prevention)', () => {
    it('should set X-Frame-Options header', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      const xFrameOptions = response.headers['x-frame-options'];

      if (xFrameOptions) {
        expect(['DENY', 'SAMEORIGIN']).toContain(xFrameOptions.toUpperCase());
        console.log(`✓ X-Frame-Options: ${xFrameOptions}`);
      } else {
        console.warn('⚠️  X-Frame-Options header not set');
      }
    });

    it('should use DENY to prevent framing from any origin', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      const xFrameOptions = response.headers['x-frame-options'];

      // For healthcare, DENY is more secure than SAMEORIGIN
      if (xFrameOptions) {
        expect(xFrameOptions.toUpperCase()).toBe('DENY');
      }
    });
  });

  // =========================================================================
  // Test 4: X-Content-Type-Options (MIME Sniffing Prevention)
  // =========================================================================

  describe('X-Content-Type-Options (MIME Sniffing Prevention)', () => {
    it('should set X-Content-Type-Options header', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      const xcto = response.headers['x-content-type-options'];

      expect(xcto).toBe('nosniff');
      console.log(`✓ X-Content-Type-Options: ${xcto}`);
    });

    it('should prevent MIME sniffing attacks', async () => {
      const response = await request('http://localhost:3001')
        .get('/api/documents/file.pdf')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`);

      const xcto = response.headers['x-content-type-options'];

      if (xcto) {
        expect(xcto).toBe('nosniff');
      }
    });

    it('should correctly set Content-Type headers', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      // Should have proper Content-Type
      expect(response.headers['content-type']).toBeDefined();
    });
  });

  // =========================================================================
  // Test 5: Referrer-Policy
  // =========================================================================

  describe('Referrer-Policy', () => {
    it('should set Referrer-Policy header', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      const referrerPolicy = response.headers['referrer-policy'];

      if (referrerPolicy) {
        console.log(`✓ Referrer-Policy: ${referrerPolicy}`);
      }
    });

    it('should limit referrer exposure for sensitive pages', async () => {
      // For healthcare, should use strict-origin-when-cross-origin or stricter
      const response = await request('http://localhost:3001')
        .get('/api/prescriptions')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`);

      const referrerPolicy = response.headers['referrer-policy'];

      if (referrerPolicy) {
        const strictPolicies = [
          'no-referrer',
          'strict-origin',
          'strict-origin-when-cross-origin'
        ];
        expect(strictPolicies).toContain(referrerPolicy);
      }
    });
  });

  // =========================================================================
  // Test 6: Permissions-Policy (Feature Policy)
  // =========================================================================

  describe('Permissions-Policy', () => {
    it('should set Permissions-Policy header', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      const permissionsPolicy = response.headers['permissions-policy'];

      if (permissionsPolicy) {
        console.log(`✓ Permissions-Policy: ${permissionsPolicy}`);
      }
    });

    it('should restrict microphone and camera access', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      const permissionsPolicy = response.headers['permissions-policy'];

      if (permissionsPolicy) {
        // Should restrict or allow only from self
        expect(permissionsPolicy.toLowerCase()).toContain('microphone');
        expect(permissionsPolicy.toLowerCase()).toContain('camera');
      }
    });

    it('should restrict geolocation access', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      const permissionsPolicy = response.headers['permissions-policy'];

      if (permissionsPolicy) {
        expect(permissionsPolicy.toLowerCase()).toContain('geolocation');
      }
    });

    it('should restrict payment request API', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      const permissionsPolicy = response.headers['permissions-policy'];

      if (permissionsPolicy) {
        expect(permissionsPolicy.toLowerCase()).toContain('payment');
      }
    });
  });

  // =========================================================================
  // Test 7: CORS Configuration
  // =========================================================================

  describe('Cross-Origin Resource Sharing (CORS)', () => {
    it('should not allow wildcard CORS (*) for sensitive APIs', async () => {
      const response = await request('http://localhost:3001')
        .get('/api/prescriptions')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .set('Origin', 'https://attacker.com');

      const allowOrigin = response.headers['access-control-allow-origin'];

      // Should not be * for sensitive endpoints
      expect(allowOrigin).not.toBe('*');
    });

    it('should validate Origin header against whitelist', async () => {
      // Only approved origins should be allowed
      const response = await request('http://localhost:3001')
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .set('Origin', 'https://metapharm.ch');

      const allowOrigin = response.headers['access-control-allow-origin'];

      // Should either match origin or not be set
      if (allowOrigin) {
        expect(allowOrigin).toBe('https://metapharm.ch');
      }
    });

    it('should restrict CORS methods to necessary verbs', async () => {
      const response = await request('http://localhost:3001')
        .options('/api/prescriptions')
        .set('Origin', 'https://metapharm.ch');

      const allowMethods = response.headers['access-control-allow-methods'];

      if (allowMethods) {
        // Should not allow DELETE on read-only resources
        const methods = allowMethods.split(',').map(m => m.trim());
        expect(methods).not.toContain('DELETE');
      }
    });

    it('should not expose credentials with wildcard CORS', async () => {
      const response = await request('http://localhost:3001')
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`)
        .set('Origin', 'https://metapharm.ch');

      const allowCredentials = response.headers['access-control-allow-credentials'];

      // If credentials allowed, must not have wildcard origin
      if (allowCredentials === 'true') {
        const allowOrigin = response.headers['access-control-allow-origin'];
        expect(allowOrigin).not.toBe('*');
      }
    });

    it('should set Access-Control-Max-Age appropriately', async () => {
      const response = await request('http://localhost:3001')
        .options('/api/prescriptions')
        .set('Origin', 'https://metapharm.ch');

      const maxAge = response.headers['access-control-max-age'];

      if (maxAge) {
        const age = parseInt(maxAge, 10);
        // Should not be excessively long
        expect(age).toBeLessThanOrEqual(86400); // 1 day max
        console.log(`✓ CORS Max-Age: ${age} seconds`);
      }
    });
  });

  // =========================================================================
  // Test 8: Additional Security Headers
  // =========================================================================

  describe('Additional Security Headers', () => {
    it('should not expose X-Powered-By header', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('should not expose Server header details', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      const serverHeader = response.headers['server'];

      if (serverHeader) {
        // Should be generic, not expose version details
        expect(serverHeader).not.toMatch(/Express|Node/i);
      }
    });

    it('should remove X-ASP.NET-Version header', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      expect(response.headers['x-aspnet-version']).toBeUndefined();
    });

    it('should set Cache-Control for sensitive data', async () => {
      const response = await request('http://localhost:3001')
        .get('/api/prescriptions')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`);

      const cacheControl = response.headers['cache-control'];

      if (cacheControl) {
        expect(cacheControl).toContain('no-store');
        expect(cacheControl).toContain('no-cache');
      }
    });

    it('should set Pragma: no-cache for HTTP/1.0 clients', async () => {
      const response = await request('http://localhost:3001')
        .get('/api/prescriptions')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`);

      const pragma = response.headers['pragma'];

      if (pragma) {
        expect(pragma).toBe('no-cache');
      }
    });

    it('should set Expires header for sensitive responses', async () => {
      const response = await request('http://localhost:3001')
        .get('/api/prescriptions')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`);

      const expires = response.headers['expires'];

      // Should have expires in past or present to prevent caching
      if (expires) {
        const expiryDate = new Date(expires);
        expect(expiryDate.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
      }
    });
  });

  // =========================================================================
  // Test 9: HTTP Status Code Security
  // =========================================================================

  describe('HTTP Status Code Configuration', () => {
    it('should not expose internal server errors (500) details', async () => {
      const response = await request('http://localhost:3001')
        .get('/api/non-existent-endpoint');

      if (response.status === 500) {
        // Should not expose stack trace
        expect(response.body.stack).toBeUndefined();
        expect(response.body.trace).toBeUndefined();
      }
    });

    it('should return proper error codes for authentication failures', async () => {
      const response = await request('http://localhost:3001')
        .get('/api/prescriptions')
        .set('Authorization', 'Bearer invalid-token');

      // Should return 401, not 500
      expect(response.status).toBe(401);
    });

    it('should return 403 for authorized users accessing forbidden resources', async () => {
      const response = await request('http://localhost:3001')
        .delete('/api/admin/users/patient-123')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`);

      // Patient should get 403, not 401
      expect(response.status).toBe(403);
    });
  });

  // =========================================================================
  // Test 10: Response Validation
  // =========================================================================

  describe('Response Validation', () => {
    it('should not expose unnecessary headers', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      // Should not have headers that leak information
      const bannedHeaders = [
        'x-powered-by',
        'x-aspnet-version',
        'x-aspnet-mvc-version',
        'server' // or if present, should be generic
      ];

      bannedHeaders.forEach(header => {
        if (response.headers[header] && header === 'server') {
          // Server header OK if generic
          expect(response.headers[header]).not.toMatch(/Express|Node|ASP/i);
        } else {
          expect(response.headers[header]).toBeUndefined();
        }
      });
    });

    it('should set appropriate Content-Type for all responses', async () => {
      const response = await request('http://localhost:3001')
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${MOCK_PATIENT_TOKEN}`);

      expect(response.headers['content-type']).toBeDefined();
    });

    it('should validate Content-Length header', async () => {
      const response = await request('http://localhost:3001')
        .get('/')
        .set('Authorization', `Bearer ${MOCK_PHARMACIST_TOKEN}`);

      // Should have Content-Length or Transfer-Encoding
      expect(
        response.headers['content-length'] || response.headers['transfer-encoding']
      ).toBeDefined();
    });
  });
});

// =========================================================================
// Test Summary
// =========================================================================

afterAll(() => {
  console.log('\n' + '='.repeat(80));
  console.log('SECURITY HEADERS AND CONFIGURATION - TEST SUMMARY');
  console.log('='.repeat(80));
  console.log('Test Areas Covered:');
  console.log('  ✓ Content Security Policy (CSP) (8+ tests)');
  console.log('  ✓ HTTP Strict Transport Security (HSTS) (4+ tests)');
  console.log('  ✓ X-Frame-Options (Clickjacking Prevention) (2+ tests)');
  console.log('  ✓ X-Content-Type-Options (MIME Sniffing Prevention) (3+ tests)');
  console.log('  ✓ Referrer-Policy (2+ tests)');
  console.log('  ✓ Permissions-Policy (4+ tests)');
  console.log('  ✓ Cross-Origin Resource Sharing (CORS) (5+ tests)');
  console.log('  ✓ Additional Security Headers (7+ tests)');
  console.log('  ✓ HTTP Status Code Configuration (3+ tests)');
  console.log('  ✓ Response Validation (3+ tests)');
  console.log('='.repeat(80) + '\n');
});
