/**
 * Security Headers Middleware (T248)
 * Implements OWASP security headers for defense-in-depth protection
 * Based on OWASP Secure Headers Project
 *
 * Features:
 * - Content Security Policy (CSP)
 * - CORS configuration
 * - HTTP Strict Transport Security (HSTS)
 * - X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
 * - Referrer-Policy, Permissions-Policy
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import {
  getCORSConfig,
  getCSPConfig,
  getSecurityHeadersConfig,
  isProduction,
} from '../config/security';

// ============================================================================
// CORS Middleware (T248)
// ============================================================================

/**
 * CORS (Cross-Origin Resource Sharing) middleware
 * Configures which origins can access the API
 *
 * Security considerations:
 * - Production: Strictly validate allowed origins
 * - Development: Allow all origins for easier testing
 * - Credentials: Allow cookies/auth headers in cross-origin requests
 */
export function configureCORS() {
  const config = getCORSConfig();

  return cors({
    origin: config.origin,
    credentials: config.credentials,
    optionsSuccessStatus: config.optionsSuccessStatus,
    allowedHeaders: config.allowedHeaders,
    exposedHeaders: config.exposedHeaders,
    maxAge: config.maxAge,
  });
}

// ============================================================================
// Content Security Policy (CSP) Middleware (T248)
// ============================================================================

/**
 * Content Security Policy (CSP) middleware
 * Prevents XSS, clickjacking, and other code injection attacks
 *
 * CSP directives explained:
 * - defaultSrc: Fallback for other fetch directives
 * - scriptSrc: Controls JavaScript sources
 * - styleSrc: Controls stylesheet sources
 * - imgSrc: Controls image sources
 * - connectSrc: Controls AJAX, WebSocket, EventSource connections
 * - fontSrc: Controls font sources
 * - objectSrc: Controls <object>, <embed>, <applet> elements
 * - mediaSrc: Controls <audio> and <video> sources
 * - frameSrc: Controls <frame> and <iframe> sources
 */
export function configureCSP() {
  const config = getCSPConfig();

  return helmet.contentSecurityPolicy({
    directives: config.directives,
    reportOnly: config.reportOnly,
  });
}

// ============================================================================
// Security Headers Middleware (T248)
// ============================================================================

/**
 * Configure all security headers using Helmet
 *
 * Headers configured:
 * - HSTS (HTTP Strict Transport Security): Force HTTPS
 * - X-Frame-Options: Prevent clickjacking
 * - X-Content-Type-Options: Prevent MIME sniffing
 * - X-XSS-Protection: Enable browser XSS protection
 * - Referrer-Policy: Control referer header
 * - Permissions-Policy: Control browser features (camera, microphone, etc.)
 *
 * @returns Express middleware
 */
export function configureSecurityHeaders() {
  const config = getSecurityHeadersConfig();

  return helmet({
    // HTTP Strict Transport Security (HSTS)
    // Forces browsers to use HTTPS for all future requests
    hsts: config.hsts.enabled
      ? {
          maxAge: config.hsts.maxAge,
          includeSubDomains: config.hsts.includeSubDomains,
          preload: config.hsts.preload,
        }
      : false,

    // X-Frame-Options: Prevent clickjacking
    // DENY: Page cannot be displayed in a frame
    // SAMEORIGIN: Page can only be displayed in a frame on the same origin
    frameguard: {
      action: config.xFrameOptions.toLowerCase() as 'deny' | 'sameorigin',
    },

    // X-Content-Type-Options: nosniff
    // Prevents browsers from MIME-sniffing responses
    noSniff: true,

    // X-XSS-Protection: 1; mode=block
    // Enables browser XSS filter
    xssFilter: true,

    // Referrer-Policy: Control referer header
    // strict-origin-when-cross-origin: Send full URL for same-origin, origin only for cross-origin
    referrerPolicy: {
      policy: config.referrerPolicy,
    },

    // Permissions-Policy (formerly Feature-Policy)
    // Controls which browser features can be used
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none',
    },

    // Disable X-Powered-By header (don't reveal Express.js)
    hidePoweredBy: true,

    // DNS Prefetch Control
    // Controls browser DNS prefetching
    dnsPrefetchControl: {
      allow: false,
    },

    // Note: expectCt was deprecated in helmet v7
    // Certificate Transparency is now enforced by browsers automatically
  });
}

// ============================================================================
// Custom Security Headers
// ============================================================================

/**
 * Add custom security headers not covered by Helmet
 *
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export function addCustomSecurityHeaders(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const config = getSecurityHeadersConfig();

  // Permissions-Policy header (replaces Feature-Policy)
  // Controls which browser features can be used by the page
  const permissionsPolicy = Object.entries(config.permissionsPolicy)
    .map(([feature, allowlist]) => {
      const allowString = allowlist.join(' ');
      return `${feature}=(${allowString})`;
    })
    .join(', ');

  res.setHeader('Permissions-Policy', permissionsPolicy);

  // X-Content-Type-Options: nosniff (already set by Helmet, but explicit)
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options (already set by Helmet, but explicit)
  res.setHeader('X-Frame-Options', config.xFrameOptions);

  // Clear sensitive headers in responses
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  // Add custom application version header (optional, for debugging)
  if (!isProduction()) {
    const version = process.env.API_VERSION || 'v1';
    res.setHeader('X-API-Version', version);
  }

  next();
}

// ============================================================================
// Complete Security Middleware Stack
// ============================================================================

/**
 * Get complete security middleware stack
 * Apply this to Express app for comprehensive security
 *
 * Usage:
 * ```typescript
 * import express from 'express';
 * import { getSecurityMiddleware } from './shared/middleware/securityHeaders';
 *
 * const app = express();
 * const securityMiddleware = getSecurityMiddleware();
 * securityMiddleware.forEach(middleware => app.use(middleware));
 * ```
 *
 * @returns Array of security middleware
 */
export function getSecurityMiddleware() {
  return [
    configureCORS(),
    configureSecurityHeaders(),
    configureCSP(),
    addCustomSecurityHeaders,
  ];
}

// ============================================================================
// Security Headers for Specific Routes
// ============================================================================

/**
 * Strict CSP for authentication pages
 * No inline scripts, no eval, no external resources
 *
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export function strictCSPForAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
      "script-src 'self'; " +
      "style-src 'self'; " +
      "img-src 'self' data:; " +
      "font-src 'self'; " +
      "object-src 'none'; " +
      "frame-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'"
  );
  next();
}

/**
 * CSP for file upload pages
 * Allows data URIs for image previews
 *
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export function cspForFileUpload(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
      "script-src 'self'; " +
      "style-src 'self' 'unsafe-inline'; " + // Allow inline styles for upload UI
      "img-src 'self' data: blob:; " + // Allow data URIs and blob URLs for previews
      "font-src 'self'; " +
      "object-src 'none'; " +
      "frame-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'"
  );
  next();
}

/**
 * CSP for teleconsultation pages
 * Allows WebRTC connections for video calls
 *
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export function cspForTeleconsultation(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const twilioVideoDomain = process.env.TWILIO_VIDEO_DOMAIN || 'video.twilio.com';

  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; ` +
      `script-src 'self' https://${twilioVideoDomain}; ` +
      `style-src 'self' 'unsafe-inline'; ` +
      `img-src 'self' data: https:; ` +
      `media-src 'self' blob: https://${twilioVideoDomain}; ` +
      `connect-src 'self' https://${twilioVideoDomain} wss://${twilioVideoDomain}; ` +
      `font-src 'self'; ` +
      `object-src 'none'; ` +
      `frame-src 'none'; ` +
      `base-uri 'self'`
  );
  next();
}

// ============================================================================
// CORS for Specific Routes
// ============================================================================

/**
 * Strict CORS for authentication endpoints
 * Only allow configured origins, no wildcard
 *
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export function strictCORSForAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  } else {
    // Origin not allowed
    res.status(403).json({
      error: 'Forbidden',
      message: 'Origin not allowed',
      code: 'ORIGIN_NOT_ALLOWED',
    });
    return;
  }

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Log security configuration
 * Useful for debugging
 */
export function logSecurityHeadersConfig(): void {
  const corsConfig = getCORSConfig();
  const cspConfig = getCSPConfig();
  const headersConfig = getSecurityHeadersConfig();

  console.log('🔒 Security Headers Configuration:');
  console.log('CORS:', {
    credentials: corsConfig.credentials,
    maxAge: corsConfig.maxAge,
  });
  console.log('CSP:', {
    reportOnly: cspConfig.reportOnly,
    directiveCount: Object.keys(cspConfig.directives).length,
  });
  console.log('HSTS:', headersConfig.hsts);
  console.log('X-Frame-Options:', headersConfig.xFrameOptions);
}

/**
 * Check if request is from allowed origin
 *
 * @param req Express request
 * @returns True if origin is allowed
 */
export function isAllowedOrigin(req: Request): boolean {
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
  const origin = req.headers.origin;

  if (!origin) {
    // No origin header (same-origin request or non-browser client)
    return true;
  }

  return allowedOrigins.includes(origin);
}

/**
 * Get CSP nonce for inline scripts
 * Use this to allow specific inline scripts while blocking others
 *
 * Usage:
 * ```typescript
 * app.use((req, res, next) => {
 *   res.locals.cspNonce = generateCSPNonce();
 *   next();
 * });
 *
 * // In your template:
 * <script nonce="<%= cspNonce %>">...</script>
 * ```
 *
 * @returns Random nonce string
 */
export function generateCSPNonce(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('base64');
}
