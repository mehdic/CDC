/** @type {import('jest').Config} */
module.exports = {
  // Test environment for Node.js backend
  testEnvironment: 'node',

  // Root directories for tests
  roots: [
    '<rootDir>/shared',
    '<rootDir>/services'
  ],

  // Transform TypeScript files using ts-jest
  // Note: Removed preset for workspace compatibility - configure directly instead
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        // Disable type checking in tests for faster execution
        isolatedModules: true,
        // Enable decorators for TypeORM entities
        experimentalDecorators: true,
        emitDecoratorMetadata: true
      }
    }]
  },

  // Module name mapper for path aliases (matching tsconfig.json)
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@models/(.*)$': '<rootDir>/shared/models/$1',
    '^@utils/(.*)$': '<rootDir>/shared/utils/$1'
  },

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/*.test.ts',
    '**/*.spec.ts'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'shared/**/*.ts',
    'services/**/*.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
    '!**/__tests__/**',
    '!**/__mocks__/**',
    '!**/node_modules/**',
    '!**/dist/**'
  ],

  // Coverage thresholds (can be adjusted based on team standards)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

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

  // Max workers for parallel test execution
  maxWorkers: '50%',

  // Timeout for tests (10 seconds default)
  testTimeout: 10000
};
