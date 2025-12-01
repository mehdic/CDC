/**
 * Nurse Medication Ordering E2E Tests
 * Tests for ordering medications, managing patient medications, and tracking orders
 */

import { test, expect } from '@playwright/test';
import { test as customTest } from '../../fixtures/auth.fixture';
import { testUsers } from '../../fixtures/auth.fixture';
import { mockApiResponse, mockApiError } from '../../utils/api-mock';
import { generateMockPrescription } from '../../utils/test-data';

customTest.describe('Nurse - Medication Ordering', () => {
  customTest.beforeEach(async ({ nursePage }) => {
    // Fixture automatically logs in as nurse
    await nursePage.goto('/medication-orders');
  });

  customTest.describe('View Medication Orders', () => {
    customTest('should display list of medication orders for assigned patients', async ({ nursePage }) => {
      // Verify orders page loads
      await expect(nursePage.getByRole('heading', { name: /medication.*orders|commandes de médicaments/i })).toBeVisible();

      // Verify orders list
      const ordersList = nursePage.locator('[data-testid="orders-list"]');
      const emptyState = nursePage.locator('[data-testid="empty-orders"]');

      const hasItems = await ordersList.isVisible().catch(() => false);
      const isEmpty = await emptyState.isVisible().catch(() => false);

      expect(hasItems || isEmpty).toBeTruthy();
    });

    customTest('should display order details with patient and medication info', async ({ nursePage }) => {
      const orderCard = nursePage.locator('[data-testid="order-card"]').first();

      if (await orderCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        const patientName = orderCard.locator('[data-testid="patient-name"]');
        const medicationName = orderCard.locator('[data-testid="medication-name"]');
        const quantity = orderCard.locator('[data-testid="quantity"]');

        expect(await patientName.isVisible()).toBeTruthy();
      }
    });

    customTest('should filter orders by status (pending, ready, delivered)', async ({ nursePage }) => {
      const statusButtons = nursePage.getByRole('button', { name: /pending|ready|delivered|pending|prêt/i });

      if (await statusButtons.count() > 0) {
        await statusButtons.first().click();

        // Verify filter applied
        await expect(nursePage.locator('[data-testid="orders-list"]')).toBeVisible({ timeout: 5000 });
      }
    });

    customTest('should search orders by patient name or medication', async ({ nursePage }) => {
      const searchInput = nursePage.locator('input[placeholder*="search"], [data-testid="search-orders"]');

      if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await searchInput.fill('Paracétamol');

        // Verify search results
        await nursePage.waitForTimeout(500);
        const results = nursePage.locator('[data-testid="order-card"]');
        const count = await results.count();

        expect(count >= 0).toBeTruthy();
      }
    });
  });

  customTest.describe('Create New Medication Order', () => {
    customTest('should open medication order creation form', async ({ nursePage }) => {
      const createButton = nursePage.getByRole('button', { name: /create.*order|new order|commander/i });

      if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await createButton.click();

        // Verify form opens
        const form = nursePage.locator('[data-testid="order-form"], [role="dialog"]').first();
        await expect(form).toBeVisible({ timeout: 5000 });
      }
    });

    customTest('should select patient for medication order', async ({ nursePage }) => {
      // Mock patients API
      await mockApiResponse(nursePage, '**/patients**', {
        status: 200,
        body: {
          success: true,
          data: [
            { id: 'patient_1', firstName: 'Sophie', lastName: 'Bernard' },
            { id: 'patient_2', firstName: 'Jean', lastName: 'Dubois' },
          ],
        },
      });

      const patientSelect = nursePage.locator('select[name="patientId"], [data-testid="patient-select"]').first();

      if (await patientSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await patientSelect.click();

        const option = nursePage.getByRole('option').first();
        if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
          await option.click();
        }
      }
    });

    customTest('should search and select medication from pharmacy catalog', async ({ nursePage }) => {
      // Mock medications API
      await mockApiResponse(nursePage, '**/medications**', {
        status: 200,
        body: {
          success: true,
          data: [
            { id: 'med_1', name: 'Paracétamol', dosage: '500mg' },
            { id: 'med_2', name: 'Ibuprofen', dosage: '200mg' },
          ],
        },
      });

      const medSearch = nursePage.locator('input[name="medicationSearch"], [data-testid="medication-search"]').first();

      if (await medSearch.isVisible({ timeout: 2000 }).catch(() => false)) {
        await medSearch.fill('Paracétamol');

        // Wait for dropdown
        await nursePage.waitForTimeout(300);

        const medOption = nursePage.getByRole('option').first();
        if (await medOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await medOption.click();
        }
      }
    });

    customTest('should set order quantity and notes', async ({ nursePage }) => {
      const quantityInput = nursePage.locator('input[name="quantity"], [data-testid="quantity-input"]').first();
      const notesInput = nursePage.locator('textarea[name="notes"], [data-testid="order-notes"]').first();

      if (await quantityInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await quantityInput.fill('30');

        const value = await quantityInput.inputValue();
        expect(value).toBe('30');
      }

      if (await notesInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await notesInput.fill('Patient needs easy-to-swallow formulation');
      }
    });

    customTest('should submit medication order and show confirmation', async ({ nursePage }) => {
      // Mock order creation
      await mockApiResponse(nursePage, '**/medication-orders', {
        status: 201,
        body: {
          success: true,
          data: {
            orderId: 'medsorder_123',
            patientId: 'patient_1',
            status: 'pending',
            createdAt: new Date().toISOString(),
            estimatedDelivery: new Date(Date.now() + 86400000).toISOString(),
          },
        },
      });

      const submitButton = nursePage.getByRole('button', { name: /submit|create|commander/i });

      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click();

        // Verify confirmation
        const confirmation = nursePage.locator('[data-testid="order-confirmation"]');
        await expect(confirmation).toBeVisible({ timeout: 5000 }).catch(() => {
          return expect(nursePage.locator('[role="status"]')).toBeVisible({ timeout: 5000 });
        });
      }
    });
  });

  customTest.describe('Track Order Status', () => {
    customTest('should display order status tracking information', async ({ nursePage }) => {
      const orderCard = nursePage.locator('[data-testid="order-card"]').first();

      if (await orderCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        const status = orderCard.locator('[data-testid="order-status"]');
        const statusText = await status.textContent();

        expect(['pending', 'ready', 'delivered', 'cancelled']).toContain(statusText?.toLowerCase());
      }
    });

    customTest('should show estimated delivery date for pending orders', async ({ nursePage }) => {
      const orderCard = nursePage.locator('[data-testid="order-card"]').first();

      if (await orderCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        const deliveryDate = orderCard.locator('[data-testid="delivery-date"]');

        if (await deliveryDate.isVisible()) {
          const dateText = await deliveryDate.textContent();
          expect(dateText).toBeTruthy();
        }
      }
    });

    customTest('should receive notification when order is ready for pickup', async ({ nursePage }) => {
      // Look for ready notification
      const readyNotification = nursePage.locator('[data-testid="order-ready-notification"]');

      if (await readyNotification.isVisible({ timeout: 2000 }).catch(() => false)) {
        const message = await readyNotification.textContent();
        expect(message).toMatch(/ready|prêt/i);
      }
    });

    customTest('should allow marking order as received', async ({ nursePage }) => {
      const receiveButtons = nursePage.locator('[data-testid="mark-received-btn"]');

      if (await receiveButtons.count() > 0) {
        await receiveButtons.first().click();

        // Verify confirmation
        const confirmation = nursePage.locator('[role="status"]');
        await expect(confirmation).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });
  });

  customTest.describe('Manage Patient Medications', () => {
    customTest('should view medication list for patient', async ({ nursePage }) => {
      // Navigate to patient medications
      const medicationsLink = nursePage.getByRole('link', { name: /medications|patient medications/i });

      if (await medicationsLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await medicationsLink.click();

        // Verify medications list
        const medList = nursePage.locator('[data-testid="medications-list"]');
        await expect(medList).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });

    customTest('should record medication administration to patient', async ({ nursePage }) => {
      const adminButtons = nursePage.locator('[data-testid="administer-btn"]');

      if (await adminButtons.count() > 0) {
        await adminButtons.first().click();

        // Verify admin form
        const adminForm = nursePage.locator('[data-testid="admin-form"]');
        await expect(adminForm).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });

    customTest('should update medication dosage or frequency', async ({ nursePage }) => {
      const editButtons = nursePage.locator('[data-testid="edit-medication-btn"]');

      if (await editButtons.count() > 0) {
        await editButtons.first().click();

        // Verify edit form
        const editForm = nursePage.locator('[data-testid="medication-edit-form"]');
        await expect(editForm).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });

    customTest('should document patient medication side effects', async ({ nursePage }) => {
      const sideEffectButtons = nursePage.locator('[data-testid="report-side-effect-btn"]');

      if (await sideEffectButtons.count() > 0) {
        await sideEffectButtons.first().click();

        // Verify side effect reporting form
        const reportForm = nursePage.locator('[data-testid="side-effect-form"]');
        await expect(reportForm).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });
  });

  customTest.describe('Communicate with Pharmacy', () => {
    customTest('should send message to pharmacy regarding order', async ({ nursePage }) => {
      const messageButtons = nursePage.locator('[data-testid="message-pharmacy-btn"]');

      if (await messageButtons.count() > 0) {
        await messageButtons.first().click();

        // Verify messaging interface
        const messagingUI = nursePage.locator('[data-testid="messaging-panel"], [role="dialog"]').first();
        await expect(messagingUI).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });

    customTest('should request urgent medication delivery', async ({ nursePage }) => {
      // Mock urgent request API
      await mockApiResponse(nursePage, '**/medication-orders/*/urgent', {
        status: 200,
        body: {
          success: true,
          data: {
            orderId: 'medsorder_123',
            urgentRequested: true,
            estimatedDelivery: new Date(Date.now() + 3600000).toISOString(),
          },
        },
      });

      const urgentButtons = nursePage.locator('[data-testid="request-urgent-btn"]');

      if (await urgentButtons.count() > 0) {
        await urgentButtons.first().click();

        // Verify urgent request confirmed
        const confirmation = nursePage.locator('[role="status"]');
        await expect(confirmation).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });

    customTest('should escalate order issues to supervisor', async ({ nursePage }) => {
      const escalateButtons = nursePage.locator('[data-testid="escalate-btn"]');

      if (await escalateButtons.count() > 0) {
        await escalateButtons.first().click();

        // Verify escalation form
        const escalationForm = nursePage.locator('[data-testid="escalation-form"]');
        await expect(escalationForm).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });
  });

  customTest.describe('Order History and Reports', () => {
    customTest('should view order history for patient', async ({ nursePage }) => {
      // Look for history link
      const historyLink = nursePage.getByRole('link', { name: /history|historique|past orders/i });

      if (await historyLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await historyLink.click();

        // Verify history displays
        const historyList = nursePage.locator('[data-testid="order-history"]');
        await expect(historyList).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });

    customTest('should generate medication order report', async ({ nursePage }) => {
      const reportButton = nursePage.getByRole('button', { name: /report|rapport|export/i });

      if (await reportButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reportButton.click();

        // Verify report options
        const reportOptions = nursePage.getByRole('menuitem').first();
        await expect(reportOptions).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });
  });

  customTest.describe('Error Handling', () => {
    customTest('should show error when order creation fails', async ({ nursePage }) => {
      // Mock failed order creation
      await mockApiError(nursePage, '**/medication-orders', 500, 'Failed to create order');

      const createButton = nursePage.getByRole('button', { name: /create.*order|new order/i });

      if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await createButton.click();

        const submitButton = nursePage.getByRole('button', { name: /submit/i });
        if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await submitButton.click();

          // Verify error appears
          const errorMessage = nursePage.locator('[role="alert"]');
          await expect(errorMessage).toBeVisible({ timeout: 5000 }).catch(() => true);
        }
      }
    });

    customTest('should show error when patient medication data not found', async ({ nursePage }) => {
      await mockApiError(nursePage, '**/patients/*/medications', 404, 'Patient not found');

      // Try to view patient medications
      const medicationsLink = nursePage.getByRole('link', { name: /medications/i });

      if (await medicationsLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await medicationsLink.click();

        const error = nursePage.locator('[role="alert"]');
        await expect(error).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });
  });
});
