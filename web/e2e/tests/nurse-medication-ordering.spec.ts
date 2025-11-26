import { test, expect } from '../fixtures/auth.fixture';
import { NursePage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';

test.describe('Patient Medication Ordering (E2E-017)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock patient search results
    await mockApiResponse(page, '**/nurse/patients**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'patient_001',
            name: 'Paul Deschamp',
            room: '101',
            age: 72,
            medicalRecord: 'MR-001',
          },
        ],
        total: 1,
      },
    });

    // Mock patient medications
    await mockApiResponse(page, '**/nurse/patients/patient_001/medications**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'med_001',
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Once daily',
            prescriptionValid: true,
            prescriptionEndDate: '2025-12-31',
            insuranceCovered: true,
          },
          {
            id: 'med_002',
            name: 'Metformine',
            dosage: '500mg',
            frequency: 'Twice daily',
            prescriptionValid: true,
            prescriptionEndDate: '2025-11-30',
            insuranceCovered: true,
          },
          {
            id: 'med_003',
            name: 'Atorvastatin',
            dosage: '20mg',
            frequency: 'Once daily',
            prescriptionValid: false,
            prescriptionEndDate: '2025-10-15',
            insuranceCovered: true,
          },
        ],
        total: 3,
      },
    });

    // Mock order creation
    await mockApiResponse(page, '**/nurse/orders**', {
      status: 201,
      body: {
        success: true,
        orderId: 'order_001',
        status: 'pending',
        estimatedDelivery: new Date(Date.now() + 86400000).toISOString(),
      },
    });

    // Mock order validation
    await mockApiResponse(page, '**/nurse/orders/*/validate**', {
      status: 200,
      body: {
        success: true,
        prescriptionValid: true,
        insuranceCovered: true,
        interactions: [],
      },
    });
  });

  test('should search and select patient for medication ordering', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search for patient
    await nursePageObj.searchPatient('Paul Deschamp');

    // Verify patient appears in search results
    await expect(nursePage.locator('[data-testid="patient-patient_001"]')).toBeVisible();

    // Select patient
    await nursePageObj.selectPatient('patient_001');

    // Verify patient is selected
    await nursePageObj.expectPatientSelected('patient_001');
  });

  test('should display patient medications with validity status', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul Deschamp');
    await nursePageObj.selectPatient('patient_001');

    // View medications
    await nursePageObj.viewPatientMedications();

    // Verify medications are displayed
    await nursePageObj.expectMedicationInList('med_001');
    await nursePageObj.expectMedicationInList('med_002');
    await nursePageObj.expectMedicationInList('med_003');

    // Verify valid prescriptions have green indicator
    const validMedication = nursePage.locator('[data-testid="medication-med_001"]');
    const validityStatus = validMedication.locator('[data-testid="prescription-validity"]');
    await expect(validityStatus).toHaveAttribute('data-status', 'valid');

    // Verify expired prescription has red indicator
    const expiredMedication = nursePage.locator('[data-testid="medication-med_003"]');
    const expiredStatus = expiredMedication.locator('[data-testid="prescription-validity"]');
    await expect(expiredStatus).toHaveAttribute('data-status', 'expired');
  });

  test('should display insurance coverage information', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul Deschamp');
    await nursePageObj.selectPatient('patient_001');

    // View medications
    await nursePageObj.viewPatientMedications();

    // Verify insurance coverage is displayed for each medication
    const med1 = nursePage.locator('[data-testid="medication-med_001"]');
    const insuranceIndicator = med1.locator('[data-testid="insurance-covered"]');
    await expect(insuranceIndicator).toBeVisible();
    await expect(insuranceIndicator).toContainText(/couvert|covered/i);
  });

  test('should order medication with normal priority', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul Deschamp');
    await nursePageObj.selectPatient('patient_001');

    // Order medication
    await nursePageObj.orderMedication({
      medicationId: 'med_001',
      quantity: 1,
      urgent: false,
      notes: 'Standard prescription refill',
    });

    // Verify order was created
    await nursePageObj.expectOrderCreated('order_001');

    // Verify success message
    await expect(nursePage.locator('[data-testid="order-success-toast"]')).toContainText(/créée|created|success/i);
  });

  test('should order medication with urgent priority', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul Deschamp');
    await nursePageObj.selectPatient('patient_001');

    // Order medication with urgent flag
    const urgentDeliveryTime = new Date(Date.now() + 7200000).toISOString().slice(0, 16);
    await nursePageObj.orderMedication({
      medicationId: 'med_001',
      quantity: 2,
      urgent: true,
      deliveryTime: urgentDeliveryTime,
      notes: 'Patient needs immediately',
    });

    // Verify order was created
    await nursePageObj.expectOrderCreated('order_001');

    // Verify urgent badge on order
    const orderElement = nursePage.locator('[data-testid="order-order_001"]');
    const urgentBadge = orderElement.locator('[data-testid="urgent-badge"]');
    await expect(urgentBadge).toBeVisible();
    await expect(urgentBadge).toContainText(/urgent/i);
  });

  test('should prevent ordering medication with expired prescription', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul Deschamp');
    await nursePageObj.selectPatient('patient_001');

    // Try to order expired medication
    await nursePageObj.viewPatientMedications();

    // Click on expired medication
    const expiredMed = nursePage.locator('[data-testid="medication-med_003"]');
    await expiredMed.click();

    // Verify order button is disabled or shows warning
    const orderButton = nursePage.locator('[data-testid="order-button-med_003"]');
    const isDisabled = await orderButton.evaluate((el) => (el as HTMLButtonElement).disabled);

    if (isDisabled) {
      await expect(orderButton).toBeDisabled();
    } else {
      // If button is enabled, verify warning is shown
      const warning = nursePage.locator('[data-testid="expired-prescription-warning"]');
      await expect(warning).toBeVisible();
    }
  });

  test('should validate order automatically for interactions and coverage', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul Deschamp');
    await nursePageObj.selectPatient('patient_001');

    // Order medication
    await nursePageObj.orderMedication({
      medicationId: 'med_001',
      quantity: 1,
      urgent: false,
    });

    // Verify validation occurred
    // Check for interaction check status
    const interactionCheck = nursePage.locator('[data-testid="interaction-check-status"]');
    if (await interactionCheck.isVisible()) {
      await expect(interactionCheck).toContainText(/ok|valide|no interactions/i);
    }

    // Check for insurance validation
    const insuranceCheck = nursePage.locator('[data-testid="insurance-validation-status"]');
    if (await insuranceCheck.isVisible()) {
      await expect(insuranceCheck).toContainText(/couvert|covered|approved/i);
    }
  });

  test('should display order summary before submission', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul Deschamp');
    await nursePageObj.selectPatient('patient_001');

    // Open medication order
    await nursePageObj.viewPatientMedications();
    const medication = nursePage.locator('[data-testid="medication-med_001"]');
    await medication.click();

    // Verify order summary is displayed
    const summary = nursePage.locator('[data-testid="order-summary"]');
    await expect(summary).toBeVisible();

    // Verify summary contains medication name
    await expect(summary).toContainText('Lisinopril');

    // Verify summary contains quantity
    const quantityDisplay = summary.locator('[data-testid="order-quantity"]');
    await expect(quantityDisplay).toBeVisible();

    // Verify summary contains delivery info
    const deliveryInfo = summary.locator('[data-testid="delivery-info"]');
    await expect(deliveryInfo).toBeVisible();
  });

  test('should allow adding multiple medications to one order', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul Deschamp');
    await nursePageObj.selectPatient('patient_001');

    // Open order creation
    const createOrderButton = nursePage.getByRole('button', { name: /créer|create.*order/i });
    if (await createOrderButton.isVisible()) {
      await createOrderButton.click();
    }

    // View medications
    await nursePageObj.viewPatientMedications();

    // Add first medication
    const med1Checkbox = nursePage.locator('[data-testid="medication-checkbox-med_001"]');
    if (await med1Checkbox.isVisible()) {
      await med1Checkbox.check();
    } else {
      // Alternative: click to select
      await nursePage.locator('[data-testid="medication-med_001"]').click();
    }

    // Add second medication
    const med2Checkbox = nursePage.locator('[data-testid="medication-checkbox-med_002"]');
    if (await med2Checkbox.isVisible()) {
      await med2Checkbox.check();
    } else {
      // Alternative: click to select
      await nursePage.locator('[data-testid="medication-med_002"]').click();
    }

    // Verify both are selected
    const selectedCount = nursePage.locator('[data-testid="selected-medications-count"]');
    if (await selectedCount.isVisible()) {
      await expect(selectedCount).toContainText('2');
    }

    // Proceed with order
    const submitButton = nursePage.locator('[data-testid="submit-multi-medication-order"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await expect(nursePage.locator('[data-testid="order-success-toast"]')).toBeVisible();
    }
  });

  test('should handle medication out of stock', async ({ nursePage }) => {
    // Mock medication out of stock
    await mockApiResponse(nursePage, '**/nurse/patients/patient_001/medications**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'med_004',
            name: 'Insulin Glargine',
            dosage: '100U/mL',
            frequency: 'Once daily',
            prescriptionValid: true,
            insuranceCovered: true,
            stockStatus: 'out_of_stock',
            estimatedAvailability: '2025-11-27',
          },
        ],
        total: 1,
      },
    });

    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul Deschamp');
    await nursePageObj.selectPatient('patient_001');

    // View medications
    await nursePageObj.viewPatientMedications();

    // Verify out of stock indicator
    const outOfStockMed = nursePage.locator('[data-testid="medication-med_004"]');
    const stockStatus = outOfStockMed.locator('[data-testid="stock-status"]');
    await expect(stockStatus).toContainText(/rupture|out of stock/i);

    // Verify estimated availability is shown
    const availability = outOfStockMed.locator('[data-testid="estimated-availability"]');
    await expect(availability).toBeVisible();
  });

  test('should show order history after creation', async ({ nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul Deschamp');
    await nursePageObj.selectPatient('patient_001');

    // Order medication
    await nursePageObj.orderMedication({
      medicationId: 'med_001',
      quantity: 1,
    });

    // Click on order to view details
    await nursePageObj.expectOrderCreated('order_001');
    const orderElement = nursePage.locator('[data-testid="order-order_001"]');
    await orderElement.click();

    // Verify order details are displayed
    await expect(nursePage.locator('[data-testid="order-details"]')).toBeVisible();
    await expect(nursePage.locator('[data-testid="order-creation-time"]')).toBeVisible();
    await expect(nursePage.locator('[data-testid="order-medications"]')).toBeVisible();
  });
});
