"use strict";
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
promClient.collectDefaultMetrics();
exports.httpRequestsTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status_code'],
});
exports.httpRequestDurationMs = new promClient.Histogram({
    name: 'http_request_duration_ms',
    help: 'HTTP request latency in milliseconds',
    labelNames: ['method', 'path', 'status_code'],
    buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
});
exports.httpResponseStatus = new promClient.Counter({
    name: 'http_response_status_total',
    help: 'Total HTTP responses by status code',
    labelNames: ['status_code'],
});
exports.slowRequests = new promClient.Counter({
    name: 'slow_requests_total',
    help: 'Total number of slow requests (>1s)',
    labelNames: ['method', 'path'],
});
exports.httpErrors = new promClient.Counter({
    name: 'http_errors_total',
    help: 'Total HTTP error responses',
    labelNames: ['method', 'path', 'status_code'],
});
exports.activeRequests = new promClient.Gauge({
    name: 'active_requests',
    help: 'Number of currently active requests',
    labelNames: ['method', 'path'],
});
exports.cacheHits = new promClient.Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['cache_name'],
});
exports.cacheMisses = new promClient.Counter({
    name: 'cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['cache_name'],
});
exports.cacheSize = new promClient.Gauge({
    name: 'cache_size_bytes',
    help: 'Current cache size in bytes',
    labelNames: ['cache_name'],
});
exports.dbQueries = new promClient.Counter({
    name: 'db_queries_total',
    help: 'Total number of database queries',
    labelNames: ['operation', 'table'],
});
exports.dbQueryDurationMs = new promClient.Histogram({
    name: 'db_query_duration_ms',
    help: 'Database query duration in milliseconds',
    labelNames: ['operation', 'table'],
    buckets: [1, 5, 10, 50, 100, 500, 1000, 5000],
});
exports.dbErrors = new promClient.Counter({
    name: 'db_errors_total',
    help: 'Total number of database errors',
    labelNames: ['operation', 'table'],
});
exports.dbConnectionPoolSize = new promClient.Gauge({
    name: 'db_connection_pool_size',
    help: 'Current database connection pool size',
});
exports.dbActiveConnections = new promClient.Gauge({
    name: 'db_active_connections',
    help: 'Number of active database connections',
});
exports.loginAttempts = new promClient.Counter({
    name: 'login_attempts_total',
    help: 'Total number of login attempts',
    labelNames: ['result'],
});
exports.tokenValidations = new promClient.Counter({
    name: 'token_validations_total',
    help: 'Total number of token validations',
    labelNames: ['result'],
});
exports.prescriptionsCreated = new promClient.Counter({
    name: 'prescriptions_created_total',
    help: 'Total number of prescriptions created',
    labelNames: ['pharmacy_id'],
});
exports.ordersPlaced = new promClient.Counter({
    name: 'orders_placed_total',
    help: 'Total number of orders placed',
    labelNames: ['status'],
});
exports.activeUsers = new promClient.Gauge({
    name: 'active_users',
    help: 'Number of active users',
});
function recordRequestDuration(method, path, duration, statusCode) {
    const statusCodeStr = String(statusCode);
    exports.httpRequestsTotal.labels(method, path, statusCodeStr).inc();
    exports.httpRequestDurationMs.labels(method, path, statusCodeStr).observe(duration);
    exports.httpResponseStatus.labels(statusCodeStr).inc();
    if (statusCode >= 400) {
        exports.httpErrors.labels(method, path, statusCodeStr).inc();
    }
}
function recordSlowRequest(method, path, duration) {
    exports.slowRequests.labels(method, path).inc();
}
function recordRequestStart(method, path) {
    exports.activeRequests.labels(method, path).inc();
}
function recordRequestEnd(method, path) {
    exports.activeRequests.labels(method, path).dec();
}
function recordCacheHit(cacheName) {
    exports.cacheHits.labels(cacheName).inc();
}
function recordCacheMiss(cacheName) {
    exports.cacheMisses.labels(cacheName).inc();
}
function updateCacheSize(cacheName, sizeBytes) {
    exports.cacheSize.labels(cacheName).set(sizeBytes);
}
function recordDatabaseQuery(operation, table, duration) {
    exports.dbQueries.labels(operation, table).inc();
    exports.dbQueryDurationMs.labels(operation, table).observe(duration);
}
function recordDatabaseError(operation, table) {
    exports.dbErrors.labels(operation, table).inc();
}
function updateConnectionPoolStatus(total, active) {
    exports.dbConnectionPoolSize.set(total);
    exports.dbActiveConnections.set(active);
}
function recordLoginAttempt(success) {
    exports.loginAttempts.labels(success ? 'success' : 'failure').inc();
}
function recordTokenValidation(result) {
    exports.tokenValidations.labels(result).inc();
}
function recordPrescriptionCreated(pharmacyId) {
    exports.prescriptionsCreated.labels(pharmacyId).inc();
}
function recordOrderPlaced(status) {
    exports.ordersPlaced.labels(status).inc();
}
function updateActiveUsers(count) {
    exports.activeUsers.set(count);
}
async function getMetrics() {
    return promClient.register.metrics();
}
async function getMetricsAsJson() {
    const metrics = await promClient.register.getMetricsAsJSON();
    return metrics;
}
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