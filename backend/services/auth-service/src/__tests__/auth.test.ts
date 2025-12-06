/**
 * Auth Service Unit Tests (T051)
 * Comprehensive tests for authentication endpoints
 *
 * Test Coverage:
 * - Login with valid/invalid credentials
 * - MFA verification flow
 * - MFA setup/enable/disable
 * - HIN e-ID OAuth flow (mocked)
 * - Sessions listing
 * - Logout functionality
 */

// ============================================================================
// Environment Variables (MUST be set before imports)
// ============================================================================
process.env.HIN_CLIENT_ID = 'test-hin-client-id';
process.env.HIN_CLIENT_SECRET = 'test-hin-client-secret';

// ============================================================================
// Mocks (MUST be defined before imports)
// ============================================================================

// Mock TypeORM DataSource and Repository
const mockUsers: any[] = [];

const mockRepository = {
  create: jest.fn((data: any) => ({ ...data, id: 'mock-id-' + Math.random() })),
  save: jest.fn(async (user: any) => {
    const existingIndex = mockUsers.findIndex((u: any) => u.id === user.id);
    if (existingIndex !== -1) {
      mockUsers[existingIndex] = user;
    } else {
      mockUsers.push(user);
    }
    return user;
  }),
  findOne: jest.fn(async (options: any) => {
    if (options.where?.email) {
      const email = options.where.email.toLowerCase ? options.where.email.toLowerCase() : options.where.email;
      return mockUsers.find((u: any) => u.email.toLowerCase() === email) || null;
    }
    if (options.where?.id) {
      return mockUsers.find((u: any) => u.id === options.where.id) || null;
    }
    return null;
  }),
  find: jest.fn(async (options: any) => mockUsers),
  delete: jest.fn(async (criteria: any) => {
    if (criteria.email) {
      const index = mockUsers.findIndex((u: any) => u.email === criteria.email);
      if (index !== -1) mockUsers.splice(index, 1);
    }
    return { affected: 1 };
  }),
  update: jest.fn(async (criteria: any, updateData: any) => {
    const user = mockUsers.find((u: any) => u.id === criteria.id || u.email === criteria.email);
    if (user) {
      Object.assign(user, updateData);
    }
    return { affected: user ? 1 : 0 };
  }),
};

// Mock AuditTrailEntry repository
const mockAuditEntries: any[] = [];

const mockAuditRepository = {
  create: jest.fn((data: any) => {
    const entry = { ...data, id: 'audit-' + Math.random(), created_at: new Date() };
    return entry;
  }),
  save: jest.fn(async (entry: any) => {
    mockAuditEntries.push(entry);
    return Promise.resolve(entry);
  }),
  findOne: jest.fn(async () => null),
  find: jest.fn(async () => mockAuditEntries),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getMany: jest.fn(async () => mockAuditEntries),
  })),
};

const mockDataSource = {
  isInitialized: true,
  initialize: jest.fn(async function() { return this; }),
  destroy: jest.fn(async () => {}),
  query: jest.fn(async () => [{ '?column?': 1 }]), // Mock SELECT 1 query for health check
  getRepository: jest.fn((entity: any) => {
    // Return audit repository for AuditTrailEntry entity (handle both string and class)
    if (entity && (entity.name === 'AuditTrailEntry' || entity === 'AuditTrailEntry')) {
      return mockAuditRepository;
    }
    // Default to user repository
    return mockRepository;
  }),
};

// Mock TypeORM module - this must be done before any imports
// CRITICAL: DataSource constructor must ALWAYS return the same mockDataSource instance
jest.mock('typeorm', () => ({
  ...jest.requireActual('typeorm'),
  DataSource: jest.fn().mockImplementation(() => mockDataSource),
  Entity: () => () => {},
  Column: () => () => {},
  PrimaryGeneratedColumn: () => () => {},
  CreateDateColumn: () => () => {},
  UpdateDateColumn: () => () => {},
  Index: () => () => {},
  ManyToOne: () => () => {},
  OneToMany: () => () => {},
}));

import request from 'supertest';
import { DataSource } from 'typeorm';
import app, { AppDataSource } from '../index';
import { User, UserRole, UserStatus } from '@models/User';
import { hashPassword } from '@utils/auth';
import { generateTokenPair } from '@utils/jwt';
import * as speakeasy from 'speakeasy';

// ============================================================================
// Test Setup
// ============================================================================

let testDataSource: any;
let testUser: any;
let testPharmacist: any;
let testAccessToken: string;

beforeAll(async () => {
  // Use mocked data source
  testDataSource = mockDataSource;

  // Create test users with mocked repository
  const userRepository = mockRepository;

  // Test patient (no MFA required)
  // Use a strong password that doesn't contain common weak patterns
  testUser = {
    id: 'test-patient-id',
    email: 'test.patient@example.com',
    email_verified: true,
    password_hash: await hashPassword('Str0ng!P4tient#SecureKey'),
    role: UserRole.PATIENT,
    status: UserStatus.ACTIVE,
    first_name_encrypted: Buffer.from('Test'),
    last_name_encrypted: Buffer.from('Patient'),
    phone_encrypted: null,
    mfa_enabled: false,
    mfa_secret: null,
    primary_pharmacy_id: null,
    isActive: () => true, // Mock method
    isHealthcareProfessional: () => false, // Patients are not healthcare professionals
    updateLastLogin: jest.fn(), // Mock method
  };
  mockUsers.push(testUser);

  // Test pharmacist (MFA required)
  const mfaSecret = speakeasy.generateSecret({ length: 32 }).base32;
  testPharmacist = {
    id: 'test-pharmacist-id',
    email: 'test.pharmacist@example.com',
    email_verified: true,
    password_hash: await hashPassword('Str0ng!Pharm4cist#SecureKey'),
    role: UserRole.PHARMACIST,
    status: UserStatus.ACTIVE,
    first_name_encrypted: Buffer.from('Test'),
    last_name_encrypted: Buffer.from('Pharmacist'),
    phone_encrypted: null,
    mfa_enabled: true,
    mfa_secret: mfaSecret,
    primary_pharmacy_id: null,
    isActive: () => true, // Mock method
    isHealthcareProfessional: () => true, // Pharmacists are healthcare professionals
    updateLastLogin: jest.fn(), // Mock method
  };
  mockUsers.push(testPharmacist);

  // Generate access token for authenticated tests
  const tokens = generateTokenPair(
    testUser.id,
    testUser.email,
    testUser.role,
    testUser.primary_pharmacy_id
  );
  testAccessToken = tokens.accessToken;
});

afterAll(async () => {
  // Clear mock users
  mockUsers.length = 0;
});

// ============================================================================
// Login Tests
// ============================================================================

describe('POST /auth/login', () => {
  test('should login successfully with valid credentials (no MFA)', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'test.patient@example.com',
        password: 'Str0ng!P4tient#SecureKey',
      });

    if (response.status !== 200) {
      console.log('Error response:', response.body);
    }
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe('test.patient@example.com');
    expect(response.body.user.role).toBe(UserRole.PATIENT);
  });

  test('should return requiresMFA=true for users with MFA enabled', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'test.pharmacist@example.com',
        password: 'Str0ng!Pharm4cist#SecureKey',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.requiresMFA).toBe(true);
    expect(response.body.tempToken).toBeDefined();
    expect(response.body.accessToken).toBeUndefined();
  });

  test('should fail with invalid password', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'test.patient@example.com',
        password: 'WrongPassword123!',
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Invalid credentials');
  });

  test('should fail with non-existent user', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'Str0ng!P4tient#SecureKey',
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Invalid credentials');
  });

  test('should fail with missing email', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        password: 'Str0ng!P4tient#SecureKey',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('should fail with invalid email format', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'invalid-email',
        password: 'Str0ng!P4tient#SecureKey',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});

// ============================================================================
// MFA Tests
// ============================================================================

describe('POST /auth/mfa/verify', () => {
  test('should verify valid TOTP code', async () => {
    // Generate a valid TOTP code
    const code = speakeasy.totp({
      secret: testPharmacist.mfa_secret!,
      encoding: 'base32',
    });

    // First login to get temp token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'test.pharmacist@example.com',
        password: 'Str0ng!Pharm4cist#SecureKey',
      });

    expect(loginResponse.body.requiresMFA).toBe(true);
    const tempToken = loginResponse.body.tempToken;

    // Verify MFA code
    const response = await request(app)
      .post('/auth/mfa/verify')
      .send({
        tempToken,
        code,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
  });

  test('should fail with invalid TOTP code', async () => {
    // First login to get temp token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'test.pharmacist@example.com',
        password: 'Str0ng!Pharm4cist#SecureKey',
      });

    const tempToken = loginResponse.body.tempToken;

    // Try invalid code
    const response = await request(app)
      .post('/auth/mfa/verify')
      .send({
        tempToken,
        code: '000000', // Invalid code
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});

describe('POST /auth/mfa/setup', () => {
  test('should generate MFA secret and QR code', async () => {
    const response = await request(app)
      .post('/auth/mfa/setup')
      .set('Authorization', `Bearer ${testAccessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.secret).toBeDefined();
    expect(response.body.qrCode).toBeDefined();
    expect(response.body.qrCode).toContain('data:image/png;base64,');
  });

  test('should fail without authentication', async () => {
    const response = await request(app)
      .post('/auth/mfa/setup');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});

describe('POST /auth/mfa/enable', () => {
  test('should enable MFA with valid verification code', async () => {
    // First setup MFA
    const setupResponse = await request(app)
      .post('/auth/mfa/setup')
      .set('Authorization', `Bearer ${testAccessToken}`);

    const secret = setupResponse.body.secret;

    // Generate valid code
    const code = speakeasy.totp({
      secret,
      encoding: 'base32',
    });

    // Enable MFA
    const response = await request(app)
      .post('/auth/mfa/enable')
      .set('Authorization', `Bearer ${testAccessToken}`)
      .send({ code });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

describe('DELETE /auth/mfa/disable', () => {
  test('should prevent healthcare professionals from disabling MFA', async () => {
    const pharmacistTokens = generateTokenPair(
      testPharmacist.id,
      testPharmacist.email,
      testPharmacist.role,
      testPharmacist.primary_pharmacy_id
    );

    const response = await request(app)
      .delete('/auth/mfa/disable')
      .set('Authorization', `Bearer ${pharmacistTokens.accessToken}`)
      .send({ password: 'Str0ng!Pharm4cist#SecureKey' });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Healthcare professionals');
  });
});

// ============================================================================
// Sessions Tests
// ============================================================================

describe('GET /auth/sessions', () => {
  test('should list active sessions', async () => {
    const response = await request(app)
      .get('/auth/sessions')
      .set('Authorization', `Bearer ${testAccessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.sessions).toBeDefined();
    expect(Array.isArray(response.body.sessions)).toBe(true);
  });

  test('should fail without authentication', async () => {
    const response = await request(app)
      .get('/auth/sessions');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});

// ============================================================================
// Logout Tests
// ============================================================================

describe('DELETE /auth/logout', () => {
  test('should logout successfully', async () => {
    const response = await request(app)
      .delete('/auth/logout')
      .set('Authorization', `Bearer ${testAccessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Logged out successfully');
  });

  test('should succeed even with expired token', async () => {
    const response = await request(app)
      .delete('/auth/logout')
      .set('Authorization', 'Bearer expired.token.here');

    // Should still return 200 for logout
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('should fail without authorization header', async () => {
    const response = await request(app)
      .delete('/auth/logout');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});

// ============================================================================
// Health Check Tests
// ============================================================================

describe('GET /health', () => {
  test('should return healthy status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
    expect(response.body.service).toBe('auth-service');
    expect(response.body.database).toBe('connected');
  });
});

// ============================================================================
// HIN e-ID Tests (Mocked)
// ============================================================================

describe('GET /auth/hin/authorize', () => {
  test('should redirect to HIN authorization page', async () => {
    const response = await request(app)
      .get('/auth/hin/authorize')
      .redirects(0); // Don't follow redirects

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('oauth2.hin.ch');
  });
});

describe('GET /auth/hin/callback', () => {
  test('should fail without authorization code', async () => {
    const response = await request(app)
      .get('/auth/hin/callback');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('should handle OAuth errors', async () => {
    const response = await request(app)
      .get('/auth/hin/callback')
      .query({ error: 'access_denied', error_description: 'User denied access' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
