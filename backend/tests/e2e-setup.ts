/**
 * E2E Test Setup
 *
 * Global setup for E2E tests with proper database configuration
 */

// ============================================================================
// IMPORTANT: Set environment variables BEFORE any imports
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

// Database Configuration - Use in-memory SQLite for E2E tests
process.env.DB_TYPE = 'sqlite';
process.env.DB_DATABASE = ':memory:';
process.env.DB_SYNCHRONIZE = 'true';

// S3 Configuration (will be mocked)
process.env.AWS_S3_BUCKET = 'test-bucket';

// API Base URL for E2E tests
process.env.API_BASE_URL = 'http://localhost:4002';

// ============================================================================
// Mock AWS SDK Services
// ============================================================================

jest.mock('@aws-sdk/client-kms', () => {
  const mockGenerateDataKey = jest.fn().mockResolvedValue({
    Plaintext: Buffer.from('0'.repeat(32), 'hex'),
    CiphertextBlob: Buffer.from('encrypted-data-key'),
    KeyId: 'arn:aws:kms:eu-central-1:123456789012:key/test-key-id',
  });

  const mockDecrypt = jest.fn().mockResolvedValue({
    Plaintext: Buffer.from('0'.repeat(32), 'hex'),
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

// Mock S3 Client
jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({
        ETag: 'test-etag',
        Location: 'https://s3.amazonaws.com/test-bucket/test-key',
      }),
    })),
    PutObjectCommand: jest.fn().mockImplementation((input) => input),
    GetObjectCommand: jest.fn().mockImplementation((input) => input),
  };
});

// Mock AWS Textract
jest.mock('@aws-sdk/client-textract', () => {
  return {
    TextractClient: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({
        Blocks: [
          {
            BlockType: 'LINE',
            Text: 'Amoxicillin 500mg',
            Confidence: 95,
          },
          {
            BlockType: 'LINE',
            Text: 'Take three times daily',
            Confidence: 92,
          },
        ],
      }),
    })),
    AnalyzeDocumentCommand: jest.fn().mockImplementation((input) => input),
  };
});

// ============================================================================
// Import reflect-metadata for TypeORM decorators
// ============================================================================

import 'reflect-metadata';

// ============================================================================
// Console Mocking (reduce noise in test output)
// ============================================================================

const originalConsole = global.console;

global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging
  error: originalConsole.error,
};

// ============================================================================
// Jest Configuration
// ============================================================================

jest.setTimeout(30000); // 30 seconds for E2E tests
