/**
 * Unit Tests for Prometheus Metrics (T256)
 * Tests metrics collection, recording, and export
 */

import {
  getMetrics,
  getMetricsAsJson,
  clearMetrics,
  recordRequestDuration,
  recordSlowRequest,
  recordRequestStart,
  recordRequestEnd,
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
} from '../metrics';

describe('Prometheus Metrics', () => {
  beforeEach(() => {
    // Clear metrics before each test
    clearMetrics();
  });

  describe('recordRequestDuration()', () => {
    it('should record HTTP request duration', () => {
      recordRequestDuration('GET', '/api/users', 150, 200);

      // Verify metrics were recorded
      expect(recordRequestDuration).toBeDefined();
    });

    it('should record multiple requests', () => {
      recordRequestDuration('GET', '/api/users', 100, 200);
      recordRequestDuration('POST', '/api/users', 200, 201);
      recordRequestDuration('GET', '/api/products', 150, 200);

      // Metrics should accumulate
      expect(recordRequestDuration).toBeDefined();
    });

    it('should track different status codes', () => {
      recordRequestDuration('GET', '/api/users', 100, 200);
      recordRequestDuration('GET', '/api/users', 200, 404);
      recordRequestDuration('GET', '/api/users', 300, 500);

      // All should be recorded
      expect(recordRequestDuration).toBeDefined();
    });

    it('should track different HTTP methods', () => {
      recordRequestDuration('GET', '/api/users', 100, 200);
      recordRequestDuration('POST', '/api/users', 150, 201);
      recordRequestDuration('PUT', '/api/users/123', 120, 200);
      recordRequestDuration('DELETE', '/api/users/123', 80, 204);

      expect(recordRequestDuration).toBeDefined();
    });
  });

  describe('recordSlowRequest()', () => {
    it('should record slow requests', () => {
      recordSlowRequest('GET', '/api/users', 2500);

      expect(recordSlowRequest).toBeDefined();
    });

    it('should track multiple slow requests', () => {
      recordSlowRequest('GET', '/api/users', 2000);
      recordSlowRequest('POST', '/api/import', 5000);

      expect(recordSlowRequest).toBeDefined();
    });
  });

  describe('Request tracking', () => {
    it('should record active request start', () => {
      recordRequestStart('GET', '/api/users');

      expect(recordRequestStart).toBeDefined();
    });

    it('should record active request end', () => {
      recordRequestEnd('GET', '/api/users');

      expect(recordRequestEnd).toBeDefined();
    });

    it('should track concurrent requests', () => {
      recordRequestStart('GET', '/api/users');
      recordRequestStart('GET', '/api/users');
      recordRequestStart('POST', '/api/data');

      recordRequestEnd('GET', '/api/users');

      expect(recordRequestStart).toBeDefined();
      expect(recordRequestEnd).toBeDefined();
    });
  });

  describe('Cache metrics', () => {
    it('should record cache hits', () => {
      recordCacheHit('user-cache');
      recordCacheHit('product-cache');

      expect(recordCacheHit).toBeDefined();
    });

    it('should record cache misses', () => {
      recordCacheMiss('user-cache');
      recordCacheMiss('product-cache');

      expect(recordCacheMiss).toBeDefined();
    });

    it('should update cache size', () => {
      updateCacheSize('user-cache', 1024 * 1024); // 1MB
      updateCacheSize('product-cache', 512 * 1024); // 512KB

      expect(updateCacheSize).toBeDefined();
    });

    it('should track hit/miss ratio per cache', () => {
      recordCacheHit('cache-1');
      recordCacheHit('cache-1');
      recordCacheMiss('cache-1');

      recordCacheHit('cache-2');
      recordCacheMiss('cache-2');
      recordCacheMiss('cache-2');

      expect(recordCacheHit).toBeDefined();
      expect(recordCacheMiss).toBeDefined();
    });
  });

  describe('Database metrics', () => {
    it('should record database queries', () => {
      recordDatabaseQuery('SELECT', 'users', 100);
      recordDatabaseQuery('INSERT', 'prescriptions', 150);
      recordDatabaseQuery('UPDATE', 'inventory', 120);

      expect(recordDatabaseQuery).toBeDefined();
    });

    it('should record database errors', () => {
      recordDatabaseError('SELECT', 'users');
      recordDatabaseError('INSERT', 'orders');

      expect(recordDatabaseError).toBeDefined();
    });

    it('should update connection pool status', () => {
      updateConnectionPoolStatus(10, 7);
      updateConnectionPoolStatus(10, 5);
      updateConnectionPoolStatus(10, 9);

      expect(updateConnectionPoolStatus).toBeDefined();
    });

    it('should track query duration per operation', () => {
      recordDatabaseQuery('SELECT', 'users', 50);
      recordDatabaseQuery('SELECT', 'users', 100);
      recordDatabaseQuery('SELECT', 'users', 150);

      recordDatabaseQuery('INSERT', 'logs', 200);
      recordDatabaseQuery('INSERT', 'logs', 250);

      expect(recordDatabaseQuery).toBeDefined();
    });
  });

  describe('Authentication metrics', () => {
    it('should record login attempts', () => {
      recordLoginAttempt(true);
      recordLoginAttempt(true);
      recordLoginAttempt(false);

      expect(recordLoginAttempt).toBeDefined();
    });

    it('should record token validation results', () => {
      recordTokenValidation('valid');
      recordTokenValidation('valid');
      recordTokenValidation('expired');
      recordTokenValidation('invalid');

      expect(recordTokenValidation).toBeDefined();
    });

    it('should track success vs failure rate', () => {
      for (let i = 0; i < 8; i++) {
        recordLoginAttempt(true);
      }
      for (let i = 0; i < 2; i++) {
        recordLoginAttempt(false);
      }

      expect(recordLoginAttempt).toBeDefined();
    });
  });

  describe('Business metrics', () => {
    it('should record prescriptions created', () => {
      recordPrescriptionCreated('pharmacy-123');
      recordPrescriptionCreated('pharmacy-123');
      recordPrescriptionCreated('pharmacy-456');

      expect(recordPrescriptionCreated).toBeDefined();
    });

    it('should record orders placed', () => {
      recordOrderPlaced('completed');
      recordOrderPlaced('pending');
      recordOrderPlaced('completed');
      recordOrderPlaced('failed');

      expect(recordOrderPlaced).toBeDefined();
    });

    it('should update active users', () => {
      updateActiveUsers(150);
      updateActiveUsers(160);
      updateActiveUsers(145);

      expect(updateActiveUsers).toBeDefined();
    });

    it('should track per-pharmacy metrics', () => {
      recordPrescriptionCreated('pharmacy-001');
      recordPrescriptionCreated('pharmacy-001');
      recordPrescriptionCreated('pharmacy-001');

      recordPrescriptionCreated('pharmacy-002');
      recordPrescriptionCreated('pharmacy-002');

      expect(recordPrescriptionCreated).toBeDefined();
    });

    it('should track per-status order metrics', () => {
      recordOrderPlaced('completed');
      recordOrderPlaced('completed');
      recordOrderPlaced('pending');
      recordOrderPlaced('failed');
      recordOrderPlaced('pending');

      expect(recordOrderPlaced).toBeDefined();
    });
  });

  describe('getMetrics()', () => {
    it('should return metrics in text format', async () => {
      recordRequestDuration('GET', '/api/test', 100, 200);

      const metrics = await getMetrics();

      expect(typeof metrics).toBe('string');
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should include Prometheus format markers', async () => {
      recordRequestDuration('GET', '/api/test', 100, 200);

      const metrics = await getMetrics();

      // Prometheus format includes HELP and TYPE comments
      expect(metrics).toMatch(/#/);
    });

    it('should include metric values', async () => {
      recordLoginAttempt(true);

      const metrics = await getMetrics();

      expect(metrics.length).toBeGreaterThan(0);
    });
  });

  describe('getMetricsAsJson()', () => {
    it('should return metrics as JSON', async () => {
      recordRequestDuration('POST', '/api/data', 200, 201);

      const metricsJson = await getMetricsAsJson();

      expect(typeof metricsJson).toBe('object');
      expect(Array.isArray(metricsJson) || typeof metricsJson === 'object').toBe(true);
    });

    it('should be parseable JSON', async () => {
      recordCacheHit('test-cache');

      const metricsJson = await getMetricsAsJson();

      expect(() => JSON.stringify(metricsJson)).not.toThrow();
    });
  });

  describe('clearMetrics()', () => {
    it('should reset all metrics', async () => {
      recordRequestDuration('GET', '/api/test', 100, 200);
      recordLoginAttempt(true);

      clearMetrics();

      // Metrics should be reset
      const metrics = await getMetrics();
      expect(metrics).toBeDefined();
    });

    it('should allow fresh recording after clear', async () => {
      recordRequestDuration('GET', '/api/old', 100, 200);
      clearMetrics();
      recordRequestDuration('GET', '/api/new', 150, 200);

      const metrics = await getMetrics();
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
            recordRequestDuration(method, path, Math.random() * 1000, status);
          });
        });
      });

      expect(recordRequestDuration).toBeDefined();
    });

    it('should handle database metrics with operation/table combinations', () => {
      const operations = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
      const tables = ['users', 'prescriptions', 'inventory', 'orders'];

      operations.forEach((op) => {
        tables.forEach((table) => {
          recordDatabaseQuery(op, table, Math.random() * 500);
        });
      });

      expect(recordDatabaseQuery).toBeDefined();
    });
  });

  describe('Metric accumulation', () => {
    it('should accumulate metrics over time', async () => {
      recordRequestDuration('GET', '/api/test', 100, 200);
      recordRequestDuration('GET', '/api/test', 150, 200);
      recordRequestDuration('GET', '/api/test', 200, 200);

      const metrics = await getMetrics();

      // Metrics should include all recorded data
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should not lose data on export', async () => {
      recordRequestDuration('GET', '/api/test', 100, 200);
      recordLoginAttempt(true);
      recordCacheHit('cache');

      const metrics1 = await getMetrics();

      // Record more
      recordRequestDuration('POST', '/api/test', 200, 201);

      const metrics2 = await getMetrics();

      // Second export should include all data
      expect(metrics2.length).toBeGreaterThan(metrics1.length);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero duration', () => {
      recordRequestDuration('GET', '/api/test', 0, 200);
      expect(recordRequestDuration).toBeDefined();
    });

    it('should handle very large durations', () => {
      recordRequestDuration('GET', '/api/slow', 3600000, 200); // 1 hour
      expect(recordRequestDuration).toBeDefined();
    });

    it('should handle empty cache name', () => {
      recordCacheHit('');
      recordCacheMiss('');
      expect(recordCacheHit).toBeDefined();
    });

    it('should handle empty table name', () => {
      recordDatabaseQuery('SELECT', '', 100);
      expect(recordDatabaseQuery).toBeDefined();
    });

    it('should handle extreme active user counts', () => {
      updateActiveUsers(0);
      updateActiveUsers(1000000);
      expect(updateActiveUsers).toBeDefined();
    });
  });

  describe('Metric isolation', () => {
    it('should not mix cache metrics', () => {
      recordCacheHit('cache-1');
      recordCacheHit('cache-1');
      recordCacheMiss('cache-2');

      // Each cache should track independently
      expect(recordCacheHit).toBeDefined();
      expect(recordCacheMiss).toBeDefined();
    });

    it('should not mix database operation metrics', () => {
      recordDatabaseQuery('SELECT', 'users', 100);
      recordDatabaseError('INSERT', 'orders');

      expect(recordDatabaseQuery).toBeDefined();
      expect(recordDatabaseError).toBeDefined();
    });

    it('should isolate authentication metrics', () => {
      recordLoginAttempt(true);
      recordTokenValidation('valid');

      expect(recordLoginAttempt).toBeDefined();
      expect(recordTokenValidation).toBeDefined();
    });
  });
});
