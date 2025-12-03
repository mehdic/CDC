/**
 * Jest Test Setup
 *
 * Global setup for all tests
 */

// ============================================================================
// CRITICAL: Import reflect-metadata FIRST (required by TypeORM decorators)
// ============================================================================

import 'reflect-metadata';

// ============================================================================
// IMPORTANT: Set environment variables BEFORE other imports
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
process.env.DB_TYPE = 'sqlite'; // Default to SQLite for tests

// ============================================================================
// JSONB to SQLite Adapter - Patches entities for test compatibility
// ============================================================================

// Import AFTER reflect-metadata but BEFORE entity imports
// The adapter converts PostgreSQL jsonb type to simple-json for SQLite
try {
  const { adaptJsonbColumnsForSqlite } = require('../shared/db/jsonb-sqlite-adapter');

  // List of all entities that use JSONB columns in the shared/models directory
  // These models are designed for PostgreSQL but tests use SQLite
  const jsonbEntities = [
    require('../shared/models/AuditLog').AuditLog,
    require('../shared/models/Cart').Cart,
    require('../shared/models/CartItem').CartItem,
    require('../shared/models/CODTransaction').CODTransaction,
    require('../shared/models/ConsultationNote').ConsultationNote,
    require('../shared/models/DriverSettlement').DriverSettlement,
    require('../shared/models/Notification').Notification,
    require('../shared/models/Order').Order,
    require('../shared/models/Payment').Payment,
    require('../shared/models/Prescription').Prescription,
    require('../shared/models/PrescriptionItem').PrescriptionItem,
    require('../shared/models/RolePermission').RolePermission,
    require('../shared/models/TreatmentPlan').TreatmentPlan,
  ].filter(entity => entity !== undefined);

  // Apply JSONB to simple-json conversion for SQLite compatibility
  // This patches TypeORM metadata so that JSONB columns work in SQLite tests
  if (jsonbEntities.length > 0) {
    adaptJsonbColumnsForSqlite(jsonbEntities);
  }
} catch (error) {
  // If adapter fails to load or models don't exist, continue anyway
  // Individual tests will fail with JSONB errors if the adapter is needed
}

// ============================================================================
// Mock AWS SDK KMS Client
// ============================================================================

jest.mock('@aws-sdk/client-kms', () => {
  // Mock KMS responses
  // Create a proper 32-byte buffer for AES-256 encryption
  const mockPlaintextKey = Buffer.alloc(32, 0); // 32 bytes of zeros

  const mockSend = jest.fn().mockImplementation(async (command) => {
    // Check command type by constructor name
    const commandName = command.constructor.name;

    if (commandName === 'GenerateDataKeyCommand') {
      return {
        Plaintext: mockPlaintextKey, // 32-byte key for AES-256
        CiphertextBlob: Buffer.from('encrypted-data-key'),
        KeyId: 'arn:aws:kms:eu-central-1:123456789012:key/test-key-id',
      };
    } else if (commandName === 'DecryptCommand') {
      return {
        Plaintext: mockPlaintextKey, // 32-byte key for AES-256
        KeyId: 'arn:aws:kms:eu-central-1:123456789012:key/test-key-id',
      };
    }

    return Promise.resolve({});
  });

  return {
    KMSClient: jest.fn().mockImplementation(() => ({
      send: mockSend,
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
