/**
 * Application Logging Infrastructure (T251)
 * Implements structured logging with Winston
 * Based on: /specs/002-metapharm-platform/plan.md
 *
 * Features:
 * - Structured logging with JSON format
 * - Multiple log levels: error, warn, info, debug
 * - Request correlation IDs for distributed tracing
 * - File rotation for production
 * - User ID tracking for audit trails
 * - Request ID propagation through logs
 *
 * Usage:
 * logger.info('User logged in', { userId: '123', requestId: 'req-456' })
 * logger.error('Database error', error, { userId: '123', requestId: 'req-456' })
 */
import * as winston from 'winston';
export interface LogContext {
    requestId?: string;
    userId?: string;
    pharmacyId?: string;
    correlationId?: string;
    [key: string]: any;
}
export interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    error?: string;
    stack?: string;
    context?: LogContext;
}
export declare const logger: winston.Logger;
/**
 * Log info level message
 */
export declare function logInfo(message: string, context?: LogContext): void;
/**
 * Log warning level message
 */
export declare function logWarn(message: string, context?: LogContext): void;
/**
 * Log error with stack trace
 */
export declare function logError(message: string, error?: Error, context?: LogContext): void;
/**
 * Log debug message (only in development)
 */
export declare function logDebug(message: string, context?: LogContext): void;
/**
 * Create a child logger with predefined context
 */
export declare function createChildLogger(context: LogContext): winston.Logger;
/**
 * Log request/response cycle
 */
export declare function logRequest(method: string, path: string, userId?: string, requestId?: string): void;
/**
 * Log response completion
 */
export declare function logResponse(method: string, path: string, statusCode: number, duration: number, requestId?: string): void;
/**
 * Log database operation
 */
export declare function logDatabase(operation: string, table: string, duration: number, context?: LogContext): void;
export default logger;
//# sourceMappingURL=logger.d.ts.map