/**
 * HIN Provider Unit Tests
 *
 * Tests for HIN OAuth2 provider implementation
 * Task: T5-002 (HIN Authentication Service Implementation)
 */

import axios from 'axios';
import { HINProvider, HINProviderError } from '../providers/hin-provider';
import {
  generateStateParameter,
  validateStateParameter,
  parseHINProfession,
  buildAuthorizationUrl,
  validateHINConfig,
} from '../providers/hin-config';
import type { HINTokenResponse, HINUserInfo } from '../providers/hin-config';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HIN Provider Configuration', () => {
  beforeEach(() => {
    // Set up environment variables for tests
    process.env.HIN_CLIENT_ID = 'test_client_id';
    process.env.HIN_CLIENT_SECRET = 'test_client_secret';
    process.env.HIN_REDIRECT_URI = 'http://localhost:4001/auth/hin/callback';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration Validation', () => {
    it('should validate valid HIN configuration', () => {
      const config = {
        clientId: 'test_client_id',
        clientSecret: 'test_client_secret',
        redirectUri: 'http://localhost:4001/auth/hin/callback',
        authorizationEndpoint: 'https://oauth2.hin.ch/authorize',
        tokenEndpoint: 'https://oauth2.hin.ch/REST/v1/getoAuthToken',
        userInfoEndpoint: 'https://oauth2.hin.ch/userinfo',
        scopes: ['openid', 'profile', 'email'],
      };

      const result = validateHINConfig(config);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject configuration without client ID', () => {
      const config = {
        clientId: '',
        clientSecret: 'test_client_secret',
        redirectUri: 'http://localhost:4001/auth/hin/callback',
        authorizationEndpoint: 'https://oauth2.hin.ch/authorize',
        tokenEndpoint: 'https://oauth2.hin.ch/REST/v1/getoAuthToken',
        userInfoEndpoint: 'https://oauth2.hin.ch/userinfo',
        scopes: ['openid', 'profile', 'email'],
      };

      const result = validateHINConfig(config);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('HIN_CLIENT_ID');
    });

    it('should reject configuration without redirect URI', () => {
      const config = {
        clientId: 'test_client_id',
        clientSecret: 'test_client_secret',
        redirectUri: '',
        authorizationEndpoint: 'https://oauth2.hin.ch/authorize',
        tokenEndpoint: 'https://oauth2.hin.ch/REST/v1/getoAuthToken',
        userInfoEndpoint: 'https://oauth2.hin.ch/userinfo',
        scopes: ['openid', 'profile', 'email'],
      };

      const result = validateHINConfig(config);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('HIN_REDIRECT_URI');
    });
  });

  describe('State Parameter Generation and Validation', () => {
    it('should generate valid state parameter', () => {
      const state = generateStateParameter();
      expect(state).toBeTruthy();
      expect(typeof state).toBe('string');
      expect(state.length).toBeGreaterThan(10);
    });

    it('should validate fresh state parameter', () => {
      const state = generateStateParameter();
      const isValid = validateStateParameter(state);
      expect(isValid).toBe(true);
    });

    it('should reject expired state parameter', () => {
      const expiredState = Buffer.from(
        JSON.stringify({
          timestamp: Date.now() - 700000, // 11+ minutes ago
          nonce: 'test',
        })
      ).toString('base64url');

      const isValid = validateStateParameter(expiredState);
      expect(isValid).toBe(false);
    });

    it('should reject malformed state parameter', () => {
      const isValid = validateStateParameter('invalid-state');
      expect(isValid).toBe(false);
    });
  });

  describe('Authorization URL Building', () => {
    it('should build correct authorization URL', () => {
      const config = {
        clientId: 'test_client_id',
        clientSecret: 'test_client_secret',
        redirectUri: 'http://localhost:4001/auth/hin/callback',
        authorizationEndpoint: 'https://oauth2.hin.ch/authorize',
        tokenEndpoint: 'https://oauth2.hin.ch/REST/v1/getoAuthToken',
        userInfoEndpoint: 'https://oauth2.hin.ch/userinfo',
        scopes: ['openid', 'profile', 'email'],
      };

      const state = 'test_state';
      const url = buildAuthorizationUrl(config, state);

      expect(url).toContain('https://oauth2.hin.ch/authorize');
      expect(url).toContain('client_id=test_client_id');
      expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A4001%2Fauth%2Fhin%2Fcallback');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=openid+profile+email');
      expect(url).toContain('state=test_state');
    });
  });

  describe('Profession Parsing', () => {
    it('should parse pharmacist profession (English)', () => {
      expect(parseHINProfession('Pharmacist')).toBe('pharmacist');
      expect(parseHINProfession('Community Pharmacist')).toBe('pharmacist');
    });

    it('should parse pharmacist profession (German)', () => {
      expect(parseHINProfession('Apotheker')).toBe('pharmacist');
      expect(parseHINProfession('Apothekerin')).toBe('pharmacist');
    });

    it('should parse pharmacist profession (French)', () => {
      expect(parseHINProfession('Pharmacien')).toBe('pharmacist');
      expect(parseHINProfession('Pharmacienne')).toBe('pharmacist');
    });

    it('should parse nurse profession (English)', () => {
      expect(parseHINProfession('Nurse')).toBe('nurse');
      expect(parseHINProfession('Registered Nurse')).toBe('nurse');
    });

    it('should parse nurse profession (German)', () => {
      expect(parseHINProfession('Krankenschwester')).toBe('nurse');
      expect(parseHINProfession('Pflegefachperson')).toBe('nurse');
    });

    it('should parse nurse profession (French)', () => {
      expect(parseHINProfession('Infirmière')).toBe('nurse');
      expect(parseHINProfession('Infirmier')).toBe('nurse');
    });

    it('should default to doctor for unknown profession', () => {
      expect(parseHINProfession('Unknown')).toBe('doctor');
      expect(parseHINProfession()).toBe('doctor');
    });

    it('should parse doctor profession', () => {
      expect(parseHINProfession('Doctor')).toBe('doctor');
      expect(parseHINProfession('Arzt')).toBe('doctor');
      expect(parseHINProfession('Médecin')).toBe('doctor');
    });
  });
});

describe('HIN Provider OAuth2 Flow', () => {
  let provider: HINProvider;

  beforeEach(() => {
    process.env.HIN_CLIENT_ID = 'test_client_id';
    process.env.HIN_CLIENT_SECRET = 'test_client_secret';
    process.env.HIN_REDIRECT_URI = 'http://localhost:4001/auth/hin/callback';

    provider = new HINProvider();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authorization Initiation', () => {
    it('should initiate authorization and return URL and state', () => {
      const result = provider.initiateAuthorization();

      expect(result.authorizationUrl).toContain('https://oauth2.hin.ch/authorize');
      expect(result.authorizationUrl).toContain('client_id=test_client_id');
      expect(result.state).toBeTruthy();
      expect(typeof result.state).toBe('string');
    });
  });

  describe('Token Exchange', () => {
    it('should exchange authorization code for access token', async () => {
      const mockTokenResponse: HINTokenResponse = {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid profile email',
      };

      const mockUserInfo: HINUserInfo = {
        sub: 'hin_12345',
        email: 'doctor@example.com',
        given_name: 'John',
        family_name: 'Doe',
        profession: 'Doctor',
        gln: '7601001234567',
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockTokenResponse });
      mockedAxios.get.mockResolvedValueOnce({ data: mockUserInfo });

      const state = generateStateParameter();
      const result = await provider.exchangeCodeForToken('test_code', state);

      expect(result.accessToken).toBe('mock_access_token');
      expect(result.refreshToken).toBe('mock_refresh_token');
      expect(result.expiresIn).toBe(3600);
      expect(result.userInfo.sub).toBe('hin_12345');
      expect(result.userInfo.email).toBe('doctor@example.com');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('getoAuthToken'),
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
    });

    it('should reject invalid state parameter', async () => {
      const invalidState = 'invalid_state';

      await expect(provider.exchangeCodeForToken('test_code', invalidState)).rejects.toThrow(
        HINProviderError
      );
      await expect(provider.exchangeCodeForToken('test_code', invalidState)).rejects.toThrow(
        'Invalid or expired state parameter'
      );
    });

    it('should handle token exchange errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          data: { error: 'invalid_grant', error_description: 'Authorization code expired' },
        },
      });

      const state = generateStateParameter();

      await expect(provider.exchangeCodeForToken('expired_code', state)).rejects.toThrow(
        HINProviderError
      );
    });

    it('should handle missing access token in response', async () => {
      const mockTokenResponse = {
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid profile email',
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockTokenResponse });

      const state = generateStateParameter();

      await expect(provider.exchangeCodeForToken('test_code', state)).rejects.toThrow(
        'No access token received from HIN'
      );
    });
  });

  describe('User Info Fetch', () => {
    it('should fetch user information successfully', async () => {
      const mockUserInfo: HINUserInfo = {
        sub: 'hin_12345',
        email: 'pharmacist@example.com',
        given_name: 'Jane',
        family_name: 'Smith',
        profession: 'Pharmacist',
        gln: '7601001234567',
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockUserInfo });

      const userInfo = await provider.fetchUserInfo('mock_access_token');

      expect(userInfo.sub).toBe('hin_12345');
      expect(userInfo.email).toBe('pharmacist@example.com');
      expect(userInfo.profession).toBe('Pharmacist');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('userinfo'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer mock_access_token' },
        })
      );
    });

    it('should reject incomplete user information', async () => {
      const incompleteUserInfo = {
        sub: 'hin_12345',
        // Missing email
      };

      mockedAxios.get.mockResolvedValueOnce({ data: incompleteUserInfo });

      await expect(provider.fetchUserInfo('mock_access_token')).rejects.toThrow(
        'Incomplete user information from HIN'
      );
    });

    it('should handle userinfo fetch errors', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          data: { error: 'invalid_token' },
        },
      });

      await expect(provider.fetchUserInfo('invalid_token')).rejects.toThrow(HINProviderError);
    });
  });

  describe('Token Refresh', () => {
    it('should refresh access token successfully', async () => {
      const mockTokenResponse: HINTokenResponse = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid profile email',
      };

      mockedAxios.post.mockResolvedValueOnce({ data: mockTokenResponse });

      const result = await provider.refreshAccessToken('old_refresh_token');

      expect(result.accessToken).toBe('new_access_token');
      expect(result.refreshToken).toBe('new_refresh_token');
      expect(result.expiresIn).toBe(3600);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('getoAuthToken'),
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );

      const callArgs = mockedAxios.post.mock.calls[0][1] as URLSearchParams;
      expect(callArgs.get('grant_type')).toBe('refresh_token');
      expect(callArgs.get('refresh_token')).toBe('old_refresh_token');
    });

    it('should handle token refresh errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          data: { error: 'invalid_grant', error_description: 'Refresh token expired' },
        },
      });

      await expect(provider.refreshAccessToken('expired_refresh_token')).rejects.toThrow(
        HINProviderError
      );
      await expect(provider.refreshAccessToken('expired_refresh_token')).rejects.toThrow(
        'Failed to refresh access token'
      );
    });
  });

  describe('Token Validation', () => {
    it('should validate valid access token', async () => {
      const mockUserInfo: HINUserInfo = {
        sub: 'hin_12345',
        email: 'doctor@example.com',
        given_name: 'John',
        family_name: 'Doe',
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockUserInfo });

      const isValid = await provider.validateToken('valid_access_token');
      expect(isValid).toBe(true);
    });

    it('should reject invalid access token', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          data: { error: 'invalid_token' },
        },
      });

      const isValid = await provider.validateToken('invalid_access_token');
      expect(isValid).toBe(false);
    });
  });

  describe('Credential Extraction', () => {
    it('should extract credentials from HIN user info', () => {
      const mockUserInfo: HINUserInfo = {
        sub: 'hin_12345',
        email: 'DOCTOR@EXAMPLE.COM', // Test email normalization
        given_name: 'John',
        family_name: 'Doe',
        profession: 'Arzt',
        gln: '7601001234567',
      };

      const credentials = provider.extractCredentials(mockUserInfo);

      expect(credentials.hinId).toBe('hin_12345');
      expect(credentials.email).toBe('doctor@example.com'); // Lowercase
      expect(credentials.firstName).toBe('John');
      expect(credentials.lastName).toBe('Doe');
      expect(credentials.role).toBe('doctor');
      expect(credentials.gln).toBe('7601001234567');
    });

    it('should handle missing optional fields', () => {
      const mockUserInfo: HINUserInfo = {
        sub: 'hin_67890',
        email: 'nurse@example.com',
      };

      const credentials = provider.extractCredentials(mockUserInfo);

      expect(credentials.hinId).toBe('hin_67890');
      expect(credentials.firstName).toBe('Unknown');
      expect(credentials.lastName).toBe('Unknown');
      expect(credentials.role).toBe('doctor'); // Default
      expect(credentials.gln).toBeUndefined();
    });
  });
});

describe('HIN Provider Error Handling', () => {
  it('should throw HINProviderError with correct properties', () => {
    const error = new HINProviderError('Test error', 'TEST_CODE', { detail: 'Test detail' });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(HINProviderError);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.details).toEqual({ detail: 'Test detail' });
    expect(error.name).toBe('HINProviderError');
  });

  it('should throw error when initializing without credentials', () => {
    delete process.env.HIN_CLIENT_ID;
    delete process.env.HIN_CLIENT_SECRET;

    expect(() => new HINProvider()).toThrow(HINProviderError);
    expect(() => new HINProvider()).toThrow('Invalid HIN configuration');
  });
});
