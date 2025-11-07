/**
 * Rate Limiting Middleware (T053)
 * Implements rate limiting to prevent API abuse
 * Based on: /specs/002-metapharm-platform/plan.md
 *
 * Security Requirements:
 * - Prevent brute force attacks
 * - Limit API abuse per IP
 * - Different limits for authentication endpoints
 */

import rateLimit from 'express-rate-limit';

// Configuration from environment
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
 * General rate limiter for all API endpoints
 * Default: 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip rate limiting for whitelisted IPs (can be configured)
  skip: (req) => {
    const whitelistedIPs = process.env['RATE_LIMIT_WHITELIST_IPS']?.split(',') || [];
    return whitelistedIPs.includes(req.ip || '');
  },
});

/**
 * Stricter rate limiter for authentication endpoints
 * Default: 5 requests per 15 minutes per IP
 * Prevents brute force attacks on login
 */
export const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: AUTH_RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too Many Requests',
    message: 'Too many login attempts from this IP, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests, even successful ones
});

/**
 * Rate limiter for authenticated users (more permissive)
 * 200 requests per 15 minutes for authenticated users
 */
export const authenticatedLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS * 2, // 2x the general limit
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please slow down your requests.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID as key for authenticated requests
  keyGenerator: (req: any) => {
    return req.user?.userId || req.ip || 'unknown';
  },
});
