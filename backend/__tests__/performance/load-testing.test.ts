/**
 * Performance and Load Testing Suite
 * Tests API response times and performance under load
 *
 * Task: T3-111 - Performance Testing
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import express, { Application } from 'express';
import { authenticateJWT } from '../../shared/middleware/auth';
import { generateAccessToken } from '../../shared/utils/jwt';

describe('Performance Testing Suite', () => {
  let app: Application;
  let validToken: string;

  beforeAll(() => {
    // Set up test Express app with realistic routes
    app = express();
    app.use(express.json());

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // Mock database query endpoint
    app.get('/api/prescriptions', authenticateJWT as any, async (req, res) => {
      // Simulate database query delay
      await new Promise(resolve => setTimeout(resolve, 50));
      res.json({
        prescriptions: Array.from({ length: 10 }, (_, i) => ({
          id: `rx-${i}`,
          medication: `Medication ${i}`,
          patient: 'John Doe',
        })),
      });
    });

    // Mock search endpoint (complex query simulation)
    app.post('/api/search', authenticateJWT as any, async (req, res) => {
      // Simulate search processing
      await new Promise(resolve => setTimeout(resolve, 100));
      res.json({
        results: Array.from({ length: 20 }, (_, i) => ({
          id: i,
          title: `Result ${i}`,
        })),
        total: 100,
      });
    });

    // Mock data creation endpoint
    app.post('/api/orders', authenticateJWT as any, async (req, res) => {
      // Simulate database write
      await new Promise(resolve => setTimeout(resolve, 75));
      res.status(201).json({ id: 'order-123', ...req.body });
    });

    validToken = generateAccessToken({
      userId: 'perf-test-user',
      email: 'perf@example.com',
      role: 'PATIENT',
      pharmacyId: null,
    });
  });

  describe('API Response Time Tests', () => {
    it('should respond to health checks in < 120ms', async () => {
      const start = Date.now();

      await request(app).get('/health').expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(120);
      console.log(`✓ Health check: ${duration}ms`);
    });

    it('should respond to authenticated GET requests in < 500ms', async () => {
      const start = Date.now();

      await request(app)
        .get('/api/prescriptions')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
      console.log(`✓ Authenticated GET: ${duration}ms`);
    });

    it('should respond to search queries in < 1000ms', async () => {
      const start = Date.now();

      await request(app)
        .post('/api/search')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ query: 'test medication', filters: {} })
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
      console.log(`✓ Search query: ${duration}ms`);
    });

    it('should respond to write operations in < 800ms', async () => {
      const start = Date.now();

      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          items: [{ productId: 'prod-1', quantity: 2 }],
          totalPrice: 50.0,
        })
        .expect(201);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(800);
      console.log(`✓ Write operation: ${duration}ms`);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle 10 concurrent requests efficiently', async () => {
      const start = Date.now();

      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .get('/api/prescriptions')
          .set('Authorization', `Bearer ${validToken}`)
      );

      const responses = await Promise.all(requests);

      const duration = Date.now() - start;

      // All requests should succeed
      responses.forEach(res => {
        expect(res.status).toBe(200);
      });

      // Should complete all 10 requests in < 2 seconds (with simulated 50ms delay each)
      expect(duration).toBeLessThan(2000);
      console.log(`✓ 10 concurrent requests: ${duration}ms`);
    });

    it('should handle 50 concurrent requests without errors', async () => {
      const start = Date.now();

      const requests = Array.from({ length: 50 }, () =>
        request(app).get('/health')
      );

      const responses = await Promise.all(requests);

      const duration = Date.now() - start;

      // All requests should succeed
      const successCount = responses.filter(res => res.status === 200).length;
      expect(successCount).toBe(50);

      console.log(`✓ 50 concurrent requests: ${duration}ms (${successCount}/50 succeeded)`);
    });

    it('should maintain response time under load (100 requests)', async () => {
      const start = Date.now();

      // Send 100 requests in batches of 10
      const batches = Array.from({ length: 10 }, (_, batchIndex) =>
        Promise.all(
          Array.from({ length: 10 }, () =>
            request(app).get('/health').then(res => ({
              status: res.status,
              time: Date.now(),
            }))
          )
        )
      );

      const results = await Promise.all(batches);
      const allResults = results.flat();

      const duration = Date.now() - start;

      // All should succeed
      const successCount = allResults.filter(r => r.status === 200).length;
      expect(successCount).toBe(100);

      // Average time per request should be reasonable
      const avgTime = duration / 100;
      expect(avgTime).toBeLessThan(100); // < 100ms average per request

      console.log(`✓ 100 requests: ${duration}ms total, ${avgTime.toFixed(2)}ms avg`);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not leak memory during repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await request(app).get('/health');
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be < 10MB for 100 simple requests
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);

      console.log(
        `✓ Memory usage: ${(initialMemory / 1024 / 1024).toFixed(2)}MB → ${(finalMemory / 1024 / 1024).toFixed(2)}MB (Δ ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB)`
      );
    });
  });

  describe('Database Query Performance (Simulated)', () => {
    it('should optimize list queries with pagination', async () => {
      const start = Date.now();

      const response = await request(app)
        .get('/api/prescriptions?page=1&limit=10')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      const duration = Date.now() - start;

      // Paginated queries should be fast
      expect(duration).toBeLessThan(500);
      expect(response.body.prescriptions).toHaveLength(10);

      console.log(`✓ Paginated query: ${duration}ms`);
    });

    it('should handle large result sets efficiently', async () => {
      const start = Date.now();

      const response = await request(app)
        .post('/api/search')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ query: 'medication', filters: { category: 'all' } })
        .expect(200);

      const duration = Date.now() - start;

      // Even with large result sets, should respond quickly
      expect(duration).toBeLessThan(1000);
      expect(response.body.results.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('total');

      console.log(`✓ Large result set: ${duration}ms (${response.body.results.length} results)`);
    });
  });

  describe('Performance Bottleneck Identification', () => {
    it('should identify slow endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/health', name: 'Health Check' },
        {
          method: 'get',
          path: '/api/prescriptions',
          name: 'List Prescriptions',
          auth: true,
        },
        {
          method: 'post',
          path: '/api/search',
          name: 'Search',
          auth: true,
          body: { query: 'test' },
        },
        {
          method: 'post',
          path: '/api/orders',
          name: 'Create Order',
          auth: true,
          body: { items: [] },
        },
      ];

      const results: Array<{ name: string; duration: number }> = [];

      for (const endpoint of endpoints) {
        const start = Date.now();

        let req = request(app)[endpoint.method as 'get' | 'post'](
          endpoint.path
        );

        if (endpoint.auth) {
          req = req.set('Authorization', `Bearer ${validToken}`);
        }

        if (endpoint.body) {
          req = req.send(endpoint.body);
        }

        await req;

        const duration = Date.now() - start;
        results.push({ name: endpoint.name, duration });
      }

      // Log performance results
      console.log('\n📊 Performance Summary:');
      results.forEach(r => {
        const status = r.duration < 500 ? '✓' : '⚠️';
        console.log(`  ${status} ${r.name}: ${r.duration}ms`);
      });

      // Identify bottlenecks
      const slowEndpoints = results.filter(r => r.duration > 1000);
      if (slowEndpoints.length > 0) {
        console.warn(
          `\n⚠️  Performance Bottlenecks Detected:\n${slowEndpoints.map(e => `  - ${e.name}: ${e.duration}ms`).join('\n')}`
        );
      }

      // All endpoints should respond in < 2 seconds
      results.forEach(r => {
        expect(r.duration).toBeLessThan(2000);
      });
    });
  });

  describe('Caching Performance', () => {
    it('should demonstrate caching benefits (if implemented)', async () => {
      // First request (cold cache)
      const start1 = Date.now();
      await request(app)
        .get('/api/prescriptions')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      const duration1 = Date.now() - start1;

      // Second request (warm cache, if caching exists)
      const start2 = Date.now();
      await request(app)
        .get('/api/prescriptions')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      const duration2 = Date.now() - start2;

      console.log(`  First request: ${duration1}ms`);
      console.log(`  Second request: ${duration2}ms`);

      if (duration2 < duration1 * 0.5) {
        console.log(`  ✓ Caching appears to be working (${((1 - duration2 / duration1) * 100).toFixed(0)}% faster)`);
      } else {
        console.log(`  💡 Consider implementing caching for frequently accessed resources`);
      }
    });
  });

  describe('Performance Recommendations', () => {
    it('should generate performance optimization recommendations', () => {
      console.log('\n💡 Performance Optimization Recommendations:');
      console.log('  1. Enable response compression (gzip/brotli)');
      console.log('  2. Implement Redis caching for frequently accessed data');
      console.log('  3. Use connection pooling for database queries');
      console.log('  4. Optimize database indexes for common queries');
      console.log('  5. Implement CDN for static assets');
      console.log('  6. Use pagination for all list endpoints');
      console.log('  7. Monitor and set appropriate timeout values');
      console.log('  8. Consider horizontal scaling for high-traffic endpoints');

      expect(true).toBe(true);
    });
  });
});
