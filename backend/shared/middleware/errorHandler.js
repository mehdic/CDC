"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCodes = exports.AppError = void 0;
exports.createBadRequestError = createBadRequestError;
exports.createUnauthorizedError = createUnauthorizedError;
exports.createForbiddenError = createForbiddenError;
exports.createNotFoundError = createNotFoundError;
exports.createConflictError = createConflictError;
exports.createValidationError = createValidationError;
exports.createInternalServerError = createInternalServerError;
exports.createServiceUnavailableError = createServiceUnavailableError;
exports.errorHandler = errorHandler;
exports.asyncHandler = asyncHandler;
const logger_1 = require("../utils/logger");
// ============================================================================
// Types
// ============================================================================
class AppError extends Error {
    constructor(message, statusCode, code, isOperational = true) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
// ============================================================================
// Common Error Definitions
// ============================================================================
exports.ErrorCodes = {
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
};
// ============================================================================
// Error Factory Functions
// ============================================================================
/**
 * Create a bad request error
 */
function createBadRequestError(message) {
    return new AppError(message, 400, exports.ErrorCodes.BAD_REQUEST);
}
/**
 * Create an unauthorized error
 */
function createUnauthorizedError(message = 'Unauthorized') {
    return new AppError(message, 401, exports.ErrorCodes.UNAUTHORIZED);
}
/**
 * Create a forbidden error
 */
function createForbiddenError(message = 'Forbidden') {
    return new AppError(message, 403, exports.ErrorCodes.FORBIDDEN);
}
/**
 * Create a not found error
 */
function createNotFoundError(resource) {
    return new AppError(`${resource} not found`, 404, exports.ErrorCodes.NOT_FOUND);
}
/**
 * Create a conflict error
 */
function createConflictError(message) {
    return new AppError(message, 409, exports.ErrorCodes.CONFLICT);
}
/**
 * Create a validation error
 */
function createValidationError(message, details) {
    const error = new AppError(message, 422, exports.ErrorCodes.VALIDATION_ERROR);
    error.details = details;
    return error;
}
/**
 * Create an internal server error
 */
function createInternalServerError(message = 'Internal Server Error') {
    return new AppError(message, 500, exports.ErrorCodes.INTERNAL_SERVER_ERROR, false);
}
/**
 * Create a service unavailable error
 */
function createServiceUnavailableError(message = 'Service Unavailable') {
    return new AppError(message, 503, exports.ErrorCodes.SERVICE_UNAVAILABLE, false);
}
// ============================================================================
// Error Handler
// ============================================================================
/**
 * Global error handler middleware
 * Should be registered as the last middleware in Express app
 */
function errorHandler(error, req, res, next) {
    const requestId = req.requestId || 'unknown';
    const timestamp = new Date().toISOString();
    // Default error properties
    let statusCode = 500;
    let code = exports.ErrorCodes.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let stack;
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
            logger_1.logger.error(`API Error (${code})`, error, { requestId, statusCode });
        }
        else {
            logger_1.logger.warn(`Client Error (${code}): ${message}`, {
                requestId,
                statusCode,
            });
        }
    }
    else if (error instanceof Error) {
        // Handle generic Error instances
        logger_1.logger.error('Unhandled Error', error, { requestId });
        // Only include stack trace in development
        if (process.env.NODE_ENV === 'development') {
            stack = error.stack;
        }
    }
    else {
        // Handle unknown error types
        logger_1.logger.error('Unknown Error Type', new Error(String(error)), { requestId });
    }
    // Determine if it's an operational error
    const isOperational = error instanceof AppError ? error.isOperational : false;
    // Build error response
    const errorResponse = {
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
        logger_1.logger.error('Non-operational error detected', error, {
            requestId,
            statusCode,
        });
    }
}
/**
 * Async error wrapper for route handlers
 * Catches errors and passes them to the error handler
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
exports.default = errorHandler;
//# sourceMappingURL=errorHandler.js.map