/**
 * Complete Monitoring Integration Example (T8-060)
 * Demonstrates how to use all monitoring features together
 *
 * This example shows:
 * - Express app setup with all monitoring middleware
 * - Error handling with tracking
 * - Metrics collection
 * - Health checks
 * - Distributed tracing
 * - Alert configuration
 */

import express, { Request, Response, NextFunction } from 'express';
import {
  // Initialization
  initializeSentry,
  initializeTracing,
  logger,
  configureCloudWatchLogging,
  setupUncaughtExceptionHandler,
  setupUnhandledRejectionHandler,

  // Middleware
  requestLoggingMiddleware,
  metricsMiddleware,
  tracingMiddleware,
  sentryRequestHandler,
  sentryErrorHandler,

  // Health checks
  healthCheckEndpoint,
  readinessCheckEndpoint,
  livenessCheckEndpoint,

  // Metrics
  metricsEndpoint,
  recordOrderCreated,
  recordDatabaseQuery,
  recordCacheHit,
  recordCacheMiss,
  updateActiveUsers,

  // Error tracking
  captureException,
  captureMessage,
  setErrorTrackingUserContext,
  addErrorTrackingBreadcrumb,

  // Tracing
  createSpan,
  addSpanAttribute,
  traceDatabase,
  traceCache,

  // Alerting
  sendAlert,
  alertManager,
  DEFAULT_ALERT_DEFINITIONS,
} from '../monitoring';

import { errorHandler, AppError, createNotFoundError } from '../middleware/errorHandler';

// ============================================================================
// Express App Setup
// ============================================================================

export async function createMonitoredApp(): Promise<express.Application> {
  const app = express();

  // Parse JSON bodies
  app.use(express.json());

  // ============================================================================
  // Step 1: Initialize Monitoring Services
  // ============================================================================

  // Initialize Sentry error tracking
  initializeSentry();
  logger.info('Sentry initialized');

  // Initialize OpenTelemetry distributed tracing
  await initializeTracing();
  logger.info('Tracing initialized');

  // Configure CloudWatch logging (production only)
  configureCloudWatchLogging();

  // Setup global error handlers
  setupUncaughtExceptionHandler();
  setupUnhandledRejectionHandler();

  // ============================================================================
  // Step 2: Add Monitoring Middleware (ORDER MATTERS!)
  // ============================================================================

  // Sentry request handler (must be first)
  app.use(sentryRequestHandler());

  // Distributed tracing
  app.use(tracingMiddleware());

  // Request logging
  app.use(requestLoggingMiddleware);

  // Metrics collection
  app.use(metricsMiddleware);

  // ============================================================================
  // Step 3: Health Check Endpoints
  // ============================================================================

  app.get('/health', healthCheckEndpoint);
  app.get('/health/ready', readinessCheckEndpoint);
  app.get('/health/live', livenessCheckEndpoint);
  app.get('/metrics', metricsEndpoint);

  // ============================================================================
  // Step 4: Application Routes with Monitoring
  // ============================================================================

  /**
   * Example: Create Order with Full Monitoring
   */
  app.post('/api/orders', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Set user context for error tracking
      const userId = req.body.userId;
      setErrorTrackingUserContext(userId, 'patient', req.body.email);

      // Add breadcrumb for tracing user action
      addErrorTrackingBreadcrumb('Order creation started', 'user-action', {
        userId,
        orderType: req.body.type,
      });

      // Create a span for this operation
      const span = createSpan('create_order', {
        'order.type': req.body.type,
        'user.id': userId,
      });

      try {
        // Simulate database operation with tracing
        const startDb = Date.now();
        const order = await traceDatabase(
          'insert',
          'orders',
          async () => {
            // Simulate database insert
            await new Promise((resolve) => setTimeout(resolve, 10));
            return { id: '12345', ...req.body };
          }
        );
        const dbDuration = Date.now() - startDb;

        // Record database metric
        recordDatabaseQuery('insert', 'orders', dbDuration);

        // Simulate cache update
        await traceCache('set', 'orders', async () => {
          // Cache the order
          recordCacheHit('orders');
        });

        // Record business metric
        recordOrderCreated(req.body.type);

        // Add success breadcrumb
        addErrorTrackingBreadcrumb('Order created successfully', 'success', {
          orderId: order.id,
        });

        // Log success
        logger.info('Order created', {
          userId,
          orderId: order.id,
          type: req.body.type,
        });

        res.status(201).json(order);
      } finally {
        span.end();
      }
    } catch (error) {
      // Capture exception with context
      captureException(error as Error, {
        userId: req.body.userId,
        orderType: req.body.type,
      });

      next(error);
    }
  });

  /**
   * Example: Get Order with Cache Monitoring
   */
  app.get('/api/orders/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = req.params.id;

      // Create span for this operation
      const span = createSpan('get_order', {
        'order.id': orderId,
      });

      try {
        // Try cache first
        let order = await traceCache('get', 'orders', async () => {
          // Simulate cache lookup
          const cached = null; // Simulate cache miss
          if (cached) {
            recordCacheHit('orders');
          } else {
            recordCacheMiss('orders');
          }
          return cached;
        });

        if (!order) {
          // Cache miss - fetch from database
          order = await traceDatabase('select', 'orders', async () => {
            // Simulate database query
            await new Promise((resolve) => setTimeout(resolve, 5));
            return { id: orderId, type: 'prescription', status: 'pending' };
          });

          // Update cache
          await traceCache('set', 'orders', async () => {
            // Cache the order
          });
        }

        res.json(order);
      } finally {
        span.end();
      }
    } catch (error) {
      next(error);
    }
  });

  /**
   * Example: Error Handling
   */
  app.get('/api/orders/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = req.params.id;

      // Simulate order not found
      if (!orderId || orderId === 'invalid') {
        throw createNotFoundError('Order');
      }

      // Simulate operation that might fail
      if (Math.random() > 0.8) {
        // Only capture non-operational errors
        const error = new Error('Unexpected cancellation failure');
        captureException(error, {
          orderId,
          operation: 'cancel',
        });
        throw error;
      }

      logger.info('Order cancelled', { orderId });
      res.json({ success: true, orderId });
    } catch (error) {
      next(error);
    }
  });

  /**
   * Example: Custom Alert Trigger
   */
  app.get('/api/admin/check-alerts', async (req: Request, res: Response) => {
    // Simulate checking a custom condition
    const prescriptionBacklog = Math.floor(Math.random() * 150);

    if (prescriptionBacklog > 100) {
      await sendAlert({
        name: 'High Prescription Backlog',
        description: `Prescription backlog has reached ${prescriptionBacklog}`,
        severity: 'warning',
        service: process.env.SERVICE_NAME || 'pharmacy-service',
        environment: process.env.NODE_ENV || 'development',
        metric: 'prescription_backlog',
        threshold: 100,
        currentValue: prescriptionBacklog,
      });
    }

    res.json({
      backlog: prescriptionBacklog,
      alertTriggered: prescriptionBacklog > 100,
    });
  });

  /**
   * Example: Performance Tracking
   */
  app.get('/api/performance', async (req: Request, res: Response) => {
    const span = createSpan('performance_check');

    try {
      // Simulate some work
      const start = Date.now();
      await new Promise((resolve) => setTimeout(resolve, 100));
      const duration = Date.now() - start;

      addSpanAttribute(span, 'operation.duration', duration);

      res.json({
        duration,
        message: 'Performance check complete',
      });
    } finally {
      span.end();
    }
  });

  // ============================================================================
  // Step 5: Error Handling Middleware (MUST BE LAST)
  // ============================================================================

  // Sentry error handler
  app.use(sentryErrorHandler());

  // Custom error handler
  app.use(errorHandler);

  return app;
}

// ============================================================================
// Start Monitoring Background Tasks
// ============================================================================

/**
 * Start alert monitoring
 */
export function startAlertMonitoring(): void {
  // Monitor default alert definitions
  DEFAULT_ALERT_DEFINITIONS.forEach((definition) => {
    setInterval(async () => {
      // Get current metric value (this would come from Prometheus or similar)
      const currentValue = await getMetricValue(definition.metric);

      // Check and alert if threshold exceeded
      await alertManager.checkAndAlert(definition, currentValue);
    }, definition.checkInterval);
  });

  logger.info('Alert monitoring started');
}

/**
 * Simulate getting metric value
 * In production, this would query Prometheus
 */
async function getMetricValue(metric: string): Promise<number> {
  // Simulate random metric values for demonstration
  const values: Record<string, () => number> = {
    'http_request_duration_seconds': () => Math.random() * 3,
    'http_requests_total_errors': () => Math.random() * 0.1,
    'db_connections_active': () => Math.floor(Math.random() * 100),
    'cache_hit_rate': () => Math.random(),
    'process_heap_used_bytes': () => Math.random(),
    'service_availability': () => 0.95 + Math.random() * 0.05,
  };

  return values[metric] ? values[metric]() : 0;
}

/**
 * Update active users gauge periodically
 */
export function startActiveUsersTracking(): void {
  setInterval(async () => {
    // Simulate getting active user counts
    const activePharmacists = Math.floor(Math.random() * 50);
    const activeDoctors = Math.floor(Math.random() * 30);
    const activePatients = Math.floor(Math.random() * 200);

    updateActiveUsers('pharmacist', activePharmacists);
    updateActiveUsers('doctor', activeDoctors);
    updateActiveUsers('patient', activePatients);

    logger.debug('Active users updated', {
      pharmacists: activePharmacists,
      doctors: activeDoctors,
      patients: activePatients,
    });
  }, 60000); // Every minute
}

// ============================================================================
// Example Server Startup
// ============================================================================

/**
 * Start the monitored server
 */
export async function startServer(): Promise<void> {
  const app = await createMonitoredApp();
  const PORT = process.env.PORT || 3000;

  // Start background monitoring tasks
  startAlertMonitoring();
  startActiveUsersTracking();

  app.listen(PORT, () => {
    logger.info('Server started', {
      port: PORT,
      environment: process.env.NODE_ENV,
    });

    // Send startup message
    captureMessage('Server started successfully', 'info', {
      port: PORT,
      environment: process.env.NODE_ENV,
    });
  });
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

/**
 * Handle graceful shutdown
 */
export function setupGracefulShutdown(server: any): void {
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, starting graceful shutdown`);

    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // Wait for existing connections to finish (max 10 seconds)
    setTimeout(() => {
      logger.error('Forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// ============================================================================
// Usage Example
// ============================================================================

if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });
}
