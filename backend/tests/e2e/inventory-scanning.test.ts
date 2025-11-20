/**
 * E2E Test: Inventory QR Scanning Workflow
 * Tests the complete QR scanning flow from scan to stock update
 */

import request from 'supertest';
import { DataSource } from 'typeorm';
import { InventoryItem } from '../../shared/models/InventoryItem';
import { InventoryTransaction } from '../../shared/models/InventoryTransaction';
import { InventoryAlert } from '../../shared/models/InventoryAlert';

// Import app but don't start the server
const app = require('../../services/inventory-service/src/index').default;

describe.skip('E2E: Inventory QR Scanning Workflow (SKIPPED - requires running service)', () => {
  let testPharmacyId: string;
  let testUserId: string;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Setup test data
    testPharmacyId = 'test-pharmacy-uuid';
    testUserId = 'test-pharmacist-uuid';

    // Initialize in-memory SQLite database for E2E tests
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [InventoryItem, InventoryTransaction, InventoryAlert],
      synchronize: true,
      dropSchema: true,
      logging: false,
    });

    await dataSource.initialize();

    // Override the AppDataSource in the app
    const inventoryModule = require('../../services/inventory-service/src/index');
    inventoryModule.AppDataSource = dataSource;
  });

  afterAll(async () => {
    // Cleanup and close connections
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('POST /inventory/scan - Receive stock', () => {
    it('should scan QR code and add new item to inventory', async () => {
      const scanRequest = {
        qr_code: '(01)08901234567890(17)250630(10)ABC123(21)XYZ789',
        transaction_type: 'receive',
        quantity: 100,
        pharmacy_id: testPharmacyId,
        user_id: testUserId,
        batch_number: 'ABC123',
        supplier_name: 'Test Supplier',
        cost_per_unit: 5.50,
      };

      const response = await request(app)
        .post('/inventory/scan')
        .send(scanRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.inventory_item.gtin).toBe('08901234567890');
      expect(response.body.inventory_item.quantity).toBe(100);
      expect(response.body.inventory_item.batch_number).toBe('ABC123');
      expect(response.body.transaction.type).toBe('receive');
      expect(response.body.transaction.quantity_change).toBe(100);
    });

    it('should update existing item quantity when scanning same GTIN', async () => {
      // First scan (creates item)
      const firstScan = {
        qr_code: '(01)08901234567891(17)250630',
        transaction_type: 'receive',
        quantity: 50,
        pharmacy_id: testPharmacyId,
        user_id: testUserId,
      };

      await request(app)
        .post('/inventory/scan')
        .send(firstScan)
        .expect(200);

      // Second scan (updates item)
      const secondScan = {
        qr_code: '(01)08901234567891(17)250630',
        transaction_type: 'receive',
        quantity: 30,
        pharmacy_id: testPharmacyId,
        user_id: testUserId,
      };

      const response = await request(app)
        .post('/inventory/scan')
        .send(secondScan)
        .expect(200);

      expect(response.body.inventory_item.quantity).toBe(80); // 50 + 30
    });
  });

  describe('POST /inventory/scan - Dispense stock', () => {
    it('should scan QR code and decrement inventory', async () => {
      // First, receive stock
      const receiveScan = {
        qr_code: '(01)08901234567892(17)250630',
        transaction_type: 'receive',
        quantity: 100,
        pharmacy_id: testPharmacyId,
        user_id: testUserId,
      };

      await request(app)
        .post('/inventory/scan')
        .send(receiveScan)
        .expect(200);

      // Then, dispense
      const dispenseScan = {
        qr_code: '(01)08901234567892(17)250630',
        transaction_type: 'dispense',
        quantity: 10,
        pharmacy_id: testPharmacyId,
        user_id: testUserId,
        prescription_id: 'test-prescription-uuid',
      };

      const response = await request(app)
        .post('/inventory/scan')
        .send(dispenseScan)
        .expect(200);

      expect(response.body.inventory_item.quantity).toBe(90); // 100 - 10
      expect(response.body.transaction.quantity_change).toBe(-10);
    });

    it('should return error when dispensing more than available stock', async () => {
      const dispenseScan = {
        qr_code: '(01)08901234567892(17)250630',
        transaction_type: 'dispense',
        quantity: 200, // More than available (90)
        pharmacy_id: testPharmacyId,
        user_id: testUserId,
      };

      const response = await request(app)
        .post('/inventory/scan')
        .send(dispenseScan)
        .expect(400);

      expect(response.body.error).toBe('Insufficient stock');
    });
  });

  describe('POST /inventory/scan - Alert generation', () => {
    it('should generate low stock alert when quantity falls below threshold', async () => {
      // Create item with reorder threshold
      const receiveScan = {
        qr_code: '(01)08901234567893(17)250630',
        transaction_type: 'receive',
        quantity: 50,
        pharmacy_id: testPharmacyId,
        user_id: testUserId,
      };

      await request(app)
        .post('/inventory/scan')
        .send(receiveScan);

      // TODO: Set reorder_threshold to 40 via PUT /inventory/items/:id

      // Dispense to trigger low stock alert
      const dispenseScan = {
        qr_code: '(01)08901234567893(17)250630',
        transaction_type: 'dispense',
        quantity: 20,
        pharmacy_id: testPharmacyId,
        user_id: testUserId,
      };

      await request(app)
        .post('/inventory/scan')
        .send(dispenseScan);

      // Check alerts were generated
      const alertsResponse = await request(app)
        .get('/inventory/alerts')
        .query({ pharmacy_id: testPharmacyId, status: 'active' })
        .expect(200);

      const lowStockAlerts = alertsResponse.body.alerts.filter(
        (alert: any) => alert.alert_type === 'low_stock'
      );

      expect(lowStockAlerts.length).toBeGreaterThan(0);
    });
  });

  describe('POST /inventory/scan - Invalid QR codes', () => {
    it('should return error for QR code without GTIN', async () => {
      const scanRequest = {
        qr_code: '(17)250630(10)ABC123', // Missing (01) GTIN
        transaction_type: 'receive',
        quantity: 10,
        pharmacy_id: testPharmacyId,
        user_id: testUserId,
      };

      const response = await request(app)
        .post('/inventory/scan')
        .send(scanRequest)
        .expect(400);

      expect(response.body.error).toBe('Invalid QR code format');
    });
  });
});
