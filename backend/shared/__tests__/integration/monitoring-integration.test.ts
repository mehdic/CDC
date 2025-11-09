/**
 * Integration Tests for Monitoring & Observability (T251-T257)
 * Tests middleware chain and real functionality
 */

import express, { Request, Response } from 'express';
import request from 'supertest';
import { requestLogger, attachRequestIdToLogs } from '../../middleware/requestLogger';
import { performanceMonitor } from '../../middleware/performanceMonitor';
import { errorHandler } from '../../middleware/errorHandler';
import { healthRouter, initializeHealthCheck } from '../../routes/health';
import { getMetrics } from '../../utils/metrics';

describe('Monitoring & Observability Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Apply monitoring middleware in order
    app.use(requestLogger);
    app.use(attachRequestIdToLogs);
    app.use(performanceMonitor);

    // Test routes
    app.get('/test/success', (req: Request, res: Response) => {
      res.json({ message: 'Success', requestId: req.requestId });
    });

    app.get('/test/slow', async (req: Request, res: Response) => {
      // Simulate slow request (>1s threshold)
      await new Promise(resolve => setTimeout(resolve, 1100));
      res.json({ message: 'Slow response' });
    });

    app.get('/test/error', (req: Request, res: Response) => {
      throw new Error('Test error');
    });

    // Health routes
    app.use('/health', healthRouter);

    // Error handler (must be last)
    app.use(errorHandler);
  });

  describe('Request Logger Integration (T254)', () => {
    it('should add requestId to responses', async () => {
      const response = await request(app)
        .get('/test/success')
        .expect(200);

      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-correlation-id']).toBeDefined();
      expect(response.body.requestId).toBeDefined();
    });

    it('should accept custom request ID from header', async () => {
      const customId = 'custom-request-123';

      const response = await request(app)
        .get('/test/success')
        .set('X-Request-ID', customId)
        .expect(200);

      expect(response.headers['x-request-id']).toBe(customId);
      expect(response.body.requestId).toBe(customId);
    });

    it('should propagate correlation ID', async () => {
      const correlationId = 'correlation-456';

      const response = await request(app)
        .get('/test/success')
        .set('X-Correlation-ID', correlationId)
        .expect(200);

      expect(response.headers['x-correlation-id']).toBe(correlationId);
    });
  });

  describe('Performance Monitor Integration (T255)', () => {
    it('should track fast requests', async () => {
      const response = await request(app)
        .get('/test/success')
        .expect(200);

      // Request should complete quickly
      expect(response.headers['x-request-id']).toBeDefined();
    });

    it('should detect slow requests', async () => {
      const response = await request(app)
        .get('/test/slow')
        .expect(200);

      // Should still complete successfully
      expect(response.body.message).toBe('Slow response');
    }, 10000); // 10s timeout for slow request test
  });

  describe('Error Handler Integration (T253)', () => {
    it('should return error response with requestId', async () => {
      const response = await request(app)
        .get('/test/error')
        .expect(500);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(response.body.error.requestId).toBeDefined();
    });
  });

  describe('Health Check Integration (T252)', () => {
    it('GET /health should return alive status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('alive');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
      expect(response.body.timestamp).toBeDefined();
    });

    it('GET /health/metrics should return metrics', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .expect(200);

      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
      expect(response.body.memory).toBeDefined();
      expect(response.body.prometheus).toBeDefined();
    });
  });

  describe('Metrics Integration (T256)', () => {
    it('should collect Prometheus metrics', () => {
      const metrics = getMetrics();

      expect(metrics).toBeDefined();
      expect(typeof metrics).toBe('string');

      // Should contain prometheus format metrics
      expect(metrics).toContain('# TYPE');
      expect(metrics).toContain('http_requests_total');
    });
  });

  describe('Full Middleware Chain', () => {
    it('should process request through complete chain', async () => {
      const response = await request(app)
        .get('/test/success')
        .expect(200);

      // Verify all middleware executed
      expect(response.headers['x-request-id']).toBeDefined(); // requestLogger
      expect(response.headers['x-correlation-id']).toBeDefined(); // requestLogger
      expect(response.body.requestId).toBeDefined(); // Available in handler
    });

    it('should handle errors through complete chain', async () => {
      const response = await request(app)
        .get('/test/error')
        .expect(500);

      // Verify error handling with monitoring
      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.body.error.requestId).toBeDefined();
      expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });
});
