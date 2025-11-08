/**
 * Jest Test Setup
 *
 * Global setup for all tests
 */

// ============================================================================
// IMPORTANT: Set environment variables BEFORE any imports
// This prevents encryption.ts from throwing at import time
// ============================================================================

process.env.NODE_ENV = 'test';

// AWS KMS Configuration (required by encryption.ts)
process.env.AWS_REGION = 'eu-central-1';
process.env.AWS_KMS_KEY_ID = 'arn:aws:kms:eu-central-1:123456789012:key/test-key-id';
process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';

// JWT Configuration
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-do-not-use-in-production';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

// Redis Configuration (for rate limiting tests)
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.REDIS_TTL = '3600';

// Database Configuration
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// ============================================================================
// Mock AWS SDK KMS Client
// ============================================================================

jest.mock('@aws-sdk/client-kms', () => {
  // Mock KMS responses
  const mockGenerateDataKey = jest.fn().mockResolvedValue({
    Plaintext: Buffer.from('0'.repeat(32), 'hex'), // 32-byte key for AES-256
    CiphertextBlob: Buffer.from('encrypted-data-key'),
    KeyId: 'arn:aws:kms:eu-central-1:123456789012:key/test-key-id',
  });

  const mockDecrypt = jest.fn().mockResolvedValue({
    Plaintext: Buffer.from('0'.repeat(32), 'hex'), // 32-byte key for AES-256
    KeyId: 'arn:aws:kms:eu-central-1:123456789012:key/test-key-id',
  });

  return {
    KMSClient: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockImplementation((command) => {
        if (command.constructor.name === 'GenerateDataKeyCommand') {
          return mockGenerateDataKey();
        } else if (command.constructor.name === 'DecryptCommand') {
          return mockDecrypt();
        }
        return Promise.resolve({});
      }),
    })),
    GenerateDataKeyCommand: jest.fn().mockImplementation((input) => ({
      constructor: { name: 'GenerateDataKeyCommand' },
      input,
    })),
    DecryptCommand: jest.fn().mockImplementation((input) => ({
      constructor: { name: 'DecryptCommand' },
      input,
    })),
  };
});

// ============================================================================
// Mock TypeORM for tests that don't need real database
// ============================================================================

// Import reflect-metadata for TypeORM decorators
import 'reflect-metadata';

// ============================================================================
// Console Mocking
// ============================================================================

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Keep log for debugging if needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// ============================================================================
// Jest Configuration
// ============================================================================

// Setup test timeout
jest.setTimeout(10000);
