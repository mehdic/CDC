/**
 * Analytics Controller Tests
 * Integration tests for analytics API endpoints
 */

import request from 'supertest';
import express, { Express } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';

describe('AnalyticsController', () => {
  let app: Express;
  let analyticsController: AnalyticsController;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    analyticsController = new AnalyticsController();

    // Setup routes
    app.get('/health', analyticsController.health);
    app.get('/api/analytics/dashboard/:pharmacyId', analyticsController.getDashboard);
    app.get('/api/analytics/metrics/:pharmacyId', analyticsController.getMetrics);
    app.get('/api/analytics/revenue/:pharmacyId', analyticsController.getRevenueTrends);
    app.get('/api/analytics/prescriptions/:pharmacyId', analyticsController.getPrescriptionTrends);
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('analytics-service');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.version).toBe('1.0.0');
    });
  });

  describe('GET /api/analytics/dashboard/:pharmacyId', () => {
    it('should return dashboard data for valid pharmacy ID', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard/pharmacy-001')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.pharmacyId).toBe('pharmacy-001');
      expect(response.body.data.metrics).toBeDefined();
      expect(response.body.data.timeSeries).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    it('should include revenue metrics', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard/pharmacy-001')
        .expect(200);

      expect(response.body.data.metrics.revenue).toBeDefined();
      expect(response.body.data.metrics.revenue.today).toBeGreaterThanOrEqual(0);
      expect(response.body.data.metrics.revenue.thisWeek).toBeGreaterThanOrEqual(0);
      expect(response.body.data.metrics.revenue.thisMonth).toBeGreaterThanOrEqual(0);
      expect(response.body.data.metrics.revenue.trend).toBeDefined();
    });

    it('should include prescription metrics', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard/pharmacy-001')
        .expect(200);

      expect(response.body.data.metrics.prescriptions).toBeDefined();
      expect(response.body.data.metrics.prescriptions.today).toBeGreaterThanOrEqual(0);
      expect(response.body.data.metrics.prescriptions.thisWeek).toBeGreaterThanOrEqual(0);
      expect(response.body.data.metrics.prescriptions.thisMonth).toBeGreaterThanOrEqual(0);
      expect(response.body.data.metrics.prescriptions.trend).toBeDefined();
    });

    it('should include inventory metrics', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard/pharmacy-001')
        .expect(200);

      expect(response.body.data.metrics.inventory).toBeDefined();
      expect(response.body.data.metrics.inventory.totalItems).toBeGreaterThanOrEqual(0);
      expect(response.body.data.metrics.inventory.lowStockItems).toBeGreaterThanOrEqual(0);
      expect(response.body.data.metrics.inventory.expiredItems).toBeGreaterThanOrEqual(0);
      expect(response.body.data.metrics.inventory.totalValue).toBeGreaterThanOrEqual(0);
    });

    it('should return 400 for missing pharmacy ID', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard/')
        .expect(404);
    });

    it('should support date range filtering', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard/pharmacy-001')
        .query({
          startDate: '2025-11-01',
          endDate: '2025-11-30',
          groupBy: 'daily',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should return error for non-existent pharmacy', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard/non-existent-pharmacy')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/analytics/metrics/:pharmacyId', () => {
    it('should return metrics summary for valid pharmacy ID', async () => {
      const response = await request(app)
        .get('/api/analytics/metrics/pharmacy-001')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.pharmacyId).toBe('pharmacy-001');
      expect(response.body.data.totalRevenue).toBeGreaterThanOrEqual(0);
      expect(response.body.data.totalPrescriptions).toBeGreaterThanOrEqual(0);
      expect(response.body.data.averageOrderValue).toBeGreaterThanOrEqual(0);
      expect(response.body.data.inventoryValue).toBeGreaterThanOrEqual(0);
      expect(response.body.data.lastUpdated).toBeDefined();
    });

    it('should return error for non-existent pharmacy', async () => {
      const response = await request(app)
        .get('/api/analytics/metrics/non-existent-pharmacy')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/analytics/revenue/:pharmacyId', () => {
    it('should return revenue trends for valid date range', async () => {
      const response = await request(app)
        .get('/api/analytics/revenue/pharmacy-001')
        .query({
          startDate: '2025-11-01',
          endDate: '2025-11-30',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify data structure
      response.body.data.forEach((item: { date: string; value: number }) => {
        expect(item.date).toBeDefined();
        expect(typeof item.value).toBe('number');
      });
    });

    it('should return 400 for missing start date', async () => {
      const response = await request(app)
        .get('/api/analytics/revenue/pharmacy-001')
        .query({
          endDate: '2025-11-30',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should return 400 for missing end date', async () => {
      const response = await request(app)
        .get('/api/analytics/revenue/pharmacy-001')
        .query({
          startDate: '2025-11-01',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should return error for non-existent pharmacy', async () => {
      const response = await request(app)
        .get('/api/analytics/revenue/non-existent-pharmacy')
        .query({
          startDate: '2025-11-01',
          endDate: '2025-11-30',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/analytics/prescriptions/:pharmacyId', () => {
    it('should return prescription trends for valid date range', async () => {
      const response = await request(app)
        .get('/api/analytics/prescriptions/pharmacy-001')
        .query({
          startDate: '2025-11-01',
          endDate: '2025-11-30',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify data structure
      response.body.data.forEach((item: { date: string; value: number }) => {
        expect(item.date).toBeDefined();
        expect(typeof item.value).toBe('number');
      });
    });

    it('should return 400 for missing start date', async () => {
      const response = await request(app)
        .get('/api/analytics/prescriptions/pharmacy-001')
        .query({
          endDate: '2025-11-30',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should return 400 for missing end date', async () => {
      const response = await request(app)
        .get('/api/analytics/prescriptions/pharmacy-001')
        .query({
          startDate: '2025-11-01',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should return error for non-existent pharmacy', async () => {
      const response = await request(app)
        .get('/api/analytics/prescriptions/non-existent-pharmacy')
        .query({
          startDate: '2025-11-01',
          endDate: '2025-11-30',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Response Format', () => {
    it('should always include timestamp in response', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard/pharmacy-001')
        .expect(200);

      expect(response.body.timestamp).toBeDefined();
      expect(new Date(response.body.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should include success flag in all responses', async () => {
      const response = await request(app)
        .get('/api/analytics/metrics/pharmacy-001')
        .expect(200);

      expect(typeof response.body.success).toBe('boolean');
    });

    it('should include error message on failure', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard/non-existent-pharmacy')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });
});
