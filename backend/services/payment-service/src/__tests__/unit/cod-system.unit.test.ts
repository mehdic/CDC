/**
 * Unit Tests for COD System
 * Tests COD Service and Settlement Service business logic
 */

import { DataSource } from 'typeorm';
import { CODService } from '../../services/cod/CODService';
import { SettlementService } from '../../services/cod/SettlementService';
import { CODTransaction, CODStatus, CODPaymentMethod } from '../../../../../shared/models/CODTransaction';
import { DriverSettlement, SettlementStatus } from '../../../../../shared/models/DriverSettlement';
import { User, UserRole } from '../../../../../shared/models/User';
import { Order, OrderStatus } from '../../../../../shared/models/Order';
import { Pharmacy } from '../../../../../shared/models/Pharmacy';

describe('COD System Unit Tests', () => {
  let dataSource: DataSource;
  let codService: CODService;
  let settlementService: SettlementService;

  // Initialize in-memory database before all tests
  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [CODTransaction, DriverSettlement, User, Order, Pharmacy],
      synchronize: true,
      logging: false,
    });

    await dataSource.initialize();

    codService = new CODService(dataSource);
    settlementService = new SettlementService(dataSource);
  });

  // Close database after all tests
  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  // Clear tables before each test
  beforeEach(async () => {
    const codRepo = dataSource.getRepository(CODTransaction);
    const settlementRepo = dataSource.getRepository(DriverSettlement);
    const userRepo = dataSource.getRepository(User);
    const orderRepo = dataSource.getRepository(Order);
    const pharmacyRepo = dataSource.getRepository(Pharmacy);

    await codRepo.clear();
    await settlementRepo.clear();
    await userRepo.clear();
    await orderRepo.clear();
    await pharmacyRepo.clear();
  });

  // Helper function to create encrypted buffer
  const encryptField = (value: string): Buffer => Buffer.from(value, 'utf8');

  // Helper function to create test pharmacy
  const createTestPharmacy = async (): Promise<Pharmacy> => {
    const pharmacyRepo = dataSource.getRepository(Pharmacy);
    const pharmacy = pharmacyRepo.create({
      id: 'pharmacy-001',
      name: 'Test Pharmacy',
      license_number: 'LIC-12345',
      email: 'pharmacy@test.com',
      phone: '+41791234567',
      address_encrypted: encryptField('123 Pharmacy St'),
      city: 'Lausanne',
      canton: 'VD',
      postal_code: '1000',
    });
    await pharmacyRepo.save(pharmacy);
    return pharmacy;
  };

  // Helper function to create test driver
  const createTestDriver = async (): Promise<User> => {
    const userRepo = dataSource.getRepository(User);
    const driver = userRepo.create({
      id: 'driver-001',
      email: 'driver@test.com',
      password_hash: 'test-hash',
      first_name_encrypted: encryptField('Test'),
      last_name_encrypted: encryptField('Driver'),
      phone_encrypted: encryptField('+41797654321'),
      role: UserRole.DELIVERY,
      email_verified: true,
    });
    await userRepo.save(driver);
    return driver;
  };

  // Helper function to create test patient
  const createTestPatient = async (): Promise<User> => {
    const userRepo = dataSource.getRepository(User);
    const patient = userRepo.create({
      id: 'patient-001',
      email: 'patient@test.com',
      password_hash: 'test-hash',
      first_name_encrypted: encryptField('Test'),
      last_name_encrypted: encryptField('Patient'),
      phone_encrypted: encryptField('+41791234567'),
      role: UserRole.PATIENT,
      email_verified: true,
    });
    await userRepo.save(patient);
    return patient;
  };

  // Helper function to create test order
  const createTestOrder = async (pharmacy: Pharmacy, patient: User): Promise<Order> => {
    const orderRepo = dataSource.getRepository(Order);
    const order = orderRepo.create({
      id: 'order-001',
      pharmacy_id: pharmacy.id,
      user_id: patient.id,
      status: OrderStatus.CONFIRMED,
      items: [
        {
          product_id: 'prod-001',
          product_name: 'Test Product',
          quantity: 1,
          unit_price: 50,
          total_price: 50,
        },
      ],
      subtotal: 50,
      shipping_cost: 10,
      total_amount: 60,
      payment_status: 'pending' as any,
    });
    await orderRepo.save(order);
    return order;
  };

  describe('COD Service', () => {
    describe('createCODTransaction', () => {
      test('creates COD transaction with valid amount', async () => {
        const driver = await createTestDriver();

        const transaction = await codService.createCODTransaction({
          order_id: 'order-001',
          delivery_id: 'delivery-001',
          driver_id: driver.id,
          amount: 100,
        });

        expect(transaction).toBeDefined();
        expect(transaction.id).toBeDefined();
        expect(transaction.amount).toBe(100);
        expect(transaction.status).toBe(CODStatus.PENDING);
        expect(transaction.driver_id).toBe(driver.id);
      });

      test('throws error when amount exceeds maximum limit (CHF 500)', async () => {
        const driver = await createTestDriver();

        await expect(
          codService.createCODTransaction({
            order_id: 'order-001',
            delivery_id: 'delivery-001',
            driver_id: driver.id,
            amount: 501,
          })
        ).rejects.toThrow('COD amount exceeds maximum limit');
      });

      test('throws error when amount is zero or negative', async () => {
        const driver = await createTestDriver();

        await expect(
          codService.createCODTransaction({
            order_id: 'order-001',
            delivery_id: 'delivery-001',
            driver_id: driver.id,
            amount: 0,
          })
        ).rejects.toThrow('COD amount must be greater than 0');
      });

      test('throws error when COD transaction already exists for order', async () => {
        const driver = await createTestDriver();

        await codService.createCODTransaction({
          order_id: 'order-001',
          delivery_id: 'delivery-001',
          driver_id: driver.id,
          amount: 100,
        });

        await expect(
          codService.createCODTransaction({
            order_id: 'order-001',
            delivery_id: 'delivery-002',
            driver_id: driver.id,
            amount: 100,
          })
        ).rejects.toThrow('COD transaction already exists for this order');
      });
    });

    describe('collectPayment', () => {
      test('collects payment with exact amount (cash)', async () => {
        const driver = await createTestDriver();

        const transaction = await codService.createCODTransaction({
          order_id: 'order-001',
          delivery_id: 'delivery-001',
          driver_id: driver.id,
          amount: 100,
        });

        const collected = await codService.collectPayment(transaction.id, {
          collected_amount: 100,
          payment_method: CODPaymentMethod.CASH,
          change_given: 0,
          notes: 'Exact change',
        });

        expect(collected.status).toBe(CODStatus.COLLECTED);
        expect(collected.collected_amount).toBe(100);
        expect(collected.payment_method).toBe(CODPaymentMethod.CASH);
        expect(collected.change_given).toBe(0);
        expect(collected.collected_at).toBeDefined();
      });

      test('collects payment with change (cash)', async () => {
        const driver = await createTestDriver();

        const transaction = await codService.createCODTransaction({
          order_id: 'order-001',
          delivery_id: 'delivery-001',
          driver_id: driver.id,
          amount: 100,
        });

        const collected = await codService.collectPayment(transaction.id, {
          collected_amount: 120,
          payment_method: CODPaymentMethod.CASH,
          change_given: 20,
          notes: 'Customer paid CHF 120',
        });

        expect(collected.collected_amount).toBe(120);
        expect(collected.change_given).toBe(20);
      });

      test('collects payment via card terminal', async () => {
        const driver = await createTestDriver();

        const transaction = await codService.createCODTransaction({
          order_id: 'order-001',
          delivery_id: 'delivery-001',
          driver_id: driver.id,
          amount: 100,
        });

        const collected = await codService.collectPayment(transaction.id, {
          collected_amount: 100,
          payment_method: CODPaymentMethod.CARD,
        });

        expect(collected.payment_method).toBe(CODPaymentMethod.CARD);
        expect(collected.change_given).toBe(0);
      });

      test('throws error when collecting less than expected amount', async () => {
        const driver = await createTestDriver();

        const transaction = await codService.createCODTransaction({
          order_id: 'order-001',
          delivery_id: 'delivery-001',
          driver_id: driver.id,
          amount: 100,
        });

        await expect(
          codService.collectPayment(transaction.id, {
            collected_amount: 90,
            payment_method: CODPaymentMethod.CASH,
          })
        ).rejects.toThrow('Collected amount is less than expected amount');
      });

      test('throws error when transaction not found', async () => {
        await expect(
          codService.collectPayment('non-existent-id', {
            collected_amount: 100,
            payment_method: CODPaymentMethod.CASH,
          })
        ).rejects.toThrow('COD transaction not found');
      });

      test('throws error when transaction not in pending status', async () => {
        const driver = await createTestDriver();

        const transaction = await codService.createCODTransaction({
          order_id: 'order-001',
          delivery_id: 'delivery-001',
          driver_id: driver.id,
          amount: 100,
        });

        await codService.collectPayment(transaction.id, {
          collected_amount: 100,
          payment_method: CODPaymentMethod.CASH,
        });

        await expect(
          codService.collectPayment(transaction.id, {
            collected_amount: 100,
            payment_method: CODPaymentMethod.CASH,
          })
        ).rejects.toThrow('Cannot collect payment for transaction with status');
      });
    });

    describe('getDriverCODBalance', () => {
      test('returns correct balance with pending and collected transactions', async () => {
        const driver = await createTestDriver();

        // Create pending transaction
        await codService.createCODTransaction({
          order_id: 'order-001',
          delivery_id: 'delivery-001',
          driver_id: driver.id,
          amount: 100,
        });

        // Create and collect transaction
        const transaction2 = await codService.createCODTransaction({
          order_id: 'order-002',
          delivery_id: 'delivery-002',
          driver_id: driver.id,
          amount: 50,
        });

        await codService.collectPayment(transaction2.id, {
          collected_amount: 50,
          payment_method: CODPaymentMethod.CASH,
        });

        const balance = await codService.getDriverCODBalance(driver.id);

        expect(balance.pending_count).toBe(1);
        expect(balance.collected_count).toBe(1);
        expect(balance.total_pending).toBe(100);
        expect(balance.total_collected).toBe(50);
        expect(balance.total_unsettled).toBe(50);
      });

      test('returns zero balance for driver with no transactions', async () => {
        const driver = await createTestDriver();

        const balance = await codService.getDriverCODBalance(driver.id);

        expect(balance.pending_count).toBe(0);
        expect(balance.collected_count).toBe(0);
        expect(balance.total_pending).toBe(0);
        expect(balance.total_collected).toBe(0);
      });
    });
  });

  describe('Settlement Service', () => {
    describe('createSettlement', () => {
      test('creates settlement with collected transactions', async () => {
        const driver = await createTestDriver();

        // Create and collect transactions
        const transaction1 = await codService.createCODTransaction({
          order_id: 'order-001',
          delivery_id: 'delivery-001',
          driver_id: driver.id,
          amount: 100,
        });

        await codService.collectPayment(transaction1.id, {
          collected_amount: 100,
          payment_method: CODPaymentMethod.CASH,
        });

        const transaction2 = await codService.createCODTransaction({
          order_id: 'order-002',
          delivery_id: 'delivery-002',
          driver_id: driver.id,
          amount: 50,
        });

        await codService.collectPayment(transaction2.id, {
          collected_amount: 50,
          payment_method: CODPaymentMethod.CARD,
        });

        // Create settlement
        const settlement = await settlementService.createSettlement({
          driver_id: driver.id,
          settlement_date: new Date(),
          total_settled: 150,
          driver_notes: 'All transactions collected',
        });

        expect(settlement).toBeDefined();
        expect(settlement.id).toBeDefined();
        expect(settlement.total_expected).toBe(150);
        expect(settlement.total_collected).toBe(150);
        expect(settlement.total_settled).toBe(150);
        expect(settlement.variance).toBe(0);
        expect(settlement.transaction_count).toBe(2);
        expect(settlement.status).toBe(SettlementStatus.PENDING);
      });

      test('calculates variance when settled amount differs', async () => {
        const driver = await createTestDriver();

        const transaction = await codService.createCODTransaction({
          order_id: 'order-001',
          delivery_id: 'delivery-001',
          driver_id: driver.id,
          amount: 100,
        });

        await codService.collectPayment(transaction.id, {
          collected_amount: 100,
          payment_method: CODPaymentMethod.CASH,
        });

        // Driver settles 95 (5 CHF deficit)
        const settlement = await settlementService.createSettlement({
          driver_id: driver.id,
          settlement_date: new Date(),
          total_settled: 95,
          driver_notes: 'Lost 5 CHF',
        });

        expect(settlement.variance).toBe(-5);
      });

      test('throws error when no collected transactions found', async () => {
        const driver = await createTestDriver();

        await expect(
          settlementService.createSettlement({
            driver_id: driver.id,
            settlement_date: new Date(),
            total_settled: 0,
          })
        ).rejects.toThrow('No collected transactions found for this driver on this date');
      });

      test('throws error when settlement already exists for date', async () => {
        const driver = await createTestDriver();

        const transaction = await codService.createCODTransaction({
          order_id: 'order-001',
          delivery_id: 'delivery-001',
          driver_id: driver.id,
          amount: 100,
        });

        await codService.collectPayment(transaction.id, {
          collected_amount: 100,
          payment_method: CODPaymentMethod.CASH,
        });

        const settlementDate = new Date();

        await settlementService.createSettlement({
          driver_id: driver.id,
          settlement_date: settlementDate,
          total_settled: 100,
        });

        await expect(
          settlementService.createSettlement({
            driver_id: driver.id,
            settlement_date: settlementDate,
            total_settled: 100,
          })
        ).rejects.toThrow('Settlement already exists for this driver and date');
      });
    });

    describe('approveSettlement', () => {
      test('approves pending settlement', async () => {
        const driver = await createTestDriver();

        const transaction = await codService.createCODTransaction({
          order_id: 'order-001',
          delivery_id: 'delivery-001',
          driver_id: driver.id,
          amount: 100,
        });

        await codService.collectPayment(transaction.id, {
          collected_amount: 100,
          payment_method: CODPaymentMethod.CASH,
        });

        const settlement = await settlementService.createSettlement({
          driver_id: driver.id,
          settlement_date: new Date(),
          total_settled: 100,
        });

        const approved = await settlementService.approveSettlement(settlement.id, {
          approved_by: 'manager-001',
          manager_notes: 'Approved',
        });

        expect(approved.status).toBe(SettlementStatus.APPROVED);
        expect(approved.approved_by).toBe('manager-001');
        expect(approved.approved_at).toBeDefined();
      });

      test('throws error when settlement not in pending status', async () => {
        const driver = await createTestDriver();

        const transaction = await codService.createCODTransaction({
          order_id: 'order-001',
          delivery_id: 'delivery-001',
          driver_id: driver.id,
          amount: 100,
        });

        await codService.collectPayment(transaction.id, {
          collected_amount: 100,
          payment_method: CODPaymentMethod.CASH,
        });

        const settlement = await settlementService.createSettlement({
          driver_id: driver.id,
          settlement_date: new Date(),
          total_settled: 100,
        });

        await settlementService.approveSettlement(settlement.id, {
          approved_by: 'manager-001',
        });

        await expect(
          settlementService.approveSettlement(settlement.id, {
            approved_by: 'manager-001',
          })
        ).rejects.toThrow('Cannot approve settlement with status');
      });
    });
  });
});
