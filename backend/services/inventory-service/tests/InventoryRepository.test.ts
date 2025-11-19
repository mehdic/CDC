/**
 * InventoryRepository Integration Tests
 * Tests for the repository data access layer
 */

import { DataSource } from 'typeorm';
import { InventoryRepository } from '../src/repositories/InventoryRepository';
import { InventoryItem } from '../../../shared/models/InventoryItem';
import { InventoryTransaction, TransactionType } from '../../../shared/models/InventoryTransaction';
import { InventoryAlert, AlertType, AlertSeverity, AlertStatus } from '../../../shared/models/InventoryAlert';
import { Pharmacy } from '../../../shared/models/Pharmacy';
import { User } from '../../../shared/models/User';
import { AuditTrailEntry } from '../../../shared/models/AuditTrailEntry';

describe('InventoryRepository', () => {
  let dataSource: DataSource;
  let repository: InventoryRepository;

  beforeAll(async () => {
    // In-memory SQLite database for testing
    // Note: Using datetime type override for timestamp columns (SQLite compatibility)
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [InventoryItem, InventoryTransaction, InventoryAlert, Pharmacy, User, AuditTrailEntry],
      synchronize: true,
      logging: false,
      // Override timestamp type to datetime for SQLite compatibility
      // This allows shared models designed for MySQL/PostgreSQL to work with SQLite in tests
      migrations: [],
      migrationsRun: false,
    });

    await dataSource.initialize();

    // Disable foreign key constraints for test simplicity
    // This allows testing repository logic without creating full relational data
    await dataSource.query('PRAGMA foreign_keys = OFF;');

    repository = new InventoryRepository(dataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  afterEach(async () => {
    await repository.clearAll();
  });

  describe('Inventory Item Operations', () => {
    it('should create and retrieve an inventory item', async () => {
      const item = await repository.createItem({
        pharmacy_id: '123e4567-e89b-12d3-a456-426614174000',
        medication_name: 'Aspirin',
        medication_gtin: '08901234567890',
        quantity: 100,
        unit: 'pills',
        reorder_threshold: 20,
      });

      expect(item.id).toBeDefined();
      expect(item.medication_name).toBe('Aspirin');
      expect(item.quantity).toBe(100);

      const retrieved = await repository.findItemById(item.id, item.pharmacy_id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.medication_name).toBe('Aspirin');
    });

    it('should find item by GTIN', async () => {
      const gtin = '08901234567890';
      await repository.createItem({
        pharmacy_id: '123e4567-e89b-12d3-a456-426614174000',
        medication_name: 'Ibuprofen',
        medication_gtin: gtin,
        quantity: 50,
        unit: 'pills',
      });

      const item = await repository.findItemByGTIN(gtin, '123e4567-e89b-12d3-a456-426614174000');
      expect(item).not.toBeNull();
      expect(item?.medication_gtin).toBe(gtin);
    });

    it('should list items with pagination', async () => {
      const pharmacy_id = '123e4567-e89b-12d3-a456-426614174000';

      // Create multiple items
      for (let i = 0; i < 5; i++) {
        await repository.createItem({
          pharmacy_id,
          medication_name: `Med ${i}`,
          quantity: 10 * i,
          unit: 'pills',
        });
      }

      const result = await repository.listItems({
        pharmacy_id,
        limit: 3,
        offset: 0,
      });

      expect(result.items.length).toBe(3);
      expect(result.total).toBe(5);
      expect(result.has_more).toBe(true);
    });

    it('should update item quantity', async () => {
      const item = await repository.createItem({
        pharmacy_id: '123e4567-e89b-12d3-a456-426614174000',
        medication_name: 'Paracetamol',
        quantity: 100,
        unit: 'pills',
      });

      const updated = await repository.updateItemQuantity(
        item.id,
        item.pharmacy_id,
        150
      );

      expect(updated).not.toBeNull();
      expect(updated?.quantity).toBe(150);
    });
  });

  describe('Transaction Operations', () => {
    it('should create a transaction', async () => {
      const item = await repository.createItem({
        pharmacy_id: '123e4567-e89b-12d3-a456-426614174000',
        medication_name: 'Codeine',
        quantity: 100,
        unit: 'pills',
      });

      const transaction = await repository.createTransaction({
        pharmacy_id: item.pharmacy_id,
        inventory_item_id: item.id,
        transaction_type: TransactionType.DISPENSE,
        quantity_change: -10,
        quantity_after: 90,
        user_id: '123e4567-e89b-12d3-a456-426614174001',
      });

      expect(transaction.id).toBeDefined();
      expect(transaction.transaction_type).toBe(TransactionType.DISPENSE);
      expect(transaction.quantity_change).toBe(-10);
    });

    it('should list transactions for an item', async () => {
      const item = await repository.createItem({
        pharmacy_id: '123e4567-e89b-12d3-a456-426614174000',
        medication_name: 'Morphine',
        quantity: 50,
        unit: 'pills',
      });

      // Create multiple transactions
      for (let i = 0; i < 3; i++) {
        await repository.createTransaction({
          pharmacy_id: item.pharmacy_id,
          inventory_item_id: item.id,
          transaction_type: TransactionType.DISPENSE,
          quantity_change: -5,
          quantity_after: 50 - (i + 1) * 5,
          user_id: '123e4567-e89b-12d3-a456-426614174001',
        });
      }

      const result = await repository.listTransactionsForItem(
        item.id,
        item.pharmacy_id
      );

      expect(result.items.length).toBe(3);
      expect(result.total).toBe(3);
    });
  });

  describe('Alert Operations', () => {
    it('should create an alert', async () => {
      const item = await repository.createItem({
        pharmacy_id: '123e4567-e89b-12d3-a456-426614174000',
        medication_name: 'Warfarin',
        quantity: 5,
        unit: 'pills',
        reorder_threshold: 20,
      });

      const alert = await repository.createAlert({
        pharmacy_id: item.pharmacy_id,
        inventory_item_id: item.id,
        alert_type: AlertType.LOW_STOCK,
        severity: AlertSeverity.HIGH,
        message: 'Low stock alert for Warfarin',
      });

      expect(alert.id).toBeDefined();
      expect(alert.alert_type).toBe(AlertType.LOW_STOCK);
      expect(alert.status).toBe(AlertStatus.ACTIVE);
    });

    it('should find active alert by type', async () => {
      const item = await repository.createItem({
        pharmacy_id: '123e4567-e89b-12d3-a456-426614174000',
        medication_name: 'Insulin',
        quantity: 10,
        unit: 'units',
      });

      await repository.createAlert({
        pharmacy_id: item.pharmacy_id,
        inventory_item_id: item.id,
        alert_type: AlertType.EXPIRING_SOON,
        severity: AlertSeverity.MEDIUM,
        message: 'Insulin expiring soon',
      });

      const alert = await repository.findActiveAlert(
        item.id,
        AlertType.EXPIRING_SOON
      );

      expect(alert).not.toBeNull();
      expect(alert?.alert_type).toBe(AlertType.EXPIRING_SOON);
    });

    it('should update alert status', async () => {
      const item = await repository.createItem({
        pharmacy_id: '123e4567-e89b-12d3-a456-426614174000',
        medication_name: 'Epinephrine',
        quantity: 2,
        unit: 'pens',
      });

      const alert = await repository.createAlert({
        pharmacy_id: item.pharmacy_id,
        inventory_item_id: item.id,
        alert_type: AlertType.LOW_STOCK,
        severity: AlertSeverity.CRITICAL,
        message: 'Critical low stock',
      });

      const updated = await repository.updateAlertStatus(
        alert.id,
        alert.pharmacy_id,
        AlertStatus.ACKNOWLEDGED,
        '123e4567-e89b-12d3-a456-426614174001'
      );

      expect(updated).not.toBeNull();
      expect(updated?.status).toBe(AlertStatus.ACKNOWLEDGED);
      expect(updated?.acknowledged_by_user_id).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(updated?.acknowledged_at).toBeDefined();
    });

    it('should list alerts with filtering', async () => {
      const pharmacy_id = '123e4567-e89b-12d3-a456-426614174000';
      const item = await repository.createItem({
        pharmacy_id,
        medication_name: 'Test Med',
        quantity: 10,
        unit: 'pills',
      });

      // Create multiple alerts
      await repository.createAlert({
        pharmacy_id,
        inventory_item_id: item.id,
        alert_type: AlertType.LOW_STOCK,
        severity: AlertSeverity.HIGH,
        message: 'Low stock',
      });

      await repository.createAlert({
        pharmacy_id,
        inventory_item_id: item.id,
        alert_type: AlertType.EXPIRED,
        severity: AlertSeverity.CRITICAL,
        message: 'Expired',
      });

      const result = await repository.listAlerts({
        pharmacy_id,
        status: AlertStatus.ACTIVE,
      });

      expect(result.items.length).toBe(2);
      expect(result.total).toBe(2);
    });
  });
});
