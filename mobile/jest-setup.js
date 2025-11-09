/**
 * Jest setup file for React Native testing environment
 * Runs after the test environment is set up but before tests execute
 */

// Suppress console warnings in tests (optional)
global.console = {
  ...console,
  // Suppress specific warnings if needed
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock global objects if needed
global.fetch = jest.fn();

// Add custom matchers from @testing-library/jest-native if installed
// This is already handled by setupFilesAfterEnv in jest.config.js
