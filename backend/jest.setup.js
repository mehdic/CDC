/**
 * Jest Setup - Runs BEFORE test framework
 *
 * This file is loaded via setupFiles (not setupFilesAfterEnv)
 * It runs before Jest's test framework is installed, so we can't use
 * jest.mock() here. Instead, we set environment variables and do
 * other pre-test configuration.
 */

// Silence console output during tests
global.console = {
  ...console,
  log: jest.fn ? jest.fn() : () => {},
  debug: jest.fn ? jest.fn() : () => {},
  info: jest.fn ? jest.fn() : () => {},
  warn: jest.fn ? jest.fn() : () => {},
  error: jest.fn ? jest.fn() : () => {},
};
