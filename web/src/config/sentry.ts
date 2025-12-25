/**
 * Initialize Sentry error tracking for the web application
 * Only initializes if VITE_SENTRY_DSN environment variable is set
 *
 * NOTE: This implementation is ready but requires @sentry/react to be installed.
 * Install with: npm install @sentry/react --workspace=web
 */
export const initSentry = (): void => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  // Only initialize if DSN is provided
  if (dsn && typeof dsn === 'string' && dsn.trim() !== '') {
    // Dynamic import to avoid build errors when @sentry/react is not installed
    import('@sentry/react')
      .then((Sentry) => {
        Sentry.init({
          dsn,
          environment: import.meta.env.MODE || 'development',

          // Performance Monitoring
          tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring

          // Session Replay (optional - can be enabled later)
          // replaysSessionSampleRate: 0.1,
          // replaysOnErrorSampleRate: 1.0,

          // Integrations
          integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
          ],

          // Ignore common errors that don't need tracking
          ignoreErrors: [
            // Browser extensions
            'top.GLOBALS',
            // Network errors that are expected
            'NetworkError',
            'Failed to fetch',
          ],

          // Filter out sensitive data
          beforeSend(event) {
            // Remove sensitive query parameters
            if (event.request?.url) {
              const url = new URL(event.request.url);
              const sensitiveParams = ['token', 'password', 'secret', 'api_key'];
              sensitiveParams.forEach((param) => {
                if (url.searchParams.has(param)) {
                  url.searchParams.set(param, '[FILTERED]');
                }
              });
              event.request.url = url.toString();
            }
            return event;
          },
        });

        console.log('[Sentry] Initialized for environment:', import.meta.env.MODE);
      })
      .catch((error) => {
        console.warn('[Sentry] Failed to initialize - @sentry/react may not be installed:', error.message);
      });
  } else {
    console.log('[Sentry] Skipped initialization - VITE_SENTRY_DSN not configured');
  }
};
