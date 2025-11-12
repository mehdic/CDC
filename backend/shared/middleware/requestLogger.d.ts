/**
 * Request Logging and Correlation ID Middleware (T254)
 * Implements request/response logging with unique request IDs
 * Based on: /specs/002-metapharm-platform/plan.md
 *
 * Features:
 * - Unique UUID v4 requestId for every request
 * - Request logging: method, path, userId, timestamp
 * - Response logging: statusCode, duration, requestId
 * - RequestId propagation through all logs
 * - X-Request-ID header in responses
 * - User-Agent and IP tracking
 * - Request body/response body logging (with redaction for sensitive data)
 *
 * Usage:
 * app.use(requestLogger);
 *
 * Access requestId in routes:
 * const requestId = req.requestId;
 * or
 * const requestId = (req as any).requestId;
 */
import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            requestId: string;
            userId?: string;
            correlationId?: string;
        }
    }
}
/**
 * Request logging middleware
 * Must be registered early in the middleware chain
 */
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware to attach request ID to all logs
 * Works with the logger utility to include requestId in context
 */
export declare function attachRequestIdToLogs(req: Request, res: Response, next: NextFunction): void;
export default requestLogger;
//# sourceMappingURL=requestLogger.d.ts.map