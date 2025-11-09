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
import * as path from 'path';
import * as fs from 'fs';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Configuration
// ============================================================================

const LOG_DIR = 'logs';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// ============================================================================
// Transport Configuration
// ============================================================================

const transportsList: winston.transport[] = [];

// Console transport for all environments
transportsList.push(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level}] ${message}${metaStr ? '\n' + metaStr : ''}`;
      })
    ),
  })
);

// File transports for production
if (NODE_ENV === 'production') {
  // All logs
  transportsList.push(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 14, // 2 weeks of daily rotation
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );

  // Error logs only
  transportsList.push(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 14, // 2 weeks of daily rotation
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );
}

// ============================================================================
// Logger Instance
// ============================================================================

export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'metapharm-backend' },
  transports: transportsList,
});

// ============================================================================
// Convenience Methods
// ============================================================================

/**
 * Log info level message
 */
export function logInfo(message: string, context?: LogContext): void {
  logger.info(message, context ? { context } : {});
}

/**
 * Log warning level message
 */
export function logWarn(message: string, context?: LogContext): void {
  logger.warn(message, context ? { context } : {});
}

/**
 * Log error with stack trace
 */
export function logError(message: string, error?: Error, context?: LogContext): void {
  logger.error(message, {
    error: error?.message,
    stack: error?.stack,
    ...(context ? { context } : {}),
  });
}

/**
 * Log debug message (only in development)
 */
export function logDebug(message: string, context?: LogContext): void {
  logger.debug(message, context ? { context } : {});
}

/**
 * Create a child logger with predefined context
 */
export function createChildLogger(context: LogContext): winston.Logger {
  return logger.child({ context });
}

/**
 * Log request/response cycle
 */
export function logRequest(
  method: string,
  path: string,
  userId?: string,
  requestId?: string
): void {
  logger.info('Incoming request', {
    method,
    path,
    userId,
    requestId,
  });
}

/**
 * Log response completion
 */
export function logResponse(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  requestId?: string
): void {
  logger.info('Request completed', {
    method,
    path,
    statusCode,
    duration,
    requestId,
  });
}

/**
 * Log database operation
 */
export function logDatabase(
  operation: string,
  table: string,
  duration: number,
  context?: LogContext
): void {
  logger.debug('Database operation', {
    operation,
    table,
    duration,
    ...(context ? { context } : {}),
  });
}

export default logger;
