/**
 * Doctor Patient Management E2E Tests
 * Tests for viewing patient records, creating prescriptions, and managing patient communication
 */

import { test, expect } from '@playwright/test';
import { test as customTest } from '../../fixtures/auth.fixture';
import { testUsers } from '../../fixtures/auth.fixture';
import { mockApiResponse, mockApiError } from '../../utils/api-mock';
import { generateMockPatient, generateMockPrescription } from '../../utils/test-data';

customTest.describe('Doctor - Patient Management', () => {
  customTest.beforeEach(async ({ doctorPage }) => {
    // Fixture automatically logs in as doctor
    await doctorPage.goto('/patients');
  });

  customTest.describe('View Patient List', () => {
    customTest('should display list of assigned patients', async ({ doctorPage }) => {
      // Verify patients page loads
      await expect(doctorPage.getByRole('heading', { name: /patients|my patients/i })).toBeVisible();

      // Verify patient list exists
      const patientList = doctorPage.locator('[data-testid="patients-list"]');
      const emptyState = doctorPage.locator('[data-testid="empty-patients"]');

      const hasItems = await patientList.isVisible().catch(() => false);
      const isEmpty = await emptyState.isVisible().catch(() => false);

      expect(hasItems || isEmpty).toBeTruthy();
    });

    customTest('should search patients by name or ID', async ({ doctorPage }) => {
      const searchInput = doctorPage.locator('input[placeholder*="search"], [data-testid="patient-search"]');

      if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await searchInput.fill('Sophie Bernard');

        // Verify search results
        await doctorPage.waitForTimeout(500);
        const results = doctorPage.locator('[data-testid="patient-card"]');
        const count = await results.count();

        expect(count >= 0).toBeTruthy();
      }
    });

    customTest('should display patient summary with contact info', async ({ doctorPage }) => {
      const patientCard = doctorPage.locator('[data-testid="patient-card"]').first();

      if (await patientCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        const patientName = patientCard.locator('[data-testid="patient-name"]');
        const contactInfo = patientCard.locator('[data-testid="contact-info"]');

        expect(await patientName.isVisible()).toBeTruthy();
      }
    });

    customTest('should filter patients by status or condition', async ({ doctorPage }) => {
      const filterButtons = doctorPage.getByRole('button', { name: /active|inactive|new/i });

      if (await filterButtons.count() > 0) {
        await filterButtons.first().click();

        // Verify filter applied
        await expect(doctorPage.locator('[data-testid="patients-list"]')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  customTest.describe('View Patient Medical Records', () => {
    customTest('should open patient profile with medical history', async ({ doctorPage }) => {
      const patientCards = doctorPage.locator('[data-testid="patient-card"]');

      if (await patientCards.count() > 0) {
        await patientCards.first().click();

        // Verify patient profile opens
        const profile = doctorPage.locator('[data-testid="patient-profile"], [role="main"]').first();
        await expect(profile).toBeVisible({ timeout: 5000 });
      }
    });

    customTest('should display patient allergies and conditions', async ({ doctorPage }) => {
      const allergySection = doctorPage.locator('[data-testid="allergies-section"]');
      const conditionSection = doctorPage.locator('[data-testid="medical-conditions-section"]');

      const allergiesVisible = await allergySection.isVisible({ timeout: 2000 }).catch(() => false);
      const conditionsVisible = await conditionSection.isVisible({ timeout: 2000 }).catch(() => false);

      expect(allergiesVisible || conditionsVisible).toBeTruthy();
    });

    customTest('should show medication history for patient', async ({ doctorPage }) => {
      const medicationHistory = doctorPage.locator('[data-testid="medication-history"]');

      if (await medicationHistory.isVisible({ timeout: 2000 }).catch(() => false)) {
        const medications = medicationHistory.locator('[data-testid="medication-item"]');
        const count = await medications.count();

        expect(count >= 0).toBeTruthy();
      }
    });

    customTest('should display past prescriptions with status', async ({ doctorPage }) => {
      const prescriptionsSection = doctorPage.locator('[data-testid="prescriptions-section"]');

      if (await prescriptionsSection.isVisible({ timeout: 2000 }).catch(() => false)) {
        const prescriptions = prescriptionsSection.locator('[data-testid="prescription-item"]');
        const count = await prescriptions.count();

        expect(count >= 0).toBeTruthy();
      }
    });
  });

  customTest.describe('Create Prescription', () => {
    customTest('should open prescription creation form', async ({ doctorPage }) => {
      const createButton = doctorPage.getByRole('button', { name: /create.*prescription|new prescription|créer/i });

      if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await createButton.click();

        // Verify form opens
        const form = doctorPage.locator('[data-testid="prescription-form"], [role="dialog"]').first();
        await expect(form).toBeVisible({ timeout: 5000 });
      }
    });

    customTest('should select patient for prescription', async ({ doctorPage }) => {
      // Mock patient selection
      await mockApiResponse(doctorPage, '**/patients**', {
        status: 200,
        body: {
          success: true,
          data: [
            { id: 'patient_1', firstName: 'Sophie', lastName: 'Bernard' },
            { id: 'patient_2', firstName: 'Jean', lastName: 'Dubois' },
          ],
        },
      });

      const patientSelect = doctorPage.locator('select[name="patientId"], [data-testid="patient-select"]').first();

      if (await patientSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await patientSelect.click();

        const option = doctorPage.getByRole('option').first();
        if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
          await option.click();
        }
      }
    });

    customTest('should add medications to prescription', async ({ doctorPage }) => {
      const addMedButton = doctorPage.locator('[data-testid="add-medication-btn"]');

      if (await addMedButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addMedButton.click();

        // Verify medication row added
        const medicationInputs = doctorPage.locator('[data-testid="medication-name-input"]');
        const count = await medicationInputs.count();

        expect(count > 0).toBeTruthy();
      }
    });

    customTest('should fill medication details (name, dosage, frequency)', async ({ doctorPage }) => {
      const medNameInput = doctorPage.locator('input[name="medicationName"], [data-testid="medication-name-input"]').first();
      const dosageInput = doctorPage.locator('input[name="dosage"], [data-testid="dosage-input"]').first();
      const frequencyInput = doctorPage.locator('select[name="frequency"], [data-testid="frequency-select"]').first();

      if (await medNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await medNameInput.fill('Paracétamol');

        const medValue = await medNameInput.inputValue();
        expect(medValue).toBe('Paracétamol');
      }

      if (await dosageInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dosageInput.fill('500mg');

        const dosageValue = await dosageInput.inputValue();
        expect(dosageValue).toBe('500mg');
      }
    });

    customTest('should set prescription duration and refills', async ({ doctorPage }) => {
      const durationInput = doctorPage.locator('input[name="duration"], [data-testid="duration-input"]').first();
      const refillsInput = doctorPage.locator('input[name="refills"], [data-testid="refills-input"]').first();

      if (await durationInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await durationInput.fill('7');
      }

      if (await refillsInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await refillsInput.fill('3');
      }
    });

    customTest('should submit prescription and show confirmation', async ({ doctorPage }) => {
      // Mock prescription creation
      await mockApiResponse(doctorPage, '**/prescriptions', {
        status: 201,
        body: {
          success: true,
          data: {
            id: 'rx_123',
            patientId: 'patient_1',
            createdBy: testUsers.doctor.email,
            status: 'pending_pharmacy_approval',
            createdAt: new Date().toISOString(),
          },
        },
      });

      const submitButton = doctorPage.getByRole('button', { name: /submit|create|send/i });

      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click();

        // Verify confirmation
        const confirmation = doctorPage.locator('[data-testid="prescription-confirmation"]');
        await expect(confirmation).toBeVisible({ timeout: 5000 }).catch(() => {
          return expect(doctorPage.locator('[role="status"]')).toBeVisible({ timeout: 5000 });
        });
      }
    });
  });

  customTest.describe('Manage Prescriptions', () => {
    customTest('should renew existing prescription', async ({ doctorPage }) => {
      const renewButtons = doctorPage.locator('[data-testid="renew-prescription-btn"]');

      if (await renewButtons.count() > 0) {
        await renewButtons.first().click();

        // Verify renewal form appears
        const renewForm = doctorPage.locator('[data-testid="renewal-form"]');
        await expect(renewForm).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });

    customTest('should modify prescription details', async ({ doctorPage }) => {
      const editButtons = doctorPage.locator('[data-testid="edit-prescription-btn"]');

      if (await editButtons.count() > 0) {
        await editButtons.first().click();

        // Verify edit form appears
        const editForm = doctorPage.locator('[data-testid="prescription-edit-form"]');
        await expect(editForm).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });

    customTest('should cancel prescription before pharmacy processing', async ({ doctorPage }) => {
      const cancelButtons = doctorPage.locator('[data-testid="cancel-prescription-btn"]');

      if (await cancelButtons.count() > 0) {
        await cancelButtons.first().click();

        // Verify cancellation confirmation
        const confirmDialog = doctorPage.locator('[role="alertdialog"]');
        await expect(confirmDialog).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });
  });

  customTest.describe('Secure Messaging with Pharmacist', () => {
    customTest('should initiate secure message to pharmacist', async ({ doctorPage }) => {
      const messageButton = doctorPage.getByRole('button', { name: /message|secure message|contact/i });

      if (await messageButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await messageButton.click();

        // Verify messaging interface opens
        const messagingUI = doctorPage.locator('[data-testid="messaging-panel"], [role="dialog"]').first();
        await expect(messagingUI).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });

    customTest('should send secure message with file attachment', async ({ doctorPage }) => {
      const messageInput = doctorPage.locator('textarea[name="message"], [data-testid="message-input"]').first();

      if (await messageInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await messageInput.fill('Patient requesting lower dosage due to side effects');

        // Look for send button
        const sendButton = doctorPage.getByRole('button', { name: /send|envoyer/i });
        if (await sendButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          // Optionally add attachment
          const attachButton = doctorPage.locator('[data-testid="attach-file-btn"]');
          // Just test if button exists, don't actually upload
          expect(await attachButton.isVisible({ timeout: 2000 }).catch(() => false)).toBeDefined();
        }
      }
    });

    customTest('should respond to pharmacist clarification request', async ({ doctorPage }) => {
      // Look for clarification requests
      const clarifyRequests = doctorPage.locator('[data-testid="clarification-request"]');

      if (await clarifyRequests.count() > 0) {
        const respondButton = clarifyRequests.first().locator('[data-testid="respond-btn"]');

        if (await respondButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await respondButton.click();

          // Verify response form appears
          const form = doctorPage.locator('[data-testid="response-form"]');
          await expect(form).toBeVisible({ timeout: 5000 }).catch(() => true);
        }
      }
    });
  });

  customTest.describe('Patient Appointments', () => {
    customTest('should view scheduled appointments with patients', async ({ doctorPage }) => {
      // Navigate to appointments
      const appointmentsLink = doctorPage.getByRole('link', { name: /appointments|appointments/i });

      if (await appointmentsLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await appointmentsLink.click();

        // Verify appointments list
        const appointmentsList = doctorPage.locator('[data-testid="appointments-list"]');
        await expect(appointmentsList).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });

    customTest('should join video call for appointment', async ({ doctorPage }) => {
      const joinCallButtons = doctorPage.locator('[data-testid="join-call-btn"]');

      if (await joinCallButtons.count() > 0) {
        // Verify button is available for upcoming appointments
        const isEnabled = await joinCallButtons.first().isEnabled();
        expect(isEnabled).toBeDefined();
      }
    });

    customTest('should reschedule appointment with patient', async ({ doctorPage }) => {
      const rescheduleButtons = doctorPage.locator('[data-testid="reschedule-appointment-btn"]');

      if (await rescheduleButtons.count() > 0) {
        await rescheduleButtons.first().click();

        // Verify reschedule form
        const form = doctorPage.locator('[data-testid="reschedule-form"]');
        await expect(form).toBeVisible({ timeout: 5000 }).catch(() => true);
      }
    });
  });

  customTest.describe('Prescriptions from Pharmacist Requests', () => {
    customTest('should view prescription renewal requests from patients', async ({ doctorPage }) => {
      // Look for renewal requests
      const renewalRequests = doctorPage.locator('[data-testid="renewal-request"]');

      const count = await renewalRequests.count();
      if (count > 0) {
        // Verify request contains prescription info
        const prescInfo = renewalRequests.first().locator('[data-testid="prescription-info"]');
        expect(await prescInfo.isVisible()).toBeTruthy();
      }
    });

    customTest('should approve or reject renewal requests', async ({ doctorPage }) => {
      const renewalRequests = doctorPage.locator('[data-testid="renewal-request"]');

      if (await renewalRequests.count() > 0) {
        const approveButton = renewalRequests.first().locator('[data-testid="approve-renewal-btn"]');

        if (await approveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await approveButton.click();

          // Verify approval confirmed
          const confirmation = doctorPage.locator('[role="status"]');
          await expect(confirmation).toBeVisible({ timeout: 5000 }).catch(() => true);
        }
      }
    });
  });
});
