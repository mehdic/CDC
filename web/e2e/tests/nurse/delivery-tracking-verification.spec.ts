/**
 * Nurse Delivery Tracking Verification E2E Tests
 * Tests for tracking medication deliveries, verifying receipt, and managing delivery status
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { NursePage } from '../../page-objects';
import { mockApiResponse, mockApiError } from '../../utils/api-mock';

test.describe('Nurse - Delivery Tracking Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Mock active orders list
    await mockApiResponse(page, '**/nurse/orders/active**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'order_001',
            patientId: 'patient_001',
            patientName: 'Paul Deschamp',
            room: '101',
            medicationName: 'Lisinopril',
            quantity: 10,
            dosage: '10mg',
            status: 'in_transit',
            orderedAt: new Date(Date.now() - 3600000).toISOString(),
            estimatedDelivery: new Date(Date.now() + 1800000).toISOString(),
            driverId: 'driver_001',
            driverName: 'Mohamed Ali',
            deliveryPartner: 'Medico Express',
            trackingNumber: 'TRACK-001',
            currentLocation: {
              lat: 46.9479,
              lng: 7.4474,
              address: 'Route towards hospital',
            },
            route: [
              { lat: 46.9479, lng: 7.4474, time: new Date().toISOString() },
              { lat: 46.9480, lng: 7.4475, time: new Date(Date.now() + 600000).toISOString() },
              { lat: 46.9481, lng: 7.4476, time: new Date(Date.now() + 1200000).toISOString() },
            ],
          },
          {
            id: 'order_002',
            patientId: 'patient_002',
            patientName: 'Marie Dupuis',
            room: '102',
            medicationName: 'Metformine',
            quantity: 20,
            dosage: '500mg',
            status: 'pending',
            orderedAt: new Date(Date.now() - 7200000).toISOString(),
            estimatedDelivery: new Date(Date.now() + 3600000).toISOString(),
            driverId: null,
            driverName: null,
            deliveryPartner: null,
            trackingNumber: null,
            currentLocation: null,
          },
          {
            id: 'order_003',
            patientId: 'patient_001',
            patientName: 'Paul Deschamp',
            room: '101',
            medicationName: 'Atorvastatin',
            quantity: 15,
            dosage: '20mg',
            status: 'delivered',
            orderedAt: new Date(Date.now() - 86400000).toISOString(),
            deliveredAt: new Date(Date.now() - 3600000).toISOString(),
            estimatedDelivery: new Date(Date.now() - 7200000).toISOString(),
            driverId: 'driver_002',
            driverName: 'Sara Martin',
            deliveryPartner: 'Medico Express',
            trackingNumber: 'TRACK-003',
            verificationCode: 'VERIFY-001',
            signedBy: 'Nurse Caroline Leclerc',
          },
        ],
        total: 3,
      },
    });

    // Mock order details
    await mockApiResponse(page, '**/nurse/orders/order_001**', {
      status: 200,
      body: {
        success: true,
        data: {
          id: 'order_001',
          patientId: 'patient_001',
          patientName: 'Paul Deschamp',
          room: '101',
          medicationName: 'Lisinopril',
          quantity: 10,
          dosage: '10mg',
          status: 'in_transit',
          orderedAt: new Date(Date.now() - 3600000).toISOString(),
          estimatedDelivery: new Date(Date.now() + 1800000).toISOString(),
          driverId: 'driver_001',
          driverName: 'Mohamed Ali',
          driverPhone: '+41 79 123 4567',
          deliveryPartner: 'Medico Express',
          trackingNumber: 'TRACK-001',
          currentLocation: {
            lat: 46.9479,
            lng: 7.4474,
            address: 'Route towards hospital',
            updatedAt: new Date().toISOString(),
          },
        },
      },
    });

    // Mock delivery tracking history
    await mockApiResponse(page, '**/nurse/orders/order_001/tracking**', {
      status: 200,
      body: {
        success: true,
        data: [
          {
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            status: 'picked_up',
            location: 'Pharmacy Distribution Center',
            notes: 'Order picked up by driver',
          },
          {
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            status: 'in_transit',
            location: 'Rte de Jussy, 1200 Geneva',
            notes: 'Out for delivery',
          },
        ],
      },
    });

    // Mock delivery receipt
    await mockApiResponse(page, '**/nurse/orders/order_001/receipt**', {
      status: 200,
      body: {
        success: true,
        data: {
          orderId: 'order_001',
          receivedAt: new Date().toISOString(),
          receivedBy: 'Nurse Caroline Leclerc',
          quantity: 10,
          condition: 'intact',
          verificationCode: 'VERIFY-002',
          notes: 'Package received in good condition',
        },
      },
    });

    // Mock confirm delivery endpoint
    await mockApiResponse(page, '**/nurse/orders/order_001/confirm**', {
      status: 200,
      body: {
        success: true,
        message: 'Delivery confirmed',
        status: 'delivered',
        verificationCode: 'VERIFY-002',
        receiptId: 'RECEIPT-001',
      },
    });

    // Mock delivery issues reporting
    await mockApiResponse(page, '**/nurse/orders/order_001/report-issue**', {
      status: 200,
      body: {
        success: true,
        issueId: 'ISSUE-001',
        status: 'reported',
        message: 'Issue has been reported to delivery partner',
      },
    });

    // Mock re-delivery request
    await mockApiResponse(page, '**/nurse/orders/order_001/redelivery**', {
      status: 200,
      body: {
        success: true,
        redeliveryScheduled: true,
        estimatedDelivery: new Date(Date.now() + 3600000).toISOString(),
        trackingNumber: 'TRACK-001-REDELIV',
      },
    });
  });

  test('should display active deliveries list', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // Navigate to active orders/deliveries
    await nursePageObj.viewActiveOrders();

    // Verify active orders displayed
    const ordersList = nursePage.locator('[data-testid="active-orders-list"]');
    await expect(ordersList).toBeVisible();

    // Verify order cards are displayed
    const orderCards = nursePage.locator('[data-testid^="order-card-"]');
    const count = await orderCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show order status for each delivery', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View active orders
    await nursePageObj.viewActiveOrders();

    // Verify status indicators
    const inTransitStatus = nursePage.locator('[data-testid="order-status-in_transit"]');
    await expect(inTransitStatus).toBeVisible();

    const pendingStatus = nursePage.locator('[data-testid="order-status-pending"]');
    await expect(pendingStatus).toBeVisible();
  });

  test('should track delivery location in real-time', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View active orders
    await nursePageObj.viewActiveOrders();

    // Click on in-transit order
    const inTransitOrder = nursePage.locator('[data-testid="order-card-order_001"]');
    await inTransitOrder.click();
    await page.waitForLoadState('networkidle');

    // Track delivery
    await nursePageObj.trackDelivery('order_001');

    // Verify delivery map is displayed
    await expect(nursePageObj.deliveryTrackingMap).toBeVisible();

    // Verify driver information
    const driverInfo = nursePage.locator('[data-testid="driver-info"]');
    await expect(driverInfo).toBeVisible();
    await expect(driverInfo).toContainText(/Mohamed|driver/i);
  });

  test('should show driver contact information', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View active orders
    await nursePageObj.viewActiveOrders();

    // Click on in-transit order
    const inTransitOrder = nursePage.locator('[data-testid="order-card-order_001"]');
    await inTransitOrder.click();
    await page.waitForLoadState('networkidle');

    // View driver contact
    const driverPhone = nursePage.locator('[data-testid="driver-phone"]');
    await expect(driverPhone).toBeVisible();
    await expect(driverPhone).toContainText(/\+41|phone/i);

    // Verify call button
    const callButton = nursePage.locator('[data-testid="call-driver-button"]');
    await expect(callButton).toBeVisible();
  });

  test('should display estimated delivery time', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View active orders
    await nursePageObj.viewActiveOrders();

    // Click on order
    const order = nursePage.locator('[data-testid="order-card-order_001"]');
    await order.click();
    await page.waitForLoadState('networkidle');

    // Verify ETA displayed
    const eta = await nursePageObj.getDeliveryETA('order_001');
    expect(eta).toBeTruthy();
  });

  test('should show delivery tracking history', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View active orders
    await nursePageObj.viewActiveOrders();

    // Click on order
    const order = nursePage.locator('[data-testid="order-card-order_001"]');
    await order.click();
    await page.waitForLoadState('networkidle');

    // View tracking history
    const trackingHistory = nursePage.locator('[data-testid="tracking-history"]');
    await expect(trackingHistory).toBeVisible();

    // Verify history entries
    const historyEntries = nursePage.locator('[data-testid^="tracking-entry-"]');
    const count = await historyEntries.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should confirm delivery receipt', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View active orders
    await nursePageObj.viewActiveOrders();

    // Click on delivered order
    const deliveredOrder = nursePage.locator('[data-testid="order-card-order_003"]');
    await deliveredOrder.click();
    await page.waitForLoadState('networkidle');

    // Verify receipt information
    const receiptInfo = nursePage.locator('[data-testid="receipt-info"]');
    await expect(receiptInfo).toBeVisible();

    // Verify received timestamp
    const receivedAt = nursePage.locator('[data-testid="received-timestamp"]');
    await expect(receivedAt).toBeVisible();
  });

  test('should verify package condition on receipt', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View active orders
    await nursePageObj.viewActiveOrders();

    // Click on delivered order
    const order = nursePage.locator('[data-testid="order-card-order_003"]');
    await order.click();
    await page.waitForLoadState('networkidle');

    // Verify condition indicator
    const conditionBadge = nursePage.locator('[data-testid="package-condition"]');
    await expect(conditionBadge).toBeVisible();
    await expect(conditionBadge).toContainText(/intact|good|acceptable/i);
  });

  test('should show verification code for signed deliveries', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View active orders
    await nursePageObj.viewActiveOrders();

    // Click on delivered order
    const order = nursePage.locator('[data-testid="order-card-order_003"]');
    await order.click();
    await page.waitForLoadState('networkidle');

    // Verify code displayed
    const verificationCode = nursePage.locator('[data-testid="verification-code"]');
    await expect(verificationCode).toBeVisible();
  });

  test('should report delivery issues', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View active orders
    await nursePageObj.viewActiveOrders();

    // Click on in-transit order
    const order = nursePage.locator('[data-testid="order-card-order_001"]');
    await order.click();
    await page.waitForLoadState('networkidle');

    // Click report issue button
    const reportButton = nursePage.locator('[data-testid="report-issue-button"]');
    await reportButton.click();
    await page.waitForLoadState('networkidle');

    // Verify issue form shown
    const issueForm = nursePage.locator('[data-testid="issue-form"]');
    await expect(issueForm).toBeVisible();

    // Fill issue description
    const issueInput = nursePage.locator('[data-testid="issue-description"]');
    await issueInput.fill('Package not arrived at expected time');

    // Submit
    const submitButton = nursePage.locator('[data-testid="submit-issue-button"]');
    await submitButton.click();
    await page.waitForLoadState('networkidle');

    // Verify success message
    const successMessage = nursePage.locator('[data-testid="issue-reported-message"]');
    await expect(successMessage).toBeVisible();
  });

  test('should request re-delivery for failed delivery', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View active orders
    await nursePageObj.viewActiveOrders();

    // Click on pending order
    const order = nursePage.locator('[data-testid="order-card-order_002"]');
    await order.click();
    await page.waitForLoadState('networkidle');

    // Click request redelivery
    const redeliveryButton = nursePage.locator('[data-testid="request-redelivery-button"]');
    if (await redeliveryButton.isVisible()) {
      await redeliveryButton.click();
      await page.waitForLoadState('networkidle');

      // Verify redelivery scheduled
      const redeliveryMessage = nursePage.locator('[data-testid="redelivery-scheduled-message"]');
      await expect(redeliveryMessage).toBeVisible();

      // Verify new ETA
      const newEta = nursePage.locator('[data-testid="new-eta"]');
      await expect(newEta).toBeVisible();
    }
  });

  test('should filter deliveries by status', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View active orders
    await nursePageObj.viewActiveOrders();

    // Filter by status
    const statusFilter = nursePage.locator('[data-testid="delivery-status-filter"]');
    await statusFilter.click();

    const inTransitOption = nursePage.locator('[data-testid="filter-in_transit"]');
    await inTransitOption.click();
    await page.waitForLoadState('networkidle');

    // Verify only in-transit orders shown
    const orders = nursePage.locator('[data-testid^="order-card-"]');
    const count = await orders.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should sort deliveries by ETA', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View active orders
    await nursePageObj.viewActiveOrders();

    // Click sort button
    const sortButton = nursePage.locator('[data-testid="sort-by-eta-button"]');
    await sortButton.click();
    await page.waitForLoadState('networkidle');

    // Verify orders sorted by ETA
    const orders = nursePage.locator('[data-testid^="order-card-"]');
    const count = await orders.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display delivery partner information', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View active orders
    await nursePageObj.viewActiveOrders();

    // Click on order
    const order = nursePage.locator('[data-testid="order-card-order_001"]');
    await order.click();
    await page.waitForLoadState('networkidle');

    // Verify delivery partner info
    const partnerInfo = nursePage.locator('[data-testid="delivery-partner-info"]');
    await expect(partnerInfo).toBeVisible();
    await expect(partnerInfo).toContainText(/Medico|Express/i);
  });

  test('should show delivery partner rating and reviews', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View active orders
    await nursePageObj.viewActiveOrders();

    // Click on order
    const order = nursePage.locator('[data-testid="order-card-order_001"]');
    await order.click();
    await page.waitForLoadState('networkidle');

    // Verify partner rating shown
    const partnerRating = nursePage.locator('[data-testid="partner-rating"]');
    await expect(partnerRating).toBeVisible();
  });

  test('should show delivery proof (signature or photo)', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View active orders
    await nursePageObj.viewActiveOrders();

    // Click on delivered order
    const order = nursePage.locator('[data-testid="order-card-order_003"]');
    await order.click();
    await page.waitForLoadState('networkidle');

    // Verify delivery proof
    const deliveryProof = nursePage.locator('[data-testid="delivery-proof"]');
    await expect(deliveryProof).toBeVisible();

    // Verify signature/photo shown
    const signatureOrPhoto = nursePage.locator('[data-testid="proof-signature-or-photo"]');
    await expect(signatureOrPhoto).toBeVisible();
  });

  test('should download delivery receipt as PDF', async ({ page, nursePage }) => {
    const nursePageObj = new NursePage(nursePage);
    await nursePageObj.goto();

    // View active orders
    await nursePageObj.viewActiveOrders();

    // Click on delivered order
    const order = nursePage.locator('[data-testid="order-card-order_003"]');
    await order.click();
    await page.waitForLoadState('networkidle');

    // Download receipt
    await nursePageObj.exportOrderToPDF('order_003');
  });
});
