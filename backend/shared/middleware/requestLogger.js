"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
exports.attachRequestIdToLogs = attachRequestIdToLogs;
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
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
function getClientIp(req) {
    return (req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.socket.remoteAddress ||
        'unknown');
}
function shouldLog(path) {
    return !EXCLUDED_PATHS.some((excluded) => path.startsWith(excluded));
}
function extractUserId(req) {
    if (req.user?.id) {
        return req.user.id;
    }
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        try {
            const token = authHeader.substring(7);
            const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            return decoded.userId || decoded.sub;
        }
        catch (e) {
        }
    }
    return undefined;
}
function requestLogger(req, res, next) {
    const requestId = req.headers['x-request-id'] || (0, uuid_1.v4)();
    const correlationId = req.headers['x-correlation-id'] || requestId;
    req.requestId = requestId;
    req.correlationId = correlationId;
    req.userId = extractUserId(req);
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Correlation-ID', correlationId);
    if (!shouldLog(req.path)) {
        return next();
    }
    const startTime = Date.now();
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'];
    const userId = req.userId;
    const timestamp = new Date().toISOString();
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
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
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
        return originalSend.call(this, data);
    };
    const originalJson = res.json;
    res.json = function (data) {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
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
        return originalJson.call(this, data);
    };
    next();
}
function attachRequestIdToLogs(req, res, next) {
    const childLogger = logger_1.logger.child({
        requestId: req.requestId,
        userId: req.userId,
        correlationId: req.correlationId,
    });
    req.logger = childLogger;
    next();
}
exports.default = requestLogger;
//# sourceMappingURL=requestLogger.js.map