/**
 * Contract Tests - Subscription API
 * Validates API contract compliance
 * Task T6-016 - Subscription Service Implementation
 */

import request from 'supertest';
import { app, dataSource } from '../../index';

describe('Subscription API Contract Tests', () => {
  beforeAll(async () => {
    // Initialize database if not already done
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
  });

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('POST /api/v1/patients/:id/subscriptions', () => {
    test('returns 201 with subscription object on success', async () => {
      const response = await request(app)
        .post('/api/v1/patients/patient-001/subscriptions')
        .send({
          pharmacy_id: 'pharmacy-001',
          name: 'Monthly Medication',
          frequency: 'monthly',
          items: [
            {
              product_id: 'product-001',
              quantity: 1,
              unit_price: 50.00,
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('patient_id', 'patient-001');
      expect(response.body.data).toHaveProperty('pharmacy_id', 'pharmacy-001');
      expect(response.body.data).toHaveProperty('frequency', 'monthly');
      expect(response.body.data).toHaveProperty('status', 'active');
    });

    test('returns 400 when items array is empty', async () => {
      const response = await request(app)
        .post('/api/v1/patients/patient-001/subscriptions')
        .send({
          pharmacy_id: 'pharmacy-001',
          name: 'Monthly Medication',
          frequency: 'monthly',
          items: [],
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('returns 400 when custom frequency without interval days', async () => {
      const response = await request(app)
        .post('/api/v1/patients/patient-001/subscriptions')
        .send({
          pharmacy_id: 'pharmacy-001',
          name: 'Custom Medication',
          frequency: 'custom',
          items: [
            {
              product_id: 'product-001',
              quantity: 1,
              unit_price: 50.00,
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Custom interval days required');
    });
  });

  describe('GET /api/v1/patients/:id/subscriptions', () => {
    test('returns 200 with array of subscriptions', async () => {
      const response = await request(app).get('/api/v1/patients/patient-001/subscriptions');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/subscriptions/:id', () => {
    test('returns 404 for non-existent subscription', async () => {
      const response = await request(app).get('/api/v1/subscriptions/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Subscription not found');
    });
  });

  describe('PUT /api/v1/subscriptions/:id', () => {
    test('returns 404 for non-existent subscription', async () => {
      const response = await request(app)
        .put('/api/v1/subscriptions/non-existent-id')
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/subscriptions/:id/pause', () => {
    test('returns 404 for non-existent subscription', async () => {
      const response = await request(app).post('/api/v1/subscriptions/non-existent-id/pause');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/subscriptions/:id/resume', () => {
    test('returns 404 for non-existent subscription', async () => {
      const response = await request(app).post('/api/v1/subscriptions/non-existent-id/resume');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/subscriptions/:id/skip', () => {
    test('returns 404 for non-existent subscription', async () => {
      const response = await request(app).post('/api/v1/subscriptions/non-existent-id/skip');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/subscriptions/:id/cancel', () => {
    test('returns 404 for non-existent subscription', async () => {
      const response = await request(app)
        .post('/api/v1/subscriptions/non-existent-id/cancel')
        .send({
          reason: 'No longer needed',
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/subscriptions/:id/next-delivery', () => {
    test('returns 404 for non-existent subscription', async () => {
      const response = await request(app).get(
        '/api/v1/subscriptions/non-existent-id/next-delivery'
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/v1/subscriptions/:id', () => {
    test('returns 404 for non-existent subscription', async () => {
      const response = await request(app).delete('/api/v1/subscriptions/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/v1/subscriptions/process-scheduled', () => {
    test('returns 200 with processing results', async () => {
      const response = await request(app).post('/api/v1/subscriptions/process-scheduled');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('total_processed');
      expect(response.body.data).toHaveProperty('successful');
      expect(response.body.data).toHaveProperty('failed');
      expect(response.body.data).toHaveProperty('results');
    });
  });

  describe('GET /health', () => {
    test('returns 200 with health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'subscription-service');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
