"use strict";
/**
 * Rate Limiting Middleware (T245)
 * Implements DDoS protection and rate limiting for API endpoints
 * Based on OWASP API Security Top 10 - API4:2023 Unrestricted Resource Consumption
 *
 * Features:
 * - Distributed rate limiting using Redis
 * - Different limits for different endpoint types
 * - Configurable limits per environment
 * - Proper error responses with Retry-After header
 */
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
// ============================================================================
// Redis Client Setup
// ============================================================================
let redisClient = null;
/**
 * Initialize Redis client for distributed rate limiting
 * @returns Redis client instance
 */
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
// ============================================================================
// Redis Store for Distributed Rate Limiting
// ============================================================================
/**
 * Custom Redis store for express-rate-limit
 * Allows rate limiting across multiple server instances
 */
class RedisStore {
    constructor(client, prefix, windowMs) {
        this.client = client;
        this.prefix = prefix;
        this.windowMs = windowMs;
    }
    /**
     * Increment request count for a key
     */
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
    /**
     * Decrement request count for a key (if skipSuccessfulRequests/skipFailedRequests is enabled)
     */
    async decrement(key) {
        const redisKey = `${this.prefix}:${key}`;
        await this.client.decr(redisKey);
    }
    /**
     * Reset request count for a key
     */
    async resetKey(key) {
        const redisKey = `${this.prefix}:${key}`;
        await this.client.del(redisKey);
    }
}
/**
 * Create Redis store instance
 */
async function createRedisStore(prefix, windowMs) {
    const client = await getRedisClient();
    const store = new RedisStore(client, prefix, windowMs);
    return {
        increment: (key) => store.increment(key),
        decrement: (key) => store.decrement(key),
        resetKey: (key) => store.resetKey(key),
    };
}
// ============================================================================
// Rate Limiter Factory
// ============================================================================
/**
 * Create rate limiter middleware with custom configuration
 *
 * @param options Rate limit options
 * @returns Express middleware
 */
async function createRateLimiter(options) {
    const { windowMs, maxRequests, skipSuccessfulRequests = false, skipFailedRequests = false, keyGenerator = (req) => req.ip || 'unknown', prefix = 'rl', message = 'Too many requests, please try again later.', handler, } = options;
    // Use Redis store for distributed rate limiting
    let store;
    try {
        store = await createRedisStore(prefix, windowMs);
    }
    catch (error) {
        console.warn('⚠️  Redis not available for rate limiting, falling back to memory store', error);
        // Fallback to memory store if Redis is not available (dev/test only)
        store = undefined; // express-rate-limit will use default memory store
    }
    return (0, express_rate_limit_1.default)({
        windowMs,
        max: maxRequests,
        standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
        legacyHeaders: false, // Disable `X-RateLimit-*` headers
        store,
        skip: (req) => {
            // Skip rate limiting for health check endpoints
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
// ============================================================================
// Pre-configured Rate Limiters
// ============================================================================
/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
async function createGeneralRateLimiter() {
    const config = (0, security_1.getRateLimitConfig)().general;
    return createRateLimiter({
        windowMs: config.windowMs,
        maxRequests: config.maxRequests,
        prefix: 'rl:general',
        message: 'Too many requests from this IP, please try again later.',
    });
}
/**
 * Authentication rate limiter
 * 10 failed auth attempts per 15 minutes
 */
async function createAuthRateLimiter() {
    const config = (0, security_1.getRateLimitConfig)().auth;
    return createRateLimiter({
        windowMs: config.windowMs,
        maxRequests: config.maxRequests,
        skipSuccessfulRequests: config.skipSuccessfulRequests, // Only count failed attempts
        skipFailedRequests: config.skipFailedRequests,
        prefix: 'rl:auth',
        message: 'Too many authentication attempts. Please try again later or reset your password.',
        handler: (req, res) => {
            const retryAfter = Math.ceil(config.windowMs / 1000);
            // Log suspicious activity
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
/**
 * Password reset rate limiter
 * 3 requests per hour
 */
async function createPasswordResetRateLimiter() {
    const config = (0, security_1.getRateLimitConfig)().passwordReset;
    return createRateLimiter({
        windowMs: config.windowMs,
        maxRequests: config.maxRequests,
        prefix: 'rl:password-reset',
        keyGenerator: (req) => {
            // Use email from request body if available, fallback to IP
            const email = req.body?.email;
            return email || req.ip || 'unknown';
        },
        message: 'Too many password reset requests. Please try again later or contact support.',
        handler: (req, res) => {
            const retryAfter = Math.ceil(config.windowMs / 1000);
            // Log suspicious activity
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
/**
 * MFA verification rate limiter
 * 5 requests per 15 minutes
 */
async function createMFARateLimiter() {
    const config = (0, security_1.getRateLimitConfig)().mfa;
    return createRateLimiter({
        windowMs: config.windowMs,
        maxRequests: config.maxRequests,
        prefix: 'rl:mfa',
        keyGenerator: (req) => {
            // Use userId from request if authenticated, fallback to IP
            const userId = req.user?.userId;
            return userId || req.ip || 'unknown';
        },
        message: 'Too many MFA verification attempts. Please try again later.',
        handler: (req, res) => {
            const retryAfter = Math.ceil(config.windowMs / 1000);
            // Log suspicious activity
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
/**
 * File upload rate limiter
 * 20 requests per hour
 */
async function createFileUploadRateLimiter() {
    const config = (0, security_1.getRateLimitConfig)().fileUpload;
    return createRateLimiter({
        windowMs: config.windowMs,
        maxRequests: config.maxRequests,
        prefix: 'rl:file-upload',
        keyGenerator: (req) => {
            // Use userId if authenticated, fallback to IP
            const userId = req.user?.userId;
            return userId || req.ip || 'unknown';
        },
        message: 'Too many file uploads. Please try again later.',
    });
}
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Reset rate limit for a specific key
 * Useful for administrative purposes or after successful authentication
 *
 * @param prefix Rate limiter prefix (e.g., 'rl:auth')
 * @param key The key to reset (usually IP or user ID)
 */
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
/**
 * Get current rate limit status for a key
 *
 * @param prefix Rate limiter prefix
 * @param key The key to check
 * @returns Current hit count and TTL
 */
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
/**
 * Cleanup function for graceful shutdown
 */
async function closeRateLimiterRedis() {
    if (redisClient && redisClient.isOpen) {
        await redisClient.quit();
        redisClient = null;
        console.log('✓ Redis rate limiter disconnected');
    }
}
//# sourceMappingURL=rateLimiter.js.map