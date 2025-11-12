"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
exports.attachRequestIdToLogs = attachRequestIdToLogs;
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
// ============================================================================
// Configuration
// ============================================================================
const SENSITIVE_HEADERS = [
    'authorization',
    'x-api-key',
    'x-auth-token',
    'cookie',
    'set-cookie',
];
const SENSITIVE_FIELDS = [
    'password',
    'token',
    'secret',
    'apiKey',
    'creditCard',
    'ssn',
    'email',
    'phone',
];
const EXCLUDED_PATHS = ['/health', '/metrics', '/favicon.ico'];
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Redact sensitive data from object
 */
function redactSensitiveData(obj, depth = 0) {
    if (depth > 5 || !obj || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map((item) => redactSensitiveData(item, depth + 1));
    }
    const redacted = {};
    for (const key in obj) {
        if (SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
            redacted[key] = '[REDACTED]';
        }
        else if (typeof obj[key] === 'object' && obj[key] !== null) {
            redacted[key] = redactSensitiveData(obj[key], depth + 1);
        }
        else {
            redacted[key] = obj[key];
        }
    }
    return redacted;
}
/**
 * Get client IP address
 */
function getClientIp(req) {
    return (req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.socket.remoteAddress ||
        'unknown');
}
/**
 * Check if path should be logged
 */
function shouldLog(path) {
    return !EXCLUDED_PATHS.some((excluded) => path.startsWith(excluded));
}
/**
 * Extract user ID from request (from JWT token or session)
 */
function extractUserId(req) {
    // Try to extract from user object (set by auth middleware)
    if (req.user?.id) {
        return req.user.id;
    }
    // Try to extract from authorization header (JWT)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        try {
            // Note: This is a basic extraction without verification
            // Full verification should be done in auth middleware
            const token = authHeader.substring(7);
            const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            return decoded.userId || decoded.sub;
        }
        catch (e) {
            // Token parsing failed, continue
        }
    }
    return undefined;
}
// ============================================================================
// Request Logging Middleware
// ============================================================================
/**
 * Request logging middleware
 * Must be registered early in the middleware chain
 */
function requestLogger(req, res, next) {
    // Generate or retrieve request ID
    const requestId = req.headers['x-request-id'] || (0, uuid_1.v4)();
    const correlationId = req.headers['x-correlation-id'] || requestId;
    // Attach to request object for use in route handlers
    req.requestId = requestId;
    req.correlationId = correlationId;
    req.userId = extractUserId(req);
    // Add request ID to response headers
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Correlation-ID', correlationId);
    // Skip logging for excluded paths
    if (!shouldLog(req.path)) {
        return next();
    }
    const startTime = Date.now();
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'];
    const userId = req.userId;
    const timestamp = new Date().toISOString();
    // Log incoming request
    const requestMetadata = {
        requestId,
        method: req.method,
        path: req.path,
        query: Object.keys(req.query).length > 0 ? redactSensitiveData(req.query) : undefined,
        userId,
        ip,
        userAgent,
        timestamp,
    };
    logger_1.logger.info('Incoming request', {
        ...requestMetadata,
    });
    // Capture original send method
    const originalSend = res.send;
    // Override send method to log response
    res.send = function (data) {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        // Log response
        const responseMetadata = {
            ...requestMetadata,
            statusCode,
            duration,
            responseTime: `${duration}ms`,
        };
        if (statusCode >= 400) {
            logger_1.logger.warn('Request completed with error', {
                ...responseMetadata,
            });
        }
        else {
            logger_1.logger.info('Request completed', {
                ...responseMetadata,
            });
        }
        // Call original send
        return originalSend.call(this, data);
    };
    // Handle json responses
    const originalJson = res.json;
    res.json = function (data) {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        // Log response
        const responseMetadata = {
            ...requestMetadata,
            statusCode,
            duration,
            responseTime: `${duration}ms`,
        };
        if (statusCode >= 400) {
            logger_1.logger.warn('Request completed with error', {
                ...responseMetadata,
            });
        }
        else {
            logger_1.logger.info('Request completed', {
                ...responseMetadata,
            });
        }
        // Call original json
        return originalJson.call(this, data);
    };
    next();
}
/**
 * Middleware to attach request ID to all logs
 * Works with the logger utility to include requestId in context
 */
function attachRequestIdToLogs(req, res, next) {
    // Create a child logger with request context
    const childLogger = logger_1.logger.child({
        requestId: req.requestId,
        userId: req.userId,
        correlationId: req.correlationId,
    });
    // Replace the global logger for this request (if using a request-scoped logger)
    req.logger = childLogger;
    next();
}
exports.default = requestLogger;
//# sourceMappingURL=requestLogger.js.map