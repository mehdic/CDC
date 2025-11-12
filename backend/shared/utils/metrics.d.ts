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
export interface MetricValue {
    value: number;
    timestamp?: number;
}
export declare const httpRequestsTotal: promClient.Counter<"path" | "method" | "status_code">;
export declare const httpRequestDurationMs: promClient.Histogram<"path" | "method" | "status_code">;
export declare const httpResponseStatus: promClient.Counter<"status_code">;
export declare const slowRequests: promClient.Counter<"path" | "method">;
export declare const httpErrors: promClient.Counter<"path" | "method" | "status_code">;
export declare const activeRequests: promClient.Gauge<"path" | "method">;
export declare const cacheHits: promClient.Counter<"cache_name">;
export declare const cacheMisses: promClient.Counter<"cache_name">;
export declare const cacheSize: promClient.Gauge<"cache_name">;
export declare const dbQueries: promClient.Counter<"table" | "operation">;
export declare const dbQueryDurationMs: promClient.Histogram<"table" | "operation">;
export declare const dbErrors: promClient.Counter<"table" | "operation">;
export declare const dbConnectionPoolSize: promClient.Gauge<string>;
export declare const dbActiveConnections: promClient.Gauge<string>;
export declare const loginAttempts: promClient.Counter<"result">;
export declare const tokenValidations: promClient.Counter<"result">;
export declare const prescriptionsCreated: promClient.Counter<"pharmacy_id">;
export declare const ordersPlaced: promClient.Counter<"status">;
export declare const activeUsers: promClient.Gauge<string>;
/**
 * Record an HTTP request
 */
export declare function recordRequestDuration(method: string, path: string, duration: number, statusCode: number): void;
/**
 * Record a slow request
 */
export declare function recordSlowRequest(method: string, path: string, duration: number): void;
/**
 * Record active request start
 */
export declare function recordRequestStart(method: string, path: string): void;
/**
 * Record active request end
 */
export declare function recordRequestEnd(method: string, path: string): void;
/**
 * Record cache hit
 */
export declare function recordCacheHit(cacheName: string): void;
/**
 * Record cache miss
 */
export declare function recordCacheMiss(cacheName: string): void;
/**
 * Update cache size
 */
export declare function updateCacheSize(cacheName: string, sizeBytes: number): void;
/**
 * Record database query
 */
export declare function recordDatabaseQuery(operation: string, table: string, duration: number): void;
/**
 * Record database error
 */
export declare function recordDatabaseError(operation: string, table: string): void;
/**
 * Update connection pool status
 */
export declare function updateConnectionPoolStatus(total: number, active: number): void;
/**
 * Record login attempt
 */
export declare function recordLoginAttempt(success: boolean): void;
/**
 * Record token validation result
 */
export declare function recordTokenValidation(result: 'valid' | 'expired' | 'invalid'): void;
/**
 * Record prescription created
 */
export declare function recordPrescriptionCreated(pharmacyId: string): void;
/**
 * Record order placed
 */
export declare function recordOrderPlaced(status: string): void;
/**
 * Update active users count
 */
export declare function updateActiveUsers(count: number): void;
/**
 * Get all metrics in Prometheus text format
 */
export declare function getMetrics(): Promise<string>;
/**
 * Get metrics as JSON (for non-Prometheus endpoints)
 */
export declare function getMetricsAsJson(): Promise<any>;
/**
 * Clear all metrics (useful for testing)
 */
export declare function clearMetrics(): void;
declare const _default: {
    getMetrics: typeof getMetrics;
    getMetricsAsJson: typeof getMetricsAsJson;
    recordRequestDuration: typeof recordRequestDuration;
    recordSlowRequest: typeof recordSlowRequest;
    recordCacheHit: typeof recordCacheHit;
    recordCacheMiss: typeof recordCacheMiss;
    updateCacheSize: typeof updateCacheSize;
    recordDatabaseQuery: typeof recordDatabaseQuery;
    recordDatabaseError: typeof recordDatabaseError;
    updateConnectionPoolStatus: typeof updateConnectionPoolStatus;
    recordLoginAttempt: typeof recordLoginAttempt;
    recordTokenValidation: typeof recordTokenValidation;
    recordPrescriptionCreated: typeof recordPrescriptionCreated;
    recordOrderPlaced: typeof recordOrderPlaced;
    updateActiveUsers: typeof updateActiveUsers;
};
export default _default;
//# sourceMappingURL=metrics.d.ts.map