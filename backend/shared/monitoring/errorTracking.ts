import * as Sentry from '@sentry/node';
import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

const SERVICE_NAME = process.env.SERVICE_NAME || 'metapharm-api';
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const SENTRY_DSN = process.env.SENTRY_DSN || '';
const RELEASE = process.env.APP_VERSION || '0.1.0';

/**
 * Initialize Sentry error tracking
 */
export function initializeSentry() {
  if (!SENTRY_DSN) {
    logger.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: RELEASE,
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    beforeSend: (event, hint) => {
      // Filter sensitive data
      if (event.request) {
        // Remove auth headers
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['x-api-key'];
          delete event.request.headers['cookie'];
        }
      }

      // Add custom tags
      event.tags = {
        ...event.tags,
        service: SERVICE_NAME,
      };

      return event;
    },
  });

  logger.info('Sentry error tracking initialized', {
    environment: ENVIRONMENT,
    release: RELEASE,
  });
}

/**
 * Express middleware for Sentry request handler
 */
export function sentryRequestHandler() {
  // Return a simple middleware that does nothing
  // Sentry SDK automatically instruments requests
  return (req: Request, res: Response, next: NextFunction) => {
    next();
  };
}

/**
 * Express middleware for Sentry error handler
 */
export function sentryErrorHandler() {
  // Return a simple middleware for error handling
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    if (!(err instanceof SilentError)) {
      Sentry.captureException(err);
    }
    next(err);
  };
}

/**
 * Custom error class for errors that shouldn't be sent to Sentry
 */
export class SilentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SilentError';
  }
}

/**
 * Capture exception with context
 */
export function captureException(
  error: Error,
  context?: {
    userId?: string;
    pharmacyId?: string;
    orderId?: string;
    deliveryId?: string;
    [key: string]: any;
  }
) {
  if (error instanceof SilentError) {
    return;
  }

  Sentry.withScope((scope) => {
    // Add user context
    if (context?.userId) {
      scope.setUser({
        id: context.userId,
        username: context.userType as string,
      });
    }

    // Add custom context
    if (context) {
      scope.setContext('error_context', context);
    }

    Sentry.captureException(error);
  });

  logger.error('Exception captured in Sentry', {
    error: error.message,
    stack: error.stack,
    ...context,
  });
}

/**
 * Capture message
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: Record<string, any>
) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('message_context', context);
    }
    Sentry.captureMessage(message, level);
  });

  logger.log(level, message, context);
}

/**
 * Set user context for error tracking
 */
export function setErrorTrackingUserContext(
  userId: string,
  userType?: string,
  email?: string,
  pharmacyId?: string
) {
  Sentry.setUser({
    id: userId,
    username: userType,
    email,
    ip_address: '{{auto}}',
  });

  // Add custom data
  if (pharmacyId) {
    Sentry.setTag('pharmacy_id', pharmacyId);
  }
}

/**
 * Clear user context
 */
export function clearErrorTrackingUserContext() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addErrorTrackingBreadcrumb(
  message: string,
  category: string = 'user-action',
  data?: Record<string, any>,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Release tracking
 * Track deployments and releases
 */
export async function trackReleaseEvent(
  event: 'deploy' | 'crash' | 'release',
  data?: Record<string, any>
) {
  Sentry.captureMessage(
    `Release event: ${event}`,
    'info'
  );

  addErrorTrackingBreadcrumb(
    `Release event: ${event}`,
    'release',
    data,
    'info'
  );
}

/**
 * Source map configuration helper
 */
export function configureSourceMaps(publicDsn: string) {
  // This should be called with the public DSN to upload source maps
  logger.info('Source maps configured', {
    publicDsn,
    service: SERVICE_NAME,
    release: RELEASE,
  });
}

/**
 * Express error handler that integrates with Sentry
 */
export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Add request context to error tracking
  Sentry.withScope((scope) => {
    scope.setContext('http_request', {
      method: req.method,
      url: req.originalUrl,
      headers: {
        // Don't include sensitive headers
        'user-agent': req.get('user-agent'),
        'accept': req.get('accept'),
      },
    });

    scope.setTag('error_type', err.name);

    // Capture the error
    if (!(err instanceof SilentError)) {
      Sentry.captureException(err);
    }
  });

  // Log the error
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
  });

  // Send response
  res.status(500).json({
    error: 'Internal server error',
    ...(ENVIRONMENT === 'development' && {
      message: err.message,
      stack: err.stack,
    }),
  });
}

/**
 * Handle uncaught exceptions
 */
export function setupUncaughtExceptionHandler() {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught exception', {
      error: error.message,
      stack: error.stack,
    });
    captureException(error, { type: 'uncaughtException' });
    // Exit after logging
    process.exit(1);
  });
}

/**
 * Handle unhandled promise rejections
 */
export function setupUnhandledRejectionHandler() {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger.error('Unhandled promise rejection', {
      error: error.message,
      stack: error.stack,
      promise: String(promise),
    });
    captureException(error, { type: 'unhandledRejection' });
  });
}
