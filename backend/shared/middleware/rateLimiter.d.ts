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
import { RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response } from 'express';
/**
 * Create rate limiter middleware with custom configuration
 *
 * @param options Rate limit options
 * @returns Express middleware
 */
export declare function createRateLimiter(options: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: Request) => string;
    handler?: (req: Request, res: Response) => void;
    message?: string;
    prefix?: string;
}): Promise<RateLimitRequestHandler>;
/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
export declare function createGeneralRateLimiter(): Promise<RateLimitRequestHandler>;
/**
 * Authentication rate limiter
 * 10 failed auth attempts per 15 minutes
 */
export declare function createAuthRateLimiter(): Promise<RateLimitRequestHandler>;
/**
 * Password reset rate limiter
 * 3 requests per hour
 */
export declare function createPasswordResetRateLimiter(): Promise<RateLimitRequestHandler>;
/**
 * MFA verification rate limiter
 * 5 requests per 15 minutes
 */
export declare function createMFARateLimiter(): Promise<RateLimitRequestHandler>;
/**
 * File upload rate limiter
 * 20 requests per hour
 */
export declare function createFileUploadRateLimiter(): Promise<RateLimitRequestHandler>;
/**
 * Reset rate limit for a specific key
 * Useful for administrative purposes or after successful authentication
 *
 * @param prefix Rate limiter prefix (e.g., 'rl:auth')
 * @param key The key to reset (usually IP or user ID)
 */
export declare function resetRateLimit(prefix: string, key: string): Promise<void>;
/**
 * Get current rate limit status for a key
 *
 * @param prefix Rate limiter prefix
 * @param key The key to check
 * @returns Current hit count and TTL
 */
export declare function getRateLimitStatus(prefix: string, key: string): Promise<{
    hits: number;
    ttl: number;
} | null>;
/**
 * Cleanup function for graceful shutdown
 */
export declare function closeRateLimiterRedis(): Promise<void>;
//# sourceMappingURL=rateLimiter.d.ts.map