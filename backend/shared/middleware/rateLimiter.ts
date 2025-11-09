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

import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { createClient, RedisClientType } from 'redis';
import { Request, Response } from 'express';
import { getRateLimitConfig } from '../config/security';

// ============================================================================
// Redis Client Setup
// ============================================================================

let redisClient: RedisClientType | null = null;

/**
 * Initialize Redis client for distributed rate limiting
 * @returns Redis client instance
 */
async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  redisClient = createClient({
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
  private client: RedisClientType;
  private prefix: string;
  private windowMs: number;

  constructor(client: RedisClientType, prefix: string, windowMs: number) {
    this.client = client;
    this.prefix = prefix;
    this.windowMs = windowMs;
  }

  /**
   * Increment request count for a key
   */
  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const redisKey = `${this.prefix}:${key}`;
    const ttlSeconds = Math.ceil(this.windowMs / 1000);

    const multi = this.client.multi();
    multi.incr(redisKey);
    multi.expire(redisKey, ttlSeconds);
    multi.ttl(redisKey);

    const results = await multi.exec();

    const totalHits = (results[0] as number) || 1;
    const ttl = (results[2] as number) || ttlSeconds;

    const resetTime = new Date(Date.now() + ttl * 1000);

    return { totalHits, resetTime };
  }

  /**
   * Decrement request count for a key (if skipSuccessfulRequests/skipFailedRequests is enabled)
   */
  async decrement(key: string): Promise<void> {
    const redisKey = `${this.prefix}:${key}`;
    await this.client.decr(redisKey);
  }

  /**
   * Reset request count for a key
   */
  async resetKey(key: string): Promise<void> {
    const redisKey = `${this.prefix}:${key}`;
    await this.client.del(redisKey);
  }
}

/**
 * Create Redis store instance
 */
async function createRedisStore(
  prefix: string,
  windowMs: number
): Promise<any> {
  const client = await getRedisClient();
  const store = new RedisStore(client, prefix, windowMs);

  return {
    increment: (key: string) => store.increment(key),
    decrement: (key: string) => store.decrement(key),
    resetKey: (key: string) => store.resetKey(key),
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
export async function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  handler?: (req: Request, res: Response) => void;
  message?: string;
  prefix?: string;
}): Promise<RateLimitRequestHandler> {
  const {
    windowMs,
    maxRequests,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (req: Request) => req.ip || 'unknown',
    prefix = 'rl',
    message = 'Too many requests, please try again later.',
    handler,
  } = options;

  // Use Redis store for distributed rate limiting
  let store: any;
  try {
    store = await createRedisStore(prefix, windowMs);
  } catch (error) {
    console.warn(
      '⚠️  Redis not available for rate limiting, falling back to memory store',
      error
    );
    // Fallback to memory store if Redis is not available (dev/test only)
    store = undefined; // express-rate-limit will use default memory store
  }

  return rateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    store,
    skip: (req: Request) => {
      // Skip rate limiting for health check endpoints
      if (req.path === '/health' || req.path === '/ping') {
        return true;
      }
      return false;
    },
    keyGenerator,
    skipSuccessfulRequests,
    skipFailedRequests,
    handler:
      handler ||
      ((req: Request, res: Response) => {
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
export async function createGeneralRateLimiter(): Promise<RateLimitRequestHandler> {
  const config = getRateLimitConfig().general;

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
export async function createAuthRateLimiter(): Promise<RateLimitRequestHandler> {
  const config = getRateLimitConfig().auth;

  return createRateLimiter({
    windowMs: config.windowMs,
    maxRequests: config.maxRequests,
    skipSuccessfulRequests: config.skipSuccessfulRequests, // Only count failed attempts
    skipFailedRequests: config.skipFailedRequests,
    prefix: 'rl:auth',
    message:
      'Too many authentication attempts. Please try again later or reset your password.',
    handler: (req: Request, res: Response) => {
      const retryAfter = Math.ceil(config.windowMs / 1000);

      // Log suspicious activity
      console.warn('Rate limit exceeded for authentication', {
        ip: req.ip,
        path: req.path,
        userAgent: req.headers['user-agent'],
      });

      res.status(429).json({
        error: 'Too Many Requests',
        message:
          'Too many authentication attempts. Please try again later or reset your password.',
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
export async function createPasswordResetRateLimiter(): Promise<RateLimitRequestHandler> {
  const config = getRateLimitConfig().passwordReset;

  return createRateLimiter({
    windowMs: config.windowMs,
    maxRequests: config.maxRequests,
    prefix: 'rl:password-reset',
    keyGenerator: (req: Request) => {
      // Use email from request body if available, fallback to IP
      const email = req.body?.email;
      return email || req.ip || 'unknown';
    },
    message:
      'Too many password reset requests. Please try again later or contact support.',
    handler: (req: Request, res: Response) => {
      const retryAfter = Math.ceil(config.windowMs / 1000);

      // Log suspicious activity
      console.warn('Rate limit exceeded for password reset', {
        ip: req.ip,
        email: req.body?.email,
        path: req.path,
      });

      res.status(429).json({
        error: 'Too Many Requests',
        message:
          'Too many password reset requests. Please try again later or contact support.',
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
export async function createMFARateLimiter(): Promise<RateLimitRequestHandler> {
  const config = getRateLimitConfig().mfa;

  return createRateLimiter({
    windowMs: config.windowMs,
    maxRequests: config.maxRequests,
    prefix: 'rl:mfa',
    keyGenerator: (req: Request) => {
      // Use userId from request if authenticated, fallback to IP
      const userId = (req as any).user?.userId;
      return userId || req.ip || 'unknown';
    },
    message: 'Too many MFA verification attempts. Please try again later.',
    handler: (req: Request, res: Response) => {
      const retryAfter = Math.ceil(config.windowMs / 1000);

      // Log suspicious activity
      console.warn('Rate limit exceeded for MFA verification', {
        ip: req.ip,
        userId: (req as any).user?.userId,
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
export async function createFileUploadRateLimiter(): Promise<RateLimitRequestHandler> {
  const config = getRateLimitConfig().fileUpload;

  return createRateLimiter({
    windowMs: config.windowMs,
    maxRequests: config.maxRequests,
    prefix: 'rl:file-upload',
    keyGenerator: (req: Request) => {
      // Use userId if authenticated, fallback to IP
      const userId = (req as any).user?.userId;
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
export async function resetRateLimit(prefix: string, key: string): Promise<void> {
  try {
    const client = await getRedisClient();
    const redisKey = `${prefix}:${key}`;
    await client.del(redisKey);
  } catch (error) {
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
export async function getRateLimitStatus(
  prefix: string,
  key: string
): Promise<{ hits: number; ttl: number } | null> {
  try {
    const client = await getRedisClient();
    const redisKey = `${prefix}:${key}`;

    const multi = client.multi();
    multi.get(redisKey);
    multi.ttl(redisKey);

    const results = await multi.exec();

    const hits = parseInt(results[0] as string, 10) || 0;
    const ttl = (results[1] as number) || 0;

    return { hits, ttl };
  } catch (error) {
    console.error('Failed to get rate limit status:', error);
    return null;
  }
}

/**
 * Cleanup function for graceful shutdown
 */
export async function closeRateLimiterRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
    console.log('✓ Redis rate limiter disconnected');
  }
}
