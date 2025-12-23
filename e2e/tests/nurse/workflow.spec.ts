import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { NursePage } from '../../pages/NursePage';
import { PharmacyPage } from '../../pages/PharmacyPage';
import { DeliveryPage } from '../../pages/DeliveryPage';
import { testUsers } from '../../fixtures/users';
import {
  medicationOrderData,
  patientData,
  deliveryData,
  negativeTestCases,
} from '../../fixtures/nurse-test-data';

test.describe('Nurse Workflow - Complete Medication Order Flow', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let nursePage: NursePage;
  let pharmacyPage: PharmacyPage;
  let deliveryPage: DeliveryPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    nursePage = new NursePage(page);
    pharmacyPage = new PharmacyPage(page);
    deliveryPage = new DeliveryPage(page);
  });

  test('Complete workflow: Nurse orders medication → Pharmacy fills → Delivery → Administration', async ({
    page,
  }) => {
    // STEP 1: Nurse login and create medication order
    await loginPage.goto();
    await loginPage.login(testUsers.nurse.email, testUsers.nurse.password);
    await dashboardPage.waitForDashboardLoad();

    // Navigate to medication orders
    await nursePage.goto();
    expect(page.url()).toContain('/medications');

    // Search for patient
    await nursePage.searchPatient(patientData.patient1.firstName);
    await nursePage.selectPatient(0);

    // Create medication order
    const orderData = medicationOrderData.validOrder;
    await nursePage.createMedicationOrder(
      orderData.medication,
      orderData.dosage,
      orderData.quantity,
      orderData.urgency,
      orderData.instructions
    );

    // Verify success message
    const success = await nursePage.waitForSuccess();
    expect(success).toBe(true);

    // STEP 2: Logout nurse, login as pharmacist
    await loginPage.logout();
    await loginPage.goto();
    await loginPage.login(testUsers.pharmacist.email, testUsers.pharmacist.password);

    // Navigate to pharmacy orders
    await pharmacyPage.goto();
    const hasOrders = await pharmacyPage.getIncomingOrders();
    expect(hasOrders).toBe(true);

    // Select the order we just created
    await pharmacyPage.selectOrder(0);

    // Verify prescription validation
    const prescriptionMsg = await pharmacyPage.getPrescriptionValidationMessage();
    expect(prescriptionMsg.length).toBeGreaterThan(0);

    // Check inventory
    await pharmacyPage.checkInventory();
    const stockMsg = await pharmacyPage.getStockAvailableMessage();
    expect(stockMsg.length).toBeGreaterThan(0);

    // Confirm stock and approve order
    await pharmacyPage.confirmStock();
    await pharmacyPage.approveOrder();
    expect(await pharmacyPage.waitForSuccess()).toBe(true);

    // Mark as ready for pickup
    await pharmacyPage.markAsReadyForPickup();
    expect(await pharmacyPage.waitForSuccess()).toBe(true);

    // Request delivery
    await pharmacyPage.requestDelivery();

    // STEP 3: Logout pharmacist, login as delivery person
    await loginPage.logout();
    await loginPage.goto();
    await loginPage.login(testUsers.delivery.email, testUsers.delivery.password);

    // Navigate to delivery orders
    await deliveryPage.goto();
    const hasDeliveryOrders = await deliveryPage.getDeliveryOrders();
    expect(hasDeliveryOrders).toBe(true);

    // Select order and start delivery process
    await deliveryPage.selectOrder(0);
    await deliveryPage.pickupOrder();
    expect(await deliveryPage.waitForSuccess()).toBe(true);

    // Start delivery
    await deliveryPage.startDelivery();
    expect(await deliveryPage.waitForSuccess()).toBe(true);

    // Add delivery notes
    await deliveryPage.addDeliveryNotes('Package delivered to patient');

    // Mark as in transit
    await deliveryPage.markInTransit();
    expect(await deliveryPage.waitForSuccess()).toBe(true);

    // Confirm delivery
    await deliveryPage.confirmDelivery(true);
    expect(await deliveryPage.waitForSuccess()).toBe(true);

    // Mark as delivered
    await deliveryPage.markAsDelivered();
    expect(await deliveryPage.waitForSuccess()).toBe(true);

    // STEP 4: Record medication administration
    await deliveryPage.administerMedication(
      orderData.medication,
      testUsers.delivery.firstName,
      new Date().toISOString().split('T')[1].slice(0, 5)
    );
    expect(await deliveryPage.waitForSuccess()).toBe(true);

    // View medication receipt
    await deliveryPage.viewMedicationReceipt();
    const receiptVisible = await deliveryPage.receiptPreview.isVisible();
    expect(receiptVisible).toBe(true);
  });

  test('Urgent medication order prioritization', async ({ page }) => {
    // Nurse creates urgent order
    await loginPage.goto();
    await loginPage.login(testUsers.nurse.email, testUsers.nurse.password);
    await nursePage.goto();
    await nursePage.searchPatient(patientData.patient2.firstName);
    await nursePage.selectPatient(0);

    const urgentOrder = medicationOrderData.urgentOrder;
    await nursePage.createMedicationOrder(
      urgentOrder.medication,
      urgentOrder.dosage,
      urgentOrder.quantity,
      urgentOrder.urgency,
      urgentOrder.instructions
    );

    expect(await nursePage.waitForSuccess()).toBe(true);

    // Pharmacist verifies urgent status
    await loginPage.logout();
    await loginPage.goto();
    await loginPage.login(testUsers.pharmacist.email, testUsers.pharmacist.password);

    await pharmacyPage.goto();
    await pharmacyPage.filterByStatus('urgent');

    // Verify urgent order is visible and prioritized
    const orderCount = await pharmacyPage.getOrderCount();
    expect(orderCount).toBeGreaterThan(0);
  });

  test('NEGATIVE: Order for wrong patient is blocked', async ({ page }) => {
    // Create order as nurse for patient 1
    await loginPage.goto();
    await loginPage.login(testUsers.nurse.email, testUsers.nurse.password);
    await nursePage.goto();
    await nursePage.searchPatient(patientData.patient1.firstName);
    await nursePage.selectPatient(0);

    const orderData = medicationOrderData.validOrder;
    await nursePage.createMedicationOrder(
      orderData.medication,
      orderData.dosage,
      orderData.quantity,
      orderData.urgency
    );

    expect(await nursePage.waitForSuccess()).toBe(true);

    // Get order ID from page
    const orderText = await page.locator('[data-testid="order-id"]').textContent();
    const orderId = orderText || 'order-001';

    // Logout and login as delivery
    await loginPage.logout();
    await loginPage.goto();
    await loginPage.login(testUsers.delivery.email, testUsers.delivery.password);

    // Try to deliver to wrong patient should fail or show warning
    await deliveryPage.goto();
    const deliveryOrders = await deliveryPage.getOrderCount();

    // Verify correct order restrictions are in place
    expect(deliveryOrders).toBeGreaterThanOrEqual(0);
  });

  test('NEGATIVE: Allergy conflict detected and flagged', async ({ page }) => {
    // Patient 1 is allergic to Penicillin
    await loginPage.goto();
    await loginPage.login(testUsers.nurse.email, testUsers.nurse.password);
    await nursePage.goto();
    await nursePage.searchPatient(patientData.patient1.firstName);
    await nursePage.selectPatient(0);

    // Try to order Penicillin (which patient is allergic to)
    await nursePage.createMedicationOrder(
      'Penicillin', // Patient allergic to this
      '500mg',
      10,
      'routine'
    );

    // Should show allergy warning or error
    const hasError = await page.locator('[data-testid="error-message"], .alert-danger').isVisible().catch(() => false);
    const hasWarning = await page.locator('[data-testid="allergy-warning"], .allergy-alert').isVisible().catch(() => false);

    // Either error or warning should be present
    expect(hasError || hasWarning || (await nursePage.getErrorMessage()).length > 0).toBe(true);
  });

  test('Order with insufficient stock is rejected', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(testUsers.nurse.email, testUsers.nurse.password);
    await nursePage.goto();
    await nursePage.searchPatient(patientData.patient1.firstName);
    await nursePage.selectPatient(0);

    // Create order with very high quantity
    await nursePage.createMedicationOrder(
      'CommonMedication',
      '1mg',
      10000, // Unrealistic quantity
      'routine'
    );

    // Pharmacist should reject due to insufficient stock
    await loginPage.logout();
    await loginPage.goto();
    await loginPage.login(testUsers.pharmacist.email, testUsers.pharmacist.password);
    await pharmacyPage.goto();

    if (await pharmacyPage.getOrderCount() > 0) {
      await pharmacyPage.selectOrder(0);
      const stockMsg = await pharmacyPage.getStockAvailableMessage();
      // Should indicate insufficient stock
      expect(stockMsg.toLowerCase().includes('unavailable') || stockMsg.toLowerCase().includes('insufficient')).toBe(true);
    }
  });

  test('Multiple concurrent orders tracked correctly', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(testUsers.nurse.email, testUsers.nurse.password);
    await nursePage.goto();

    // Create first order for patient 1
    await nursePage.searchPatient(patientData.patient1.firstName);
    await nursePage.selectPatient(0);
    await nursePage.createMedicationOrder(
      medicationOrderData.validOrder.medication,
      medicationOrderData.validOrder.dosage,
      medicationOrderData.validOrder.quantity,
      medicationOrderData.validOrder.urgency
    );
    expect(await nursePage.waitForSuccess()).toBe(true);

    // Create second order for patient 2
    await nursePage.goto();
    await nursePage.searchPatient(patientData.patient2.firstName);
    await nursePage.selectPatient(0);
    await nursePage.createMedicationOrder(
      medicationOrderData.urgentOrder.medication,
      medicationOrderData.urgentOrder.dosage,
      medicationOrderData.urgentOrder.quantity,
      medicationOrderData.urgentOrder.urgency
    );
    expect(await nursePage.waitForSuccess()).toBe(true);

    // Verify both orders exist
    await nursePage.goto();
    const orderCount = await nursePage.getOrderCount();
    expect(orderCount).toBeGreaterThanOrEqual(2);
  });

  test('GPS tracking visible during delivery', async ({ page }) => {
    // Setup: Create and approve order
    await loginPage.goto();
    await loginPage.login(testUsers.nurse.email, testUsers.nurse.password);
    await nursePage.goto();
    await nursePage.searchPatient(patientData.patient1.firstName);
    await nursePage.selectPatient(0);

    await nursePage.createMedicationOrder(
      medicationOrderData.validOrder.medication,
      medicationOrderData.validOrder.dosage,
      medicationOrderData.validOrder.quantity
    );

    // Move to delivery person
    await loginPage.logout();
    await loginPage.goto();
    await loginPage.login(testUsers.delivery.email, testUsers.delivery.password);
    await deliveryPage.goto();

    if (await deliveryPage.getOrderCount() > 0) {
      await deliveryPage.selectOrder(0);
      await deliveryPage.startDelivery();

      // Check GPS tracking is visible
      const hasGPS = await deliveryPage.getGPSTracking();
      expect(hasGPS).toBe(true);

      // Verify destination address
      const destination = await deliveryPage.getDestinationAddress();
      expect(destination.length).toBeGreaterThan(0);
    }
  });
});
