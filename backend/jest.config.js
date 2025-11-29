/** @type {import('jest').Config} */
module.exports = {
  // Test environment for Node.js backend
  testEnvironment: 'node',

  // Root directories for tests
  roots: [
    '<rootDir>/shared',
    '<rootDir>/services',
    '<rootDir>/tests',
    '<rootDir>/__tests__'
  ],

  // Transform TypeScript files using ts-jest
  // Note: Removed preset for workspace compatibility - configure directly instead
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      isolatedModules: true,
      experimentalDecorators: true,
      emitDecoratorMetadata: true
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
    '__tests__/**/*.ts',
    '!**/*.test.ts',
    '!**/*.spec.ts',
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

  // Ignore patterns for test discovery
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',           // Exclude build artifacts
    '\\.d\\.ts$',       // Exclude TypeScript declaration files
    '/tests/contract/', // Exclude contract tests (require live infrastructure)
    '/tests/e2e/',      // Exclude end-to-end tests (require live infrastructure)
    '/tests/load/'      // Exclude load tests (require live infrastructure)
  ],

  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Clear mocks between tests (disabled to preserve AWS SDK mocks)
  clearMocks: false,

  // Reset mocks between tests (disabled to preserve AWS SDK mocks)
  resetMocks: false,

  // Restore mocks between tests (disabled to preserve AWS SDK mocks)
  restoreMocks: false,

  // Verbose output
  verbose: true,

  // Max workers for parallel test execution
  maxWorkers: '50%',

  // Timeout for tests (10 seconds default)
  testTimeout: 10000
};
