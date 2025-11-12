"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logInfo = logInfo;
exports.logWarn = logWarn;
exports.logError = logError;
exports.logDebug = logDebug;
exports.createChildLogger = createChildLogger;
exports.logRequest = logRequest;
exports.logResponse = logResponse;
exports.logDatabase = logDatabase;
const winston = __importStar(require("winston"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
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
const transportsList = [];
// Console transport for all environments
transportsList.push(new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), winston.format.simple(), winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level}] ${message}${metaStr ? '\n' + metaStr : ''}`;
    })),
}));
// File transports for production
if (NODE_ENV === 'production') {
    // All logs
    transportsList.push(new winston.transports.File({
        filename: path.join(LOG_DIR, 'combined.log'),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 14, // 2 weeks of daily rotation
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }));
    // Error logs only
    transportsList.push(new winston.transports.File({
        filename: path.join(LOG_DIR, 'error.log'),
        level: 'error',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 14, // 2 weeks of daily rotation
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }));
}
// ============================================================================
// Logger Instance
// ============================================================================
exports.logger = winston.createLogger({
    level: LOG_LEVEL,
    format: winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), winston.format.errors({ stack: true }), winston.format.json()),
    defaultMeta: { service: 'metapharm-backend' },
    transports: transportsList,
});
// ============================================================================
// Convenience Methods
// ============================================================================
/**
 * Log info level message
 */
function logInfo(message, context) {
    exports.logger.info(message, context ? { context } : {});
}
/**
 * Log warning level message
 */
function logWarn(message, context) {
    exports.logger.warn(message, context ? { context } : {});
}
/**
 * Log error with stack trace
 */
function logError(message, error, context) {
    exports.logger.error(message, {
        error: error?.message,
        stack: error?.stack,
        ...(context ? { context } : {}),
    });
}
/**
 * Log debug message (only in development)
 */
function logDebug(message, context) {
    exports.logger.debug(message, context ? { context } : {});
}
/**
 * Create a child logger with predefined context
 */
function createChildLogger(context) {
    return exports.logger.child({ context });
}
/**
 * Log request/response cycle
 */
function logRequest(method, path, userId, requestId) {
    exports.logger.info('Incoming request', {
        method,
        path,
        userId,
        requestId,
    });
}
/**
 * Log response completion
 */
function logResponse(method, path, statusCode, duration, requestId) {
    exports.logger.info('Request completed', {
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
function logDatabase(operation, table, duration, context) {
    exports.logger.debug('Database operation', {
        operation,
        table,
        duration,
        ...(context ? { context } : {}),
    });
}
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map