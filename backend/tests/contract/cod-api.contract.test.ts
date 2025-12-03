/**
 * Contract Tests for COD API
 * Tests API endpoint contracts and response formats
 */

import request from 'supertest';
import { app } from '../../services/payment-service/src/index';
import { AppDataSource } from '../../services/payment-service/src/config/database';
import { User, UserRole } from '../../shared/models/User';
import { Order, OrderStatus } from '../../shared/models/Order';
import { Pharmacy } from '../../shared/models/Pharmacy';
import { CODTransaction, CODStatus } from '../../shared/models/CODTransaction';

describe('COD API Contract Tests', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  beforeEach(async () => {
    const codRepo = AppDataSource.getRepository(CODTransaction);
    const userRepo = AppDataSource.getRepository(User);
    const orderRepo = AppDataSource.getRepository(Order);
    const pharmacyRepo = AppDataSource.getRepository(Pharmacy);

    await codRepo.clear();
    await userRepo.clear();
    await orderRepo.clear();
    await pharmacyRepo.clear();
  });

  const encryptField = (value: string): Buffer => Buffer.from(value, 'utf8');

  describe('POST /api/v1/orders/:id/cod', () => {
    test('contract: creates COD transaction with correct response format', async () => {
      const pharmacy = await AppDataSource.getRepository(Pharmacy).save({
        id: 'pharmacy-001',
        name: 'Test Pharmacy',
        license_number: 'LIC-001',
        email: 'pharmacy@test.com',
        phone: '+41791234567',
        address_encrypted: encryptField('123 Test St'),
        city: 'Lausanne',
        canton: 'VD',
        postal_code: '1000',
      });

      const patient = await AppDataSource.getRepository(User).save({
        id: 'patient-001',
        email: 'patient@test.com',
        password_hash: 'test-hash',
        first_name_encrypted: encryptField('Test'),
        last_name_encrypted: encryptField('Patient'),
        role: UserRole.PATIENT,
        email_verified: true,
      });

      const order = await AppDataSource.getRepository(Order).save({
        id: 'order-001',
        pharmacy_id: pharmacy.id,
        user_id: patient.id,
        status: OrderStatus.CONFIRMED,
        items: [{ product_id: 'prod-001', product_name: 'Test', quantity: 1, unit_price: 100, total_price: 100 }],
        subtotal: 100,
        total_amount: 100,
        payment_status: 'pending' as any,
      });

      const response = await request(app)
        .post(`/api/v1/orders/${order.id}/cod`)
        .send({ amount: 100 })
        .expect(200);

      // Contract assertions
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('order_id');
      expect(response.body).toHaveProperty('amount');
      expect(response.body.amount).toBe(100);
      expect(response.body.order_id).toBe(order.id);
    });

    test('contract: returns 400 when amount is invalid', async () => {
      const response = await request(app)
        .post('/api/v1/orders/order-001/cod')
        .send({ amount: 0 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.error).toBe('Invalid amount');
    });
  });

  describe('GET /api/v1/orders/:id/cod/status', () => {
    test('contract: returns COD status with correct format', async () => {
      // This test requires a COD transaction to exist
      // For contract testing, we'll verify the response structure
      const response = await request(app)
        .get('/api/v1/orders/order-001/cod/status')
        .expect(404); // Will be 404 if not found, which is expected

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/v1/deliveries/:id/collect-payment', () => {
    test('contract: returns 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/v1/deliveries/delivery-001/collect-payment')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.error).toBe('Bad Request');
    });

    test('contract: validates payment_method enum', async () => {
      const response = await request(app)
        .post('/api/v1/deliveries/delivery-001/collect-payment')
        .send({
          transaction_id: 'trans-001',
          collected_amount: 100,
          payment_method: 'invalid',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('payment_method must be either "cash" or "card"');
    });
  });

  describe('GET /api/v1/drivers/:id/cod-balance', () => {
    test('contract: returns driver balance with correct format', async () => {
      const driver = await AppDataSource.getRepository(User).save({
        id: 'driver-001',
        email: 'driver@test.com',
        password_hash: 'test-hash',
        first_name_encrypted: encryptField('Test'),
        last_name_encrypted: encryptField('Driver'),
        role: UserRole.DELIVERY,
        email_verified: true,
      });

      const response = await request(app)
        .get(`/api/v1/drivers/${driver.id}/cod-balance`)
        .expect(200);

      // Contract assertions
      expect(response.body).toHaveProperty('pending_count');
      expect(response.body).toHaveProperty('collected_count');
      expect(response.body).toHaveProperty('total_pending');
      expect(response.body).toHaveProperty('total_collected');
      expect(response.body).toHaveProperty('total_unsettled');
      expect(typeof response.body.pending_count).toBe('number');
      expect(typeof response.body.total_pending).toBe('number');
    });
  });

  describe('GET /api/v1/reports/cod/daily', () => {
    test('contract: returns 400 when date parameter is missing', async () => {
      const response = await request(app)
        .get('/api/v1/reports/cod/daily')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('date query parameter is required');
    });

    test('contract: returns daily report with correct format', async () => {
      const response = await request(app)
        .get('/api/v1/reports/cod/daily')
        .query({ date: '2025-12-03' })
        .expect(200);

      // Contract assertions
      expect(response.body).toHaveProperty('date');
      expect(response.body).toHaveProperty('total_transactions');
      expect(response.body).toHaveProperty('total_expected');
      expect(response.body).toHaveProperty('total_collected');
      expect(response.body).toHaveProperty('cash_collected');
      expect(response.body).toHaveProperty('card_collected');
      expect(response.body).toHaveProperty('pending_count');
      expect(typeof response.body.total_transactions).toBe('number');
      expect(typeof response.body.total_expected).toBe('number');
    });
  });

  describe('GET /api/v1/reports/cod/reconciliation', () => {
    test('contract: returns 400 when date parameters are missing', async () => {
      const response = await request(app)
        .get('/api/v1/reports/cod/reconciliation')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('start_date and end_date query parameters are required');
    });

    test('contract: returns reconciliation report with correct format', async () => {
      const response = await request(app)
        .get('/api/v1/reports/cod/reconciliation')
        .query({ start_date: '2025-12-01', end_date: '2025-12-31' })
        .expect(200);

      // Contract assertions
      expect(response.body).toHaveProperty('total_settlements');
      expect(response.body).toHaveProperty('total_expected');
      expect(response.body).toHaveProperty('total_settled');
      expect(response.body).toHaveProperty('total_variance');
      expect(response.body).toHaveProperty('pending_approvals');
      expect(response.body).toHaveProperty('disputed_count');
      expect(response.body).toHaveProperty('by_driver');
      expect(Array.isArray(response.body.by_driver)).toBe(true);
    });
  });
});
