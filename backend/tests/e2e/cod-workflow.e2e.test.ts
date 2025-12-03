/**
 * E2E Tests for COD Workflow
 * Tests complete COD workflow from order to settlement
 */

import request from 'supertest';
import { app } from '../../services/payment-service/src/index';
import { AppDataSource } from '../../services/payment-service/src/config/database';
import { User, UserRole } from '../../shared/models/User';
import { Order, OrderStatus } from '../../shared/models/Order';
import { Pharmacy } from '../../shared/models/Pharmacy';
import { CODTransaction } from '../../shared/models/CODTransaction';
import { DriverSettlement } from '../../shared/models/DriverSettlement';
import { CODService } from '../../services/payment-service/src/services/cod/CODService';

describe('COD Workflow E2E Tests', () => {
  let codService: CODService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    codService = new CODService(AppDataSource);
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  beforeEach(async () => {
    const codRepo = AppDataSource.getRepository(CODTransaction);
    const settlementRepo = AppDataSource.getRepository(DriverSettlement);
    const userRepo = AppDataSource.getRepository(User);
    const orderRepo = AppDataSource.getRepository(Order);
    const pharmacyRepo = AppDataSource.getRepository(Pharmacy);

    await codRepo.clear();
    await settlementRepo.clear();
    await userRepo.clear();
    await orderRepo.clear();
    await pharmacyRepo.clear();
  });

  const encryptField = (value: string): Buffer => Buffer.from(value, 'utf8');

  describe('Complete COD Workflow', () => {
    test('full workflow: order creation → payment collection → driver settlement → approval', async () => {
      // Step 1: Setup - Create pharmacy, patient, and driver
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

      const driver = await AppDataSource.getRepository(User).save({
        id: 'driver-001',
        email: 'driver@test.com',
        password_hash: 'test-hash',
        first_name_encrypted: encryptField('Test'),
        last_name_encrypted: encryptField('Driver'),
        role: UserRole.DELIVERY,
        email_verified: true,
      });

      // Step 2: Create order
      const order = await AppDataSource.getRepository(Order).save({
        id: 'order-001',
        pharmacy_id: pharmacy.id,
        user_id: patient.id,
        status: OrderStatus.CONFIRMED,
        items: [
          {
            product_id: 'prod-001',
            product_name: 'Medicine A',
            quantity: 2,
            unit_price: 50,
            total_price: 100,
          },
        ],
        subtotal: 100,
        shipping_cost: 10,
        total_amount: 110,
        payment_status: 'pending' as any,
      });

      // Step 3: Mark order as COD
      const codResponse = await request(app)
        .post(`/api/v1/orders/${order.id}/cod`)
        .send({ amount: 110 })
        .expect(200);

      expect(codResponse.body.message).toContain('Order marked as COD successfully');

      // Step 4: Create COD transaction (driver accepts delivery)
      const transaction = await codService.createCODTransaction({
        order_id: order.id,
        delivery_id: 'delivery-001',
        driver_id: driver.id,
        amount: 110,
      });

      expect(transaction).toBeDefined();
      expect(transaction.amount).toBe(110);

      // Step 5: Check COD status
      const statusResponse = await request(app)
        .get(`/api/v1/orders/${order.id}/cod/status`)
        .expect(200);

      expect(statusResponse.body.status).toBe('pending');
      expect(statusResponse.body.details.amount).toBe(110);

      // Step 6: Collect payment (driver collects cash from customer)
      const collectResponse = await request(app)
        .post('/api/v1/deliveries/delivery-001/collect-payment')
        .send({
          transaction_id: transaction.id,
          collected_amount: 120, // Customer paid with 120 CHF
          payment_method: 'cash',
          change_given: 10,
          notes: 'Customer paid CHF 120, gave CHF 10 change',
        })
        .expect(200);

      expect(collectResponse.body.message).toContain('Payment collected successfully');
      expect(collectResponse.body.transaction.collected_amount).toBe(120);

      // Step 7: Check updated COD status
      const updatedStatusResponse = await request(app)
        .get(`/api/v1/orders/${order.id}/cod/status`)
        .expect(200);

      expect(updatedStatusResponse.body.status).toBe('collected');
      expect(updatedStatusResponse.body.details.collected_amount).toBe(120);

      // Step 8: Check driver's COD balance
      const balanceResponse = await request(app)
        .get(`/api/v1/drivers/${driver.id}/cod-balance`)
        .expect(200);

      expect(balanceResponse.body.collected_count).toBe(1);
      expect(balanceResponse.body.total_collected).toBe(120);
      expect(balanceResponse.body.total_unsettled).toBe(120);

      // Step 9: Create driver settlement (end of day)
      const settlementResponse = await request(app)
        .post(`/api/v1/drivers/${driver.id}/settlement`)
        .send({
          settlement_date: new Date().toISOString().split('T')[0],
          total_settled: 110, // Driver hands over only expected amount (kept change)
          driver_notes: 'End of day settlement',
        })
        .expect(201);

      expect(settlementResponse.body.message).toContain('Settlement created successfully');
      expect(settlementResponse.body.settlement.total_expected).toBe(110);
      expect(settlementResponse.body.settlement.total_settled).toBe(110);
      expect(settlementResponse.body.settlement.variance).toBe(0);

      const settlementId = settlementResponse.body.settlement.id;

      // Step 10: Manager approves settlement
      const approvalResponse = await request(app)
        .put(`/api/v1/settlements/${settlementId}/approve`)
        .send({
          approved_by: 'manager-001',
          manager_notes: 'Settlement approved',
        })
        .expect(200);

      expect(approvalResponse.body.message).toContain('Settlement approved successfully');
      expect(approvalResponse.body.settlement.status).toBe('approved');

      // Step 11: Verify final state - driver balance should be zero
      const finalBalanceResponse = await request(app)
        .get(`/api/v1/drivers/${driver.id}/cod-balance`)
        .expect(200);

      expect(finalBalanceResponse.body.collected_count).toBe(0); // All settled
      expect(finalBalanceResponse.body.total_unsettled).toBe(0);
    });

    test('workflow with deficit: driver settles less than expected', async () => {
      // Setup
      const driver = await AppDataSource.getRepository(User).save({
        id: 'driver-001',
        email: 'driver@test.com',
        password_hash: 'test-hash',
        first_name_encrypted: encryptField('Test'),
        last_name_encrypted: encryptField('Driver'),
        role: UserRole.DELIVERY,
        email_verified: true,
      });

      // Create and collect transaction
      const transaction = await codService.createCODTransaction({
        order_id: 'order-001',
        delivery_id: 'delivery-001',
        driver_id: driver.id,
        amount: 100,
      });

      await codService.collectPayment(transaction.id, {
        collected_amount: 100,
        payment_method: 'cash',
      });

      // Driver settles less (95 CHF - 5 CHF deficit)
      const settlementResponse = await request(app)
        .post(`/api/v1/drivers/${driver.id}/settlement`)
        .send({
          settlement_date: new Date().toISOString().split('T')[0],
          total_settled: 95,
          driver_notes: 'Lost 5 CHF during shift',
        })
        .expect(201);

      expect(settlementResponse.body.settlement.variance).toBe(-5);
      expect(settlementResponse.body.settlement.total_expected).toBe(100);
      expect(settlementResponse.body.settlement.total_settled).toBe(95);
    });

    test('daily report shows aggregated COD metrics', async () => {
      // Create driver
      const driver = await AppDataSource.getRepository(User).save({
        id: 'driver-001',
        email: 'driver@test.com',
        password_hash: 'test-hash',
        first_name_encrypted: encryptField('Test'),
        last_name_encrypted: encryptField('Driver'),
        role: UserRole.DELIVERY,
        email_verified: true,
      });

      // Create multiple transactions
      const transaction1 = await codService.createCODTransaction({
        order_id: 'order-001',
        delivery_id: 'delivery-001',
        driver_id: driver.id,
        amount: 100,
      });

      await codService.collectPayment(transaction1.id, {
        collected_amount: 100,
        payment_method: 'cash',
      });

      const transaction2 = await codService.createCODTransaction({
        order_id: 'order-002',
        delivery_id: 'delivery-002',
        driver_id: driver.id,
        amount: 50,
      });

      await codService.collectPayment(transaction2.id, {
        collected_amount: 50,
        payment_method: 'card',
      });

      // Get daily report
      const reportResponse = await request(app)
        .get('/api/v1/reports/cod/daily')
        .query({ date: new Date().toISOString().split('T')[0] })
        .expect(200);

      expect(reportResponse.body.total_transactions).toBe(2);
      expect(reportResponse.body.total_expected).toBe(150);
      expect(reportResponse.body.total_collected).toBe(150);
      expect(reportResponse.body.cash_collected).toBe(100);
      expect(reportResponse.body.card_collected).toBe(50);
    });
  });
});
