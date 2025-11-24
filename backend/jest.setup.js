/**
 * Jest Setup - Runs BEFORE test framework
 *
 * This file is loaded via setupFiles (not setupFilesAfterEnv)
 * It runs before Jest's test framework is installed.
 */

// Set AWS environment variables for all tests
process.env.AWS_KMS_KEY_ID = 'arn:aws:kms:eu-central-1:123456789012:key/test-key-id';
process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.AWS_REGION = 'eu-central-1';

// Silence console output during tests
global.console = {
  ...console,
  log: jest.fn ? jest.fn() : () => {},
  debug: jest.fn ? jest.fn() : () => {},
  info: jest.fn ? jest.fn() : () => {},
  warn: jest.fn ? jest.fn() : () => {},
  error: jest.fn ? jest.fn() : () => {},
};
