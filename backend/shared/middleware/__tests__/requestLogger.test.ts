/**
 * Unit Tests for Request Logger Middleware (T254)
 * Tests request logging, correlation IDs, and response tracking
 */

// Mock uuid - MUST be before imports
jest.mock('uuid');

// Mock logger - MUST be before imports
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnValue({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
}));

import { Request, Response, NextFunction } from 'express';
import { requestLogger, attachRequestIdToLogs } from '../requestLogger';
import { v4 as uuidv4 } from 'uuid';

describe('Request Logger Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Configure uuid mock to return a test value
    (uuidv4 as jest.Mock).mockReturnValue('generated-uuid-123');

    mockRequest = {
      method: 'GET',
      path: '/api/users',
      originalUrl: '/api/users?page=1',
      hostname: 'localhost',
      headers: {
        'user-agent': 'Mozilla/5.0 (Linux)',
      },
      query: { page: '1' },
      socket: {
        remoteAddress: '192.168.1.100',
      } as any,
    } as any;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      statusCode: 200,
    };

    mockNext = jest.fn();
  });

  describe('requestLogger middleware', () => {
    it('should attach requestId to request object', () => {
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).requestId).toBeDefined();
      expect(typeof (mockRequest as any).requestId).toBe('string');
    });

    it('should generate UUID v4 for requestId', () => {
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      expect(uuidv4).toHaveBeenCalled();
    });

    it('should use existing X-Request-ID header if provided', () => {
      const customId = 'custom-req-id-456';
      mockRequest.headers = {
        'x-request-id': customId,
      };

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).requestId).toBe(customId);
    });

    it('should set correlation ID', () => {
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).correlationId).toBeDefined();
    });

    it('should use X-Correlation-ID header if provided', () => {
      const customCorrelation = 'correlation-789';
      mockRequest.headers = {
        'x-correlation-id': customCorrelation,
      };

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).correlationId).toBe(customCorrelation);
    });

    it('should set response headers with request ID', () => {
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Request-ID',
        expect.any(String)
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Correlation-ID',
        expect.any(String)
      );
    });

    it('should call next middleware', () => {
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should log incoming request', () => {
      const { logger } = require('../../utils/logger');

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.info).toHaveBeenCalledWith(
        'Incoming request',
        expect.objectContaining({
          method: 'GET',
          path: '/api/users',
        })
      );
    });

    it('should skip logging for health check paths', () => {
      const { logger } = require('../../utils/logger');

      mockRequest.path = '/health';

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.info).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip logging for metrics paths', () => {
      const { logger } = require('../../utils/logger');

      mockRequest.path = '/metrics';

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.info).not.toHaveBeenCalled();
    });

    it('should extract user ID from user object', () => {
      const { logger } = require('../../utils/logger');
      (mockRequest as any).user = { id: 'user-123' };

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.info).toHaveBeenCalledWith(
        'Incoming request',
        expect.objectContaining({
          userId: 'user-123',
        })
      );
    });

    it('should include IP address in request log', () => {
      const { logger } = require('../../utils/logger');

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.info).toHaveBeenCalledWith(
        'Incoming request',
        expect.objectContaining({
          ip: expect.any(String),
        })
      );
    });

    it('should include user agent in request log', () => {
      const { logger } = require('../../utils/logger');

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.info).toHaveBeenCalledWith(
        'Incoming request',
        expect.objectContaining({
          userAgent: 'Mozilla/5.0 (Linux)',
        })
      );
    });

    it('should redact sensitive query parameters', () => {
      const { logger } = require('../../utils/logger');
      mockRequest.query = {
        password: 'secret123',
        apiKey: 'key-456',
        regularParam: 'value',
      };

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      const call = logger.info.mock.calls[0][1];
      expect(call.query).toEqual({
        password: '[REDACTED]',
        apiKey: '[REDACTED]',
        regularParam: 'value',
      });
    });
  });

  describe('Response logging', () => {
    it('should log response via json method', () => {
      const { logger } = require('../../utils/logger');
      const originalJson = jest.fn();
      mockResponse.json = originalJson;

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      // Simulate response
      const json = (mockResponse.json as jest.Mock);
      json({ data: 'test' });

      // Response should be logged
      expect(logger.info).toHaveBeenCalledWith(
        'Request completed',
        expect.objectContaining({
          statusCode: 200,
          duration: expect.any(Number),
        })
      );
    });

    it('should measure request duration', () => {
      const { logger } = require('../../utils/logger');
      jest.useFakeTimers();

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      // Advance time
      jest.advanceTimersByTime(150);

      const json = (mockResponse.json as jest.Mock);
      json({ data: 'test' });

      const call = logger.info.mock.calls.find(
        (c) => c[0] === 'Request completed'
      );
      expect(call![1]).toHaveProperty('duration', expect.any(Number));

      jest.useRealTimers();
    });

    it('should log responses with 4xx status as warnings', () => {
      const { logger } = require('../../utils/logger');
      mockResponse.statusCode = 404;

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      const json = (mockResponse.json as jest.Mock);
      json({ error: 'Not found' });

      expect(logger.warn).toHaveBeenCalledWith(
        'Request completed with error',
        expect.objectContaining({
          statusCode: 404,
        })
      );
    });

    it('should log responses with 5xx status as warnings', () => {
      const { logger } = require('../../utils/logger');
      mockResponse.statusCode = 500;

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      const json = (mockResponse.json as jest.Mock);
      json({ error: 'Internal error' });

      expect(logger.warn).toHaveBeenCalledWith(
        'Request completed with error',
        expect.objectContaining({
          statusCode: 500,
        })
      );
    });

    it('should log successful responses as info', () => {
      const { logger } = require('../../utils/logger');
      mockResponse.statusCode = 200;

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      const json = (mockResponse.json as jest.Mock);
      json({ data: 'success' });

      expect(logger.info).toHaveBeenCalledWith(
        'Request completed',
        expect.objectContaining({
          statusCode: 200,
        })
      );
    });

    it('should log response via send method', () => {
      const { logger } = require('../../utils/logger');
      mockResponse.statusCode = 200;

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      const send = (mockResponse.send as jest.Mock);
      send('text response');

      expect(logger.info).toHaveBeenCalledWith(
        'Request completed',
        expect.any(Object)
      );
    });
  });

  describe('attachRequestIdToLogs middleware', () => {
    it('should attach logger to request object', () => {
      (mockRequest as any).requestId = 'req-123';

      attachRequestIdToLogs(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).logger).toBeDefined();
    });

    it('should create child logger with request context', () => {
      const { logger } = require('../../utils/logger');
      (mockRequest as any).requestId = 'req-123';
      (mockRequest as any).userId = 'user-456';
      (mockRequest as any).correlationId = 'corr-789';

      attachRequestIdToLogs(mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.child).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'req-123',
          userId: 'user-456',
          correlationId: 'corr-789',
        })
      );
    });

    it('should call next middleware', () => {
      attachRequestIdToLogs(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('IP address extraction', () => {
    it('should use X-Forwarded-For header if present', () => {
      const { logger } = require('../../utils/logger');
      mockRequest.headers = {
        'x-forwarded-for': '10.0.0.1, 10.0.0.2',
      };

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.info).toHaveBeenCalledWith(
        'Incoming request',
        expect.objectContaining({
          ip: '10.0.0.1',
        })
      );
    });

    it('should use socket remote address as fallback', () => {
      const { logger } = require('../../utils/logger');
      mockRequest.headers = {};
      mockRequest.socket = { remoteAddress: '192.168.1.1' } as any;

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.info).toHaveBeenCalledWith(
        'Incoming request',
        expect.objectContaining({
          ip: '192.168.1.1',
        })
      );
    });

    it('should use unknown if no IP available', () => {
      const { logger } = require('../../utils/logger');
      mockRequest.headers = {};
      mockRequest.socket = {} as any;
      (mockRequest as any).ip = undefined;

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.info).toHaveBeenCalledWith(
        'Incoming request',
        expect.objectContaining({
          ip: 'unknown',
        })
      );
    });
  });

  describe('Sensitive data handling', () => {
    it('should redact password fields', () => {
      const { logger } = require('../../utils/logger');
      mockRequest.query = { password: 'secret' };

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      const call = logger.info.mock.calls[0][1];
      expect(call.query.password).toBe('[REDACTED]');
    });

    it('should redact token fields', () => {
      const { logger } = require('../../utils/logger');
      mockRequest.query = { token: 'secret-token-123' };

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      const call = logger.info.mock.calls[0][1];
      expect(call.query.token).toBe('[REDACTED]');
    });

    it('should redact credit card fields', () => {
      const { logger } = require('../../utils/logger');
      mockRequest.query = { creditCard: '4111-1111-1111-1111' };

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      const call = logger.info.mock.calls[0][1];
      expect(call.query.creditCard).toBe('[REDACTED]');
    });

    it('should not redact non-sensitive fields', () => {
      const { logger } = require('../../utils/logger');
      mockRequest.query = {
        name: 'John Doe',
        page: '1',
        search: 'test',
      };

      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      const call = logger.info.mock.calls[0][1];
      expect(call.query.name).toBe('John Doe');
      expect(call.query.page).toBe('1');
    });
  });
});
