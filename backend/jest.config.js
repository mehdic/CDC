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
    }],
    '^.+\\.js$': ['ts-jest', {
      useESM: true
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
      branches: 25,
      functions: 25,
      lines: 30,
      statements: 30
    }
  },

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Ignore patterns for test discovery
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',           // Exclude build artifacts
    '\\.d\\.ts$',       // Exclude TypeScript declaration files
    '/__mocks__/',      // Exclude mock files
    '/tests/contract/', // Exclude contract tests (require live infrastructure)
    '/tests/e2e/',      // Exclude end-to-end tests (require live infrastructure)
    '/tests/load/',     // Exclude load tests (require live infrastructure)
    '/tests/security/', // Exclude security tests (require running server)
    '/tests/performance/', // Exclude performance tests (require running server)
    '/tests/compliance/', // Exclude compliance tests (require running server)
    '/tests/accessibility/', // Exclude accessibility tests (require browser)
    '/__tests__/security/', // Exclude security tests (require running server)
    '/__tests__/compliance/', // Exclude compliance tests (require running server)
    '/services/.*/__tests__/.*\\.integration\\.test\\.ts$', // Exclude integration tests
    '/services/.*/__tests__/.*\\.e2e\\.test\\.ts$', // Exclude E2E tests
    '/services/.*/__tests__/.*\\.contract\\.test\\.ts$', // Exclude contract tests
    'test-setup\\.ts$', // Exclude test setup files
    'tracking\\.test\\.ts$', // Exclude delivery tracking tests (require app)
    'smoke\\.test\\.ts$', // Exclude smoke tests (require app)
    'orders\\.test\\.ts$', // Exclude order tests (require app)
    'cart\\.test\\.ts$', // Exclude cart tests (requires full TypeORM setup with all entities)
    'AccountHierarchyService\\.test\\.ts$', // Exclude (requires PostgreSQL)
    'routeController\\.test\\.ts$', // Exclude (requires live infrastructure)
    'cod-system\\.unit\\.test\\.ts$' // Exclude (requires PostgreSQL ENUM support)
  ],

  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Transform ES modules from node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/).*\\.js$'
  ],

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
