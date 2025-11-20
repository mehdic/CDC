/** @type {import('jest').Config} */
module.exports = {
  // Test environment for Node.js backend
  testEnvironment: 'node',

  // Display name for this test configuration
  displayName: {
    name: 'E2E',
    color: 'magenta',
  },

  // Root directory for E2E tests
  roots: ['<rootDir>/tests/e2e'],

  // Transform TypeScript files using ts-jest
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          // Disable type checking in tests for faster execution
          isolatedModules: true,
          // Enable decorators for TypeORM entities
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
        },
      },
    ],
  },

  // Module name mapper for path aliases (matching tsconfig.json)
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@models/(.*)$': '<rootDir>/shared/models/$1',
    '^@utils/(.*)$': '<rootDir>/shared/utils/$1',
  },

  // Test file patterns - only match E2E tests
  testMatch: ['**/tests/e2e/**/*.test.ts', '**/tests/e2e/**/*.spec.ts'],

  // Setup files to run before E2E tests
  setupFilesAfterEnv: ['<rootDir>/tests/e2e-setup.ts'],

  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Clear mocks between tests
  clearMocks: true,

  // Reset mocks between tests
  resetMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Max workers for E2E tests (run sequentially to avoid port conflicts)
  maxWorkers: 1,

  // Increased timeout for E2E tests (30 seconds)
  testTimeout: 30000,

  // Don't collect coverage for E2E tests (too slow)
  collectCoverage: false,

  // Detect open handles (helps find hanging connections)
  detectOpenHandles: false,

  // Force exit after tests complete
  forceExit: true,
};
