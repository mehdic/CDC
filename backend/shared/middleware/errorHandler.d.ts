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
export declare function createBadRequestError(message: string): AppError;
export declare function createUnauthorizedError(message?: string): AppError;
export declare function createForbiddenError(message?: string): AppError;
export declare function createNotFoundError(resource: string): AppError;
export declare function createConflictError(message: string): AppError;
export declare function createValidationError(message: string, details?: any): AppError;
export declare function createInternalServerError(message?: string): AppError;
export declare function createServiceUnavailableError(message?: string): AppError;
export declare function errorHandler(error: Error | AppError, req: Request, res: Response, next: NextFunction): void;
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): (req: Request, res: Response, next: NextFunction) => void;
export default errorHandler;
//# sourceMappingURL=errorHandler.d.ts.map