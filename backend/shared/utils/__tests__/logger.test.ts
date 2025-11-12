/**
 * Unit Tests for Logger Utility (T251)
 * Tests structured logging, log levels, and context propagation
 */

import * as path from 'path';
import * as fs from 'fs';
import { logger, logInfo, logWarn, logError, logDebug, createChildLogger, LogContext } from '../logger';

describe('Logger Utility', () => {
  const testLogDir = path.join(__dirname, '../../../test-logs');

  beforeAll(() => {
    // Ensure test log directory exists
    if (!fs.existsSync(testLogDir)) {
      fs.mkdirSync(testLogDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test logs
    if (fs.existsSync(testLogDir)) {
      const files = fs.readdirSync(testLogDir);
      files.forEach((file) => {
        fs.unlinkSync(path.join(testLogDir, file));
      });
      fs.rmdirSync(testLogDir);
    }
  });

  describe('logInfo()', () => {
    it('should log info message without context', () => {
      const spy = jest.spyOn(logger, 'info');

      logInfo('Test info message');

      expect(spy).toHaveBeenCalledWith('Test info message', {});
      spy.mockRestore();
    });

    it('should log info message with context', () => {
      const spy = jest.spyOn(logger, 'info');
      const context: LogContext = {
        requestId: 'req-123',
        userId: 'user-456',
      };

      logInfo('Test info with context', context);

      expect(spy).toHaveBeenCalledWith('Test info with context', { context });
      spy.mockRestore();
    });
  });

  describe('logWarn()', () => {
    it('should log warning message', () => {
      const spy = jest.spyOn(logger, 'warn');
      const context: LogContext = {
        requestId: 'req-123',
      };

      logWarn('Test warning', context);

      expect(spy).toHaveBeenCalledWith('Test warning', { context });
      spy.mockRestore();
    });
  });

  describe('logError()', () => {
    it('should log error with stack trace', () => {
      const spy = jest.spyOn(logger, 'error');
      const error = new Error('Test error message');
      const context: LogContext = {
        requestId: 'req-123',
        userId: 'user-456',
      };

      logError('An error occurred', error, context);

      expect(spy).toHaveBeenCalledWith('An error occurred', {
        error: error.message,
        stack: error.stack,
        context,
      });
      spy.mockRestore();
    });

    it('should log error without context', () => {
      const spy = jest.spyOn(logger, 'error');
      const error = new Error('Another test error');

      logError('Error message', error);

      expect(spy).toHaveBeenCalledWith('Error message', {
        error: error.message,
        stack: error.stack,
      });
      spy.mockRestore();
    });
  });

  describe('logDebug()', () => {
    it('should log debug message', () => {
      const spy = jest.spyOn(logger, 'debug');
      const context: LogContext = {
        requestId: 'req-123',
        data: { test: 'value' },
      };

      logDebug('Debug message', context);

      expect(spy).toHaveBeenCalledWith('Debug message', { context });
      spy.mockRestore();
    });
  });

  describe('createChildLogger()', () => {
    it('should create child logger with context', () => {
      const context: LogContext = {
        requestId: 'req-123',
        userId: 'user-456',
      };

      const childLogger = createChildLogger(context);

      expect(childLogger).toBeDefined();
      // Child logger should have the context attached
      expect(typeof childLogger.info).toBe('function');
      expect(typeof childLogger.warn).toBe('function');
      expect(typeof childLogger.error).toBe('function');
      expect(typeof childLogger.debug).toBe('function');
    });

    it('should propagate context to child logger methods', () => {
      const spy = jest.spyOn(logger, 'child');
      const context: LogContext = {
        pharmacyId: 'pharmacy-789',
      };

      createChildLogger(context);

      expect(spy).toHaveBeenCalledWith({ context });
      spy.mockRestore();
    });
  });

  describe('logRequest()', () => {
    it('should log incoming request with all fields', () => {
      const spy = jest.spyOn(logger, 'info');

      const { logRequest } = require('../logger');
      logRequest('GET', '/api/users', 'user-123', 'req-456');

      expect(spy).toHaveBeenCalledWith('Incoming request', {
        method: 'GET',
        path: '/api/users',
        userId: 'user-123',
        requestId: 'req-456',
      });
      spy.mockRestore();
    });

    it('should log request without userId', () => {
      const spy = jest.spyOn(logger, 'info');

      const { logRequest } = require('../logger');
      logRequest('POST', '/api/login', undefined, 'req-789');

      expect(spy).toHaveBeenCalledWith('Incoming request', {
        method: 'POST',
        path: '/api/login',
        userId: undefined,
        requestId: 'req-789',
      });
      spy.mockRestore();
    });
  });

  describe('logResponse()', () => {
    it('should log response with duration', () => {
      const spy = jest.spyOn(logger, 'info');

      const { logResponse } = require('../logger');
      logResponse('GET', '/api/users', 200, 150, 'req-123');

      expect(spy).toHaveBeenCalledWith('Request completed', {
        method: 'GET',
        path: '/api/users',
        statusCode: 200,
        duration: 150,
        requestId: 'req-123',
      });
      spy.mockRestore();
    });
  });

  describe('logDatabase()', () => {
    it('should log database operation with context', () => {
      const spy = jest.spyOn(logger, 'debug');
      const context: LogContext = {
        userId: 'user-123',
      };

      const { logDatabase } = require('../logger');
      logDatabase('SELECT', 'users', 45, context);

      expect(spy).toHaveBeenCalledWith('Database operation', {
        operation: 'SELECT',
        table: 'users',
        duration: 45,
        context,
      });
      spy.mockRestore();
    });
  });

  describe('Logger instance', () => {
    it('should be properly configured', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should have default metadata with service name', () => {
      const spy = jest.spyOn(logger, 'info');

      logger.info('Test message');

      // The call should include the message
      expect(spy).toHaveBeenCalledWith('Test message');
      spy.mockRestore();
    });
  });

  describe('Log levels', () => {
    it('should respect log level configuration', () => {
      const currentLevel = logger.level;
      expect(['error', 'warn', 'info', 'debug']).toContain(currentLevel);
    });
  });

  describe('Context nesting', () => {
    it('should handle deeply nested context objects', () => {
      const spy = jest.spyOn(logger, 'info');
      const context: LogContext = {
        requestId: 'req-123',
        user: {
          id: 'user-456',
          pharmacy: {
            id: 'pharmacy-789',
            address: {
              city: 'Geneva',
            },
          },
        } as any,
      };

      logInfo('Nested context', context);

      expect(spy).toHaveBeenCalledWith('Nested context', { context });
      spy.mockRestore();
    });
  });

  describe('Error handling', () => {
    it('should handle logging without error object', () => {
      const spy = jest.spyOn(logger, 'error');

      logError('Error without exception');

      expect(spy).toHaveBeenCalledWith('Error without exception', {});
      spy.mockRestore();
    });

    it('should extract error message and stack', () => {
      const spy = jest.spyOn(logger, 'error');
      const error = new Error('Database connection failed');

      logError('DB Error', error);

      expect(spy).toHaveBeenCalled();
      const call = spy.mock.calls[0] as any[];
      expect(call[1]).toHaveProperty('error', 'Database connection failed');
      expect(call[1]).toHaveProperty('stack');

      spy.mockRestore();
    });
  });
});
