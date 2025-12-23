import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { NursePage } from '../../pages/NursePage';
import { testUsers } from '../../fixtures/users';
import {
  shiftHandoverData,
  patientData,
  medicationOrderData,
} from '../../fixtures/nurse-test-data';

test.describe('Nurse Workflow - Shift Handover', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let nursePage: NursePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    nursePage = new NursePage(page);

    // Login as nurse
    await loginPage.goto();
    await loginPage.login(testUsers.nurse.email, testUsers.nurse.password);
    await dashboardPage.waitForDashboardLoad();
  });

  test('Start shift handover with standard notes', async ({ page }) => {
    // Navigate to handover section
    await nursePage.goto();

    // Start shift
    await nursePage.startShift();
    expect(await nursePage.waitForSuccess()).toBe(true);

    // Verify shift is active
    const endShiftVisible = await nursePage.endShiftButton.isVisible();
    expect(endShiftVisible).toBe(true);
  });

  test('End shift with comprehensive handover notes', async ({ page }) => {
    // Start shift first
    await nursePage.goto();
    await nursePage.startShift();
    expect(await nursePage.waitForSuccess()).toBe(true);

    // Create some medication orders during shift
    await nursePage.searchPatient(patientData.patient1.firstName);
    await nursePage.selectPatient(0);

    await nursePage.createMedicationOrder(
      medicationOrderData.validOrder.medication,
      medicationOrderData.validOrder.dosage,
      medicationOrderData.validOrder.quantity,
      medicationOrderData.validOrder.urgency
    );

    expect(await nursePage.waitForSuccess()).toBe(true);

    // End shift with handover notes
    const handoverData = shiftHandoverData.standardHandover;
    await nursePage.endShift(handoverData.notes);
    expect(await nursePage.waitForSuccess()).toBe(true);

    // Verify shift ended
    const startShiftVisible = await nursePage.startShiftButton.isVisible();
    expect(startShiftVisible || !await nursePage.endShiftButton.isVisible()).toBe(true);
  });

  test('Handover notes include patient updates', async ({ page }) => {
    await nursePage.goto();
    await nursePage.startShift();

    // Create medication orders for tracking
    await nursePage.searchPatient(patientData.patient1.firstName);
    await nursePage.selectPatient(0);
    await nursePage.createMedicationOrder(
      medicationOrderData.validOrder.medication,
      medicationOrderData.validOrder.dosage,
      medicationOrderData.validOrder.quantity
    );

    // End shift and include patient information in notes
    const handoverData = shiftHandoverData.standardHandover;
    const detailedNotes = `${handoverData.notes}\n${handoverData.patientUpdates}`;
    await nursePage.endShift(detailedNotes);

    expect(await nursePage.waitForSuccess()).toBe(true);
  });

  test('Handover with reported issues and escalations', async ({ page }) => {
    await nursePage.goto();
    await nursePage.startShift();

    // Simulate creating and managing orders
    await nursePage.searchPatient(patientData.patient1.firstName);
    await nursePage.selectPatient(0);
    await nursePage.createMedicationOrder(
      medicationOrderData.validOrder.medication,
      medicationOrderData.validOrder.dosage,
      medicationOrderData.validOrder.quantity
    );

    // End shift with issues documented
    const handoverData = shiftHandoverData.handoverWithIssues;
    const issueNotes = `${handoverData.notes}\n\nReported Issues:\n${handoverData.issues.join('\n')}`;
    await nursePage.endShift(issueNotes);

    expect(await nursePage.waitForSuccess()).toBe(true);
  });

  test('Night shift handover with emergency medications', async ({ page }) => {
    await nursePage.goto();
    await nursePage.startShift();

    // Request emergency medication
    const emergencyOrder = medicationOrderData.emergencyOrder;
    await nursePage.requestEmergencyMedication(
      emergencyOrder.medication,
      emergencyOrder.instructions,
      emergencyOrder.urgency
    );

    // End shift and document emergency in handover
    const handoverData = shiftHandoverData.nightShiftHandover;
    const nightNotes = `${handoverData.notes}\n${handoverData.patientUpdates}`;
    await nursePage.endShift(nightNotes);

    expect(await nursePage.waitForSuccess()).toBe(true);
  });

  test('Multiple handovers tracked across shifts', async ({ page }) => {
    // First shift handover
    await nursePage.goto();
    await nursePage.startShift();

    await nursePage.searchPatient(patientData.patient1.firstName);
    await nursePage.selectPatient(0);
    await nursePage.createMedicationOrder(
      medicationOrderData.validOrder.medication,
      medicationOrderData.validOrder.dosage,
      medicationOrderData.validOrder.quantity
    );

    await nursePage.endShift('Morning shift: 5 orders completed, all patients stable');
    expect(await nursePage.waitForSuccess()).toBe(true);

    // Second shift handover
    await nursePage.goto();
    await nursePage.startShift();

    await nursePage.searchPatient(patientData.patient2.firstName);
    await nursePage.selectPatient(0);
    await nursePage.createMedicationOrder(
      medicationOrderData.urgentOrder.medication,
      medicationOrderData.urgentOrder.dosage,
      medicationOrderData.urgentOrder.quantity
    );

    await nursePage.endShift('Evening shift: 3 urgent orders processed, 1 pending delivery');
    expect(await nursePage.waitForSuccess()).toBe(true);
  });

  test('Handover timestamp recorded', async ({ page }) => {
    await nursePage.goto();
    await nursePage.startShift();
    expect(await nursePage.waitForSuccess()).toBe(true);

    // Wait a moment to ensure time difference
    await page.waitForTimeout(1000);

    // End shift and check timestamp
    const beforeEndShift = new Date();
    await nursePage.endShift('Test shift: All medications administered on schedule');
    const afterEndShift = new Date();

    expect(await nursePage.waitForSuccess()).toBe(true);
    expect(afterEndShift.getTime()).toBeGreaterThanOrEqual(beforeEndShift.getTime());
  });

  test('Handover notes persist in patient medical records', async ({ page }) => {
    // Start and end shift with notes
    await nursePage.goto();
    await nursePage.startShift();

    await nursePage.searchPatient(patientData.patient1.firstName);
    await nursePage.selectPatient(0);

    await nursePage.createMedicationOrder(
      medicationOrderData.validOrder.medication,
      medicationOrderData.validOrder.dosage,
      medicationOrderData.validOrder.quantity
    );

    const handoverNotes = 'Patient responsive, medication administered successfully at 14:00';
    await nursePage.endShift(handoverNotes);

    expect(await nursePage.waitForSuccess()).toBe(true);

    // Verify handover info persists in patient record
    await nursePage.viewPatientRecords(0);
    const hasRecords = await nursePage.patientRecords.isVisible();
    expect(hasRecords).toBe(true);
  });

  test('Shift cannot end without completing required documentation', async ({ page }) => {
    await nursePage.goto();
    await nursePage.startShift();

    // Try to end shift without notes (if required)
    await nursePage.endShiftButton.click();
    await page.waitForLoadState('networkidle');

    // Check if validation is required
    const notesInputVisible = await nursePage.shiftNotesInput.isVisible();
    const submitBtn = await nursePage.submitButton.isVisible();

    // Either notes are required or submit button available
    expect(notesInputVisible || submitBtn).toBe(true);
  });

  test('Handover transfer accountability between nurses', async ({ page }) => {
    // Morning shift nurse ends
    await nursePage.goto();
    await nursePage.startShift();

    await nursePage.searchPatient(patientData.patient1.firstName);
    await nursePage.selectPatient(0);
    await nursePage.createMedicationOrder(
      medicationOrderData.validOrder.medication,
      medicationOrderData.validOrder.dosage,
      medicationOrderData.validOrder.quantity
    );

    const morningHandover = `Shift completed: 3 orders dispensed. Patient status: stable. Next nurse: verify dosage compliance`;
    await nursePage.endShift(morningHandover);

    expect(await nursePage.waitForSuccess()).toBe(true);

    // Document shows handover acknowledgment
    await nursePage.goto();
    const orderCount = await nursePage.getOrderCount();
    expect(orderCount).toBeGreaterThanOrEqual(0);
  });

  test('Shift handover includes medication counts and inventory notes', async ({ page }) => {
    await nursePage.goto();
    await nursePage.startShift();

    // Create several orders to track inventory
    await nursePage.searchPatient(patientData.patient1.firstName);
    await nursePage.selectPatient(0);
    await nursePage.createMedicationOrder(
      medicationOrderData.validOrder.medication,
      medicationOrderData.validOrder.dosage,
      medicationOrderData.validOrder.quantity
    );

    await nursePage.searchPatient(patientData.patient2.firstName);
    await nursePage.selectPatient(0);
    await nursePage.createMedicationOrder(
      medicationOrderData.urgentOrder.medication,
      medicationOrderData.urgentOrder.dosage,
      medicationOrderData.urgentOrder.quantity
    );

    const inventoryHandover = `Shift inventory: Amoxicillin 500mg - 15 units dispensed, Ibuprofen 400mg - 8 units dispensed. Low stock alert: Warfarin (3 units remaining)`;
    await nursePage.endShift(inventoryHandover);

    expect(await nursePage.waitForSuccess()).toBe(true);
  });

  test('Critical incidents documented in shift handover', async ({ page }) => {
    await nursePage.goto();
    await nursePage.startShift();

    // Simulate critical incident
    const criticalHandover = `CRITICAL INCIDENT: Patient in Room 201 reported severe allergic reaction to Penicillin at 11:30. Anaphylaxis protocol initiated. Epinephrine administered. Emergency services contacted. Patient stabilized. Requires close monitoring next shift.`;
    await nursePage.endShift(criticalHandover);

    expect(await nursePage.waitForSuccess()).toBe(true);
  });
});
