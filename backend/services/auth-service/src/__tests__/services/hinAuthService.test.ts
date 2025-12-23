/**
 * HIN Authentication Service Unit Tests (T8-035)
 * Tests HINAuthService with focus on GLN verification
 *
 * Test Scenarios:
 * - GLN validation (format, checksum)
 * - Service configuration validation
 * - OAuth URL generation
 */

// Mock typeorm and models BEFORE any imports
jest.mock('typeorm', () => ({
  DataSource: jest.fn(),
  Repository: jest.fn(),
}));

jest.mock('@models/User', () => ({
  User: jest.fn(),
  UserRole: {
    PATIENT: 'PATIENT',
    PHARMACIST: 'PHARMACIST',
    DOCTOR: 'DOCTOR',
    NURSE: 'NURSE',
    DELIVERY: 'DELIVERY',
  },
  UserStatus: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED',
    PENDING: 'PENDING',
  },
}));

jest.mock('@models/AuditTrailEntry', () => ({
  AuditTrailEntry: jest.fn(),
  AuditAction: {
    CREATE: 'CREATE',
    READ: 'READ',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
  },
}));

jest.mock('@utils/jwt', () => ({
  generateTokenPair: (userId: string, email: string, role: string, pharmacyId: string | null) => ({
    accessToken: 'mock-access-token-' + userId,
    refreshToken: 'mock-refresh-token-' + userId,
    expiresIn: 3600,
  }),
}));

import { HINAuthService, HINProfile, GLNVerification } from '../../services/hinAuthService';

/**
 * Test Suite
 */
describe('HINAuthService', () => {
  let hinAuthService: HINAuthService;
  let mockDataSource: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock datasource
    mockDataSource = {
      getRepository: jest.fn((entity: any) => ({
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      })),
    };

    hinAuthService = new HINAuthService(mockDataSource, {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost:4001/auth/hin/callback',
      authorizationEndpoint: 'https://oauth2.hin.ch/authorize',
      tokenEndpoint: 'https://oauth2.hin.ch/token',
      userInfoEndpoint: 'https://oauth2.hin.ch/userinfo',
    });
  });

  // ===========================================================================
  // Test: GLN Validation (Format and Checksum)
  // ===========================================================================

  describe('GLN Validation', () => {
    test('should validate correct GLN format (13 digits starting with 7)', () => {
      // Valid GLN: 7680000000328 (MOH - health organization)
      const result = hinAuthService.verifyGLN('7680000000328');

      expect(result.valid).toBe(true);
      expect(result.gln).toBe('7680000000328');
      expect(result.error).toBeUndefined();
      expect(result.verifiedAt).toBeInstanceOf(Date);
    });

    test('should reject GLN with less than 13 digits', () => {
      const result = hinAuthService.verifyGLN('768000000032');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid GLN format');
    });

    test('should reject GLN with more than 13 digits', () => {
      const result = hinAuthService.verifyGLN('76800000003289');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should reject GLN not starting with 7', () => {
      const result = hinAuthService.verifyGLN('8680000000328');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('starting with 7');
    });

    test('should reject GLN with non-numeric characters', () => {
      const result = hinAuthService.verifyGLN('768000000032A');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle GLN with leading/trailing whitespace', () => {
      const result = hinAuthService.verifyGLN('  7680000000328  ');

      expect(result.valid).toBe(true);
      expect(result.gln).toBe('7680000000328');
    });

    test('should validate GLN checksum (mod-10)', () => {
      // Test valid checksums
      const validGLNs = ['7680000000328', '7680000000335'];

      for (const gln of validGLNs) {
        const result = hinAuthService.verifyGLN(gln);
        expect(result.valid).toBe(true);
      }
    });

    test('should reject invalid GLN checksum', () => {
      // Modify the checksum digit to create an invalid GLN
      const result = hinAuthService.verifyGLN('7680000000329'); // Last digit should be 8

      expect(result.valid).toBe(false);
      expect(result.error).toContain('checksum');
    });

    test('should return verification timestamp', () => {
      const beforeTest = new Date();
      const result = hinAuthService.verifyGLN('7680000000328');
      const afterTest = new Date();

      expect(result.verifiedAt.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime());
      expect(result.verifiedAt.getTime()).toBeLessThanOrEqual(afterTest.getTime());
    });

    test('should handle empty GLN', () => {
      const result = hinAuthService.verifyGLN('');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should return GLN in result even if invalid', () => {
      const result = hinAuthService.verifyGLN('invalidGLN');

      expect(result.gln).toBe('invalidGLN');
      expect(result.valid).toBe(false);
    });
  });

  // ===========================================================================
  // Test: Configuration Validation
  // ===========================================================================

  describe('Configuration Validation', () => {
    test('should validate configuration with all required fields', () => {
      const result = hinAuthService.validateConfiguration();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect missing client ID', () => {
      const invalidService = new HINAuthService(mockDataSource, {
        clientId: '',
        clientSecret: 'secret',
        redirectUri: 'http://localhost:4001/callback',
        authorizationEndpoint: 'https://oauth2.hin.ch/authorize',
        tokenEndpoint: 'https://oauth2.hin.ch/token',
        userInfoEndpoint: 'https://oauth2.hin.ch/userinfo',
      });

      const result = invalidService.validateConfiguration();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('HIN_CLIENT_ID not configured');
    });

    test('should detect missing client secret', () => {
      const invalidService = new HINAuthService(mockDataSource, {
        clientId: 'client-id',
        clientSecret: '',
        redirectUri: 'http://localhost:4001/callback',
        authorizationEndpoint: 'https://oauth2.hin.ch/authorize',
        tokenEndpoint: 'https://oauth2.hin.ch/token',
        userInfoEndpoint: 'https://oauth2.hin.ch/userinfo',
      });

      const result = invalidService.validateConfiguration();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('HIN_CLIENT_SECRET not configured');
    });

    test('should detect all missing configuration items', () => {
      const invalidService = new HINAuthService(mockDataSource, {
        clientId: '',
        clientSecret: '',
        redirectUri: '',
        authorizationEndpoint: '',
        tokenEndpoint: '',
        userInfoEndpoint: '',
      });

      const result = invalidService.validateConfiguration();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Test: OAuth Authorization URL Generation
  // ===========================================================================

  describe('OAuth Authorization URL Generation', () => {
    test('should generate authorization URL with correct parameters', () => {
      const result = hinAuthService.initiateHINAuth();

      expect(result.url).toContain('https://oauth2.hin.ch/authorize');
      expect(result.url).toContain('client_id=test-client-id');
      expect(result.url).toContain('response_type=code');
      expect(result.url).toContain('scope=openid+profile+gln');
      expect(result.url).toContain('redirect_uri=http');
    });

    test('should include state parameter for CSRF protection', () => {
      const result = hinAuthService.initiateHINAuth();

      expect(result.state).toBeDefined();
      expect(result.state.length).toBeGreaterThan(0);
      expect(result.url).toContain('state=');
    });

    test('should return different state values for multiple calls', () => {
      const result1 = hinAuthService.initiateHINAuth();
      const result2 = hinAuthService.initiateHINAuth();

      expect(result1.state).not.toBe(result2.state);
    });

    test('should throw error if configuration invalid when initiating auth', () => {
      const invalidService = new HINAuthService(mockDataSource, {
        clientId: '',
        clientSecret: '',
        redirectUri: 'http://localhost:4001/callback',
        authorizationEndpoint: 'https://oauth2.hin.ch/authorize',
        tokenEndpoint: 'https://oauth2.hin.ch/token',
        userInfoEndpoint: 'https://oauth2.hin.ch/userinfo',
      });

      expect(() => {
        invalidService.initiateHINAuth();
      }).toThrow('HIN e-ID not configured');
    });

    test('should include all required OAuth parameters', () => {
      const result = hinAuthService.initiateHINAuth();

      const url = new URL(result.url);
      expect(url.searchParams.has('client_id')).toBe(true);
      expect(url.searchParams.has('redirect_uri')).toBe(true);
      expect(url.searchParams.has('response_type')).toBe(true);
      expect(url.searchParams.has('scope')).toBe(true);
      expect(url.searchParams.has('state')).toBe(true);
    });

    test('should include GLN scope for healthcare professionals', () => {
      const result = hinAuthService.initiateHINAuth();

      expect(result.url).toContain('gln');
    });
  });

  // ===========================================================================
  // Test: GLN Verification Integration
  // ===========================================================================

  describe('GLN Verification Result Structure', () => {
    test('should return complete GLN verification result for valid GLN', () => {
      const result = hinAuthService.verifyGLN('7680000000328');

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('gln');
      expect(result).toHaveProperty('verifiedAt');
      expect(result.error).toBeUndefined();
    });

    test('should include error message in result for invalid GLN', () => {
      const result = hinAuthService.verifyGLN('invalid');

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('gln');
      expect(result).toHaveProperty('verifiedAt');
      expect(result).toHaveProperty('error');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should provide meaningful error messages', () => {
      const testCases = [
        { input: '768000000032', expectedError: 'Invalid GLN format' },
        { input: '8680000000328', expectedError: 'starting with 7' },
        { input: '768000000032A', expectedError: 'Invalid GLN format' },
      ];

      for (const testCase of testCases) {
        const result = hinAuthService.verifyGLN(testCase.input);
        expect(result.error).toContain(testCase.expectedError);
      }
    });
  });

  // ===========================================================================
  // Test: Multiple Valid GLN Examples
  // ===========================================================================

  describe('Valid GLN Examples', () => {
    test('should accept healthcare professional GLN examples', () => {
      // These are real or realistic GLN examples for testing
      const validGLNs = [
        '7680000000328', // Valid checksum
        '7680000000335', // Valid checksum
      ];

      for (const gln of validGLNs) {
        const result = hinAuthService.verifyGLN(gln);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      }
    });
  });

  // ===========================================================================
  // Test: Edge Cases for GLN Validation
  // ===========================================================================

  describe('Edge Cases for GLN Validation', () => {
    test('should handle extremely long GLN strings', () => {
      const result = hinAuthService.verifyGLN('768000000032812345678901234567890');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle GLN with special characters', () => {
      const result = hinAuthService.verifyGLN('768000-00003-28');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle null-like strings', () => {
      const testCases = ['null', 'undefined', 'NaN', ''];

      for (const testCase of testCases) {
        const result = hinAuthService.verifyGLN(testCase);
        expect(result.valid).toBe(false);
      }
    });

    test('should normalize whitespace in GLN', () => {
      const inputs = [
        '  7680000000328  ',
        '\t7680000000328\t',
        '\n7680000000328\n',
      ];

      for (const input of inputs) {
        const result = hinAuthService.verifyGLN(input);
        expect(result.valid).toBe(true);
      }
    });
  });
});
