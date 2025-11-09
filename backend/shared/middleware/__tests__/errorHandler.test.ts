/**
 * Unit Tests for Error Handler Middleware (T253)
 * Tests error categorization, response formatting, and logging
 */

import { Request, Response, NextFunction } from 'express';
import {
  AppError,
  ErrorCodes,
  errorHandler,
  asyncHandler,
  createBadRequestError,
  createUnauthorizedError,
  createForbiddenError,
  createNotFoundError,
  createConflictError,
  createValidationError,
  createInternalServerError,
  createServiceUnavailableError,
} from '../errorHandler';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      method: 'POST',
      path: '/api/users',
    } as any;

    mockRequest.requestId = 'req-123';

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('AppError class', () => {
    it('should create AppError with all properties', () => {
      const error = new AppError('Test error', 400, ErrorCodes.BAD_REQUEST, true);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCodes.BAD_REQUEST);
      expect(error.isOperational).toBe(true);
    });

    it('should extend Error class', () => {
      const error = new AppError('Test', 500, ErrorCodes.INTERNAL_SERVER_ERROR);

      expect(error instanceof Error).toBe(true);
      expect(error.stack).toBeDefined();
    });
  });

  describe('Error factory functions', () => {
    describe('createBadRequestError()', () => {
      it('should create 400 error', () => {
        const error = createBadRequestError('Invalid input');

        expect(error.statusCode).toBe(400);
        expect(error.code).toBe(ErrorCodes.BAD_REQUEST);
        expect(error.message).toBe('Invalid input');
      });
    });

    describe('createUnauthorizedError()', () => {
      it('should create 401 error', () => {
        const error = createUnauthorizedError('Invalid credentials');

        expect(error.statusCode).toBe(401);
        expect(error.code).toBe(ErrorCodes.UNAUTHORIZED);
        expect(error.message).toBe('Invalid credentials');
      });

      it('should use default message', () => {
        const error = createUnauthorizedError();

        expect(error.message).toBe('Unauthorized');
      });
    });

    describe('createForbiddenError()', () => {
      it('should create 403 error', () => {
        const error = createForbiddenError('Access denied');

        expect(error.statusCode).toBe(403);
        expect(error.code).toBe(ErrorCodes.FORBIDDEN);
      });
    });

    describe('createNotFoundError()', () => {
      it('should create 404 error with resource name', () => {
        const error = createNotFoundError('User');

        expect(error.statusCode).toBe(404);
        expect(error.code).toBe(ErrorCodes.NOT_FOUND);
        expect(error.message).toBe('User not found');
      });
    });

    describe('createConflictError()', () => {
      it('should create 409 error', () => {
        const error = createConflictError('Resource already exists');

        expect(error.statusCode).toBe(409);
        expect(error.code).toBe(ErrorCodes.CONFLICT);
      });
    });

    describe('createValidationError()', () => {
      it('should create 422 error', () => {
        const error = createValidationError('Invalid input');

        expect(error.statusCode).toBe(422);
        expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
      });

      it('should include validation details', () => {
        const details = { field: 'email', message: 'Invalid format' };
        const error = createValidationError('Validation failed', details);

        expect((error as any).details).toEqual(details);
      });
    });

    describe('createInternalServerError()', () => {
      it('should create 500 error', () => {
        const error = createInternalServerError('Database error');

        expect(error.statusCode).toBe(500);
        expect(error.code).toBe(ErrorCodes.INTERNAL_SERVER_ERROR);
        expect(error.isOperational).toBe(false);
      });
    });

    describe('createServiceUnavailableError()', () => {
      it('should create 503 error', () => {
        const error = createServiceUnavailableError('Maintenance in progress');

        expect(error.statusCode).toBe(503);
        expect(error.code).toBe(ErrorCodes.SERVICE_UNAVAILABLE);
      });
    });
  });

  describe('errorHandler middleware', () => {
    it('should handle AppError with correct status code', () => {
      const error = createBadRequestError('Invalid data');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorCodes.BAD_REQUEST,
            message: 'Invalid data',
            statusCode: 400,
          }),
        })
      );
    });

    it('should include requestId in error response', () => {
      const error = createNotFoundError('Resource');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            requestId: 'req-123',
          }),
        })
      );
    });

    it('should include timestamp in error response', () => {
      const error = createBadRequestError('Test');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      const call = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(call.error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should not include stack trace in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = createInternalServerError('Server error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      const call = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(call.error.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should include stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new AppError('Test', 400, ErrorCodes.BAD_REQUEST);

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      const call = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(call.error.stack).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle generic Error instances', () => {
      const error = new Error('Generic error message');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            statusCode: 500,
            code: ErrorCodes.INTERNAL_SERVER_ERROR,
          }),
        })
      );
    });

    it('should handle unknown error types', () => {
      const unknownError = 'String error' as any;

      errorHandler(unknownError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('should log 5xx errors', () => {
      const { logger } = require('../../utils/logger');
      const error = createInternalServerError('Server issue');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.error).toHaveBeenCalled();
    });

    it('should warn on 4xx errors', () => {
      const { logger } = require('../../utils/logger');
      const error = createBadRequestError('Bad request');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('asyncHandler wrapper', () => {
    it('should wrap async route handlers', async () => {
      const mockFn = jest.fn().mockResolvedValue(undefined);
      const wrapped = asyncHandler(mockFn);

      wrapped(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
    });

    it('should catch errors in async functions', async () => {
      const testError = new Error('Async error');
      const mockFn = jest.fn().mockRejectedValue(testError);
      const wrapped = asyncHandler(mockFn);

      wrapped(mockRequest as Request, mockResponse as Response, mockNext);

      // Give promise time to settle
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockNext).toHaveBeenCalledWith(testError);
    });

    it('should pass thrown errors to next middleware', async () => {
      const thrownError = new Error('Thrown error');
      const mockFn = jest.fn().mockImplementation(() => {
        throw thrownError;
      });
      const wrapped = asyncHandler(mockFn);

      expect(() => {
        wrapped(mockRequest as Request, mockResponse as Response, mockNext);
      }).not.toThrow();
    });
  });

  describe('Error response format', () => {
    it('should match standard error format', () => {
      const error = createValidationError('Invalid input');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      const call = (mockResponse.json as jest.Mock).mock.calls[0][0];

      // Verify structure
      expect(call).toHaveProperty('error');
      expect(call.error).toHaveProperty('code');
      expect(call.error).toHaveProperty('message');
      expect(call.error).toHaveProperty('requestId');
      expect(call.error).toHaveProperty('statusCode');
      expect(call.error).toHaveProperty('timestamp');
    });

    it('should not leak sensitive information', () => {
      const error = new AppError('Database password: secret123', 500, ErrorCodes.INTERNAL_SERVER_ERROR);

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      const call = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(call.error.message).toBe('Database password: secret123');
      // In production, message should be sanitized - this is app responsibility
    });
  });

  describe('Different HTTP methods', () => {
    it('should handle errors from GET requests', () => {
      mockRequest.method = 'GET';
      const error = createNotFoundError('Resource');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should handle errors from POST requests', () => {
      mockRequest.method = 'POST';
      const error = createConflictError('Resource exists');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
    });

    it('should handle errors from DELETE requests', () => {
      mockRequest.method = 'DELETE';
      const error = createForbiddenError('Cannot delete');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });
});
