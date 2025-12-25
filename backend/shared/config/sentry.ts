import * as Sentry from '@sentry/node';

/**
 * Initialize Sentry error tracking for backend services
 * Only initializes if SENTRY_DSN environment variable is set
 *
 * @param serviceName - The name of the service (e.g., 'api-gateway', 'auth-service')
 */
export const initSentry = (serviceName: string): void => {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';

  // Only initialize if DSN is provided
  if (dsn && typeof dsn === 'string' && dsn.trim() !== '') {
    Sentry.init({
      dsn,
      environment,

      // Service identification
      serverName: serviceName,

      // Performance Monitoring
      tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring

      // Integrations - Sentry v10+ uses getAutoPerformanceIntegrations()
      integrations: Sentry.getAutoPerformanceIntegrations(),

      // Filter out sensitive data
      beforeSend(event) {
        // Remove sensitive headers
        if (event.request?.headers) {
          const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
          sensitiveHeaders.forEach((header) => {
            if (event.request?.headers?.[header]) {
              event.request.headers[header] = '[FILTERED]';
            }
          });
        }

        // Remove sensitive query parameters
        if (event.request?.query_string) {
          const url = new URL(`http://example.com?${event.request.query_string}`);
          const sensitiveParams = ['token', 'password', 'secret', 'api_key'];
          sensitiveParams.forEach((param) => {
            if (url.searchParams.has(param)) {
              url.searchParams.set(param, '[FILTERED]');
            }
          });
          event.request.query_string = url.search.substring(1);
        }

        return event;
      },

      // Ignore common errors that don't need tracking
      ignoreErrors: [
        'ECONNREFUSED',
        'ENOTFOUND',
        'Socket timeout',
      ],
    });

    console.log(`[Sentry] Initialized for ${serviceName} (${environment})`);
  } else {
    console.log(`[Sentry] Skipped initialization for ${serviceName} - SENTRY_DSN not configured`);
  }
};

/**
 * Express middleware to setup Sentry error handler
 * Add this AFTER all controllers but BEFORE other error handlers
 *
 * @example
 * import { setupSentryErrorHandler } from './config/sentry';
 * app.use(Sentry.expressIntegration());
 * app.use(setupSentryErrorHandler());
 */
export const setupSentryErrorHandler = Sentry.setupExpressErrorHandler;
