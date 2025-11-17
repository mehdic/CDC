import { test, expect } from '../fixtures/auth.fixture';
import { InventoryPage } from '../page-objects';

test.describe('Inventory Management', () => {
  test('should display inventory list', async ({ pharmacistPage }) => {
    const inventoryPage = new InventoryPage(pharmacistPage);
    await inventoryPage.goto();

    await inventoryPage.expectPageLoaded();
    await expect(inventoryPage.inventoryList).toBeVisible();
  });

  test('should scan QR code to add stock', async ({ pharmacistPage }) => {
    const inventoryPage = new InventoryPage(pharmacistPage);
    await inventoryPage.goto();

    await inventoryPage.scanQRCode('QR_MOCK_12345');
  });

  test('should add new inventory item manually', async ({ pharmacistPage }) => {
    const inventoryPage = new InventoryPage(pharmacistPage);
    await inventoryPage.goto();

    await inventoryPage.addInventoryItem({
      name: 'Aspirine 100mg',
      sku: 'SKU12345',
      quantity: 50,
      price: 7.5,
      category: 'Analgésiques',
      expiryDate: '2026-12-31',
    });
  });

  test('should update stock level for existing item', async ({ pharmacistPage }) => {
    const inventoryPage = new InventoryPage(pharmacistPage);
    await inventoryPage.goto();

    await inventoryPage.updateStockLevel('item_001', 75);
  });

  test('should search inventory items', async ({ pharmacistPage }) => {
    const inventoryPage = new InventoryPage(pharmacistPage);
    await inventoryPage.goto();

    await inventoryPage.searchInventory('Paracétamol');
    await expect(inventoryPage.inventoryList).toBeVisible();
  });

  test('should filter inventory by category', async ({ pharmacistPage }) => {
    const inventoryPage = new InventoryPage(pharmacistPage);
    await inventoryPage.goto();

    await inventoryPage.filterByCategory('Analgésiques');
    await expect(inventoryPage.inventoryList).toBeVisible();
  });

  test('should view low stock items and receive alerts', async ({ pharmacistPage }) => {
    const inventoryPage = new InventoryPage(pharmacistPage);
    await inventoryPage.goto();

    await inventoryPage.expectLowStockAlert();
    await inventoryPage.viewLowStockItems();
  });

  test('should view expiring items and receive alerts', async ({ pharmacistPage }) => {
    const inventoryPage = new InventoryPage(pharmacistPage);
    await inventoryPage.goto();

    await inventoryPage.expectExpiryAlert();
    await inventoryPage.viewExpiringItems();
  });

  test('should view AI-powered reorder suggestions', async ({ pharmacistPage }) => {
    const inventoryPage = new InventoryPage(pharmacistPage);
    await inventoryPage.goto();

    await inventoryPage.viewReorderSuggestions();
  });

  test('should generate stock report', async ({ pharmacistPage }) => {
    const inventoryPage = new InventoryPage(pharmacistPage);
    await inventoryPage.goto();

    await inventoryPage.generateInventoryReport('stock');
  });

  test('should generate expiry report', async ({ pharmacistPage }) => {
    const inventoryPage = new InventoryPage(pharmacistPage);
    await inventoryPage.goto();

    await inventoryPage.generateInventoryReport('expiry');
  });

  test('should generate sales analytics report', async ({ pharmacistPage }) => {
    const inventoryPage = new InventoryPage(pharmacistPage);
    await inventoryPage.goto();

    await inventoryPage.generateInventoryReport('sales');
  });
});
