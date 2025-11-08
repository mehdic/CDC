/** @type {import('jest').Config} */
module.exports = {
  // React Native preset for mobile testing
  preset: 'react-native',

  // Transform configuration for React Native
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },

  // Module name mapper for mocking assets and native modules
  moduleNameMapper: {
    // Mock image and asset imports
    '\\.(jpg|jpeg|png|gif|svg|webp|bmp)$': '<rootDir>/__mocks__/imageMock.js',
    '\\.(mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',

    // Mock native modules that don't work in Jest environment
    '^react-native-camera$': '<rootDir>/__mocks__/react-native-camera.js',
    '^react-native-qrcode-scanner$': '<rootDir>/__mocks__/react-native-qrcode-scanner.js',
    '^react-native-maps$': '<rootDir>/__mocks__/react-native-maps.js',
    '^react-native-geolocation-service$': '<rootDir>/__mocks__/react-native-geolocation-service.js',
    '^react-native-video$': '<rootDir>/__mocks__/react-native-video.js',
    '^react-native-permissions$': '<rootDir>/__mocks__/react-native-permissions.js',
    '^react-native-encrypted-storage$': '<rootDir>/__mocks__/react-native-encrypted-storage.js',
    '^react-native-keychain$': '<rootDir>/__mocks__/react-native-keychain.js',
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/async-storage.js',
    '^@react-native-community/netinfo$': '<rootDir>/__mocks__/netinfo.js',
    '^@react-native-firebase/(.*)$': '<rootDir>/__mocks__/firebase.js',

    // Path aliases for shared code (if needed in future)
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1'
  },

  // Transform ignore patterns - include React Native libraries that need transformation
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-.*|@react-native-.*|twilio-.*)/)'
  ],

  // Setup files to run after environment setup
  setupFilesAfterEnv: [
    '<rootDir>/jest-setup.js'
  ],

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.{ts,tsx}',
    '**/*.test.{ts,tsx}',
    '**/*.spec.{ts,tsx}'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'shared/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!**/__tests__/**',
    '!**/__mocks__/**',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/android/**',
    '!**/ios/**'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Test environment
  testEnvironment: 'node',

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
  testTimeout: 10000,

  // Globals (TypeScript configuration for jest)
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react'
      }
    }
  }
};
