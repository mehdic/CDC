/**
 * Request Logging Middleware (T057)
 * Implements request logging with user context for audit and debugging
 * Based on: /specs/002-metapharm-platform/plan.md
 *
 * Features:
 * - Log all incoming requests
 * - Include user ID if authenticated
 * - Log response times
 * - Different log formats for dev/production
 */

import morgan from 'morgan';
import { Request, Response } from 'express';

// Define custom token for user ID
morgan.token('user-id', (req: any) => {
  return req.user?.userId || 'anonymous';
});

// Define custom token for user role
morgan.token('user-role', (req: any) => {
  return req.user?.role || 'none';
});

// Define custom token for pharmacy ID
morgan.token('pharmacy-id', (req: any) => {
  return req.user?.pharmacyId || 'none';
});

// Define custom token for request ID
morgan.token('request-id', (req: any) => {
  return req.headers['x-request-id'] || '-';
});

/**
 * Development log format (detailed, colored)
 * Format: [:date] :method :url :status :response-time ms - :user-id (:user-role)
 */
const devFormat = ':date[iso] :method :url :status :response-time ms - :user-id (:user-role)';

/**
 * Production log format (JSON for log aggregation)
 */
const productionFormat = JSON.stringify({
  timestamp: ':date[iso]',
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time',
  userId: ':user-id',
  userRole: ':user-role',
  pharmacyId: ':pharmacy-id',
  requestId: ':request-id',
  ip: ':remote-addr',
  userAgent: ':user-agent',
});

/**
 * Request logger middleware
 * Use appropriate format based on NODE_ENV
 */
export const requestLogger =
  process.env['NODE_ENV'] === 'production'
    ? morgan(productionFormat)
    : morgan(devFormat);

/**
 * Custom logging function for specific events
 * Can be used to log errors, security events, etc.
 */
export function logRequest(
  req: Request,
  message: string,
  metadata?: Record<string, any>
) {
  const user = (req as any).user;

  console.info({
    message,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userId: user?.userId || 'anonymous',
    role: user?.role || 'none',
    pharmacyId: user?.pharmacyId || 'none',
    ip: req.ip,
    ...metadata,
  });
}

/**
 * Error logging function
 */
export function logError(
  req: Request,
  error: Error,
  metadata?: Record<string, any>
) {
  const user = (req as any).user;

  console.error({
    message: error.message,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userId: user?.userId || 'anonymous',
    role: user?.role || 'none',
    pharmacyId: user?.pharmacyId || 'none',
    ip: req.ip,
    stack: error.stack,
    ...metadata,
  });
}

/**
 * Skip logging for health check endpoints
 */
export function shouldSkipLogging(req: Request, _res: Response): boolean {
  // Skip health checks in production to reduce log noise
  if (process.env['NODE_ENV'] === 'production' && req.path === '/health') {
    return true;
  }

  return false;
}

/**
 * Request logger with skip condition
 */
export const requestLoggerWithSkip = morgan(
  process.env['NODE_ENV'] === 'production' ? productionFormat : devFormat,
  {
    skip: shouldSkipLogging,
  }
);
