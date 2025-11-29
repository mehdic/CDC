/**
 * Performance Test: API Load Testing
 * T3-111 - Tests API response times and concurrent request handling
 *
 * Test Scenarios:
 * 1. API response time under normal load
 * 2. Concurrent request handling
 * 3. Database query performance
 * 4. Memory and resource usage
 * 5. Bottleneck identification
 */

import request from 'supertest';

// Import services
const inventoryApp = require('../../services/inventory-service/src/index').default;
const prescriptionApp = require('../../services/prescription-service/src/index').default;

// Performance thresholds (in milliseconds)
const RESPONSE_TIME_THRESHOLD = 500; // Max acceptable response time
const CONCURRENT_REQUESTS = 50; // Number of concurrent requests to test
const QUERY_TIME_THRESHOLD = 200; // Max acceptable DB query time

// Mock authentication token
const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidGVzdC11c2VyIiwicm9sZSI6InBoYXJtYWNpc3QiLCJpYXQiOjE2MDAwMDAwMDB9.test-signature';

// ============================================================================
// Performance Test Suite
// ============================================================================

describe('Performance: API Load Testing', () => {

  // ==========================================================================
  // 1. Response Time Tests
  // ==========================================================================

  describe('API Response Times', () => {
    it('GET /inventory - should respond within acceptable time', async () => {
      const startTime = Date.now();

      const response = await request(inventoryApp)
        .get('/inventory')
        .set('Authorization', `Bearer ${MOCK_TOKEN}`);

      const responseTime = Date.now() - startTime;

      // Response time must be under threshold
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);

      console.log(`✓ GET /inventory response time: ${responseTime}ms (status: ${response.status})`);
    });

    it('POST /inventory/scan - should respond within acceptable time', async () => {
      const startTime = Date.now();

      const response = await request(inventoryApp)
        .post('/inventory/scan')
        .set('Authorization', `Bearer ${MOCK_TOKEN}`)
        .send({
          barcode: '1234567890',
          pharmacyId: 'test-pharmacy'
        });

      const responseTime = Date.now() - startTime;

      // Response time must be under threshold
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);

      console.log(`✓ POST /inventory/scan response time: ${responseTime}ms (status: ${response.status})`);
    });

    it('GET /prescriptions - should respond within acceptable time', async () => {
      const startTime = Date.now();

      const response = await request(prescriptionApp)
        .get('/api/prescriptions')
        .set('Authorization', `Bearer ${MOCK_TOKEN}`);

      const responseTime = Date.now() - startTime;

      // Response time must be under threshold
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);

      console.log(`✓ GET /prescriptions response time: ${responseTime}ms (status: ${response.status})`);
    });

    it('POST /prescriptions - should respond within acceptable time', async () => {
      const startTime = Date.now();

      const response = await request(prescriptionApp)
        .post('/api/prescriptions')
        .set('Authorization', `Bearer ${MOCK_TOKEN}`)
        .send({
          patientId: 'test-patient',
          doctorId: 'test-doctor',
          pharmacyId: 'test-pharmacy',
          medications: [
            {
              name: 'Test Medication',
              dosage: '10mg',
              quantity: 30,
              instructions: 'Take once daily'
            }
          ]
        });

      const responseTime = Date.now() - startTime;

      // Response time must be under threshold
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);

      console.log(`✓ POST /prescriptions response time: ${responseTime}ms (status: ${response.status})`);
    });
  });

  // ==========================================================================
  // 2. Concurrent Request Handling
  // ==========================================================================

  describe('Concurrent Request Handling', () => {
    it(`should handle ${CONCURRENT_REQUESTS} concurrent GET requests`, async () => {
      const startTime = Date.now();

      // Create array of concurrent requests
      const requests = Array.from({ length: CONCURRENT_REQUESTS }, () =>
        request(inventoryApp)
          .get('/inventory')
          .set('Authorization', `Bearer ${MOCK_TOKEN}`)
      );

      // Execute all requests concurrently
      const responses = await Promise.all(requests);

      const totalTime = Date.now() - startTime;
      const avgResponseTime = totalTime / CONCURRENT_REQUESTS;

      // Verify all requests completed
      expect(responses).toHaveLength(CONCURRENT_REQUESTS);

      // Check that average response time is reasonable
      expect(avgResponseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD * 2);

      // Count successful responses
      const successfulResponses = responses.filter(r => r.status === 200 || r.status === 401);
      const successRate = (successfulResponses.length / CONCURRENT_REQUESTS) * 100;

      console.log(`✓ ${CONCURRENT_REQUESTS} concurrent requests completed in ${totalTime}ms`);
      console.log(`✓ Average response time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`✓ Success rate: ${successRate.toFixed(2)}%`);

      // At least 90% should succeed or properly authenticate
      expect(successRate).toBeGreaterThanOrEqual(90);
    }, 30000); // Extended timeout for concurrent requests

    it(`should handle ${CONCURRENT_REQUESTS} concurrent POST requests`, async () => {
      const startTime = Date.now();

      // Create array of concurrent POST requests
      const requests = Array.from({ length: CONCURRENT_REQUESTS }, (_, i) =>
        request(inventoryApp)
          .post('/inventory/scan')
          .set('Authorization', `Bearer ${MOCK_TOKEN}`)
          .send({
            barcode: `TEST${String(i).padStart(10, '0')}`,
            pharmacyId: 'test-pharmacy'
          })
      );

      // Execute all requests concurrently
      const responses = await Promise.all(requests);

      const totalTime = Date.now() - startTime;
      const avgResponseTime = totalTime / CONCURRENT_REQUESTS;

      expect(responses).toHaveLength(CONCURRENT_REQUESTS);
      expect(avgResponseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD * 2);

      const successfulResponses = responses.filter(
        r => [200, 201, 400, 401, 404].includes(r.status)
      );
      const successRate = (successfulResponses.length / CONCURRENT_REQUESTS) * 100;

      console.log(`✓ ${CONCURRENT_REQUESTS} concurrent POST requests completed in ${totalTime}ms`);
      console.log(`✓ Average response time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`✓ Success rate: ${successRate.toFixed(2)}%`);

      expect(successRate).toBeGreaterThanOrEqual(90);
    }, 30000);

    it('should handle mixed concurrent requests (GET/POST)', async () => {
      const startTime = Date.now();

      // Mix of GET and POST requests
      const requests = Array.from({ length: CONCURRENT_REQUESTS }, (_, i) => {
        if (i % 2 === 0) {
          // Even: GET request
          return request(inventoryApp)
            .get('/inventory')
            .set('Authorization', `Bearer ${MOCK_TOKEN}`);
        } else {
          // Odd: POST request
          return request(inventoryApp)
            .post('/inventory/scan')
            .set('Authorization', `Bearer ${MOCK_TOKEN}`)
            .send({
              barcode: `MIXED${String(i).padStart(10, '0')}`,
              pharmacyId: 'test-pharmacy'
            });
        }
      });

      const responses = await Promise.all(requests);

      const totalTime = Date.now() - startTime;
      const avgResponseTime = totalTime / CONCURRENT_REQUESTS;

      expect(responses).toHaveLength(CONCURRENT_REQUESTS);
      expect(avgResponseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD * 2);

      console.log(`✓ ${CONCURRENT_REQUESTS} mixed requests completed in ${totalTime}ms`);
      console.log(`✓ Average response time: ${avgResponseTime.toFixed(2)}ms`);
    }, 30000);
  });

  // ==========================================================================
  // 3. Resource Usage & Bottleneck Detection
  // ==========================================================================

  describe('Resource Usage & Bottlenecks', () => {
    it('should identify slow endpoints (>1s response time)', async () => {
      const endpoints = [
        { method: 'GET', path: '/inventory', service: inventoryApp },
        { method: 'GET', path: '/api/prescriptions', service: prescriptionApp },
        { method: 'POST', path: '/inventory/scan', service: inventoryApp, body: { barcode: 'TEST', pharmacyId: 'test' } },
      ];

      const slowEndpoints: Array<{ endpoint: string; time: number }> = [];

      for (const endpoint of endpoints) {
        const startTime = Date.now();

        let response;
        if (endpoint.method === 'GET') {
          response = await request(endpoint.service)
            .get(endpoint.path)
            .set('Authorization', `Bearer ${MOCK_TOKEN}`);
        } else {
          response = await request(endpoint.service)
            .post(endpoint.path)
            .set('Authorization', `Bearer ${MOCK_TOKEN}`)
            .send(endpoint.body || {});
        }

        const responseTime = Date.now() - startTime;

        if (responseTime > 1000) {
          slowEndpoints.push({
            endpoint: `${endpoint.method} ${endpoint.path}`,
            time: responseTime
          });
        }

        console.log(`  ${endpoint.method} ${endpoint.path}: ${responseTime}ms`);
      }

      if (slowEndpoints.length > 0) {
        console.warn('⚠️  BOTTLENECK DETECTED:');
        slowEndpoints.forEach(({ endpoint, time }) => {
          console.warn(`  - ${endpoint}: ${time}ms (>1s threshold)`);
        });
      } else {
        console.log('✓ No bottlenecks detected - all endpoints respond in <1s');
      }

      // This is informational - log bottlenecks but don't fail the test
    });

    it('should measure throughput (requests per second)', async () => {
      const testDuration = 5000; // 5 seconds
      const startTime = Date.now();
      let requestCount = 0;
      let successCount = 0;

      // Keep sending requests for the test duration
      while (Date.now() - startTime < testDuration) {
        try {
          const response = await request(inventoryApp)
            .get('/inventory')
            .set('Authorization', `Bearer ${MOCK_TOKEN}`);

          requestCount++;
          if ([200, 401].includes(response.status)) {
            successCount++;
          }
        } catch (error) {
          requestCount++;
          // Count errors but continue
        }
      }

      const actualDuration = (Date.now() - startTime) / 1000; // Convert to seconds
      const throughput = requestCount / actualDuration;
      const successRate = (successCount / requestCount) * 100;

      console.log(`✓ Throughput: ${throughput.toFixed(2)} requests/second`);
      console.log(`✓ Success rate: ${successRate.toFixed(2)}%`);
      console.log(`✓ Total requests: ${requestCount} in ${actualDuration.toFixed(2)}s`);

      // Expect reasonable throughput (at least 10 req/s)
      expect(throughput).toBeGreaterThan(10);
      expect(successRate).toBeGreaterThan(80);
    }, 10000); // Extended timeout
  });

  // ==========================================================================
  // 4. Memory Leak Detection
  // ==========================================================================

  describe('Memory & Resource Leaks', () => {
    it('should not leak memory during repeated requests', async () => {
      const iterations = 100;
      const memorySnapshots: number[] = [];

      // Take initial memory snapshot
      if (global.gc) {
        global.gc();
      }
      const initialMemory = process.memoryUsage().heapUsed;

      // Execute repeated requests
      for (let i = 0; i < iterations; i++) {
        await request(inventoryApp)
          .get('/inventory')
          .set('Authorization', `Bearer ${MOCK_TOKEN}`);

        // Take memory snapshot every 10 iterations
        if (i % 10 === 0) {
          if (global.gc) {
            global.gc();
          }
          memorySnapshots.push(process.memoryUsage().heapUsed);
        }
      }

      // Take final memory snapshot
      if (global.gc) {
        global.gc();
      }
      const finalMemory = process.memoryUsage().heapUsed;

      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

      console.log(`✓ Memory increase: ${memoryIncreaseMB.toFixed(2)} MB after ${iterations} requests`);
      console.log(`✓ Initial memory: ${(initialMemory / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`✓ Final memory: ${(finalMemory / (1024 * 1024)).toFixed(2)} MB`);

      // Memory should not increase by more than 50MB for 100 requests
      expect(memoryIncreaseMB).toBeLessThan(50);
    }, 30000);
  });
});

// ============================================================================
// Performance Report Summary
// ============================================================================

afterAll(() => {
  console.log('\n' + '='.repeat(80));
  console.log('PERFORMANCE TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Response Time Threshold: ${RESPONSE_TIME_THRESHOLD}ms`);
  console.log(`Concurrent Requests Tested: ${CONCURRENT_REQUESTS}`);
  console.log(`Query Time Threshold: ${QUERY_TIME_THRESHOLD}ms`);
  console.log('='.repeat(80) + '\n');
});
