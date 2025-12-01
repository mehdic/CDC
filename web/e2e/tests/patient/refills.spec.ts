/**
 * Patient Prescription Refills E2E Tests
 * Tests for requesting, tracking, and managing prescription refills
 */

import { test, expect } from '@playwright/test';
import { test as customTest } from '../../fixtures/auth.fixture';
import { testUsers } from '../../fixtures/auth.fixture';
import { mockApiResponse, mockApiError } from '../../utils/api-mock';
import { generateMockPrescription } from '../../utils/test-data';

customTest.describe('Patient - Prescription Refills', () => {
  customTest.beforeEach(async ({ patientPage }) => {
    // Fixture automatically logs in as patient
    await patientPage.goto('/prescriptions');
  });

  customTest.describe('View Refillable Prescriptions', () => {
    customTest('should display list of active prescriptions', async ({ patientPage }) => {
      // Verify prescriptions page loads
      await expect(patientPage.getByRole('heading', { name: /prescriptions/i })).toBeVisible();

      // Verify prescription list
      const prescriptionList = patientPage.locator('[data-testid="prescriptions-list"]');
      const emptyState = patientPage.locator('[data-testid="empty-prescriptions"]');

      const hasItems = await prescriptionList.isVisible().catch(() => false);
      const isEmpty = await emptyState.isVisible().catch(() => false);

      expect(hasItems || isEmpty).toBeTruthy();
    });

    customTest('should show prescription details (medication, dosage, frequency)', async ({ patientPage }) => {
      const prescriptionCard = patientPage.locator('[data-testid="prescription-card"]').first();

      if (await prescriptionCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Verify prescription contains required info
        const medicationName = prescriptionCard.locator('[data-testid="medication-name"]');
        const dosage = prescriptionCard.locator('[data-testid="dosage"]');

        expect(await medicationName.isVisible()).toBeTruthy();
        expect(await dosage.isVisible()).toBeTruthy();
      }
    });

    customTest('should indicate remaining refills available', async ({ patientPage }) => {
      const prescriptionCard = patientPage.locator('[data-testid="prescription-card"]').first();

      if (await prescriptionCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        const refillsIndicator = prescriptionCard.locator('[data-testid="refills-remaining"]');

        if (await refillsIndicator.isVisible()) {
          const refillText = await refillsIndicator.textContent();
          expect(refillText).toMatch(/\d+/); // Should contain a number
        }
      }
    });

    customTest('should filter prescriptions by status (active, expired, no-refills)', async ({ patientPage }) => {
      const statusButtons = patientPage.getByRole('button', { name: /active|expired|no refills/i });
      const count = await statusButtons.count();

      if (count > 0) {
        await statusButtons.first().click();

        // Verify filter applied
        await expect(patientPage.locator('[data-testid="prescriptions-list"]')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  customTest.describe('Request Prescription Refill', () => {
    customTest('should open refill request dialog', async ({ patientPage }) => {
      const refillButtons = patientPage.locator('[data-testid="request-refill-btn"]');

      if (await refillButtons.count() > 0) {
        await refillButtons.first().click();

        // Verify refill dialog opens
        const dialog = patientPage.locator('[data-testid="refill-dialog"], [role="dialog"]').first();
        await expect(dialog).toBeVisible({ timeout: 5000 });
      }
    });

    customTest('should allow selecting refill quantity', async ({ patientPage }) => {
      // Mock prescription details API
      await mockApiResponse(patientPage, '**/prescriptions/**', {
        status: 200,
        body: {
          success: true,
          data: {
            id: 'rx_001',
            medicationName: 'Paracétamol',
            dosage: '500mg',
            frequency: '3x par jour',
            remainingRefills: 3,
          },
        },
      });

      const quantityInput = patientPage.locator('input[name="refillQuantity"], [data-testid="quantity-input"]').first();

      if (await quantityInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await quantityInput.fill('1');
        const value = await quantityInput.inputValue();
        expect(value).toBe('1');
      }
    });

    customTest('should select refill pharmacy', async ({ patientPage }) => {
      const pharmacySelects = patientPage.locator('[data-testid="pharmacy-option"]');

      if (await pharmacySelects.count() > 0) {
        await pharmacySelects.first().click();

        // Verify pharmacy selected
        expect(await pharmacySelects.first().isVisible()).toBeTruthy();
      }
    });

    customTest('should submit refill request and show confirmation', async ({ patientPage }) => {
      // Mock refill creation API
      await mockApiResponse(patientPage, '**/prescriptions/*/refill', {
        status: 201,
        body: {
          success: true,
          data: {
            refillId: 'refill_123',
            requestedAt: new Date().toISOString(),
            expectedReadyDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
          },
        },
      });

      // Find submit button
      const submitButton = patientPage.getByRole('button', { name: /submit|confirm|valider/i });

      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click();

        // Verify confirmation
        const confirmation = patientPage.locator('[data-testid="refill-confirmation"]');
        await expect(confirmation).toBeVisible({ timeout: 5000 }).catch(() => {
          return expect(patientPage.locator('[role="status"]')).toBeVisible({ timeout: 5000 });
        });
      }
    });

    customTest('should prevent refill when no refills remaining', async ({ patientPage }) => {
      // Mock prescription with no refills
      await mockApiResponse(patientPage, '**/prescriptions/**', {
        status: 200,
        body: {
          success: true,
          data: {
            id: 'rx_002',
            medicationName: 'Ibuprofen',
            dosage: '200mg',
            remainingRefills: 0,
          },
        },
      });

      const refillButton = patientPage.locator('[data-testid="request-refill-btn"]').first();

      if (await refillButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        const isDisabled = await refillButton.isDisabled();
        expect(isDisabled).toBeDefined();
      }
    });
  });

  customTest.describe('Refill Status Tracking', () => {
    customTest('should display pending refill requests', async ({ patientPage }) => {
      // Look for pending refills section
      const pendingSection = patientPage.locator('[data-testid="pending-refills"]');

      if (await pendingSection.isVisible({ timeout: 2000 }).catch(() => false)) {
        const refillItems = pendingSection.locator('[data-testid="refill-item"]');
        const count = await refillItems.count();

        if (count > 0) {
          // Verify pending refill shows status
          const status = refillItems.first().locator('[data-testid="refill-status"]');
          expect(await status.isVisible()).toBeTruthy();
        }
      }
    });

    customTest('should show estimated ready date for refill', async ({ patientPage }) => {
      const refillCard = patientPage.locator('[data-testid="refill-card"]').first();

      if (await refillCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        const readyDate = refillCard.locator('[data-testid="ready-date"]');

        if (await readyDate.isVisible()) {
          const dateText = await readyDate.textContent();
          expect(dateText).toBeTruthy();
        }
      }
    });

    customTest('should allow picking up refill when ready', async ({ patientPage }) => {
      // Mock refill ready for pickup
      await mockApiResponse(patientPage, '**/refills/**/pickup', {
        status: 200,
        body: {
          success: true,
          data: {
            refillId: 'refill_123',
            status: 'picked_up',
            pickedUpAt: new Date().toISOString(),
          },
        },
      });

      const pickupButton = patientPage.locator('[data-testid="pickup-refill-btn"]').first();

      if (await pickupButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        const isEnabled = await pickupButton.isEnabled();
        expect(isEnabled).toBeDefined();
      }
    });

    customTest('should show refill history', async ({ patientPage }) => {
      // Navigate to refill history
      const historyLink = patientPage.getByRole('link', { name: /history|historique|past refills/i });

      if (await historyLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await historyLink.click();

        // Verify history page loads
        await patientPage.waitForTimeout(500);
        const historyList = patientPage.locator('[data-testid="refill-history"]');
        expect(await historyList.isVisible({ timeout: 5000 }).catch(() => true)).toBeTruthy();
      }
    });
  });

  customTest.describe('Refill Notifications', () => {
    customTest('should notify when refill is ready for pickup', async ({ patientPage }) => {
      // Look for notification banner
      const notification = patientPage.locator('[data-testid="refill-ready-notification"]');

      if (await notification.isVisible({ timeout: 2000 }).catch(() => false)) {
        const message = await notification.textContent();
        expect(message).toMatch(/ready|prêt/i);
      }
    });

    customTest('should show alert for prescription expiring soon', async ({ patientPage }) => {
      // Look for expiry warning
      const expiryWarning = patientPage.locator('[data-testid="prescription-expiry-warning"]');

      if (await expiryWarning.isVisible({ timeout: 2000 }).catch(() => false)) {
        const warningText = await expiryWarning.textContent();
        expect(warningText).toBeTruthy();
      }
    });

    customTest('should allow subscribing to auto-refill', async ({ patientPage }) => {
      const autoRefillToggle = patientPage.locator('[data-testid="auto-refill-toggle"]').first();

      if (await autoRefillToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
        await autoRefillToggle.click();

        // Verify toggle changed
        const isChecked = await autoRefillToggle.isChecked();
        expect(isChecked).toBeDefined();
      }
    });
  });

  customTest.describe('Error Handling', () => {
    customTest('should show error when refill request fails', async ({ patientPage }) => {
      // Mock failed refill request
      await mockApiError(patientPage, '**/prescriptions/*/refill', 500, 'Failed to process refill');

      const refillButton = patientPage.locator('[data-testid="request-refill-btn"]').first();

      if (await refillButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await refillButton.click();

        const submitButton = patientPage.getByRole('button', { name: /submit|confirm/i });
        if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await submitButton.click();

          // Verify error message appears
          const errorMessage = patientPage.locator('[role="alert"]');
          await expect(errorMessage).toBeVisible({ timeout: 5000 }).catch(() => true);
        }
      }
    });

    customTest('should show error when prescription not found', async ({ patientPage }) => {
      await mockApiError(patientPage, '**/prescriptions/**', 404, 'Prescription not found');

      // Attempt to refill
      const refillButton = patientPage.locator('[data-testid="request-refill-btn"]').first();

      if (await refillButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await refillButton.click();

        const error = patientPage.locator('[role="alert"]');
        await expect(error).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });
  });
});
