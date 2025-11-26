import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { Request, Response, NextFunction } from 'express';

const SERVICE_NAME = process.env.SERVICE_NAME || 'metapharm-api';
const ENVIRONMENT = process.env.NODE_ENV || 'development';

// Enable default Prometheus metrics (CPU, memory, etc.)
collectDefaultMetrics({ prefix: 'metapharm_' });

// HTTP Metrics
export const httpRequestDuration = new Histogram({
  name: 'metapharm_http_request_duration_seconds',
  help: 'HTTP request latency',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
});

export const httpRequestTotal = new Counter({
  name: 'metapharm_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service'],
});

export const httpRequestSize = new Histogram({
  name: 'metapharm_http_request_size_bytes',
  help: 'HTTP request size in bytes',
  labelNames: ['method', 'route', 'service'],
  buckets: [100, 1000, 10000, 100000, 1000000],
});

export const httpResponseSize = new Histogram({
  name: 'metapharm_http_response_size_bytes',
  help: 'HTTP response size in bytes',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [100, 1000, 10000, 100000, 1000000],
});

// Business Metrics
export const ordersCreatedTotal = new Counter({
  name: 'metapharm_orders_created_total',
  help: 'Total orders created',
  labelNames: ['type', 'service'],
});

export const ordersCompletedTotal = new Counter({
  name: 'metapharm_orders_completed_total',
  help: 'Total orders completed',
  labelNames: ['type', 'service'],
});

export const deliveriesCompletedTotal = new Counter({
  name: 'metapharm_deliveries_completed_total',
  help: 'Total deliveries completed',
  labelNames: ['status', 'service'],
});

export const consultationsStartedTotal = new Counter({
  name: 'metapharm_consultations_started_total',
  help: 'Total consultations started',
  labelNames: ['type', 'service'],
});

export const activeUsersGauge = new Gauge({
  name: 'metapharm_active_users',
  help: 'Number of active users',
  labelNames: ['user_type', 'service'],
});

export const inventoryLevelGauge = new Gauge({
  name: 'metapharm_inventory_level',
  help: 'Current inventory level by pharmacy',
  labelNames: ['pharmacy_id', 'drug_id', 'service'],
});

// Database Metrics
export const databaseConnectionsActive = new Gauge({
  name: 'metapharm_db_connections_active',
  help: 'Active database connections',
  labelNames: ['service'],
});

export const databaseQueryDuration = new Histogram({
  name: 'metapharm_db_query_duration_seconds',
  help: 'Database query duration',
  labelNames: ['operation', 'table', 'service'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2],
});

export const databaseErrorsTotal = new Counter({
  name: 'metapharm_db_errors_total',
  help: 'Total database errors',
  labelNames: ['operation', 'error_type', 'service'],
});

// Cache Metrics
export const cacheHitsTotal = new Counter({
  name: 'metapharm_cache_hits_total',
  help: 'Total cache hits',
  labelNames: ['cache_name', 'service'],
});

export const cacheMissesTotal = new Counter({
  name: 'metapharm_cache_misses_total',
  help: 'Total cache misses',
  labelNames: ['cache_name', 'service'],
});

// Error Metrics
export const errorsTotal = new Counter({
  name: 'metapharm_errors_total',
  help: 'Total errors',
  labelNames: ['error_type', 'service'],
});

/**
 * HTTP metrics middleware
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const route = req.route?.path || req.path;

  // Record request size
  const requestSize = parseInt(req.get('content-length') || '0', 10);
  httpRequestSize.labels(req.method, route, SERVICE_NAME).observe(requestSize);

  // Wrap response.end to capture response data
  const originalEnd = res.end;
  let responseSize = 0;

  res.end = function (...args: any[]) {
    // Calculate response size
    if (typeof args[0] === 'string') {
      responseSize = Buffer.byteLength(args[0]);
    }

    // Record metrics
    const duration = (Date.now() - startTime) / 1000;
    const statusCode = res.statusCode;

    httpRequestDuration.labels(req.method, route, String(statusCode), SERVICE_NAME).observe(duration);
    httpRequestTotal.labels(req.method, route, String(statusCode), SERVICE_NAME).inc();
    httpResponseSize.labels(req.method, route, String(statusCode), SERVICE_NAME).observe(responseSize);

    // Call original end method
    return originalEnd.apply(res, args);
  };

  next();
};

/**
 * Record business metrics
 */
export const recordOrderCreated = (type: string) => {
  ordersCreatedTotal.labels(type, SERVICE_NAME).inc();
};

export const recordOrderCompleted = (type: string) => {
  ordersCompletedTotal.labels(type, SERVICE_NAME).inc();
};

export const recordDeliveryCompleted = (status: string) => {
  deliveriesCompletedTotal.labels(status, SERVICE_NAME).inc();
};

export const recordConsultationStarted = (type: string) => {
  consultationsStartedTotal.labels(type, SERVICE_NAME).inc();
};

export const updateActiveUsers = (userType: string, count: number) => {
  activeUsersGauge.labels(userType, SERVICE_NAME).set(count);
};

export const updateInventoryLevel = (pharmacyId: string, drugId: string, level: number) => {
  inventoryLevelGauge.labels(pharmacyId, drugId, SERVICE_NAME).set(level);
};

/**
 * Record database metrics
 */
export const recordDatabaseQuery = (operation: string, table: string, duration: number) => {
  databaseQueryDuration.labels(operation, table, SERVICE_NAME).observe(duration / 1000);
};

export const recordDatabaseError = (operation: string, errorType: string) => {
  databaseErrorsTotal.labels(operation, errorType, SERVICE_NAME).inc();
};

export const updateDatabaseConnections = (count: number) => {
  databaseConnectionsActive.labels(SERVICE_NAME).set(count);
};

/**
 * Record cache metrics
 */
export const recordCacheHit = (cacheName: string) => {
  cacheHitsTotal.labels(cacheName, SERVICE_NAME).inc();
};

export const recordCacheMiss = (cacheName: string) => {
  cacheMissesTotal.labels(cacheName, SERVICE_NAME).inc();
};

/**
 * Record errors
 */
export const recordError = (errorType: string) => {
  errorsTotal.labels(errorType, SERVICE_NAME).inc();
};

/**
 * Get Prometheus metrics
 */
export const getMetrics = async (): Promise<string> => {
  return register.metrics();
};

/**
 * Metrics endpoint handler
 */
export const metricsEndpoint = async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await getMetrics());
};
