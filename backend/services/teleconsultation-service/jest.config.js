/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

<<<<<<< HEAD
  // Test file patterns
=======
>>>>>>> 50ea5c5b (feat(transcription): implement AWS Transcribe and Medical NLP integration (T8-006, T8-007))
  testMatch: [
    '**/__tests__/**/*.test.ts'
  ],

<<<<<<< HEAD
  // Coverage
=======
>>>>>>> 50ea5c5b (feat(transcription): implement AWS Transcribe and Medical NLP integration (T8-006, T8-007))
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
  ],

  // Transform ES modules from node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)'
  ],

<<<<<<< HEAD
  // Mock uuid module to avoid ES module issues
  moduleNameMapper: {
    '^uuid$': '<rootDir>/src/services/transcription/__tests__/__mocks__/uuid.ts'
=======
  // Mock uuid to avoid ES module issues in Jest
  moduleNameMapper: {
    '^uuid$': '<rootDir>/src/services/transcription/__tests__/__mocks__/uuid-mock.ts'
>>>>>>> 50ea5c5b (feat(transcription): implement AWS Transcribe and Medical NLP integration (T8-006, T8-007))
  },

  moduleFileExtensions: ['ts', 'js', 'json'],
};
