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
export declare function logInfo(message: string, context?: LogContext): void;
export declare function logWarn(message: string, context?: LogContext): void;
export declare function logError(message: string, error?: Error, context?: LogContext): void;
export declare function logDebug(message: string, context?: LogContext): void;
export declare function createChildLogger(context: LogContext): winston.Logger;
export declare function logRequest(method: string, path: string, userId?: string, requestId?: string): void;
export declare function logResponse(method: string, path: string, statusCode: number, duration: number, requestId?: string): void;
export declare function logDatabase(operation: string, table: string, duration: number, context?: LogContext): void;
export default logger;
//# sourceMappingURL=logger.d.ts.map