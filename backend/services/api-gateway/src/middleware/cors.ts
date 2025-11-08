/**
 * CORS Configuration Middleware (T056)
 * Implements CORS for web/mobile clients with Swiss domains support
 * Based on: /specs/002-metapharm-platform/plan.md
 *
 * Security Requirements:
 * - Allow specific origins only (Swiss domains, healthcare compliance)
 * - Support credentials (cookies)
 * - Preflight caching
 */

import cors from 'cors';
import { Request } from 'express';

// Parse allowed origins from environment
const allowedOriginsString = process.env['ALLOWED_ORIGINS'] || 'http://localhost:3001,http://localhost:19006';
const allowedOrigins = allowedOriginsString.split(',').map(origin => origin.trim());

console.info('CORS Configuration:', {
  allowedOrigins,
  credentialsSupported: true,
});

/**
 * CORS Options Configuration
 */
const corsOptions: cors.CorsOptions = {
  /**
   * Origin validation
   * Allow requests from whitelisted origins
   */
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS: Origin not allowed', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },

  /**
   * Allow credentials (cookies, authorization headers)
   */
  credentials: true,

  /**
   * Allowed HTTP methods
   */
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  /**
   * Allowed headers
   */
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Pharmacy-ID', // Custom header for pharmacy context
    'X-Request-ID', // Request tracking
  ],

  /**
   * Exposed headers (accessible to client)
   */
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],

  /**
   * Preflight cache duration (24 hours)
   */
  maxAge: 86400,

  /**
   * Enable preflight for all routes
   */
  preflightContinue: false,

  /**
   * Provide successful status code for OPTIONS requests
   */
  optionsSuccessStatus: 204,
};

/**
 * CORS Middleware
 * Apply to all routes in API Gateway
 */
export const corsMiddleware = cors(corsOptions);

/**
 * Additional CORS headers for specific Swiss healthcare requirements
 * Can be used to add custom security headers
 */
export function additionalCorsHeaders(_req: Request, res: any, next: any) {
  // Add Swiss healthcare-specific headers if needed
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Strict Transport Security (HTTPS only)
  if (process.env['NODE_ENV'] === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
}
