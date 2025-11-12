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
export declare class AppError extends Error {
    message: string;
    statusCode: number;
    code: string;
    isOperational: boolean;
    constructor(message: string, statusCode: number, code: string, isOperational?: boolean);
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
export declare const ErrorCodes: {
    readonly BAD_REQUEST: "BAD_REQUEST";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly CONFLICT: "CONFLICT";
    readonly UNPROCESSABLE_ENTITY: "UNPROCESSABLE_ENTITY";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly REQUEST_TIMEOUT: "REQUEST_TIMEOUT";
    readonly INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR";
    readonly NOT_IMPLEMENTED: "NOT_IMPLEMENTED";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR";
    readonly INVALID_TOKEN: "INVALID_TOKEN";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS";
    readonly RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
};
/**
 * Create a bad request error
 */
export declare function createBadRequestError(message: string): AppError;
/**
 * Create an unauthorized error
 */
export declare function createUnauthorizedError(message?: string): AppError;
/**
 * Create a forbidden error
 */
export declare function createForbiddenError(message?: string): AppError;
/**
 * Create a not found error
 */
export declare function createNotFoundError(resource: string): AppError;
/**
 * Create a conflict error
 */
export declare function createConflictError(message: string): AppError;
/**
 * Create a validation error
 */
export declare function createValidationError(message: string, details?: any): AppError;
/**
 * Create an internal server error
 */
export declare function createInternalServerError(message?: string): AppError;
/**
 * Create a service unavailable error
 */
export declare function createServiceUnavailableError(message?: string): AppError;
/**
 * Global error handler middleware
 * Should be registered as the last middleware in Express app
 */
export declare function errorHandler(error: Error | AppError, req: Request, res: Response, next: NextFunction): void;
/**
 * Async error wrapper for route handlers
 * Catches errors and passes them to the error handler
 */
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): (req: Request, res: Response, next: NextFunction) => void;
export default errorHandler;
//# sourceMappingURL=errorHandler.d.ts.map