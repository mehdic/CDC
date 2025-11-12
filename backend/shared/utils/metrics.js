"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeUsers = exports.ordersPlaced = exports.prescriptionsCreated = exports.tokenValidations = exports.loginAttempts = exports.dbActiveConnections = exports.dbConnectionPoolSize = exports.dbErrors = exports.dbQueryDurationMs = exports.dbQueries = exports.cacheSize = exports.cacheMisses = exports.cacheHits = exports.activeRequests = exports.httpErrors = exports.slowRequests = exports.httpResponseStatus = exports.httpRequestDurationMs = exports.httpRequestsTotal = void 0;
exports.recordRequestDuration = recordRequestDuration;
exports.recordSlowRequest = recordSlowRequest;
exports.recordRequestStart = recordRequestStart;
exports.recordRequestEnd = recordRequestEnd;
exports.recordCacheHit = recordCacheHit;
exports.recordCacheMiss = recordCacheMiss;
exports.updateCacheSize = updateCacheSize;
exports.recordDatabaseQuery = recordDatabaseQuery;
exports.recordDatabaseError = recordDatabaseError;
exports.updateConnectionPoolStatus = updateConnectionPoolStatus;
exports.recordLoginAttempt = recordLoginAttempt;
exports.recordTokenValidation = recordTokenValidation;
exports.recordPrescriptionCreated = recordPrescriptionCreated;
exports.recordOrderPlaced = recordOrderPlaced;
exports.updateActiveUsers = updateActiveUsers;
exports.getMetrics = getMetrics;
exports.getMetricsAsJson = getMetricsAsJson;
exports.clearMetrics = clearMetrics;
const promClient = __importStar(require("prom-client"));
// ============================================================================
// Configuration
// ============================================================================
// Enable Prometheus default metrics (nodejs_* metrics)
promClient.collectDefaultMetrics();
// ============================================================================
// Metrics Definitions
// ============================================================================
// Counter: Total number of HTTP requests
exports.httpRequestsTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status_code'],
});
// Histogram: HTTP request duration in milliseconds
exports.httpRequestDurationMs = new promClient.Histogram({
    name: 'http_request_duration_ms',
    help: 'HTTP request latency in milliseconds',
    labelNames: ['method', 'path', 'status_code'],
    buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
});
// Counter: HTTP requests by status code
exports.httpResponseStatus = new promClient.Counter({
    name: 'http_response_status_total',
    help: 'Total HTTP responses by status code',
    labelNames: ['status_code'],
});
// Counter: Slow requests (>1 second)
exports.slowRequests = new promClient.Counter({
    name: 'slow_requests_total',
    help: 'Total number of slow requests (>1s)',
    labelNames: ['method', 'path'],
});
// Counter: HTTP errors (4xx, 5xx)
exports.httpErrors = new promClient.Counter({
    name: 'http_errors_total',
    help: 'Total HTTP error responses',
    labelNames: ['method', 'path', 'status_code'],
});
// Gauge: Currently active requests
exports.activeRequests = new promClient.Gauge({
    name: 'active_requests',
    help: 'Number of currently active requests',
    labelNames: ['method', 'path'],
});
// ============================================================================
// Cache Metrics
// ============================================================================
// Counter: Cache hits
exports.cacheHits = new promClient.Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['cache_name'],
});
// Counter: Cache misses
exports.cacheMisses = new promClient.Counter({
    name: 'cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['cache_name'],
});
// Gauge: Cache size
exports.cacheSize = new promClient.Gauge({
    name: 'cache_size_bytes',
    help: 'Current cache size in bytes',
    labelNames: ['cache_name'],
});
// ============================================================================
// Database Metrics
// ============================================================================
// Counter: Database queries
exports.dbQueries = new promClient.Counter({
    name: 'db_queries_total',
    help: 'Total number of database queries',
    labelNames: ['operation', 'table'],
});
// Histogram: Database query duration
exports.dbQueryDurationMs = new promClient.Histogram({
    name: 'db_query_duration_ms',
    help: 'Database query duration in milliseconds',
    labelNames: ['operation', 'table'],
    buckets: [1, 5, 10, 50, 100, 500, 1000, 5000],
});
// Counter: Database errors
exports.dbErrors = new promClient.Counter({
    name: 'db_errors_total',
    help: 'Total number of database errors',
    labelNames: ['operation', 'table'],
});
// Gauge: Connection pool status
exports.dbConnectionPoolSize = new promClient.Gauge({
    name: 'db_connection_pool_size',
    help: 'Current database connection pool size',
});
// Gauge: Active connections
exports.dbActiveConnections = new promClient.Gauge({
    name: 'db_active_connections',
    help: 'Number of active database connections',
});
// ============================================================================
// Authentication Metrics
// ============================================================================
// Counter: Login attempts
exports.loginAttempts = new promClient.Counter({
    name: 'login_attempts_total',
    help: 'Total number of login attempts',
    labelNames: ['result'], // 'success' or 'failure'
});
// Counter: Token validations
exports.tokenValidations = new promClient.Counter({
    name: 'token_validations_total',
    help: 'Total number of token validations',
    labelNames: ['result'], // 'valid', 'expired', 'invalid'
});
// ============================================================================
// Business Metrics
// ============================================================================
// Counter: Prescriptions created
exports.prescriptionsCreated = new promClient.Counter({
    name: 'prescriptions_created_total',
    help: 'Total number of prescriptions created',
    labelNames: ['pharmacy_id'],
});
// Counter: Orders placed
exports.ordersPlaced = new promClient.Counter({
    name: 'orders_placed_total',
    help: 'Total number of orders placed',
    labelNames: ['status'],
});
// Gauge: Active users
exports.activeUsers = new promClient.Gauge({
    name: 'active_users',
    help: 'Number of active users',
});
// ============================================================================
// Recording Functions
// ============================================================================
/**
 * Record an HTTP request
 */
function recordRequestDuration(method, path, duration, statusCode) {
    const statusCodeStr = String(statusCode);
    exports.httpRequestsTotal.labels(method, path, statusCodeStr).inc();
    exports.httpRequestDurationMs.labels(method, path, statusCodeStr).observe(duration);
    exports.httpResponseStatus.labels(statusCodeStr).inc();
    if (statusCode >= 400) {
        exports.httpErrors.labels(method, path, statusCodeStr).inc();
    }
}
/**
 * Record a slow request
 */
function recordSlowRequest(method, path, duration) {
    exports.slowRequests.labels(method, path).inc();
}
/**
 * Record active request start
 */
function recordRequestStart(method, path) {
    exports.activeRequests.labels(method, path).inc();
}
/**
 * Record active request end
 */
function recordRequestEnd(method, path) {
    exports.activeRequests.labels(method, path).dec();
}
/**
 * Record cache hit
 */
function recordCacheHit(cacheName) {
    exports.cacheHits.labels(cacheName).inc();
}
/**
 * Record cache miss
 */
function recordCacheMiss(cacheName) {
    exports.cacheMisses.labels(cacheName).inc();
}
/**
 * Update cache size
 */
function updateCacheSize(cacheName, sizeBytes) {
    exports.cacheSize.labels(cacheName).set(sizeBytes);
}
/**
 * Record database query
 */
function recordDatabaseQuery(operation, table, duration) {
    exports.dbQueries.labels(operation, table).inc();
    exports.dbQueryDurationMs.labels(operation, table).observe(duration);
}
/**
 * Record database error
 */
function recordDatabaseError(operation, table) {
    exports.dbErrors.labels(operation, table).inc();
}
/**
 * Update connection pool status
 */
function updateConnectionPoolStatus(total, active) {
    exports.dbConnectionPoolSize.set(total);
    exports.dbActiveConnections.set(active);
}
/**
 * Record login attempt
 */
function recordLoginAttempt(success) {
    exports.loginAttempts.labels(success ? 'success' : 'failure').inc();
}
/**
 * Record token validation result
 */
function recordTokenValidation(result) {
    exports.tokenValidations.labels(result).inc();
}
/**
 * Record prescription created
 */
function recordPrescriptionCreated(pharmacyId) {
    exports.prescriptionsCreated.labels(pharmacyId).inc();
}
/**
 * Record order placed
 */
function recordOrderPlaced(status) {
    exports.ordersPlaced.labels(status).inc();
}
/**
 * Update active users count
 */
function updateActiveUsers(count) {
    exports.activeUsers.set(count);
}
// ============================================================================
// Metrics Export
// ============================================================================
/**
 * Get all metrics in Prometheus text format
 */
async function getMetrics() {
    return promClient.register.metrics();
}
/**
 * Get metrics as JSON (for non-Prometheus endpoints)
 */
async function getMetricsAsJson() {
    const metrics = await promClient.register.getMetricsAsJSON();
    return metrics;
}
/**
 * Clear all metrics (useful for testing)
 */
function clearMetrics() {
    promClient.register.resetMetrics();
}
exports.default = {
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
//# sourceMappingURL=metrics.js.map