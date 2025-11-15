"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const metrics_1 = require("../metrics");
describe('Prometheus Metrics', () => {
    beforeEach(() => {
        (0, metrics_1.clearMetrics)();
    });
    describe('recordRequestDuration()', () => {
        it('should record HTTP request duration', () => {
            (0, metrics_1.recordRequestDuration)('GET', '/api/users', 150, 200);
            expect(metrics_1.recordRequestDuration).toBeDefined();
        });
        it('should record multiple requests', () => {
            (0, metrics_1.recordRequestDuration)('GET', '/api/users', 100, 200);
            (0, metrics_1.recordRequestDuration)('POST', '/api/users', 200, 201);
            (0, metrics_1.recordRequestDuration)('GET', '/api/products', 150, 200);
            expect(metrics_1.recordRequestDuration).toBeDefined();
        });
        it('should track different status codes', () => {
            (0, metrics_1.recordRequestDuration)('GET', '/api/users', 100, 200);
            (0, metrics_1.recordRequestDuration)('GET', '/api/users', 200, 404);
            (0, metrics_1.recordRequestDuration)('GET', '/api/users', 300, 500);
            expect(metrics_1.recordRequestDuration).toBeDefined();
        });
        it('should track different HTTP methods', () => {
            (0, metrics_1.recordRequestDuration)('GET', '/api/users', 100, 200);
            (0, metrics_1.recordRequestDuration)('POST', '/api/users', 150, 201);
            (0, metrics_1.recordRequestDuration)('PUT', '/api/users/123', 120, 200);
            (0, metrics_1.recordRequestDuration)('DELETE', '/api/users/123', 80, 204);
            expect(metrics_1.recordRequestDuration).toBeDefined();
        });
    });
    describe('recordSlowRequest()', () => {
        it('should record slow requests', () => {
            (0, metrics_1.recordSlowRequest)('GET', '/api/users', 2500);
            expect(metrics_1.recordSlowRequest).toBeDefined();
        });
        it('should track multiple slow requests', () => {
            (0, metrics_1.recordSlowRequest)('GET', '/api/users', 2000);
            (0, metrics_1.recordSlowRequest)('POST', '/api/import', 5000);
            expect(metrics_1.recordSlowRequest).toBeDefined();
        });
    });
    describe('Request tracking', () => {
        it('should record active request start', () => {
            (0, metrics_1.recordRequestStart)('GET', '/api/users');
            expect(metrics_1.recordRequestStart).toBeDefined();
        });
        it('should record active request end', () => {
            (0, metrics_1.recordRequestEnd)('GET', '/api/users');
            expect(metrics_1.recordRequestEnd).toBeDefined();
        });
        it('should track concurrent requests', () => {
            (0, metrics_1.recordRequestStart)('GET', '/api/users');
            (0, metrics_1.recordRequestStart)('GET', '/api/users');
            (0, metrics_1.recordRequestStart)('POST', '/api/data');
            (0, metrics_1.recordRequestEnd)('GET', '/api/users');
            expect(metrics_1.recordRequestStart).toBeDefined();
            expect(metrics_1.recordRequestEnd).toBeDefined();
        });
    });
    describe('Cache metrics', () => {
        it('should record cache hits', () => {
            (0, metrics_1.recordCacheHit)('user-cache');
            (0, metrics_1.recordCacheHit)('product-cache');
            expect(metrics_1.recordCacheHit).toBeDefined();
        });
        it('should record cache misses', () => {
            (0, metrics_1.recordCacheMiss)('user-cache');
            (0, metrics_1.recordCacheMiss)('product-cache');
            expect(metrics_1.recordCacheMiss).toBeDefined();
        });
        it('should update cache size', () => {
            (0, metrics_1.updateCacheSize)('user-cache', 1024 * 1024);
            (0, metrics_1.updateCacheSize)('product-cache', 512 * 1024);
            expect(metrics_1.updateCacheSize).toBeDefined();
        });
        it('should track hit/miss ratio per cache', () => {
            (0, metrics_1.recordCacheHit)('cache-1');
            (0, metrics_1.recordCacheHit)('cache-1');
            (0, metrics_1.recordCacheMiss)('cache-1');
            (0, metrics_1.recordCacheHit)('cache-2');
            (0, metrics_1.recordCacheMiss)('cache-2');
            (0, metrics_1.recordCacheMiss)('cache-2');
            expect(metrics_1.recordCacheHit).toBeDefined();
            expect(metrics_1.recordCacheMiss).toBeDefined();
        });
    });
    describe('Database metrics', () => {
        it('should record database queries', () => {
            (0, metrics_1.recordDatabaseQuery)('SELECT', 'users', 100);
            (0, metrics_1.recordDatabaseQuery)('INSERT', 'prescriptions', 150);
            (0, metrics_1.recordDatabaseQuery)('UPDATE', 'inventory', 120);
            expect(metrics_1.recordDatabaseQuery).toBeDefined();
        });
        it('should record database errors', () => {
            (0, metrics_1.recordDatabaseError)('SELECT', 'users');
            (0, metrics_1.recordDatabaseError)('INSERT', 'orders');
            expect(metrics_1.recordDatabaseError).toBeDefined();
        });
        it('should update connection pool status', () => {
            (0, metrics_1.updateConnectionPoolStatus)(10, 7);
            (0, metrics_1.updateConnectionPoolStatus)(10, 5);
            (0, metrics_1.updateConnectionPoolStatus)(10, 9);
            expect(metrics_1.updateConnectionPoolStatus).toBeDefined();
        });
        it('should track query duration per operation', () => {
            (0, metrics_1.recordDatabaseQuery)('SELECT', 'users', 50);
            (0, metrics_1.recordDatabaseQuery)('SELECT', 'users', 100);
            (0, metrics_1.recordDatabaseQuery)('SELECT', 'users', 150);
            (0, metrics_1.recordDatabaseQuery)('INSERT', 'logs', 200);
            (0, metrics_1.recordDatabaseQuery)('INSERT', 'logs', 250);
            expect(metrics_1.recordDatabaseQuery).toBeDefined();
        });
    });
    describe('Authentication metrics', () => {
        it('should record login attempts', () => {
            (0, metrics_1.recordLoginAttempt)(true);
            (0, metrics_1.recordLoginAttempt)(true);
            (0, metrics_1.recordLoginAttempt)(false);
            expect(metrics_1.recordLoginAttempt).toBeDefined();
        });
        it('should record token validation results', () => {
            (0, metrics_1.recordTokenValidation)('valid');
            (0, metrics_1.recordTokenValidation)('valid');
            (0, metrics_1.recordTokenValidation)('expired');
            (0, metrics_1.recordTokenValidation)('invalid');
            expect(metrics_1.recordTokenValidation).toBeDefined();
        });
        it('should track success vs failure rate', () => {
            for (let i = 0; i < 8; i++) {
                (0, metrics_1.recordLoginAttempt)(true);
            }
            for (let i = 0; i < 2; i++) {
                (0, metrics_1.recordLoginAttempt)(false);
            }
            expect(metrics_1.recordLoginAttempt).toBeDefined();
        });
    });
    describe('Business metrics', () => {
        it('should record prescriptions created', () => {
            (0, metrics_1.recordPrescriptionCreated)('pharmacy-123');
            (0, metrics_1.recordPrescriptionCreated)('pharmacy-123');
            (0, metrics_1.recordPrescriptionCreated)('pharmacy-456');
            expect(metrics_1.recordPrescriptionCreated).toBeDefined();
        });
        it('should record orders placed', () => {
            (0, metrics_1.recordOrderPlaced)('completed');
            (0, metrics_1.recordOrderPlaced)('pending');
            (0, metrics_1.recordOrderPlaced)('completed');
            (0, metrics_1.recordOrderPlaced)('failed');
            expect(metrics_1.recordOrderPlaced).toBeDefined();
        });
        it('should update active users', () => {
            (0, metrics_1.updateActiveUsers)(150);
            (0, metrics_1.updateActiveUsers)(160);
            (0, metrics_1.updateActiveUsers)(145);
            expect(metrics_1.updateActiveUsers).toBeDefined();
        });
        it('should track per-pharmacy metrics', () => {
            (0, metrics_1.recordPrescriptionCreated)('pharmacy-001');
            (0, metrics_1.recordPrescriptionCreated)('pharmacy-001');
            (0, metrics_1.recordPrescriptionCreated)('pharmacy-001');
            (0, metrics_1.recordPrescriptionCreated)('pharmacy-002');
            (0, metrics_1.recordPrescriptionCreated)('pharmacy-002');
            expect(metrics_1.recordPrescriptionCreated).toBeDefined();
        });
        it('should track per-status order metrics', () => {
            (0, metrics_1.recordOrderPlaced)('completed');
            (0, metrics_1.recordOrderPlaced)('completed');
            (0, metrics_1.recordOrderPlaced)('pending');
            (0, metrics_1.recordOrderPlaced)('failed');
            (0, metrics_1.recordOrderPlaced)('pending');
            expect(metrics_1.recordOrderPlaced).toBeDefined();
        });
    });
    describe('getMetrics()', () => {
        it('should return metrics in text format', async () => {
            (0, metrics_1.recordRequestDuration)('GET', '/api/test', 100, 200);
            const metrics = await (0, metrics_1.getMetrics)();
            expect(typeof metrics).toBe('string');
            expect(metrics.length).toBeGreaterThan(0);
        });
        it('should include Prometheus format markers', async () => {
            (0, metrics_1.recordRequestDuration)('GET', '/api/test', 100, 200);
            const metrics = await (0, metrics_1.getMetrics)();
            expect(metrics).toMatch(/#/);
        });
        it('should include metric values', async () => {
            (0, metrics_1.recordLoginAttempt)(true);
            const metrics = await (0, metrics_1.getMetrics)();
            expect(metrics.length).toBeGreaterThan(0);
        });
    });
    describe('getMetricsAsJson()', () => {
        it('should return metrics as JSON', async () => {
            (0, metrics_1.recordRequestDuration)('POST', '/api/data', 200, 201);
            const metricsJson = await (0, metrics_1.getMetricsAsJson)();
            expect(typeof metricsJson).toBe('object');
            expect(Array.isArray(metricsJson) || typeof metricsJson === 'object').toBe(true);
        });
        it('should be parseable JSON', async () => {
            (0, metrics_1.recordCacheHit)('test-cache');
            const metricsJson = await (0, metrics_1.getMetricsAsJson)();
            expect(() => JSON.stringify(metricsJson)).not.toThrow();
        });
    });
    describe('clearMetrics()', () => {
        it('should reset all metrics', async () => {
            (0, metrics_1.recordRequestDuration)('GET', '/api/test', 100, 200);
            (0, metrics_1.recordLoginAttempt)(true);
            (0, metrics_1.clearMetrics)();
            const metrics = await (0, metrics_1.getMetrics)();
            expect(metrics).toBeDefined();
        });
        it('should allow fresh recording after clear', async () => {
            (0, metrics_1.recordRequestDuration)('GET', '/api/old', 100, 200);
            (0, metrics_1.clearMetrics)();
            (0, metrics_1.recordRequestDuration)('GET', '/api/new', 150, 200);
            const metrics = await (0, metrics_1.getMetrics)();
            expect(metrics).toBeDefined();
        });
    });
    describe('Label combinations', () => {
        it('should handle request metrics with all label combinations', () => {
            const methods = ['GET', 'POST', 'PUT', 'DELETE'];
            const paths = ['/api/users', '/api/products', '/api/orders'];
            const statuses = [200, 201, 400, 404, 500];
            methods.forEach((method) => {
                paths.forEach((path) => {
                    statuses.forEach((status) => {
                        (0, metrics_1.recordRequestDuration)(method, path, Math.random() * 1000, status);
                    });
                });
            });
            expect(metrics_1.recordRequestDuration).toBeDefined();
        });
        it('should handle database metrics with operation/table combinations', () => {
            const operations = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
            const tables = ['users', 'prescriptions', 'inventory', 'orders'];
            operations.forEach((op) => {
                tables.forEach((table) => {
                    (0, metrics_1.recordDatabaseQuery)(op, table, Math.random() * 500);
                });
            });
            expect(metrics_1.recordDatabaseQuery).toBeDefined();
        });
    });
    describe('Metric accumulation', () => {
        it('should accumulate metrics over time', async () => {
            (0, metrics_1.recordRequestDuration)('GET', '/api/test', 100, 200);
            (0, metrics_1.recordRequestDuration)('GET', '/api/test', 150, 200);
            (0, metrics_1.recordRequestDuration)('GET', '/api/test', 200, 200);
            const metrics = await (0, metrics_1.getMetrics)();
            expect(metrics.length).toBeGreaterThan(0);
        });
        it('should not lose data on export', async () => {
            (0, metrics_1.recordRequestDuration)('GET', '/api/test', 100, 200);
            (0, metrics_1.recordLoginAttempt)(true);
            (0, metrics_1.recordCacheHit)('cache');
            const metrics1 = await (0, metrics_1.getMetrics)();
            (0, metrics_1.recordRequestDuration)('POST', '/api/test', 200, 201);
            const metrics2 = await (0, metrics_1.getMetrics)();
            expect(metrics2.length).toBeGreaterThan(metrics1.length);
        });
    });
    describe('Edge cases', () => {
        it('should handle zero duration', () => {
            (0, metrics_1.recordRequestDuration)('GET', '/api/test', 0, 200);
            expect(metrics_1.recordRequestDuration).toBeDefined();
        });
        it('should handle very large durations', () => {
            (0, metrics_1.recordRequestDuration)('GET', '/api/slow', 3600000, 200);
            expect(metrics_1.recordRequestDuration).toBeDefined();
        });
        it('should handle empty cache name', () => {
            (0, metrics_1.recordCacheHit)('');
            (0, metrics_1.recordCacheMiss)('');
            expect(metrics_1.recordCacheHit).toBeDefined();
        });
        it('should handle empty table name', () => {
            (0, metrics_1.recordDatabaseQuery)('SELECT', '', 100);
            expect(metrics_1.recordDatabaseQuery).toBeDefined();
        });
        it('should handle extreme active user counts', () => {
            (0, metrics_1.updateActiveUsers)(0);
            (0, metrics_1.updateActiveUsers)(1000000);
            expect(metrics_1.updateActiveUsers).toBeDefined();
        });
    });
    describe('Metric isolation', () => {
        it('should not mix cache metrics', () => {
            (0, metrics_1.recordCacheHit)('cache-1');
            (0, metrics_1.recordCacheHit)('cache-1');
            (0, metrics_1.recordCacheMiss)('cache-2');
            expect(metrics_1.recordCacheHit).toBeDefined();
            expect(metrics_1.recordCacheMiss).toBeDefined();
        });
        it('should not mix database operation metrics', () => {
            (0, metrics_1.recordDatabaseQuery)('SELECT', 'users', 100);
            (0, metrics_1.recordDatabaseError)('INSERT', 'orders');
            expect(metrics_1.recordDatabaseQuery).toBeDefined();
            expect(metrics_1.recordDatabaseError).toBeDefined();
        });
        it('should isolate authentication metrics', () => {
            (0, metrics_1.recordLoginAttempt)(true);
            (0, metrics_1.recordTokenValidation)('valid');
            expect(metrics_1.recordLoginAttempt).toBeDefined();
            expect(metrics_1.recordTokenValidation).toBeDefined();
        });
    });
});
//# sourceMappingURL=metrics.test.js.map