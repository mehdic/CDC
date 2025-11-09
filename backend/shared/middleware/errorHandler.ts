/**
 * Centralized Error Handler Middleware (T253)
 * Implements uniform error handling and response formatting
 * Based on: /specs/002-metapharm-platform/plan.md
 *
 * Features:
 * - Centralized error logging with context
 * - Consistent error response format
 * - Error categorization (4xx vs 5xx)
 * - Stack trace redaction in production
 * - Request context preservation
 * - Security: No sensitive data in responses
 *
 * Error Response Format:
 * {
 *   error: {
 *     code: string,
 *     message: string,
 *     requestId: string,
 *     statusCode: number,
 *     timestamp: string
 *   }
 * }
 *
 * Usage:
 * app.use(errorHandler);
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// ============================================================================
// Types
// ============================================================================

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    requestId?: string;
    statusCode: number;
    timestamp: string;
    stack?: string;
  };
}

// ============================================================================
// Common Error Definitions
// ============================================================================

export const ErrorCodes = {
  // 4xx Client Errors
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // Custom Errors
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

// ============================================================================
// Error Factory Functions
// ============================================================================

/**
 * Create a bad request error
 */
export function createBadRequestError(message: string): AppError {
  return new AppError(message, 400, ErrorCodes.BAD_REQUEST);
}

/**
 * Create an unauthorized error
 */
export function createUnauthorizedError(message: string = 'Unauthorized'): AppError {
  return new AppError(message, 401, ErrorCodes.UNAUTHORIZED);
}

/**
 * Create a forbidden error
 */
export function createForbiddenError(message: string = 'Forbidden'): AppError {
  return new AppError(message, 403, ErrorCodes.FORBIDDEN);
}

/**
 * Create a not found error
 */
export function createNotFoundError(resource: string): AppError {
  return new AppError(`${resource} not found`, 404, ErrorCodes.NOT_FOUND);
}

/**
 * Create a conflict error
 */
export function createConflictError(message: string): AppError {
  return new AppError(message, 409, ErrorCodes.CONFLICT);
}

/**
 * Create a validation error
 */
export function createValidationError(message: string, details?: any): AppError {
  const error = new AppError(message, 422, ErrorCodes.VALIDATION_ERROR);
  (error as any).details = details;
  return error;
}

/**
 * Create an internal server error
 */
export function createInternalServerError(message: string = 'Internal Server Error'): AppError {
  return new AppError(message, 500, ErrorCodes.INTERNAL_SERVER_ERROR, false);
}

/**
 * Create a service unavailable error
 */
export function createServiceUnavailableError(message: string = 'Service Unavailable'): AppError {
  return new AppError(message, 503, ErrorCodes.SERVICE_UNAVAILABLE, false);
}

// ============================================================================
// Error Handler
// ============================================================================

/**
 * Global error handler middleware
 * Should be registered as the last middleware in Express app
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = (req as any).requestId || 'unknown';
  const timestamp = new Date().toISOString();

  // Default error properties
  let statusCode = 500;
  let code: string = ErrorCodes.INTERNAL_SERVER_ERROR;
  let message = 'Internal Server Error';
  let stack: string | undefined;

  // Handle AppError instances
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;

    // Only include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      stack = error.stack;
    }

    // Log based on status code
    if (statusCode >= 500) {
      logger.error(`API Error (${code})`, error, { requestId, statusCode });
    } else {
      logger.warn(`Client Error (${code}): ${message}`, {
        requestId,
        statusCode,
      });
    }
  } else if (error instanceof Error) {
    // Handle generic Error instances
    logger.error('Unhandled Error', error, { requestId });

    // Only include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      stack = error.stack;
    }
  } else {
    // Handle unknown error types
    logger.error('Unknown Error Type', new Error(String(error)), { requestId });
  }

  // Determine if it's an operational error
  const isOperational = error instanceof AppError ? error.isOperational : false;

  // Build error response
  const errorResponse: ErrorResponse = {
    error: {
      code,
      message,
      requestId,
      statusCode,
      timestamp,
      ...(stack ? { stack } : {}),
    },
  };

  // Send response
  res.status(statusCode).json(errorResponse);

  // If it's not operational, we should probably log more aggressively
  // or trigger alerts, but for now just log
  if (!isOperational) {
    logger.error('Non-operational error detected', error as Error, {
      requestId,
      statusCode,
    });
  }
}

/**
 * Async error wrapper for route handlers
 * Catches errors and passes them to the error handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default errorHandler;
