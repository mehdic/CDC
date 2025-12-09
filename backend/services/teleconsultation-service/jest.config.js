/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.ts'
  ],

  // Coverage
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
  ],

  // Transform ES modules from node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)'
  ],

  // Mock uuid module to avoid ES module issues
  moduleNameMapper: {
    '^uuid$': '<rootDir>/src/services/transcription/__tests__/__mocks__/uuid.ts'
  },

  moduleFileExtensions: ['ts', 'js', 'json'],
};
