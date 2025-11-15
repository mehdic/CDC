"use strict";
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
class AppError extends Error {
    message;
    statusCode;
    code;
    isOperational;
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
exports.ErrorCodes = {
    BAD_REQUEST: 'BAD_REQUEST',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    DATABASE_ERROR: 'DATABASE_ERROR',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
    INVALID_TOKEN: 'INVALID_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
};
function createBadRequestError(message) {
    return new AppError(message, 400, exports.ErrorCodes.BAD_REQUEST);
}
function createUnauthorizedError(message = 'Unauthorized') {
    return new AppError(message, 401, exports.ErrorCodes.UNAUTHORIZED);
}
function createForbiddenError(message = 'Forbidden') {
    return new AppError(message, 403, exports.ErrorCodes.FORBIDDEN);
}
function createNotFoundError(resource) {
    return new AppError(`${resource} not found`, 404, exports.ErrorCodes.NOT_FOUND);
}
function createConflictError(message) {
    return new AppError(message, 409, exports.ErrorCodes.CONFLICT);
}
function createValidationError(message, details) {
    const error = new AppError(message, 422, exports.ErrorCodes.VALIDATION_ERROR);
    error.details = details;
    return error;
}
function createInternalServerError(message = 'Internal Server Error') {
    return new AppError(message, 500, exports.ErrorCodes.INTERNAL_SERVER_ERROR, false);
}
function createServiceUnavailableError(message = 'Service Unavailable') {
    return new AppError(message, 503, exports.ErrorCodes.SERVICE_UNAVAILABLE, false);
}
function errorHandler(error, req, res, next) {
    const requestId = req.requestId || 'unknown';
    const timestamp = new Date().toISOString();
    let statusCode = 500;
    let code = exports.ErrorCodes.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let stack;
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        code = error.code;
        message = error.message;
        if (process.env.NODE_ENV === 'development') {
            stack = error.stack;
        }
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
        logger_1.logger.error('Unhandled Error', error, { requestId });
        if (process.env.NODE_ENV === 'development') {
            stack = error.stack;
        }
    }
    else {
        logger_1.logger.error('Unknown Error Type', new Error(String(error)), { requestId });
    }
    const isOperational = error instanceof AppError ? error.isOperational : false;
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
    res.status(statusCode).json(errorResponse);
    if (!isOperational) {
        logger_1.logger.error('Non-operational error detected', error, {
            requestId,
            statusCode,
        });
    }
}
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
exports.default = errorHandler;
//# sourceMappingURL=errorHandler.js.map