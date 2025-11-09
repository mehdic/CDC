import { test, expect } from '../fixtures/auth.fixture';
import { InventoryPage } from '../page-objects';
import { mockApiResponse, mockInventoryList } from '../utils/api-mock';
import { generateMockInventoryItem, generateMockInventoryItems } from '../utils/test-data';

test.describe('Inventory Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock inventory list
    const items = generateMockInventoryItems(10);
    await mockInventoryList(page, items);
  });

  test('should display inventory list', async ({ pharmacistPage }) => {
    const inventoryPage = new InventoryPage(pharmacistPage);
    await inventoryPage.goto();

    await inventoryPage.expectPageLoaded();
    await expect(inventoryPage.inventoryList).toBeVisible();
  });

  test('should scan QR code to add stock', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/inventory/scan', {
      status: 200,
      body: {
        success: true,
        item: generateMockInventoryItem(),
        stockUpdated: true,
      },
    });

    const inventoryPage = new InventoryPage(pharmacistPage);
    await inventoryPage.goto();

    await inventoryPage.scanQRCode('QR_MOCK_12345');
  });

  test('should add new inventory item manually', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/inventory/add', {
      status: 200,
      body: { success: true, itemId: 'item_new_001' },
    });

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
    const item = generateMockInventoryItem({ id: 'item_001' });

    await mockApiResponse(pharmacistPage, '**/inventory/item_001', {
      status: 200,
      body: { success: true, item },
    });

    await mockApiResponse(pharmacistPage, '**/inventory/item_001/update', {
      status: 200,
      body: { success: true },
    });

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
    await mockApiResponse(pharmacistPage, '**/inventory/low-stock', {
      status: 200,
      body: {
        success: true,
        items: generateMockInventoryItems(3).map((item) => ({
          ...item,
          quantity: 5,
          minQuantity: 10,
        })),
      },
    });

    const inventoryPage = new InventoryPage(pharmacistPage);
    await inventoryPage.goto();

    await inventoryPage.expectLowStockAlert();
    await inventoryPage.viewLowStockItems();
  });

  test('should view expiring items and receive alerts', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/inventory/expiring', {
      status: 200,
      body: {
        success: true,
        items: generateMockInventoryItems(2).map((item) => ({
          ...item,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })),
      },
    });

    const inventoryPage = new InventoryPage(pharmacistPage);
    await inventoryPage.goto();

    await inventoryPage.expectExpiryAlert();
    await inventoryPage.viewExpiringItems();
  });

  test('should view AI-powered reorder suggestions', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/inventory/reorder-suggestions', {
      status: 200,
      body: {
        success: true,
        suggestions: [
          {
            itemId: 'item_001',
            name: 'Paracétamol 500mg',
            suggestedQuantity: 100,
            reason: 'Based on sales trends and current stock',
          },
        ],
      },
    });

    const inventoryPage = new InventoryPage(pharmacistPage);
    await inventoryPage.goto();

    await inventoryPage.viewReorderSuggestions();
  });

  test('should generate stock report', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/inventory/reports/stock', {
      status: 200,
      body: {
        success: true,
        report: {
          totalItems: 150,
          totalValue: 25000,
          lowStockCount: 5,
        },
      },
    });

    const inventoryPage = new InventoryPage(pharmacistPage);
    await inventoryPage.goto();

    await inventoryPage.generateInventoryReport('stock');
  });

  test('should generate expiry report', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/inventory/reports/expiry', {
      status: 200,
      body: {
        success: true,
        report: {
          expiringThisMonth: 10,
          expiringNextMonth: 15,
          expired: 2,
        },
      },
    });

    const inventoryPage = new InventoryPage(pharmacistPage);
    await inventoryPage.goto();

    await inventoryPage.generateInventoryReport('expiry');
  });

  test('should generate sales analytics report', async ({ pharmacistPage }) => {
    await mockApiResponse(pharmacistPage, '**/inventory/reports/sales', {
      status: 200,
      body: {
        success: true,
        report: {
          topSellingItems: generateMockInventoryItems(5),
          totalRevenue: 50000,
        },
      },
    });

    const inventoryPage = new InventoryPage(pharmacistPage);
    await inventoryPage.goto();

    await inventoryPage.generateInventoryReport('sales');
  });
});
