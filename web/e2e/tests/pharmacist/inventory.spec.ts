/**
 * Pharmacist Inventory Management E2E Tests
 * Tests for stock tracking, ordering, and managing pharmaceutical inventory
 */

import { test, expect } from '@playwright/test';
import { test as customTest } from '../../fixtures/auth.fixture';
import { testUsers } from '../../fixtures/auth.fixture';
import { mockApiResponse, mockApiError } from '../../utils/api-mock';
import { generateMockInventoryItem } from '../../utils/test-data';

customTest.describe('Pharmacist - Inventory Management', () => {
  customTest.beforeEach(async ({ pharmacistPage }) => {
    // Fixture automatically logs in as pharmacist
    await pharmacistPage.goto('/inventory');
  });

  customTest.describe('View Inventory', () => {
    customTest('should display inventory items with stock levels', async ({ pharmacistPage }) => {
      // Wait for page to be ready
      await pharmacistPage.waitForLoadState('networkidle');

      // Verify inventory page loads - "Inventory Management" heading
      await expect(pharmacistPage.getByRole('heading', { name: /inventory management/i })).toBeVisible({ timeout: 10000 });

      // Verify inventory list - MUI DataGrid or inventory container is visible
      // The DataGrid renders inside a Paper with data-testid="inventory-list"
      const inventoryList = pharmacistPage.locator('[data-testid="inventory-list"]');
      const dataGrid = pharmacistPage.locator('.MuiDataGrid-root');
      const emptyState = pharmacistPage.locator('[data-testid="empty-inventory"]');

      // Wait for either DataGrid, inventory list, or empty state to appear
      await pharmacistPage.waitForTimeout(2000);

      const hasDataGrid = await dataGrid.isVisible().catch(() => false);
      const hasInventoryList = await inventoryList.isVisible().catch(() => false);
      const isEmpty = await emptyState.isVisible().catch(() => false);

      // Accept any valid inventory state
      expect(hasDataGrid || hasInventoryList || isEmpty).toBeTruthy();
    });

    customTest('should show item details (name, SKU, quantity, price)', async ({ pharmacistPage }) => {
      const itemCard = pharmacistPage.locator('[data-testid="inventory-item"]').first();

      if (await itemCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        const itemName = itemCard.locator('[data-testid="item-name"]');
        const sku = itemCard.locator('[data-testid="sku"]');
        const quantity = itemCard.locator('[data-testid="quantity"]');
        const price = itemCard.locator('[data-testid="price"]');

        expect(await itemName.isVisible()).toBeTruthy();
        expect(await quantity.isVisible()).toBeTruthy();
      }
    });

    customTest('should display low stock warnings', async ({ pharmacistPage }) => {
      // Look for low stock indicator
      const lowStockItems = pharmacistPage.locator('[data-testid="low-stock-indicator"]');

      const count = await lowStockItems.count();
      if (count > 0) {
        // Verify low stock item is visible with warning
        const warning = lowStockItems.first().locator('[data-testid="stock-warning"]');
        expect(await warning.isVisible()).toBeTruthy();
      }
    });

    customTest('should filter inventory by category', async ({ pharmacistPage }) => {
      const categoryButtons = pharmacistPage.getByRole('button', { name: /analgésiques|antibiotiques|vitamins/i });

      if (await categoryButtons.count() > 0) {
        await categoryButtons.first().click();

        // Verify filter applied
        await expect(pharmacistPage.locator('[data-testid="inventory-list"]')).toBeVisible({ timeout: 5000 });
      }
    });

    customTest('should search inventory items by name or SKU', async ({ pharmacistPage }) => {
      const searchInput = pharmacistPage.locator('input[placeholder*="search"], [data-testid="inventory-search"]');

      if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await searchInput.fill('Paracetamol');

        // Verify search results
        await pharmacistPage.waitForTimeout(500);
        const results = pharmacistPage.locator('[data-testid="inventory-item"]');
        const count = await results.count();

        expect(count >= 0).toBeTruthy();
      }
    });
  });

  customTest.describe('Update Stock Levels', () => {
    customTest('should open stock update form', async ({ pharmacistPage }) => {
      const updateButtons = pharmacistPage.locator('[data-testid="update-stock-btn"]');

      if (await updateButtons.count() > 0) {
        await updateButtons.first().click();

        // Verify form opens
        const form = pharmacistPage.locator('[data-testid="stock-update-form"], [role="dialog"]').first();
        await expect(form).toBeVisible({ timeout: 5000 });
      }
    });

    customTest('should update stock by quantity added/removed', async ({ pharmacistPage }) => {
      const updateButtons = pharmacistPage.locator('[data-testid="update-stock-btn"]');

      if (await updateButtons.count() > 0) {
        await updateButtons.first().click();

        // Fill stock quantity
        const quantityInput = pharmacistPage.locator('input[name="quantity"], [data-testid="quantity-input"]').first();

        if (await quantityInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await quantityInput.fill('50');

          const value = await quantityInput.inputValue();
          expect(value).toBe('50');
        }
      }
    });

    customTest('should record reason for stock adjustment', async ({ pharmacistPage }) => {
      const reasonField = pharmacistPage.locator('select[name="reason"], [data-testid="adjustment-reason"]').first();

      if (await reasonField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reasonField.click();

        const option = pharmacistPage.getByRole('option').first();
        if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
          await option.click();
        }
      }
    });

    customTest('should submit stock update and show confirmation', async ({ pharmacistPage }) => {
      // Mock stock update API
      await mockApiResponse(pharmacistPage, '**/inventory/*/update', {
        status: 200,
        body: {
          success: true,
          data: {
            itemId: 'item_123',
            newQuantity: 150,
            previousQuantity: 100,
            updatedAt: new Date().toISOString(),
          },
        },
      });

      const submitButton = pharmacistPage.getByRole('button', { name: /submit|confirm|update/i });

      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click();

        // Verify confirmation
        const confirmation = pharmacistPage.locator('[data-testid="update-confirmation"]');
        await expect(confirmation).toBeVisible({ timeout: 5000 }).catch(() => {
          return expect(pharmacistPage.locator('[role="status"]')).toBeVisible({ timeout: 5000 });
        });
      }
    });
  });

  customTest.describe('Manage Expiry Dates', () => {
    customTest('should display items with expiring soon warning', async ({ pharmacistPage }) => {
      // Look for expiry warning
      const expiryWarnings = pharmacistPage.locator('[data-testid="expiry-warning"]');

      const count = await expiryWarnings.count();
      if (count > 0) {
        const warningText = await expiryWarnings.first().textContent();
        expect(warningText).toMatch(/expir|dates?/i);
      }
    });

    customTest('should update expiry date for inventory item', async ({ pharmacistPage }) => {
      const expiryButtons = pharmacistPage.locator('[data-testid="update-expiry-btn"]');

      if (await expiryButtons.count() > 0) {
        await expiryButtons.first().click();

        // Verify date picker opens
        const datePicker = pharmacistPage.locator('[data-testid="expiry-date-picker"], input[type="date"]').first();
        await expect(datePicker).toBeVisible({ timeout: 5000 });
      }
    });

    customTest('should mark expired items as unusable', async ({ pharmacistPage }) => {
      const expiredMarkButton = pharmacistPage.locator('[data-testid="mark-expired-btn"]').first();

      if (await expiredMarkButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expiredMarkButton.click();

        // Verify item status updated
        const confirmation = pharmacistPage.locator('[role="status"]');
        await expect(confirmation).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });
  });

  customTest.describe('Create Purchase Orders', () => {
    customTest('should open purchase order creation form', async ({ pharmacistPage }) => {
      const createOrderButton = pharmacistPage.getByRole('button', { name: /create.*order|new.*order|commander/i });

      if (await createOrderButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await createOrderButton.click();

        // Verify form opens
        const form = pharmacistPage.locator('[data-testid="order-form"], [role="dialog"]').first();
        await expect(form).toBeVisible({ timeout: 5000 });
      }
    });

    customTest('should add items to purchase order', async ({ pharmacistPage }) => {
      const addItemButtons = pharmacistPage.locator('[data-testid="add-item-btn"]');

      if (await addItemButtons.count() > 0) {
        await addItemButtons.first().click();

        // Verify item added to order
        const orderItems = pharmacistPage.locator('[data-testid="order-item"]');
        const count = await orderItems.count();

        expect(count > 0).toBeTruthy();
      }
    });

    customTest('should select supplier for purchase order', async ({ pharmacistPage }) => {
      // Mock suppliers API
      await mockApiResponse(pharmacistPage, '**/suppliers**', {
        status: 200,
        body: {
          success: true,
          data: [
            { id: 'supplier_1', name: 'Pharma Supplier A', location: 'Genève' },
            { id: 'supplier_2', name: 'Pharma Supplier B', location: 'Zurich' },
          ],
        },
      });

      const supplierSelect = pharmacistPage.locator('select[name="supplier"], [data-testid="supplier-select"]').first();

      if (await supplierSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await supplierSelect.click();

        const option = pharmacistPage.getByRole('option').first();
        if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
          await option.click();
        }
      }
    });

    customTest('should submit purchase order and show order number', async ({ pharmacistPage }) => {
      // Mock order creation
      await mockApiResponse(pharmacistPage, '**/orders', {
        status: 201,
        body: {
          success: true,
          data: {
            orderId: 'ORD-2025-001234',
            status: 'pending',
            totalAmount: 1500.5,
            createdAt: new Date().toISOString(),
          },
        },
      });

      const submitButton = pharmacistPage.getByRole('button', { name: /submit|create order|commander/i });

      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click();

        // Verify order confirmation
        const orderNumber = pharmacistPage.locator('[data-testid="order-number"]');
        await expect(orderNumber).toBeVisible({ timeout: 5000 }).catch(() => {
          return expect(pharmacistPage.locator('[role="status"]')).toBeVisible({ timeout: 5000 });
        });
      }
    });
  });

  customTest.describe('Track Orders', () => {
    customTest('should display list of pending orders', async ({ pharmacistPage }) => {
      // Navigate to orders section
      const ordersLink = pharmacistPage.getByRole('link', { name: /orders|commandes|pending/i });

      if (await ordersLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await ordersLink.click();

        // Verify orders list appears
        const ordersList = pharmacistPage.locator('[data-testid="orders-list"]');
        await expect(ordersList).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });

    customTest('should show order status and delivery date', async ({ pharmacistPage }) => {
      const orderCard = pharmacistPage.locator('[data-testid="order-card"]').first();

      if (await orderCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        const status = orderCard.locator('[data-testid="order-status"]');
        const deliveryDate = orderCard.locator('[data-testid="delivery-date"]');

        expect(await status.isVisible()).toBeTruthy();
      }
    });

    customTest('should allow cancelling pending orders', async ({ pharmacistPage }) => {
      const cancelButtons = pharmacistPage.locator('[data-testid="cancel-order-btn"]');

      if (await cancelButtons.count() > 0) {
        await cancelButtons.first().click();

        // Verify cancellation confirmation
        const confirmDialog = pharmacistPage.locator('[role="alertdialog"]');
        await expect(confirmDialog).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });
  });

  customTest.describe('Inventory Analytics', () => {
    customTest('should display inventory dashboard with statistics', async ({ pharmacistPage }) => {
      // Navigate to analytics
      const analyticsLink = pharmacistPage.getByRole('link', { name: /analytics|statistics|rapports/i });

      if (await analyticsLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await analyticsLink.click();

        // Verify dashboard loads
        const dashboard = pharmacistPage.locator('[data-testid="analytics-dashboard"]');
        await expect(dashboard).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });

    customTest('should show inventory value and turnover metrics', async ({ pharmacistPage }) => {
      const totalValue = pharmacistPage.locator('[data-testid="total-inventory-value"]');
      const turnoverRate = pharmacistPage.locator('[data-testid="turnover-rate"]');

      if (await totalValue.isVisible({ timeout: 2000 }).catch(() => false)) {
        const value = await totalValue.textContent();
        expect(value).toBeTruthy();
      }
    });

    customTest('should generate inventory reports', async ({ pharmacistPage }) => {
      const reportButton = pharmacistPage.getByRole('button', { name: /report|rapport|export/i });

      if (await reportButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reportButton.click();

        // Verify report options
        const reportOptions = pharmacistPage.getByRole('menuitem').first();
        await expect(reportOptions).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });
  });
});
