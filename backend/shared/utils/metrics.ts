/**
 * Prometheus Metrics Collection (T256)
 * Implements Prometheus-compatible metrics for monitoring
 * Based on: /specs/002-metapharm-platform/plan.md
 *
 * Metrics Tracked:
 * - Request count (by method, path, status code)
 * - Request duration histogram (p50, p95, p99)
 * - Error rate (by status code)
 * - Database connection pool stats
 * - Memory usage
 * - Cache hit/miss rates
 *
 * Usage:
 * import { getMetrics, recordRequestDuration, recordCacheHit } from '@shared/utils/metrics';
 *
 * // Record a request duration
 * recordRequestDuration('GET', '/api/users', 150, 200);
 *
 * // Get all metrics in Prometheus format
 * const metricsText = await getMetrics();
 *
 * Expose via:
 * app.get('/metrics', async (req, res) => {
 *   const metrics = await getMetrics();
 *   res.type('text/plain').send(metrics);
 * });
 */

import * as promClient from 'prom-client';

// ============================================================================
// Types
// ============================================================================

export interface MetricValue {
  value: number;
  timestamp?: number;
}

// ============================================================================
// Configuration
// ============================================================================

// Enable Prometheus default metrics (nodejs_* metrics)
promClient.collectDefaultMetrics({ timeout: 5000 });

// ============================================================================
// Metrics Definitions
// ============================================================================

// Counter: Total number of HTTP requests
export const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status_code'],
});

// Histogram: HTTP request duration in milliseconds
export const httpRequestDurationMs = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request latency in milliseconds',
  labelNames: ['method', 'path', 'status_code'],
  buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
});

// Counter: HTTP requests by status code
export const httpResponseStatus = new promClient.Counter({
  name: 'http_response_status_total',
  help: 'Total HTTP responses by status code',
  labelNames: ['status_code'],
});

// Counter: Slow requests (>1 second)
export const slowRequests = new promClient.Counter({
  name: 'slow_requests_total',
  help: 'Total number of slow requests (>1s)',
  labelNames: ['method', 'path'],
});

// Counter: HTTP errors (4xx, 5xx)
export const httpErrors = new promClient.Counter({
  name: 'http_errors_total',
  help: 'Total HTTP error responses',
  labelNames: ['method', 'path', 'status_code'],
});

// Gauge: Currently active requests
export const activeRequests = new promClient.Gauge({
  name: 'active_requests',
  help: 'Number of currently active requests',
  labelNames: ['method', 'path'],
});

// ============================================================================
// Cache Metrics
// ============================================================================

// Counter: Cache hits
export const cacheHits = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_name'],
});

// Counter: Cache misses
export const cacheMisses = new promClient.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_name'],
});

// Gauge: Cache size
export const cacheSize = new promClient.Gauge({
  name: 'cache_size_bytes',
  help: 'Current cache size in bytes',
  labelNames: ['cache_name'],
});

// ============================================================================
// Database Metrics
// ============================================================================

// Counter: Database queries
export const dbQueries = new promClient.Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table'],
});

// Histogram: Database query duration
export const dbQueryDurationMs = new promClient.Histogram({
  name: 'db_query_duration_ms',
  help: 'Database query duration in milliseconds',
  labelNames: ['operation', 'table'],
  buckets: [1, 5, 10, 50, 100, 500, 1000, 5000],
});

// Counter: Database errors
export const dbErrors = new promClient.Counter({
  name: 'db_errors_total',
  help: 'Total number of database errors',
  labelNames: ['operation', 'table'],
});

// Gauge: Connection pool status
export const dbConnectionPoolSize = new promClient.Gauge({
  name: 'db_connection_pool_size',
  help: 'Current database connection pool size',
});

// Gauge: Active connections
export const dbActiveConnections = new promClient.Gauge({
  name: 'db_active_connections',
  help: 'Number of active database connections',
});

// ============================================================================
// Authentication Metrics
// ============================================================================

// Counter: Login attempts
export const loginAttempts = new promClient.Counter({
  name: 'login_attempts_total',
  help: 'Total number of login attempts',
  labelNames: ['result'], // 'success' or 'failure'
});

// Counter: Token validations
export const tokenValidations = new promClient.Counter({
  name: 'token_validations_total',
  help: 'Total number of token validations',
  labelNames: ['result'], // 'valid', 'expired', 'invalid'
});

// ============================================================================
// Business Metrics
// ============================================================================

// Counter: Prescriptions created
export const prescriptionsCreated = new promClient.Counter({
  name: 'prescriptions_created_total',
  help: 'Total number of prescriptions created',
  labelNames: ['pharmacy_id'],
});

// Counter: Orders placed
export const ordersPlaced = new promClient.Counter({
  name: 'orders_placed_total',
  help: 'Total number of orders placed',
  labelNames: ['status'],
});

// Gauge: Active users
export const activeUsers = new promClient.Gauge({
  name: 'active_users',
  help: 'Number of active users',
});

// ============================================================================
// Recording Functions
// ============================================================================

/**
 * Record an HTTP request
 */
export function recordRequestDuration(
  method: string,
  path: string,
  duration: number,
  statusCode: number
): void {
  httpRequestsTotal.labels(method, path, statusCode).inc();
  httpRequestDurationMs.labels(method, path, statusCode).observe(duration);
  httpResponseStatus.labels(statusCode).inc();

  if (statusCode >= 400) {
    httpErrors.labels(method, path, statusCode).inc();
  }
}

/**
 * Record a slow request
 */
export function recordSlowRequest(method: string, path: string, duration: number): void {
  slowRequests.labels(method, path).inc();
}

/**
 * Record active request start
 */
export function recordRequestStart(method: string, path: string): void {
  activeRequests.labels(method, path).inc();
}

/**
 * Record active request end
 */
export function recordRequestEnd(method: string, path: string): void {
  activeRequests.labels(method, path).dec();
}

/**
 * Record cache hit
 */
export function recordCacheHit(cacheName: string): void {
  cacheHits.labels(cacheName).inc();
}

/**
 * Record cache miss
 */
export function recordCacheMiss(cacheName: string): void {
  cacheMisses.labels(cacheName).inc();
}

/**
 * Update cache size
 */
export function updateCacheSize(cacheName: string, sizeBytes: number): void {
  cacheSize.labels(cacheName).set(sizeBytes);
}

/**
 * Record database query
 */
export function recordDatabaseQuery(
  operation: string,
  table: string,
  duration: number
): void {
  dbQueries.labels(operation, table).inc();
  dbQueryDurationMs.labels(operation, table).observe(duration);
}

/**
 * Record database error
 */
export function recordDatabaseError(operation: string, table: string): void {
  dbErrors.labels(operation, table).inc();
}

/**
 * Update connection pool status
 */
export function updateConnectionPoolStatus(total: number, active: number): void {
  dbConnectionPoolSize.set(total);
  dbActiveConnections.set(active);
}

/**
 * Record login attempt
 */
export function recordLoginAttempt(success: boolean): void {
  loginAttempts.labels(success ? 'success' : 'failure').inc();
}

/**
 * Record token validation result
 */
export function recordTokenValidation(result: 'valid' | 'expired' | 'invalid'): void {
  tokenValidations.labels(result).inc();
}

/**
 * Record prescription created
 */
export function recordPrescriptionCreated(pharmacyId: string): void {
  prescriptionsCreated.labels(pharmacyId).inc();
}

/**
 * Record order placed
 */
export function recordOrderPlaced(status: string): void {
  ordersPlaced.labels(status).inc();
}

/**
 * Update active users count
 */
export function updateActiveUsers(count: number): void {
  activeUsers.set(count);
}

// ============================================================================
// Metrics Export
// ============================================================================

/**
 * Get all metrics in Prometheus text format
 */
export async function getMetrics(): Promise<string> {
  return promClient.register.metrics();
}

/**
 * Get metrics as JSON (for non-Prometheus endpoints)
 */
export async function getMetricsAsJson(): Promise<any> {
  const metrics = await promClient.register.getMetricsAsJSON();
  return metrics;
}

/**
 * Clear all metrics (useful for testing)
 */
export function clearMetrics(): void {
  promClient.register.resetMetrics();
}

export default {
  getMetrics,
  getMetricsAsJson,
  recordRequestDuration,
  recordSlowRequest,
  recordCacheHit,
  recordCacheMiss,
  updateCacheSize,
  recordDatabaseQuery,
  recordDatabaseError,
  updateConnectionPoolStatus,
  recordLoginAttempt,
  recordTokenValidation,
  recordPrescriptionCreated,
  recordOrderPlaced,
  updateActiveUsers,
};
