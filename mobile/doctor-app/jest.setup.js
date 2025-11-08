// Jest setup for React Native testing
// Basic setup - extend as needed when @testing-library/jest-native is installed

// Mock React Native modules that may not be available in test environment
global.setImmediate = global.setImmediate || ((fn, ...args) => global.setTimeout(fn, 0, ...args));
