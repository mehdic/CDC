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
  // Mock KMS responses with proper 32-byte keys for AES-256
  // Note: '0'.repeat(64) creates 64 hex chars = 32 bytes when converted from hex
  const mockDataKey = Buffer.from('0'.repeat(64), 'hex'); // 32-byte key for AES-256
  const mockEncryptedKey = Buffer.from('encrypted-data-key');

  const mockGenerateDataKey = jest.fn().mockResolvedValue({
    Plaintext: mockDataKey,
    CiphertextBlob: mockEncryptedKey,
    KeyId: 'arn:aws:kms:eu-central-1:123456789012:key/test-key-id',
  });

  const mockDecrypt = jest.fn().mockResolvedValue({
    Plaintext: mockDataKey,
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

// Global TypeORM DataSource mock
jest.mock('typeorm', () => {
  const actual = jest.requireActual('typeorm');

  // Mock repository
  const mockRepository = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findOneBy: jest.fn().mockResolvedValue(null),
    findBy: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    create: jest.fn().mockImplementation((data) => data),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    remove: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getOne: jest.fn().mockResolvedValue(null),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    }),
  };

  return {
    ...actual,
    DataSource: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(true),
      destroy: jest.fn().mockResolvedValue(undefined),
      isInitialized: true,
      getRepository: jest.fn().mockReturnValue(mockRepository),
      manager: {
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue(null),
        findOneBy: jest.fn().mockResolvedValue(null),
        save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
        create: jest.fn().mockImplementation((data) => data),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
        remove: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
        getRepository: jest.fn().mockReturnValue(mockRepository),
        transaction: jest.fn().mockImplementation((cb) => cb(mockRepository)),
      },
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest.fn().mockResolvedValue(undefined),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
        manager: {
          save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
        },
      }),
    })),
    Repository: jest.fn().mockImplementation(() => mockRepository),
    getRepository: jest.fn().mockReturnValue(mockRepository),
  };
});

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
