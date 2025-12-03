/**
 * E2E Tests - Subscription Lifecycle
 * Tests complete user workflows from creation to cancellation
 * Task T6-016 - Subscription Service Implementation
 */

import request from 'supertest';
import { app, dataSource } from '../../index';

describe('Subscription Lifecycle E2E Tests', () => {
  let createdSubscriptionId: string;
  const patientId = 'patient-e2e-001';
  const pharmacyId = 'pharmacy-e2e-001';

  beforeAll(async () => {
    // Initialize database
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
  });

  afterAll(async () => {
    // Clean up
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('Complete Subscription Workflow', () => {
    test('Step 1: Create a monthly subscription', async () => {
      const response = await request(app)
        .post(`/api/v1/patients/${patientId}/subscriptions`)
        .send({
          pharmacy_id: pharmacyId,
          name: 'Monthly Blood Pressure Medication',
          frequency: 'monthly',
          items: [
            {
              product_id: 'product-bp-001',
              quantity: 1,
              unit_price: 45.00,
            },
            {
              product_id: 'product-bp-002',
              quantity: 2,
              unit_price: 25.00,
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('active');
      expect(response.body.data.discount_percentage).toBe(10); // 10% for monthly

      createdSubscriptionId = response.body.data.id;
    });

    test('Step 2: Get next delivery preview', async () => {
      const response = await request(app).get(
        `/api/v1/subscriptions/${createdSubscriptionId}/next-delivery`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('subscription_id', createdSubscriptionId);
      expect(response.body.data).toHaveProperty('next_delivery_date');
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data).toHaveProperty('subtotal', 95); // 45 + (25 * 2)
      expect(response.body.data).toHaveProperty('discount', 9.5); // 10% of 95
      expect(response.body.data).toHaveProperty('estimated_total', 85.5); // 95 - 9.5
    });

    test('Step 3: Skip next delivery', async () => {
      const response = await request(app).post(
        `/api/v1/subscriptions/${createdSubscriptionId}/skip`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Next delivery skipped');
    });

    test('Step 4: Pause subscription', async () => {
      const response = await request(app).post(
        `/api/v1/subscriptions/${createdSubscriptionId}/pause`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('paused');
      expect(response.body.data.paused_at).toBeDefined();
    });

    test('Step 5: Attempt to skip delivery on paused subscription (should fail)', async () => {
      const response = await request(app).post(
        `/api/v1/subscriptions/${createdSubscriptionId}/skip`
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('active subscriptions');
    });

    test('Step 6: Resume subscription', async () => {
      const response = await request(app).post(
        `/api/v1/subscriptions/${createdSubscriptionId}/resume`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
      expect(response.body.data.paused_at).toBeNull();
    });

    test('Step 7: Update subscription name', async () => {
      const response = await request(app)
        .put(`/api/v1/subscriptions/${createdSubscriptionId}`)
        .send({
          name: 'Monthly BP Medication (Updated)',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Monthly BP Medication (Updated)');
    });

    test('Step 8: Cancel subscription', async () => {
      const response = await request(app)
        .post(`/api/v1/subscriptions/${createdSubscriptionId}/cancel`)
        .send({
          reason: 'Treatment completed',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
      expect(response.body.data.cancelled_at).toBeDefined();
      expect(response.body.data.cancellation_reason).toBe('Treatment completed');
    });

    test('Step 9: Attempt to update cancelled subscription (should fail)', async () => {
      const response = await request(app)
        .put(`/api/v1/subscriptions/${createdSubscriptionId}`)
        .send({
          name: 'Should not update',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('inactive subscription');
    });

    test('Step 10: Delete cancelled subscription', async () => {
      const response = await request(app).delete(
        `/api/v1/subscriptions/${createdSubscriptionId}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    test('Step 11: Verify subscription is deleted', async () => {
      const response = await request(app).get(
        `/api/v1/subscriptions/${createdSubscriptionId}`
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Biweekly Subscription with Custom Items', () => {
    let biweeklySubId: string;

    test('Create biweekly subscription with 5% discount', async () => {
      const response = await request(app)
        .post(`/api/v1/patients/${patientId}/subscriptions`)
        .send({
          pharmacy_id: pharmacyId,
          name: 'Biweekly Vitamins',
          frequency: 'biweekly',
          items: [
            {
              product_id: 'product-vitamin-001',
              quantity: 1,
              unit_price: 30.00,
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.discount_percentage).toBe(5); // 5% for biweekly
      biweeklySubId = response.body.data.id;
    });

    test('Get delivery preview with 5% discount', async () => {
      const response = await request(app).get(
        `/api/v1/subscriptions/${biweeklySubId}/next-delivery`
      );

      expect(response.status).toBe(200);
      expect(response.body.data.subtotal).toBe(30);
      expect(response.body.data.discount).toBe(1.5); // 5% of 30
      expect(response.body.data.estimated_total).toBe(28.5);
    });

    test('Clean up biweekly subscription', async () => {
      await request(app).post(`/api/v1/subscriptions/${biweeklySubId}/cancel`);
      await request(app).delete(`/api/v1/subscriptions/${biweeklySubId}`);
    });
  });

  describe('Custom Frequency Subscription', () => {
    let customSubId: string;

    test('Create custom 21-day subscription', async () => {
      const response = await request(app)
        .post(`/api/v1/patients/${patientId}/subscriptions`)
        .send({
          pharmacy_id: pharmacyId,
          name: 'Custom 21-day Medication',
          frequency: 'custom',
          custom_interval_days: 21,
          items: [
            {
              product_id: 'product-custom-001',
              quantity: 3,
              unit_price: 20.00,
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.custom_interval_days).toBe(21);
      expect(response.body.data.discount_percentage).toBe(5); // < 28 days = 5%
      customSubId = response.body.data.id;
    });

    test('Clean up custom subscription', async () => {
      await request(app).post(`/api/v1/subscriptions/${customSubId}/cancel`);
      await request(app).delete(`/api/v1/subscriptions/${customSubId}`);
    });
  });

  describe('List Patient Subscriptions', () => {
    test('Create multiple subscriptions and list them', async () => {
      // Create 3 subscriptions
      const sub1 = await request(app)
        .post(`/api/v1/patients/${patientId}/subscriptions`)
        .send({
          pharmacy_id: pharmacyId,
          name: 'Subscription 1',
          frequency: 'monthly',
          items: [{ product_id: 'p1', quantity: 1, unit_price: 10 }],
        });

      const sub2 = await request(app)
        .post(`/api/v1/patients/${patientId}/subscriptions`)
        .send({
          pharmacy_id: pharmacyId,
          name: 'Subscription 2',
          frequency: 'weekly',
          items: [{ product_id: 'p2', quantity: 1, unit_price: 20 }],
        });

      const sub3 = await request(app)
        .post(`/api/v1/patients/${patientId}/subscriptions`)
        .send({
          pharmacy_id: pharmacyId,
          name: 'Subscription 3',
          frequency: 'biweekly',
          items: [{ product_id: 'p3', quantity: 1, unit_price: 30 }],
        });

      // List all active subscriptions
      const listResponse = await request(app).get(
        `/api/v1/patients/${patientId}/subscriptions`
      );

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data.length).toBeGreaterThanOrEqual(3);
      expect(listResponse.body.count).toBeGreaterThanOrEqual(3);

      // Clean up
      await request(app).post(`/api/v1/subscriptions/${sub1.body.data.id}/cancel`);
      await request(app).post(`/api/v1/subscriptions/${sub2.body.data.id}/cancel`);
      await request(app).post(`/api/v1/subscriptions/${sub3.body.data.id}/cancel`);
    });
  });
});
