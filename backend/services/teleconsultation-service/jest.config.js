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

  // Mock uuid to avoid ES module issues in Jest
  moduleNameMapper: {
    '^uuid$': '<rootDir>/src/services/transcription/__tests__/__mocks__/uuid-mock.ts'
  },

  moduleFileExtensions: ['ts', 'js', 'json'],
};
