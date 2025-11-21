/**
 * Reusable Tracing Mock Factory
 *
 * This module provides a centralized mock for the tracing middleware
 * to be used by tests that don't need to test tracing functionality.
 *
 * Usage:
 * jest.mock('path/to/tracing', () => require('path/to/__mocks__/tracing-mock').createTracingMock());
 */

/**
 * Create a mock for the tracing module
 * Returns all tracing functions as jest mocks
 */
export function createTracingMock() {
  return {
    initializeTracing: jest.fn(),
    getTracer: jest.fn(() => ({
      startSpan: jest.fn(() => ({
        end: jest.fn(),
        setAttribute: jest.fn(),
        setAttributes: jest.fn(),
        setStatus: jest.fn(),
        recordException: jest.fn(),
        addEvent: jest.fn(),
      })),
    })),
    getCurrentSpan: jest.fn(() => null),
    createSpan: jest.fn(() => ({
      end: jest.fn(),
      setAttribute: jest.fn(),
      setAttributes: jest.fn(),
      setStatus: jest.fn(),
      recordException: jest.fn(),
      addEvent: jest.fn(),
    })),
    withSpan: jest.fn(async (name, fn) => {
      const mockSpan = {
        end: jest.fn(),
        setAttribute: jest.fn(),
        setAttributes: jest.fn(),
        setStatus: jest.fn(),
        recordException: jest.fn(),
        addEvent: jest.fn(),
      };
      return await fn(mockSpan);
    }),
    withSpanSync: jest.fn((name, fn) => {
      const mockSpan = {
        end: jest.fn(),
        setAttribute: jest.fn(),
        setAttributes: jest.fn(),
        setStatus: jest.fn(),
        recordException: jest.fn(),
        addEvent: jest.fn(),
      };
      return fn(mockSpan);
    }),
    traceDbQuery: jest.fn(async (query, operation, table, fn) => await fn()),
    traceExternalCall: jest.fn(async (service, method, url, fn) => await fn()),
    traceCacheOperation: jest.fn(async (operation, key, cacheName, fn) => await fn()),
    tracingMiddleware: jest.fn((req, res, next) => next()),
    addSpanEvent: jest.fn(),
    setSpanAttribute: jest.fn(),
    recordException: jest.fn(),
  };
}
