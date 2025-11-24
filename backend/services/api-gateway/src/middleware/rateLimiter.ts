/**
 * Rate Limiting Middleware (T053)
 * Implements rate limiting to prevent API abuse
 * Based on: /specs/002-metapharm-platform/plan.md
 *
 * Security Requirements:
 * - Prevent brute force attacks
 * - Limit API abuse per IP
 * - Different limits for authentication endpoints
 * - Bypass rate limiting in test environment for E2E tests
 */

import rateLimit from 'express-rate-limit';
import { Request } from 'express';

// Configuration from environment
const NODE_ENV = process.env['NODE_ENV'] || 'development';
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

/**
 * Check if rate limiting should be skipped for this request
 * Skips rate limiting for:
 * 1. Test environment (NODE_ENV=test) to allow E2E test suites
 * 2. Whitelisted IPs (for development/testing)
 */
function shouldSkipRateLimit(req: Request): boolean {
  // Skip rate limiting entirely in test environment
  if (NODE_ENV === 'test') {
    return true;
  }

  // Check whitelisted IPs
  const whitelistedIPs = process.env['RATE_LIMIT_WHITELIST_IPS']?.split(',') || [];
  const clientIP = req.ip || '';

  return whitelistedIPs.includes(clientIP);
}

// Log rate limiting configuration on module load
if (NODE_ENV === 'test') {
  console.log('⚠️  Rate limiting DISABLED (NODE_ENV=test) - E2E test mode');
} else {
  console.log('✓ Rate limiting enabled:', {
    windowMs: RATE_LIMIT_WINDOW_MS,
    maxRequests: RATE_LIMIT_MAX_REQUESTS,
    authMaxRequests: AUTH_RATE_LIMIT_MAX_REQUESTS,
  });
}

/**
 * General rate limiter for all API endpoints
 * Default: 100 requests per 15 minutes per IP
 * In test environment: Headers still sent but limits not enforced
 */
export const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: NODE_ENV === 'test' ? 999999 : RATE_LIMIT_MAX_REQUESTS, // Very high limit in test
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Don't skip - we want headers in tests, just with high limits
});

/**
 * Stricter rate limiter for authentication endpoints
 * Default: 5 requests per 15 minutes per IP
 * Prevents brute force attacks on login
 * In test environment: Headers still sent but limits not enforced
 */
export const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: NODE_ENV === 'test' ? 999999 : AUTH_RATE_LIMIT_MAX_REQUESTS, // Very high limit in test
  message: {
    error: 'Too Many Requests',
    message: 'Too many login attempts from this IP, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests, even successful ones
  // Don't skip - we want headers in tests, just with high limits
});

/**
 * Rate limiter for authenticated users (more permissive)
 * 200 requests per 15 minutes for authenticated users
 * In test environment: Headers still sent but limits not enforced
 */
export const authenticatedLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: NODE_ENV === 'test' ? 999999 : RATE_LIMIT_MAX_REQUESTS * 2, // Very high limit in test
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please slow down your requests.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Don't skip - we want headers in tests, just with high limits
  // Use user ID as key for authenticated requests
  keyGenerator: (req: any) => {
    return req.user?.userId || req.ip || 'unknown';
  },
});
