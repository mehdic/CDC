"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRateLimiter = createRateLimiter;
exports.createGeneralRateLimiter = createGeneralRateLimiter;
exports.createAuthRateLimiter = createAuthRateLimiter;
exports.createPasswordResetRateLimiter = createPasswordResetRateLimiter;
exports.createMFARateLimiter = createMFARateLimiter;
exports.createFileUploadRateLimiter = createFileUploadRateLimiter;
exports.resetRateLimit = resetRateLimit;
exports.getRateLimitStatus = getRateLimitStatus;
exports.closeRateLimiterRedis = closeRateLimiterRedis;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const redis_1 = require("redis");
const security_1 = require("../config/security");
let redisClient = null;
async function getRedisClient() {
    if (redisClient && redisClient.isOpen) {
        return redisClient;
    }
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = (0, redis_1.createClient)({
        url: redisUrl,
    });
    redisClient.on('error', (err) => {
        console.error('Redis rate limiter error:', err);
    });
    redisClient.on('connect', () => {
        console.log('✓ Redis rate limiter connected');
    });
    await redisClient.connect();
    return redisClient;
}
class RedisStore {
    client;
    prefix;
    windowMs;
    constructor(client, prefix, windowMs) {
        this.client = client;
        this.prefix = prefix;
        this.windowMs = windowMs;
    }
    async increment(key) {
        const redisKey = `${this.prefix}:${key}`;
        const ttlSeconds = Math.ceil(this.windowMs / 1000);
        const multi = this.client.multi();
        multi.incr(redisKey);
        multi.expire(redisKey, ttlSeconds);
        multi.ttl(redisKey);
        const results = await multi.exec();
        const totalHits = results[0] || 1;
        const ttl = results[2] || ttlSeconds;
        const resetTime = new Date(Date.now() + ttl * 1000);
        return { totalHits, resetTime };
    }
    async decrement(key) {
        const redisKey = `${this.prefix}:${key}`;
        await this.client.decr(redisKey);
    }
    async resetKey(key) {
        const redisKey = `${this.prefix}:${key}`;
        await this.client.del(redisKey);
    }
}
async function createRedisStore(prefix, windowMs) {
    const client = await getRedisClient();
    const store = new RedisStore(client, prefix, windowMs);
    return {
        increment: (key) => store.increment(key),
        decrement: (key) => store.decrement(key),
        resetKey: (key) => store.resetKey(key),
    };
}
async function createRateLimiter(options) {
    const { windowMs, maxRequests, skipSuccessfulRequests = false, skipFailedRequests = false, keyGenerator = (req) => req.ip || 'unknown', prefix = 'rl', message = 'Too many requests, please try again later.', handler, } = options;
    let store;
    try {
        store = await createRedisStore(prefix, windowMs);
    }
    catch (error) {
        console.warn('⚠️  Redis not available for rate limiting, falling back to memory store', error);
        store = undefined;
    }
    return (0, express_rate_limit_1.default)({
        windowMs,
        max: maxRequests,
        standardHeaders: true,
        legacyHeaders: false,
        store,
        skip: (req) => {
            if (req.path === '/health' || req.path === '/ping') {
                return true;
            }
            return false;
        },
        keyGenerator,
        skipSuccessfulRequests,
        skipFailedRequests,
        handler: handler ||
            ((req, res) => {
                const retryAfter = Math.ceil(windowMs / 1000);
                res.status(429).json({
                    error: 'Too Many Requests',
                    message,
                    code: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: `${retryAfter} seconds`,
                });
            }),
    });
}
async function createGeneralRateLimiter() {
    const config = (0, security_1.getRateLimitConfig)().general;
    return createRateLimiter({
        windowMs: config.windowMs,
        maxRequests: config.maxRequests,
        prefix: 'rl:general',
        message: 'Too many requests from this IP, please try again later.',
    });
}
async function createAuthRateLimiter() {
    const config = (0, security_1.getRateLimitConfig)().auth;
    return createRateLimiter({
        windowMs: config.windowMs,
        maxRequests: config.maxRequests,
        skipSuccessfulRequests: config.skipSuccessfulRequests,
        skipFailedRequests: config.skipFailedRequests,
        prefix: 'rl:auth',
        message: 'Too many authentication attempts. Please try again later or reset your password.',
        handler: (req, res) => {
            const retryAfter = Math.ceil(config.windowMs / 1000);
            console.warn('Rate limit exceeded for authentication', {
                ip: req.ip,
                path: req.path,
                userAgent: req.headers['user-agent'],
            });
            res.status(429).json({
                error: 'Too Many Requests',
                message: 'Too many authentication attempts. Please try again later or reset your password.',
                code: 'AUTH_RATE_LIMIT_EXCEEDED',
                retryAfter: `${retryAfter} seconds`,
            });
        },
    });
}
async function createPasswordResetRateLimiter() {
    const config = (0, security_1.getRateLimitConfig)().passwordReset;
    return createRateLimiter({
        windowMs: config.windowMs,
        maxRequests: config.maxRequests,
        prefix: 'rl:password-reset',
        keyGenerator: (req) => {
            const email = req.body?.email;
            return email || req.ip || 'unknown';
        },
        message: 'Too many password reset requests. Please try again later or contact support.',
        handler: (req, res) => {
            const retryAfter = Math.ceil(config.windowMs / 1000);
            console.warn('Rate limit exceeded for password reset', {
                ip: req.ip,
                email: req.body?.email,
                path: req.path,
            });
            res.status(429).json({
                error: 'Too Many Requests',
                message: 'Too many password reset requests. Please try again later or contact support.',
                code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
                retryAfter: `${retryAfter} seconds`,
            });
        },
    });
}
async function createMFARateLimiter() {
    const config = (0, security_1.getRateLimitConfig)().mfa;
    return createRateLimiter({
        windowMs: config.windowMs,
        maxRequests: config.maxRequests,
        prefix: 'rl:mfa',
        keyGenerator: (req) => {
            const userId = req.user?.userId;
            return userId || req.ip || 'unknown';
        },
        message: 'Too many MFA verification attempts. Please try again later.',
        handler: (req, res) => {
            const retryAfter = Math.ceil(config.windowMs / 1000);
            console.warn('Rate limit exceeded for MFA verification', {
                ip: req.ip,
                userId: req.user?.userId,
                path: req.path,
            });
            res.status(429).json({
                error: 'Too Many Requests',
                message: 'Too many MFA verification attempts. Please try again later.',
                code: 'MFA_RATE_LIMIT_EXCEEDED',
                retryAfter: `${retryAfter} seconds`,
            });
        },
    });
}
async function createFileUploadRateLimiter() {
    const config = (0, security_1.getRateLimitConfig)().fileUpload;
    return createRateLimiter({
        windowMs: config.windowMs,
        maxRequests: config.maxRequests,
        prefix: 'rl:file-upload',
        keyGenerator: (req) => {
            const userId = req.user?.userId;
            return userId || req.ip || 'unknown';
        },
        message: 'Too many file uploads. Please try again later.',
    });
}
async function resetRateLimit(prefix, key) {
    try {
        const client = await getRedisClient();
        const redisKey = `${prefix}:${key}`;
        await client.del(redisKey);
    }
    catch (error) {
        console.error('Failed to reset rate limit:', error);
    }
}
async function getRateLimitStatus(prefix, key) {
    try {
        const client = await getRedisClient();
        const redisKey = `${prefix}:${key}`;
        const multi = client.multi();
        multi.get(redisKey);
        multi.ttl(redisKey);
        const results = await multi.exec();
        const hits = parseInt(results[0], 10) || 0;
        const ttl = results[1] || 0;
        return { hits, ttl };
    }
    catch (error) {
        console.error('Failed to get rate limit status:', error);
        return null;
    }
}
async function closeRateLimiterRedis() {
    if (redisClient && redisClient.isOpen) {
        await redisClient.quit();
        redisClient = null;
        console.log('✓ Redis rate limiter disconnected');
    }
}
//# sourceMappingURL=rateLimiter.js.map