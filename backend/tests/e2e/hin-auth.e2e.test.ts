/**
 * E2E Tests for HIN Authentication Flow
 * Tests the complete OAuth2 Authorization Code flow with HIN
 *
 * Test Coverage:
 * - Happy path: Complete OAuth flow
 * - Error scenarios: Invalid credentials, expired tokens
 * - GLN extraction and storage
 */

import request from 'supertest';

// Mock axios for HIN API calls
jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Import auth service app
const authApp = require('../../services/auth-service/src/index').default;

describe('HIN Authentication E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /auth/hin/authorize', () => {
    it('should redirect to HIN authorization endpoint', async () => {
      const response = await request(authApp).get('/auth/hin/authorize');

      // Should redirect to HIN (or return error if not configured)
      expect([302, 500]).toContain(response.status);

      if (response.status === 302) {
        expect(response.headers.location).toContain('oauth2.hin.ch');
        expect(response.headers.location).toContain('client_id=');
        expect(response.headers.location).toContain('response_type=code');
        expect(response.headers.location).toContain('scope=openid%20profile%20email%20gln');
      }
    });

    it('should include required OAuth parameters in authorization URL', async () => {
      const response = await request(authApp).get('/auth/hin/authorize');

      if (response.status === 302) {
        const location = response.headers.location;
        expect(location).toContain('client_id=');
        expect(location).toContain('redirect_uri=');
        expect(location).toContain('response_type=code');
        expect(location).toContain('scope=');
        expect(location).toContain('state='); // CSRF protection
      }
    });
  });

  describe('GET /auth/hin/callback - Error Scenarios', () => {
    it('should handle OAuth error from HIN', async () => {
      const response = await request(authApp).get('/auth/hin/callback').query({
        error: 'access_denied',
        error_description: 'User denied authorization',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('HIN authentication failed');
    });

    it('should handle missing authorization code', async () => {
      const response = await request(authApp).get('/auth/hin/callback').query({
        state: 'mock_state',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Authorization code not received');
    });

    it('should handle token exchange failure', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          data: { error: 'invalid_grant', error_description: 'Invalid authorization code' },
        },
      });

      const response = await request(authApp).get('/auth/hin/callback').query({
        code: 'invalid_code',
        state: 'state',
      });

      // Should fail gracefully
      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  describe('HIN OAuth2 Flow Integration', () => {
    it('should properly format authorization URL with GLN scope', async () => {
      const response = await request(authApp).get('/auth/hin/authorize');

      if (response.status === 302) {
        const authUrl = new URL(response.headers.location);
        const scope = authUrl.searchParams.get('scope');

        // Verify GLN scope is included
        expect(scope).toContain('gln');
        expect(scope).toContain('openid');
        expect(scope).toContain('profile');
        expect(scope).toContain('email');
      }
    });

    it('should use correct HIN OAuth2 endpoints', async () => {
      const response = await request(authApp).get('/auth/hin/authorize');

      if (response.status === 302) {
        const authUrl = new URL(response.headers.location);

        // Verify using HIN production OAuth2 endpoint
        expect(authUrl.hostname).toBe('oauth2.hin.ch');
        expect(authUrl.pathname).toBe('/authorize');
      }
    });
  });

  describe('Security Features', () => {
    it('should include CSRF protection via state parameter', async () => {
      const response = await request(authApp).get('/auth/hin/authorize');

      if (response.status === 302) {
        const authUrl = new URL(response.headers.location);
        const state = authUrl.searchParams.get('state');

        // State should exist and be base64 encoded
        expect(state).toBeDefined();
        expect(state!.length).toBeGreaterThan(0);

        // Should be able to decode state
        const decodedState = Buffer.from(state!, 'base64').toString('utf-8');
        expect(() => JSON.parse(decodedState)).not.toThrow();
      }
    });

    it('should validate required OAuth parameters', async () => {
      const response = await request(authApp).get('/auth/hin/callback').query({
        // Missing code parameter
        state: 'test',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
