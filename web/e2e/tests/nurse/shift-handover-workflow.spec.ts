/**
 * Nurse Shift Handover Workflow E2E Tests
 * Tests for shift handover, patient status updates, and medication verification
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { NursePage } from '../../page-objects';
import { mockApiResponse, mockApiError } from '../../utils/api-mock';

test.describe('Nurse - Shift Handover Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock shift information
    await mockApiResponse(page, '**/nurse/shifts/current**', {
      status: 200,
      body: {
        success: true,
        data: {
          shiftId: 'shift_001',
          startTime: new Date(Date.now() - 7200000).toISOString(),
          endTime: new Date(Date.now() + 3600000).toISOString(),
          nurseId: 'nurse_001',
          nurseName: 'Caroline Leclerc',
          ward: 'Cardiology Ward A',
          assignedPatients: [
            'patient_001',
            'patient_002',
            'patient_003',
            'patient_004',
          ],
          pendingHandovers: 2,
          status: 'active',
        },
      },
    });

    // Mock patient status list
    await mockApiResponse(page, '**/nurse/shifts/shift_001/patients**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'patient_001',
            firstName: 'Paul',
            lastName: 'Deschamp',
            room: '101',
            bed: 'A',
            status: 'stable',
            lastVitals: {
              bloodPressure: '130/80',
              heartRate: 72,
              temperature: 36.8,
              respiratoryRate: 16,
            },
            lastVitalsTime: new Date(Date.now() - 600000).toISOString(),
            pendingMedications: 0,
            pendingOrdersCount: 1,
            notes: 'Patient resting, pain level 2/10',
          },
          {
            id: 'patient_002',
            firstName: 'Marie',
            lastName: 'Dupuis',
            room: '102',
            bed: 'B',
            status: 'attention_needed',
            lastVitals: {
              bloodPressure: '145/90',
              heartRate: 88,
              temperature: 37.2,
              respiratoryRate: 18,
            },
            lastVitalsTime: new Date(Date.now() - 1800000).toISOString(),
            pendingMedications: 2,
            pendingOrdersCount: 1,
            notes: 'Slight fever, may need fluids',
          },
          {
            id: 'patient_003',
            firstName: 'Jean',
            lastName: 'Leclerc',
            room: '103',
            bed: 'A',
            status: 'stable',
            lastVitals: {
              bloodPressure: '120/75',
              heartRate: 68,
              temperature: 36.9,
              respiratoryRate: 16,
            },
            lastVitalsTime: new Date(Date.now() - 300000).toISOString(),
            pendingMedications: 0,
            pendingOrdersCount: 0,
            notes: 'Ready for discharge tomorrow',
          },
          {
            id: 'patient_004',
            firstName: 'Robert',
            lastName: 'Martin',
            room: '104',
            bed: 'B',
            status: 'critical',
            lastVitals: {
              bloodPressure: '110/60',
              heartRate: 95,
              temperature: 38.5,
              respiratoryRate: 22,
            },
            lastVitalsTime: new Date(Date.now() - 1200000).toISOString(),
            pendingMedications: 3,
            pendingOrdersCount: 2,
            notes: 'High fever, possible infection',
          },
        ],
        total: 4,
      },
    });

    // Mock shift handover initiation
    await mockApiResponse(page, '**/nurse/shifts/shift_001/initiate-handover**', {
      status: 200,
      body: {
        success: true,
        handoverId: 'handover_001',
        status: 'initiated',
        createdAt: new Date().toISOString(),
        nextNurseId: 'nurse_002',
        nextNurseName: 'Sophie Bernard',
      },
    });

    // Mock handover details
    await mockApiResponse(page, '**/nurse/handovers/handover_001**', {
      status: 200,
      body: {
        success: true,
        data: {
          id: 'handover_001',
          fromNurse: {
            id: 'nurse_001',
            name: 'Caroline Leclerc',
            shiftStart: new Date(Date.now() - 7200000).toISOString(),
            shiftEnd: new Date(Date.now() + 3600000).toISOString(),
          },
          toNurse: {
            id: 'nurse_002',
            name: 'Sophie Bernard',
          },
          patients: [
            {
              patientId: 'patient_001',
              name: 'Paul Deschamp',
              status: 'stable',
              summary: 'Stable, continue current medications',
            },
            {
              patientId: 'patient_002',
              name: 'Marie Dupuis',
              status: 'attention_needed',
              summary: 'Monitor temperature, may need fluids',
            },
            {
              patientId: 'patient_003',
              name: 'Jean Leclerc',
              status: 'stable',
              summary: 'Ready for discharge tomorrow morning',
            },
            {
              patientId: 'patient_004',
              name: 'Robert Martin',
              status: 'critical',
              summary: 'High fever, possible infection, monitor closely',
            },
          ],
          criticalAlerts: ['patient_004'],
          pendingTasks: ['order_002', 'order_004'],
          createdAt: new Date().toISOString(),
          status: 'pending_acceptance',
        },
      },
    });

    // Mock patient status update
    await mockApiResponse(page, '**/nurse/patients/patient_001/status**', {
      status: 200,
      body: {
        success: true,
        status: 'stable',
        vitals: {
          bloodPressure: '130/80',
          heartRate: 72,
          temperature: 36.8,
          respiratoryRate: 16,
        },
        updatedAt: new Date().toISOString(),
      },
    });

    // Mock handover acceptance
    await mockApiResponse(page, '**/nurse/handovers/handover_001/accept**', {
      status: 200,
      body: {
        success: true,
        message: 'Handover accepted',
        acceptedAt: new Date().toISOString(),
        acceptedBy: 'Sophie Bernard',
      },
    });

    // Mock medication verification
    await mockApiResponse(page, '**/nurse/patients/patient_002/medications/verify**', {
      status: 200,
      body: {
        success: true,
        medicationsVerified: 2,
        medicationsReceived: 2,
        verifiedAt: new Date().toISOString(),
      },
    });
  });

  test('should display shift information and patient assignments', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Verify current shift information
    const shiftInfo = nursePage.locator('[data-testid="current-shift-info"]');
    await expect(shiftInfo).toBeVisible();

    // Verify assigned patients count
    const patientCount = nursePage.locator('[data-testid="assigned-patients-count"]');
    await expect(patientCount).toBeVisible();
    await expect(patientCount).toContainText(/4|assignment/i);
  });

  test('should initiate shift handover process', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Click handover button
    const handoverButton = nursePage.locator('[data-testid="initiate-handover-button"]');
    await expect(handoverButton).toBeVisible();
    await handoverButton.click();
    await page.waitForLoadState('networkidle');

    // Verify handover form shown
    const handoverForm = nursePage.locator('[data-testid="handover-form"]');
    await expect(handoverForm).toBeVisible();

    // Verify next nurse selection
    const nextNurseSelect = nursePage.locator('[data-testid="next-nurse-select"]');
    await expect(nextNurseSelect).toBeVisible();
  });

  test('should display patient summary for handover', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Initiate handover
    const handoverButton = nursePage.locator('[data-testid="initiate-handover-button"]');
    await handoverButton.click();
    await page.waitForLoadState('networkidle');

    // Verify patient list in handover
    const patientList = nursePage.locator('[data-testid="handover-patient-list"]');
    await expect(patientList).toBeVisible();

    // Verify patient cards displayed
    const patientCards = nursePage.locator('[data-testid^="handover-patient-"]');
    const count = await patientCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should highlight critical patients in handover', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Initiate handover
    const handoverButton = nursePage.locator('[data-testid="initiate-handover-button"]');
    await handoverButton.click();
    await page.waitForLoadState('networkidle');

    // Verify critical patient highlighted
    const criticalAlert = nursePage.locator('[data-testid="handover-patient-patient_004"] [data-testid="critical-alert"]');
    await expect(criticalAlert).toBeVisible();
    await expect(criticalAlert).toContainText(/critical|urgent/i);
  });

  test('should show pending medications in handover', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Initiate handover
    const handoverButton = nursePage.locator('[data-testid="initiate-handover-button"]');
    await handoverButton.click();
    await page.waitForLoadState('networkidle');

    // Verify pending medications shown for patient_002
    const pendingMeds = nursePage.locator('[data-testid="handover-patient-patient_002"] [data-testid="pending-medications"]');
    await expect(pendingMeds).toBeVisible();
    await expect(pendingMeds).toContainText(/2|pending/i);
  });

  test('should display patient vitals in handover notes', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Initiate handover
    const handoverButton = nursePage.locator('[data-testid="initiate-handover-button"]');
    await handoverButton.click();
    await page.waitForLoadState('networkidle');

    // Check patient vitals displayed
    const vitalsInfo = nursePage.locator('[data-testid="handover-patient-patient_002"] [data-testid="patient-vitals"]');
    await expect(vitalsInfo).toBeVisible();

    // Verify fever indicator
    const tempInfo = vitalsInfo.locator('[data-testid="temperature"]');
    await expect(tempInfo).toContainText(/37.2|fever/i);
  });

  test('should show outstanding orders in handover', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Initiate handover
    const handoverButton = nursePage.locator('[data-testid="initiate-handover-button"]');
    await handoverButton.click();
    await page.waitForLoadState('networkidle');

    // Verify pending orders section
    const pendingOrders = nursePage.locator('[data-testid="handover-pending-orders"]');
    await expect(pendingOrders).toBeVisible();

    // Verify orders listed
    const orderItems = nursePage.locator('[data-testid^="pending-order-"]');
    const count = await orderItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should add notes to handover summary', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Initiate handover
    const handoverButton = nursePage.locator('[data-testid="initiate-handover-button"]');
    await handoverButton.click();
    await page.waitForLoadState('networkidle');

    // Add handover notes
    const notesInput = nursePage.locator('[data-testid="handover-notes-input"]');
    await notesInput.fill('All patients stable except Robert Martin. Monitor temperature and medication orders.');

    // Verify notes added
    const notesValue = await notesInput.inputValue();
    expect(notesValue).toContain('Robert Martin');
  });

  test('should review handover details before submission', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Initiate handover
    const handoverButton = nursePage.locator('[data-testid="initiate-handover-button"]');
    await handoverButton.click();
    await page.waitForLoadState('networkidle');

    // Fill next nurse
    const nextNurseSelect = nursePage.locator('[data-testid="next-nurse-select"]');
    await nextNurseSelect.selectOption('nurse_002');

    // Click review button
    const reviewButton = nursePage.locator('[data-testid="review-handover-button"]');
    await reviewButton.click();
    await page.waitForLoadState('networkidle');

    // Verify review summary
    const reviewSummary = nursePage.locator('[data-testid="handover-review-summary"]');
    await expect(reviewSummary).toBeVisible();
  });

  test('should submit shift handover', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Initiate handover
    const handoverButton = nursePage.locator('[data-testid="initiate-handover-button"]');
    await handoverButton.click();
    await page.waitForLoadState('networkidle');

    // Select next nurse
    const nextNurseSelect = nursePage.locator('[data-testid="next-nurse-select"]');
    await nextNurseSelect.selectOption('nurse_002');

    // Submit handover
    const submitButton = nursePage.locator('[data-testid="submit-handover-button"]');
    await submitButton.click();
    await page.waitForLoadState('networkidle');

    // Verify success message
    const successMessage = nursePage.locator('[data-testid="handover-submitted-message"]');
    await expect(successMessage).toBeVisible();
  });

  test('should verify medication delivery in handover context', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Initiate handover
    const handoverButton = nursePage.locator('[data-testid="initiate-handover-button"]');
    await handoverButton.click();
    await page.waitForLoadState('networkidle');

    // Click on patient with pending meds
    const patientCard = nursePage.locator('[data-testid="handover-patient-patient_002"]');
    await patientCard.click();
    await page.waitForLoadState('networkidle');

    // Verify medications shown
    const medicationsList = nursePage.locator('[data-testid="patient-medications-list"]');
    await expect(medicationsList).toBeVisible();

    // Mark medication as received
    const medCheckbox = nursePage.locator('[data-testid^="medication-received-"]').first();
    await medCheckbox.check();

    // Verify checked
    const isChecked = await medCheckbox.isChecked();
    expect(isChecked).toBeTruthy();
  });

  test('should display patient notes and alerts in handover', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Initiate handover
    const handoverButton = nursePage.locator('[data-testid="initiate-handover-button"]');
    await handoverButton.click();
    await page.waitForLoadState('networkidle');

    // Verify critical patient notes displayed
    const criticalNotes = nursePage.locator('[data-testid="handover-patient-patient_004"] [data-testid="patient-notes"]');
    await expect(criticalNotes).toBeVisible();
    await expect(criticalNotes).toContainText(/High fever|infection/i);
  });

  test('should show last vitals check time', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Initiate handover
    const handoverButton = nursePage.locator('[data-testid="initiate-handover-button"]');
    await handoverButton.click();
    await page.waitForLoadState('networkidle');

    // Verify last vitals time shown
    const vitalTime = nursePage.locator('[data-testid="handover-patient-patient_001"] [data-testid="last-vitals-time"]');
    await expect(vitalTime).toBeVisible();
  });

  test('should allow accepting handover as incoming nurse', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Look for pending handover notification
    const handoverNotif = nursePage.locator('[data-testid="pending-handover-notification"]');
    if (await handoverNotif.isVisible()) {
      await handoverNotif.click();
      await page.waitForLoadState('networkidle');

      // Verify handover details shown
      const handoverDetails = nursePage.locator('[data-testid="incoming-handover-details"]');
      await expect(handoverDetails).toBeVisible();

      // Accept handover
      const acceptButton = nursePage.locator('[data-testid="accept-handover-button"]');
      if (await acceptButton.isVisible()) {
        await acceptButton.click();
        await page.waitForLoadState('networkidle');

        // Verify acceptance confirmed
        const acceptedMsg = nursePage.locator('[data-testid="handover-accepted-message"]');
        await expect(acceptedMsg).toBeVisible();
      }
    }
  });

  test('should display handover history for ward', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Navigate to handover history
    const historyButton = nursePage.locator('[data-testid="handover-history-button"]');
    if (await historyButton.isVisible()) {
      await historyButton.click();
      await page.waitForLoadState('networkidle');

      // Verify history list displayed
      const historyList = nursePage.locator('[data-testid="handover-history-list"]');
      await expect(historyList).toBeVisible();
    }
  });

  test('should generate handover report as PDF', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Initiate handover
    const handoverButton = nursePage.locator('[data-testid="initiate-handover-button"]');
    await handoverButton.click();
    await page.waitForLoadState('networkidle');

    // Click export/print button
    const exportButton = nursePage.locator('[data-testid="export-handover-button"]');
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForEvent('download');
    }
  });

  test('should validate critical information before handover completion', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Initiate handover
    const handoverButton = nursePage.locator('[data-testid="initiate-handover-button"]');
    await handoverButton.click();
    await page.waitForLoadState('networkidle');

    // Try to submit without required fields
    const submitButton = nursePage.locator('[data-testid="submit-handover-button"]');

    // Verify submit button disabled if next nurse not selected
    const nextNurseSelect = nursePage.locator('[data-testid="next-nurse-select"]');
    const currentValue = await nextNurseSelect.inputValue();

    if (!currentValue) {
      // Button should be disabled or show error
      const isDisabled = await submitButton.isDisabled();
      expect(isDisabled).toBeTruthy();
    }
  });
});
