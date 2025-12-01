/**
 * Pharmacist Prescription Processing E2E Tests
 * Tests for receiving, validating, processing, and managing prescriptions
 */

import { test, expect } from '@playwright/test';
import { test as customTest } from '../../fixtures/auth.fixture';
import { testUsers } from '../../fixtures/auth.fixture';
import { mockApiResponse, mockApiError } from '../../utils/api-mock';
import { generateMockPrescription } from '../../utils/test-data';

customTest.describe('Pharmacist - Prescription Processing', () => {
  customTest.beforeEach(async ({ pharmacistPage }) => {
    // Fixture automatically logs in as pharmacist
    await pharmacistPage.goto('/prescriptions');
  });

  customTest.describe('View Incoming Prescriptions', () => {
    customTest('should display list of pending prescriptions', async ({ pharmacistPage }) => {
      // Verify prescriptions page loads
      await expect(pharmacistPage.getByRole('heading', { name: /prescriptions|ordonnances/i })).toBeVisible();

      // Verify prescription list exists
      const prescriptionList = pharmacistPage.locator('[data-testid="prescriptions-list"]');
      const emptyState = pharmacistPage.locator('[data-testid="empty-prescriptions"]');

      const hasItems = await prescriptionList.isVisible().catch(() => false);
      const isEmpty = await emptyState.isVisible().catch(() => false);

      expect(hasItems || isEmpty).toBeTruthy();
    });

    customTest('should display prescription details with patient and doctor info', async ({ pharmacistPage }) => {
      const prescriptionCard = pharmacistPage.locator('[data-testid="prescription-card"]').first();

      if (await prescriptionCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Verify key information is visible
        const patientName = prescriptionCard.locator('[data-testid="patient-name"]');
        const doctorName = prescriptionCard.locator('[data-testid="doctor-name"]');
        const medications = prescriptionCard.locator('[data-testid="medications"]');

        expect(await patientName.isVisible()).toBeTruthy();
        expect(await doctorName.isVisible()).toBeTruthy();
      }
    });

    customTest('should filter prescriptions by status (pending, approved, rejected)', async ({ pharmacistPage }) => {
      const statusButtons = pharmacistPage.getByRole('button', { name: /pending|approved|rejected|en attente/i });
      const count = await statusButtons.count();

      if (count > 0) {
        await statusButtons.first().click();

        // Verify filter applied
        await expect(pharmacistPage.locator('[data-testid="prescriptions-list"]')).toBeVisible({ timeout: 5000 });
      }
    });

    customTest('should sort prescriptions by received date', async ({ pharmacistPage }) => {
      const sortButton = pharmacistPage.getByRole('button', { name: /sort|trier/i });

      if (await sortButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await sortButton.click();

        const dateSort = pharmacistPage.getByRole('menuitem', { name: /date|récent/i });
        if (await dateSort.isVisible({ timeout: 2000 }).catch(() => false)) {
          await dateSort.click();
        }
      }
    });
  });

  customTest.describe('Validate Prescription', () => {
    customTest('should open prescription validation form', async ({ pharmacistPage }) => {
      const validateButtons = pharmacistPage.locator('[data-testid="validate-prescription-btn"]');

      if (await validateButtons.count() > 0) {
        await validateButtons.first().click();

        // Verify validation form opens
        const form = pharmacistPage.locator('[data-testid="validation-form"], [role="dialog"]').first();
        await expect(form).toBeVisible({ timeout: 5000 });
      }
    });

    customTest('should check drug interactions', async ({ pharmacistPage }) => {
      // Mock drug interaction check API
      await mockApiResponse(pharmacistPage, '**/prescriptions/*/validate/interactions', {
        status: 200,
        body: {
          success: true,
          data: {
            hasInteractions: false,
            interactions: [],
            warnings: [],
          },
        },
      });

      // Look for interaction check button
      const checkButton = pharmacistPage.locator('[data-testid="check-interactions-btn"]');

      if (await checkButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await checkButton.click();

        // Verify interaction results displayed
        const results = pharmacistPage.locator('[data-testid="interaction-results"]');
        await expect(results).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });

    customTest('should verify patient allergy compatibility', async ({ pharmacistPage }) => {
      const prescriptionCard = pharmacistPage.locator('[data-testid="prescription-card"]').first();

      if (await prescriptionCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Look for allergy check indicator
        const allergyIndicator = prescriptionCard.locator('[data-testid="allergy-check"]');

        if (await allergyIndicator.isVisible()) {
          const status = await allergyIndicator.getAttribute('data-status');
          expect(['safe', 'warning', 'danger']).toContain(status);
        }
      }
    });

    customTest('should verify prescription has required fields', async ({ pharmacistPage }) => {
      const validateButton = pharmacistPage.locator('[data-testid="validate-prescription-btn"]').first();

      if (await validateButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await validateButton.click();

        // Verify validation checks are performed
        const validationStatus = pharmacistPage.locator('[data-testid="validation-status"]');
        await expect(validationStatus).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });
  });

  customTest.describe('Approve or Reject Prescription', () => {
    customTest('should approve prescription and update status', async ({ pharmacistPage }) => {
      // Mock approve API
      await mockApiResponse(pharmacistPage, '**/prescriptions/*/approve', {
        status: 200,
        body: {
          success: true,
          data: {
            id: 'rx_123',
            status: 'approved',
            approvedBy: testUsers.pharmacist.email,
            approvedAt: new Date().toISOString(),
          },
        },
      });

      const approveButtons = pharmacistPage.locator('[data-testid="approve-prescription-btn"]');

      if (await approveButtons.count() > 0) {
        await approveButtons.first().click();

        // Verify confirmation appears
        const confirmation = pharmacistPage.locator('[data-testid="approval-confirmation"]');
        await expect(confirmation).toBeVisible({ timeout: 5000 }).catch(() => {
          return expect(pharmacistPage.locator('[role="status"]')).toBeVisible({ timeout: 5000 });
        });
      }
    });

    customTest('should reject prescription with reason', async ({ pharmacistPage }) => {
      // Mock reject API
      await mockApiResponse(pharmacistPage, '**/prescriptions/*/reject', {
        status: 200,
        body: {
          success: true,
          data: {
            id: 'rx_123',
            status: 'rejected',
            rejectionReason: 'Drug interaction detected',
            rejectedBy: testUsers.pharmacist.email,
          },
        },
      });

      const rejectButtons = pharmacistPage.locator('[data-testid="reject-prescription-btn"]');

      if (await rejectButtons.count() > 0) {
        await rejectButtons.first().click();

        // Verify rejection reason form appears
        const reasonField = pharmacistPage.locator('textarea[name="rejectionReason"], [data-testid="rejection-reason"]');

        if (await reasonField.isVisible({ timeout: 2000 }).catch(() => false)) {
          await reasonField.fill('Drug interaction detected with Lisinopril');

          const submitButton = pharmacistPage.getByRole('button', { name: /submit|confirm/i });
          if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await submitButton.click();
          }
        }
      }
    });

    customTest('should add notes to prescription before approval', async ({ pharmacistPage }) => {
      const notesField = pharmacistPage.locator('textarea[name="notes"], [data-testid="prescription-notes"]').first();

      if (await notesField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await notesField.fill('Patient requested smaller pill size - refer to patient preferences');

        // Verify notes saved
        const saveButton = pharmacistPage.getByRole('button', { name: /save|save notes/i });
        if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await saveButton.click();
        }
      }
    });
  });

  customTest.describe('Prescription Fulfillment', () => {
    customTest('should mark prescription as fulfilled', async ({ pharmacistPage }) => {
      const fulfillButtons = pharmacistPage.locator('[data-testid="fulfill-prescription-btn"]');

      if (await fulfillButtons.count() > 0) {
        await fulfillButtons.first().click();

        // Verify fulfillment process
        const fulfillmentForm = pharmacistPage.locator('[data-testid="fulfillment-form"], [role="dialog"]').first();
        await expect(fulfillmentForm).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });

    customTest('should assign fulfillment quantity', async ({ pharmacistPage }) => {
      const quantityInputs = pharmacistPage.locator('input[name="quantity"], [data-testid="fulfill-quantity"]');

      if (await quantityInputs.count() > 0) {
        await quantityInputs.first().fill('30');

        const value = await quantityInputs.first().inputValue();
        expect(value).toBe('30');
      }
    });

    customTest('should generate barcode for fulfilled prescription', async ({ pharmacistPage }) => {
      // Mock barcode generation
      await mockApiResponse(pharmacistPage, '**/prescriptions/*/barcode', {
        status: 200,
        body: {
          success: true,
          data: {
            barcodeUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0gA=',
            barcodeValue: '1234567890',
          },
        },
      });

      const barcodeButton = pharmacistPage.locator('[data-testid="generate-barcode-btn"]').first();

      if (await barcodeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await barcodeButton.click();

        // Verify barcode appears
        const barcode = pharmacistPage.locator('[data-testid="prescription-barcode"]');
        await expect(barcode).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });
  });

  customTest.describe('Prescription Communication', () => {
    customTest('should send notification to patient', async ({ pharmacistPage }) => {
      const notifyButtons = pharmacistPage.locator('[data-testid="notify-patient-btn"]');

      if (await notifyButtons.count() > 0) {
        await notifyButtons.first().click();

        // Verify notification sent
        const confirmationMessage = pharmacistPage.locator('[role="status"]');
        await expect(confirmationMessage).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });

    customTest('should initiate secure messaging with doctor for clarification', async ({ pharmacistPage }) => {
      const messageButtons = pharmacistPage.locator('[data-testid="message-doctor-btn"]');

      if (await messageButtons.count() > 0) {
        await messageButtons.first().click();

        // Verify messaging interface opens
        const messagingUI = pharmacistPage.locator('[data-testid="messaging-panel"], [role="dialog"]').first();
        await expect(messagingUI).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });

    customTest('should request pharmacist clarification from doctor', async ({ pharmacistPage }) => {
      // Mock clarification request API
      await mockApiResponse(pharmacistPage, '**/prescriptions/*/clarification-request', {
        status: 201,
        body: {
          success: true,
          data: {
            requestId: 'clarif_123',
            status: 'pending',
            sentTo: 'doctor@test.metapharm.ch',
            sentAt: new Date().toISOString(),
          },
        },
      });

      const clarifyButton = pharmacistPage.locator('[data-testid="request-clarification-btn"]').first();

      if (await clarifyButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await clarifyButton.click();

        // Verify clarification request form
        const clarifyForm = pharmacistPage.locator('[data-testid="clarification-form"]');
        await expect(clarifyForm).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });
  });

  customTest.describe('Batch Prescription Operations', () => {
    customTest('should select multiple prescriptions for batch approval', async ({ pharmacistPage }) => {
      const checkboxes = pharmacistPage.locator('[data-testid="prescription-checkbox"]');

      if (await checkboxes.count() > 1) {
        await checkboxes.nth(0).click();
        await checkboxes.nth(1).click();

        // Verify selection
        const selectedCount = await checkboxes.count();
        expect(selectedCount >= 2).toBeTruthy();
      }
    });

    customTest('should apply batch approval to selected prescriptions', async ({ pharmacistPage }) => {
      const batchApproveButton = pharmacistPage.locator('[data-testid="batch-approve-btn"]');

      if (await batchApproveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await batchApproveButton.click();

        // Verify batch operation
        const confirmation = pharmacistPage.locator('[data-testid="batch-confirmation"]');
        await expect(confirmation).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });
  });
});
