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

import request from 'supertest';
import { DataSource } from 'typeorm';
import app, { AppDataSource } from '../index';
import { User, UserRole, UserStatus } from '../../../../shared/models/User';
import { hashPassword } from '../../../../shared/utils/auth';
import { generateTokenPair } from '../../../../shared/utils/jwt';
import * as speakeasy from 'speakeasy';

// ============================================================================
// Test Setup
// ============================================================================

let testDataSource: DataSource;
let testUser: User;
let testPharmacist: User;
let testAccessToken: string;

beforeAll(async () => {
  // Initialize test database connection
  testDataSource = AppDataSource;

  if (!testDataSource.isInitialized) {
    await testDataSource.initialize();
  }

  // Clean up any existing test data first
  try {
    // Clean up audit trail entries first (foreign key constraint)
    await testDataSource.query(
      "DELETE FROM audit_trail_entries WHERE user_id IN (SELECT id FROM users WHERE email IN ('test.patient@example.com', 'test.pharmacist@example.com'))"
    );

    // Then delete existing test users if they exist
    const userRepository = testDataSource.getRepository(User);
    await userRepository.delete({ email: 'test.patient@example.com' });
    await userRepository.delete({ email: 'test.pharmacist@example.com' });
  } catch (error) {
    // Ignore errors if users don't exist
    console.log('No existing test data to clean up');
  }

  const userRepository = testDataSource.getRepository(User);

  // Test patient (no MFA required)
  testUser = userRepository.create({
    email: 'test.patient@example.com',
    email_verified: true,
    password_hash: await hashPassword('SecureP@ssw0rd!Test2024'),
    role: UserRole.PATIENT,
    status: UserStatus.ACTIVE,
    first_name_encrypted: Buffer.from('Test'),
    last_name_encrypted: Buffer.from('Patient'),
    phone_encrypted: null,
    mfa_enabled: false,
    mfa_secret: null,
    primary_pharmacy_id: null,
  });
  await userRepository.save(testUser);

  // Test pharmacist (MFA required)
  testPharmacist = userRepository.create({
    email: 'test.pharmacist@example.com',
    email_verified: true,
    password_hash: await hashPassword('SecurePharm@cist!P@ss2024'),
    role: UserRole.PHARMACIST,
    status: UserStatus.ACTIVE,
    first_name_encrypted: Buffer.from('Test'),
    last_name_encrypted: Buffer.from('Pharmacist'),
    phone_encrypted: null,
    mfa_enabled: true,
    mfa_secret: speakeasy.generateSecret({ length: 32 }).base32,
    primary_pharmacy_id: null,
  });
  await userRepository.save(testPharmacist);

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
  // Cleanup test data
  try {
    // Clean up audit trail entries first (foreign key constraint)
    await testDataSource.query(
      "DELETE FROM audit_trail_entries WHERE user_id IN (SELECT id FROM users WHERE email IN ('test.patient@example.com', 'test.pharmacist@example.com'))"
    );

    // Then delete users
    const userRepository = testDataSource.getRepository(User);
    await userRepository.delete({ email: 'test.patient@example.com' });
    await userRepository.delete({ email: 'test.pharmacist@example.com' });
  } catch (error) {
    console.error('Cleanup error:', error);
  }

  // Close database connection
  if (testDataSource.isInitialized) {
    await testDataSource.destroy();
  }
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
        password: 'SecureP@ssw0rd!Test2024',
      });

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
        password: 'PharmacistPass123!',
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
        password: 'SecureP@ssw0rd!Test2024',
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Invalid credentials');
  });

  test('should fail with missing email', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        password: 'SecureP@ssw0rd!Test2024',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('should fail with invalid email format', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'invalid-email',
        password: 'SecureP@ssw0rd!Test2024',
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
        password: 'PharmacistPass123!',
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
        password: 'PharmacistPass123!',
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
      .send({ password: 'PharmacistPass123!' });

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
