/**
 * Redis-Based Rate Limiting Middleware (T8-016)
 * Implements distributed rate limiting across multiple instances
 * Based on: /specs/tasks8.md (Security Hardening tasks)
 *
 * Features:
 * - Redis-backed rate limiting for distributed systems
 * - Per-IP and per-user rate limits
 * - Progressive penalties
 * - Rate limit headers in responses
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { Request } from 'express';

// Configuration from environment
const NODE_ENV = process.env['NODE_ENV'] || 'development';
const REDIS_URL = process.env['REDIS_URL'] || 'redis://localhost:6379';
const RATE_LIMIT_WINDOW_MS = parseInt(
  process.env['RATE_LIMIT_WINDOW_MS'] || '900000',
  10
); // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = parseInt(
  process.env['RATE_LIMIT_MAX_REQUESTS'] || '100',
  10
);
const AUTH_RATE_LIMIT_MAX_REQUESTS = parseInt(
  process.env['AUTH_RATE_LIMIT_MAX_REQUESTS'] || '5',
  10
);

// Redis client for rate limiting
let redisClient: ReturnType<typeof createClient> | undefined;

/**
 * Initialize Redis client for rate limiting
 * Returns undefined if Redis is unavailable (fallback to in-memory)
 */
async function getRedisClient(): Promise<ReturnType<typeof createClient> | undefined> {
  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = createClient({
      url: REDIS_URL,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.warn('⚠️  Redis connection failed, falling back to in-memory rate limiting');
            return false; // Stop retrying
          }
          return Math.min(retries * 100, 3000); // Exponential backoff
        },
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await redisClient.connect();
    console.log('✓ Redis connected for rate limiting');
    return redisClient;
  } catch (error) {
    console.warn('⚠️  Redis unavailable, using in-memory rate limiting:', error);
    return undefined;
  }
}

/**
 * Create Redis store if available, otherwise return undefined (fallback to memory)
 */
async function createRedisStore(): Promise<RedisStore | undefined> {
  const client = await getRedisClient();
  if (!client) {
    return undefined;
  }

  return new RedisStore({
    // @ts-expect-error - RedisStore types are outdated
    client: client,
    prefix: 'rl:', // Rate limit prefix
  });
}

// Log rate limiting configuration on module load
if (NODE_ENV === 'test') {
  console.log('⚠️  Rate limiting DISABLED (NODE_ENV=test) - E2E test mode');
} else {
  console.log('✓ Rate limiting enabled:', {
    windowMs: RATE_LIMIT_WINDOW_MS,
    maxRequests: RATE_LIMIT_MAX_REQUESTS,
    authMaxRequests: AUTH_RATE_LIMIT_MAX_REQUESTS,
    redis: REDIS_URL,
  });
}

/**
 * General rate limiter for all API endpoints
 * Default: 100 requests per 15 minutes per IP
 * Uses Redis if available, falls back to in-memory
 */
export async function createGeneralLimiter() {
  const store = await createRedisStore();

  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: NODE_ENV === 'test' ? 999999 : RATE_LIMIT_MAX_REQUESTS,
    message: {
      error: 'Too Many Requests',
      message: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    store: store, // Use Redis or in-memory fallback
    // Skip function for test environment
    skip: (req: Request) => {
      // Skip rate limiting in test environment
      if (NODE_ENV === 'test') {
        return true;
      }
      // Check whitelisted IPs
      const whitelistedIPs = process.env['RATE_LIMIT_WHITELIST_IPS']?.split(',') || [];
      const clientIP = req.ip || '';
      return whitelistedIPs.includes(clientIP);
    },
  });
}

/**
 * Stricter rate limiter for authentication endpoints
 * Default: 5 requests per 15 minutes per IP
 * Prevents brute force attacks on login
 */
export async function createAuthLimiter() {
  const store = await createRedisStore();

  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: NODE_ENV === 'test' ? 999999 : AUTH_RATE_LIMIT_MAX_REQUESTS,
    message: {
      error: 'Too Many Requests',
      message: 'Too many login attempts from this IP, please try again later.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Count all requests
    store: store,
    skip: (req: Request) => {
      if (NODE_ENV === 'test') {
        return true;
      }
      const whitelistedIPs = process.env['RATE_LIMIT_WHITELIST_IPS']?.split(',') || [];
      const clientIP = req.ip || '';
      return whitelistedIPs.includes(clientIP);
    },
  });
}

/**
 * Rate limiter for authenticated users (more permissive)
 * 200 requests per 15 minutes for authenticated users
 * Uses user ID as key instead of IP
 */
export async function createAuthenticatedLimiter() {
  const store = await createRedisStore();

  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: NODE_ENV === 'test' ? 999999 : RATE_LIMIT_MAX_REQUESTS * 2,
    message: {
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please slow down your requests.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: store,
    // Use user ID as key for authenticated requests
    keyGenerator: (req: any) => {
      return req.user?.userId || req.ip || 'unknown';
    },
    skip: (req: Request) => {
      return NODE_ENV === 'test';
    },
  });
}

/**
 * Graceful shutdown - close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('✓ Redis connection closed');
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    }
  }
}
