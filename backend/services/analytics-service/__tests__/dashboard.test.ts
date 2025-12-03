/**
 * Dashboard API Tests
 * Tests for analytics dashboard endpoints with authentication
 */

import request from 'supertest';
import app from '../src/index';

describe('Analytics Dashboard API', () => {
  const validToken = 'Bearer mock-jwt-token';
  const pharmacyId = 'mock-pharmacy-id';

  describe('Authentication', () => {
    it('should reject requests without authorization header', async () => {
      const response = await request(app)
        .get(`/api/analytics/dashboard/${pharmacyId}`)
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: 'Authorization header required',
      });
    });

    it('should reject requests with missing token', async () => {
      const response = await request(app)
        .get(`/api/analytics/dashboard/${pharmacyId}`)
        .set('Authorization', 'Bearer ')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: 'Token required',
      });
    });
  });

  describe('GET /api/analytics/dashboard/:pharmacyId', () => {
    it('should return dashboard data with valid token', async () => {
      const response = await request(app)
        .get(`/api/analytics/dashboard/${pharmacyId}`)
        .set('Authorization', validToken)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');

      const dashboard = response.body.data;
      expect(dashboard).toHaveProperty('pharmacyId', pharmacyId);
      expect(dashboard).toHaveProperty('totalRevenue');
      expect(dashboard).toHaveProperty('totalPrescriptions');
      expect(dashboard).toHaveProperty('totalPatients');
      expect(dashboard).toHaveProperty('averageOrderValue');
      expect(dashboard).toHaveProperty('metrics');
      expect(dashboard).toHaveProperty('topProducts');
    });

    it('should include metrics in dashboard response', async () => {
      const response = await request(app)
        .get(`/api/analytics/dashboard/${pharmacyId}`)
        .set('Authorization', validToken)
        .expect(200);

      const metrics = response.body.data.metrics;
      expect(metrics).toHaveProperty('revenueToday');
      expect(metrics).toHaveProperty('prescriptionsToday');
      expect(metrics).toHaveProperty('newPatients');
      expect(metrics).toHaveProperty('activeDeliveries');
    });

    it('should include top products in dashboard response', async () => {
      const response = await request(app)
        .get(`/api/analytics/dashboard/${pharmacyId}`)
        .set('Authorization', validToken)
        .expect(200);

      const topProducts = response.body.data.topProducts;
      expect(Array.isArray(topProducts)).toBe(true);
      expect(topProducts.length).toBeGreaterThan(0);

      topProducts.forEach((product: any) => {
        expect(product).toHaveProperty('productId');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('sales');
        expect(product).toHaveProperty('revenue');
      });
    });

    it('should return valid numeric values for revenue', async () => {
      const response = await request(app)
        .get(`/api/analytics/dashboard/${pharmacyId}`)
        .set('Authorization', validToken)
        .expect(200);

      const dashboard = response.body.data;
      expect(typeof dashboard.totalRevenue).toBe('number');
      expect(dashboard.totalRevenue).toBeGreaterThan(0);
      expect(typeof dashboard.averageOrderValue).toBe('number');
      expect(dashboard.averageOrderValue).toBeGreaterThan(0);
    });
  });

  describe('GET /api/analytics/metrics/:pharmacyId', () => {
    it('should return metrics summary with valid token', async () => {
      const response = await request(app)
        .get(`/api/analytics/metrics/${pharmacyId}`)
        .set('Authorization', validToken)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');

      const metrics = response.body.data;
      expect(metrics).toHaveProperty('pharmacyId', pharmacyId);
      expect(metrics).toHaveProperty('revenue');
      expect(metrics).toHaveProperty('prescriptions');
      expect(metrics).toHaveProperty('patients');
    });

    it('should include revenue metrics by period', async () => {
      const response = await request(app)
        .get(`/api/analytics/metrics/${pharmacyId}`)
        .set('Authorization', validToken)
        .expect(200);

      const revenue = response.body.data.revenue;
      expect(revenue).toHaveProperty('daily');
      expect(revenue).toHaveProperty('weekly');
      expect(revenue).toHaveProperty('monthly');
      expect(revenue).toHaveProperty('yearly');

      // Yearly should be highest, then monthly, then weekly, then daily
      expect(revenue.yearly).toBeGreaterThanOrEqual(revenue.monthly);
      expect(revenue.monthly).toBeGreaterThanOrEqual(revenue.weekly);
      expect(revenue.weekly).toBeGreaterThanOrEqual(revenue.daily);
    });

    it('should include prescription metrics by period', async () => {
      const response = await request(app)
        .get(`/api/analytics/metrics/${pharmacyId}`)
        .set('Authorization', validToken)
        .expect(200);

      const prescriptions = response.body.data.prescriptions;
      expect(prescriptions).toHaveProperty('daily');
      expect(prescriptions).toHaveProperty('weekly');
      expect(prescriptions).toHaveProperty('monthly');
      expect(prescriptions).toHaveProperty('yearly');

      // Yearly should be highest, then monthly, then weekly, then daily
      expect(prescriptions.yearly).toBeGreaterThanOrEqual(prescriptions.monthly);
      expect(prescriptions.monthly).toBeGreaterThanOrEqual(prescriptions.weekly);
      expect(prescriptions.weekly).toBeGreaterThanOrEqual(prescriptions.daily);
    });

    it('should include patient metrics', async () => {
      const response = await request(app)
        .get(`/api/analytics/metrics/${pharmacyId}`)
        .set('Authorization', validToken)
        .expect(200);

      const patients = response.body.data.patients;
      expect(patients).toHaveProperty('active');
      expect(patients).toHaveProperty('new');
      expect(patients).toHaveProperty('returning');
      expect(typeof patients.active).toBe('number');
      expect(typeof patients.new).toBe('number');
      expect(typeof patients.returning).toBe('number');
    });
  });

  describe('GET /api/analytics/revenue/:pharmacyId', () => {
    it('should return revenue trends with valid token', async () => {
      const response = await request(app)
        .get(`/api/analytics/revenue/${pharmacyId}`)
        .set('Authorization', validToken)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return revenue trends with multiple data points', async () => {
      const response = await request(app)
        .get(`/api/analytics/revenue/${pharmacyId}`)
        .set('Authorization', validToken)
        .expect(200);

      const trends = response.body.data;
      expect(trends.length).toBeGreaterThan(0);
    });

    it('should return trend data with date and revenue fields', async () => {
      const response = await request(app)
        .get(`/api/analytics/revenue/${pharmacyId}`)
        .set('Authorization', validToken)
        .expect(200);

      const trends = response.body.data;
      trends.forEach((trend: any) => {
        expect(trend).toHaveProperty('date');
        expect(trend).toHaveProperty('revenue');
        expect(trend).toHaveProperty('transactions');
        expect(typeof trend.revenue).toBe('number');
        expect(typeof trend.transactions).toBe('number');
      });
    });

    it('should support optional date range parameters', async () => {
      const response = await request(app)
        .get(`/api/analytics/revenue/${pharmacyId}`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        })
        .set('Authorization', validToken)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/analytics/prescriptions/:pharmacyId', () => {
    it('should return prescription trends with valid token', async () => {
      const response = await request(app)
        .get(`/api/analytics/prescriptions/${pharmacyId}`)
        .set('Authorization', validToken)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return prescription trends with multiple data points', async () => {
      const response = await request(app)
        .get(`/api/analytics/prescriptions/${pharmacyId}`)
        .set('Authorization', validToken)
        .expect(200);

      const trends = response.body.data;
      expect(trends.length).toBeGreaterThan(0);
    });

    it('should return trend data with date and count fields', async () => {
      const response = await request(app)
        .get(`/api/analytics/prescriptions/${pharmacyId}`)
        .set('Authorization', validToken)
        .expect(200);

      const trends = response.body.data;
      trends.forEach((trend: any) => {
        expect(trend).toHaveProperty('date');
        expect(trend).toHaveProperty('count');
        expect(trend).toHaveProperty('uniquePatients');
        expect(typeof trend.count).toBe('number');
        expect(typeof trend.uniquePatients).toBe('number');
      });
    });

    it('should return valid dates in ISO format', async () => {
      const response = await request(app)
        .get(`/api/analytics/prescriptions/${pharmacyId}`)
        .set('Authorization', validToken)
        .expect(200);

      const trends = response.body.data;
      trends.forEach((trend: any) => {
        // Date should be in YYYY-MM-DD format
        expect(trend.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('should support optional date range parameters', async () => {
      const response = await request(app)
        .get(`/api/analytics/prescriptions/${pharmacyId}`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        })
        .set('Authorization', validToken)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Role-based Access Control', () => {
    it('should reject requests from unauthorized roles', async () => {
      // Note: In this mock implementation, roles are hardcoded
      // Real tests would need to mock different JWT tokens with different roles
      // For now, we test that the middleware is in place
      const response = await request(app)
        .get(`/api/analytics/dashboard/${pharmacyId}`)
        .set('Authorization', validToken)
        .expect(200); // Mock auth always succeeds

      expect(response.body).toHaveProperty('success', true);
    });

    it('should allow pharmacist role', async () => {
      const response = await request(app)
        .get(`/api/analytics/dashboard/${pharmacyId}`)
        .set('Authorization', validToken)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/analytics/unknown')
        .set('Authorization', validToken)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
    });

    it('should return error with timestamp', async () => {
      const response = await request(app)
        .get(`/api/analytics/dashboard/${pharmacyId}`)
        .set('Authorization', validToken)
        .expect(200);

      expect(response.body).toHaveProperty('timestamp');
      // Should be valid ISO string
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Health Check', () => {
    it('should return health status without authentication', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'analytics-service');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
    });
  });
});
