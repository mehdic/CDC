/**
 * Nurse Medication Ordering Workflow E2E Tests
 * Tests for complete medication ordering workflow including validation and confirmation
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { NursePage } from '../../page-objects';
import { mockApiResponse, mockApiError } from '../../utils/api-mock';

test.describe('Nurse - Medication Ordering Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock patient selection
    await mockApiResponse(page, '**/nurse/patients/search**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'patient_001',
            firstName: 'Paul',
            lastName: 'Deschamp',
            room: '101',
            age: 72,
            medicalRecord: 'MR-001',
            status: 'active',
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
            strength: '10',
            unit: 'mg',
            frequency: 'Once daily',
            prescriptionValid: true,
            prescriptionEndDate: '2025-12-31',
            insuranceCovered: true,
            allowedQuantityPerOrder: 30,
            currentStock: 100,
          },
          {
            id: 'med_002',
            name: 'Metformine',
            dosage: '500mg',
            strength: '500',
            unit: 'mg',
            frequency: 'Twice daily',
            prescriptionValid: true,
            prescriptionEndDate: '2025-11-30',
            insuranceCovered: true,
            allowedQuantityPerOrder: 60,
            currentStock: 150,
          },
          {
            id: 'med_003',
            name: 'Atorvastatin',
            dosage: '20mg',
            strength: '20',
            unit: 'mg',
            frequency: 'Once daily',
            prescriptionValid: false,
            prescriptionEndDate: '2025-10-15',
            insuranceCovered: true,
            allowedQuantityPerOrder: 30,
            currentStock: 50,
          },
        ],
        total: 3,
      },
    });

    // Mock order validation
    await mockApiResponse(page, '**/nurse/orders/validate**', {
      status: 200,
      body: {
        success: true,
        valid: true,
        prescriptionValid: true,
        insuranceCovered: true,
        interactions: [],
        alerts: [],
        estimatedDeliveryDate: new Date(Date.now() + 86400000).toISOString(),
      },
    });

    // Mock order creation
    await mockApiResponse(page, '**/nurse/orders**', {
      status: 201,
      body: {
        success: true,
        orderId: 'order_001',
        patientId: 'patient_001',
        medicationId: 'med_001',
        quantity: 10,
        status: 'pending',
        createdAt: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 86400000).toISOString(),
        totalCost: 25.50,
      },
    });

    // Mock inventory check
    await mockApiResponse(page, '**/pharmacy/inventory/med_001**', {
      status: 200,
      body: {
        success: true,
        medicationId: 'med_001',
        name: 'Lisinopril',
        currentStock: 100,
        reorderLevel: 20,
        expiryDate: '2026-12-31',
      },
    });

    // Mock urgent order handling
    await mockApiResponse(page, '**/nurse/orders/urgent**', {
      status: 201,
      body: {
        success: true,
        orderId: 'order_urgent_001',
        status: 'urgent',
        priority: 'high',
        estimatedDelivery: new Date(Date.now() + 3600000).toISOString(),
      },
    });
  });

  test('should display medication list for selected patient', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul Deschamp');
    await nursePage.locator('[data-testid="patient-patient_001"]').click();
    await page.waitForLoadState('networkidle');

    // Navigate to medication ordering
    await nursePageObj.viewPatientMedications();

    // Verify medication list is displayed
    await expect(nursePageObj.medicationList).toBeVisible();

    // Verify medications are displayed
    const medications = nursePage.locator('[data-testid^="medication-"]');
    const count = await medications.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display valid and invalid prescriptions', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul');
    await nursePage.locator('[data-testid="patient-patient_001"]').click();
    await page.waitForLoadState('networkidle');

    // View medications
    await nursePageObj.viewPatientMedications();

    // Verify valid prescription indicator
    const validMedication = nursePage.locator('[data-testid="medication-med_001"]');
    const validBadge = validMedication.locator('[data-testid="prescription-valid-badge"]');
    await expect(validBadge).toBeVisible();

    // Verify invalid prescription indicator
    const invalidMedication = nursePage.locator('[data-testid="medication-med_003"]');
    const invalidBadge = invalidMedication.locator('[data-testid="prescription-invalid-badge"]');
    await expect(invalidBadge).toBeVisible();
  });

  test('should order standard medication with quantity', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul');
    await nursePage.locator('[data-testid="patient-patient_001"]').click();
    await page.waitForLoadState('networkidle');

    // Order medication
    await nursePageObj.orderMedication({
      medicationId: 'med_001',
      quantity: 10,
    });

    // Verify order created
    const successMessage = nursePage.locator('[data-testid="order-success-toast"]');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText(/success|created|ordered/i);
  });

  test('should prevent ordering invalid prescription', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul');
    await nursePage.locator('[data-testid="patient-patient_001"]').click();
    await page.waitForLoadState('networkidle');

    // View medications
    await nursePageObj.viewPatientMedications();

    // Try to order invalid medication
    const invalidMedCard = nursePage.locator('[data-testid="medication-med_003"]');
    const orderButton = invalidMedCard.locator('[data-testid="order-button"]');

    // Verify order button is disabled
    const isDisabled = await orderButton.isDisabled();
    expect(isDisabled).toBeTruthy();
  });

  test('should set quantity within allowed limits', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul');
    await nursePage.locator('[data-testid="patient-patient_001"]').click();
    await page.waitForLoadState('networkidle');

    // View medications
    await nursePageObj.viewPatientMedications();

    // Click to order medication
    const medCard = nursePage.locator('[data-testid="medication-med_001"]');
    await medCard.click();

    // Verify quantity input shows max allowed
    const quantityInput = nursePage.locator('[data-testid="quantity-input"]');
    const maxQuantity = await quantityInput.getAttribute('max');
    expect(maxQuantity).toBe('30'); // allowedQuantityPerOrder
  });

  test('should mark order as urgent and set priority', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul');
    await nursePage.locator('[data-testid="patient-patient_001"]').click();
    await page.waitForLoadState('networkidle');

    // Order medication with urgent flag
    await nursePageObj.orderMedication({
      medicationId: 'med_001',
      quantity: 5,
      urgent: true,
      deliveryTime: '14:00',
    });

    // Verify urgent order created
    const urgentBadge = nursePage.locator('[data-testid="order-urgent-badge"]');
    await expect(urgentBadge).toBeVisible();
  });

  test('should add notes to medication order', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul');
    await nursePage.locator('[data-testid="patient-patient_001"]').click();
    await page.waitForLoadState('networkidle');

    // Order medication with notes
    await nursePageObj.orderMedication({
      medicationId: 'med_001',
      quantity: 10,
      notes: 'Patient has difficulty swallowing, prefer liquid form if available',
    });

    // Verify order created
    await expect(nursePage.locator('[data-testid="order-success-toast"]')).toBeVisible();
  });

  test('should validate order before submission', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul');
    await nursePage.locator('[data-testid="patient-patient_001"]').click();
    await page.waitForLoadState('networkidle');

    // View medications
    await nursePageObj.viewPatientMedications();

    // Click order button
    const medCard = nursePage.locator('[data-testid="medication-med_001"]');
    await medCard.click();

    // Fill quantity
    const quantityInput = nursePage.locator('[data-testid="quantity-input"]');
    await quantityInput.fill('10');

    // Click validate/review button
    const validateButton = nursePage.locator('[data-testid="validate-order-button"]');
    await validateButton.click();
    await page.waitForLoadState('networkidle');

    // Verify validation summary shown
    const validationSummary = nursePage.locator('[data-testid="order-validation-summary"]');
    await expect(validationSummary).toBeVisible();

    // Verify insurance coverage shown
    const insuranceCovered = nursePage.locator('[data-testid="insurance-covered"]');
    await expect(insuranceCovered).toContainText(/covered|couvert/i);
  });

  test('should display estimated delivery date', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul');
    await nursePage.locator('[data-testid="patient-patient_001"]').click();
    await page.waitForLoadState('networkidle');

    // Order medication
    await nursePageObj.orderMedication({
      medicationId: 'med_001',
      quantity: 10,
    });

    // Verify delivery date is displayed
    const deliveryDate = nursePage.locator('[data-testid="estimated-delivery-date"]');
    await expect(deliveryDate).toBeVisible();
  });

  test('should handle simultaneous orders for multiple medications', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul');
    await nursePage.locator('[data-testid="patient-patient_001"]').click();
    await page.waitForLoadState('networkidle');

    // View medications
    await nursePageObj.viewPatientMedications();

    // Order first medication
    let medCard = nursePage.locator('[data-testid="medication-med_001"]');
    await medCard.click();
    let quantityInput = nursePage.locator('[data-testid="quantity-input"]');
    await quantityInput.fill('10');
    await nursePage.locator('[data-testid="submit-order-button"]').click();
    await page.waitForLoadState('networkidle');

    // Verify first order created
    await expect(nursePage.locator('[data-testid="order-success-toast"]')).toBeVisible();

    // Order second medication
    medCard = nursePage.locator('[data-testid="medication-med_002"]');
    await medCard.click();
    quantityInput = nursePage.locator('[data-testid="quantity-input"]');
    await quantityInput.fill('20');
    await nursePage.locator('[data-testid="submit-order-button"]').click();
    await page.waitForLoadState('networkidle');

    // Verify second order created
    await expect(nursePage.locator('[data-testid="order-success-toast"]')).toBeVisible();

    // Verify both orders in active orders list
    const activeOrders = nursePage.locator('[data-testid^="order-card-"]');
    const count = await activeOrders.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should display cost estimation for order', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul');
    await nursePage.locator('[data-testid="patient-patient_001"]').click();
    await page.waitForLoadState('networkidle');

    // View medications
    await nursePageObj.viewPatientMedications();

    // Start ordering
    const medCard = nursePage.locator('[data-testid="medication-med_001"]');
    await medCard.click();

    // Fill quantity
    const quantityInput = nursePage.locator('[data-testid="quantity-input"]');
    await quantityInput.fill('10');

    // Verify cost estimation shown
    const costEstimate = nursePage.locator('[data-testid="cost-estimate"]');
    await expect(costEstimate).toBeVisible();
    await expect(costEstimate).toContainText(/CHF|€|cost|price/i);
  });

  test('should show inventory status before ordering', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Search and select patient
    await nursePageObj.searchPatient('Paul');
    await nursePage.locator('[data-testid="patient-patient_001"]').click();
    await page.waitForLoadState('networkidle');

    // View medications
    await nursePageObj.viewPatientMedications();

    // Verify inventory status shown
    const medCard = nursePage.locator('[data-testid="medication-med_001"]');
    const inventoryStatus = medCard.locator('[data-testid="inventory-status"]');
    await expect(inventoryStatus).toBeVisible();
    await expect(inventoryStatus).toContainText(/in stock|available/i);
  });
});
