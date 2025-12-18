/**
 * E2E Test: Complete Delivery Workflow
 *
 * Tests the full happy path delivery workflow:
 * Order created → Assigned → Picked up → Delivered → Confirmed
 */

import { device, element, by, expect as detoxExpect, waitFor } from 'detox';
import { standardDelivery, testUser } from '../helpers/testData';
import { grantLocationPermissions, setDeviceLocation, testLocations, generateRoute, simulateRouteMovement } from '../helpers/mockGPS';

describe('Complete Delivery Workflow', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { location: 'always', camera: 'YES' },
      newInstance: true
    });
    await grantLocationPermissions(device);
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete a full delivery from assignment to confirmation', async () => {
    // Step 1: Login
    await detoxExpect(element(by.id('login-screen'))).toBeVisible();

    await element(by.id('email-input')).typeText(testUser.email);
    await element(by.id('password-input')).typeText(testUser.password);
    await element(by.id('login-button')).tap();

    // Wait for home screen to load
    await waitFor(element(by.id('delivery-list-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Step 2: View delivery list and find assigned delivery
    await detoxExpect(element(by.id('delivery-list'))).toBeVisible();

    const deliveryCard = element(by.id(`delivery-card-${standardDelivery.id}`));
    await detoxExpect(deliveryCard).toBeVisible();

    // Verify delivery details are shown
    await detoxExpect(element(by.text(standardDelivery.patient.name))).toBeVisible();
    await detoxExpect(element(by.text(standardDelivery.patient.address.street))).toBeVisible();

    // Step 3: Accept the delivery
    await deliveryCard.tap();

    await waitFor(element(by.id('delivery-detail-screen')))
      .toBeVisible()
      .withTimeout(3000);

    await detoxExpect(element(by.id('accept-delivery-button'))).toBeVisible();
    await element(by.id('accept-delivery-button')).tap();

    // Verify status changes to accepted
    await waitFor(element(by.text('Accepted')))
      .toBeVisible()
      .withTimeout(2000);

    // Step 4: Navigate to pharmacy to pick up package
    await element(by.id('navigate-button')).tap();

    await waitFor(element(by.id('navigation-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Simulate arrival at pharmacy
    await setDeviceLocation(device, testLocations.pharmacyGeneva);

    await waitFor(element(by.id('arrived-at-pharmacy-button')))
      .toBeVisible()
      .withTimeout(5000);

    // Step 5: Scan QR code to pick up package
    await element(by.id('scan-qr-button')).tap();

    await waitFor(element(by.id('qr-scanner-screen')))
      .toBeVisible()
      .withTimeout(2000);

    // In a real test, this would trigger the camera
    // For E2E, we simulate a successful scan
    await element(by.id('qr-scanner-camera')).tap();

    // Simulate QR code scan result
    await waitFor(element(by.id('pickup-acknowledgment-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Verify package details
    await detoxExpect(element(by.text(standardDelivery.packages[0].qrCode))).toBeVisible();
    await detoxExpect(element(by.text(standardDelivery.packages[0].medications[0].name))).toBeVisible();

    // Confirm pickup
    await element(by.id('confirm-pickup-button')).tap();

    // Verify status changes to in_transit
    await waitFor(element(by.text('In Transit')))
      .toBeVisible()
      .withTimeout(2000);

    // Step 6: Navigate to patient address
    const route = generateRoute(testLocations.pharmacyGeneva, testLocations.patientHomeGeneva, 3);

    // Simulate movement along route
    await simulateRouteMovement(device, route, 1000);

    // Step 7: Arrive at patient address
    await waitFor(element(by.id('arrived-at-destination-button')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('arrived-at-destination-button')).tap();

    // Step 8: Collect proof of delivery
    await waitFor(element(by.id('proof-of-delivery-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Enter recipient name
    await element(by.id('recipient-name-input')).typeText('Jean Dupont');

    // Capture signature
    await element(by.id('signature-canvas')).tap();
    // Simulate signature drawing
    await element(by.id('signature-canvas')).swipe('right', 'slow', 0.5);
    await element(by.id('signature-clear-button')).tap(); // Clear if needed
    await element(by.id('signature-canvas')).swipe('right', 'slow', 0.5);

    // Optional: Take photo
    await element(by.id('take-photo-button')).tap();
    await waitFor(element(by.id('camera-screen')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.id('capture-photo-button')).tap();

    // Add notes
    await element(by.id('delivery-notes-input')).typeText('Package delivered successfully');

    // Submit proof of delivery
    await element(by.id('submit-proof-button')).tap();

    // Step 9: Verify delivery completion
    await waitFor(element(by.id('delivery-complete-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await detoxExpect(element(by.text('Delivery Completed'))).toBeVisible();
    await detoxExpect(element(by.text(standardDelivery.patient.name))).toBeVisible();

    // Return to delivery list
    await element(by.id('return-to-list-button')).tap();

    await waitFor(element(by.id('delivery-list-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Verify delivery is no longer in active list (moved to completed)
    await detoxExpect(element(by.id(`delivery-card-${standardDelivery.id}`))).not.toBeVisible();

    // Check completed deliveries tab
    await element(by.id('completed-tab')).tap();
    await detoxExpect(element(by.id(`delivery-card-${standardDelivery.id}`))).toBeVisible();
    await detoxExpect(element(by.text('Delivered'))).toBeVisible();
  });

  it('should update delivery statistics after completion', async () => {
    // Navigate to earnings/stats screen
    await element(by.id('earnings-tab')).tap();

    await waitFor(element(by.id('earnings-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Verify stats are updated
    await detoxExpect(element(by.id('today-completed-count'))).toBeVisible();
    await detoxExpect(element(by.id('today-earnings'))).toBeVisible();
    await detoxExpect(element(by.id('today-distance'))).toBeVisible();
  });

  it('should sync delivery data when back online after offline period', async () => {
    // Simulate offline mode
    await device.setStatusBar({
      networkConnection: 'airplane'
    });

    // Accept delivery while offline
    const deliveryCard = element(by.id(`delivery-card-${standardDelivery.id}`));
    await deliveryCard.tap();
    await element(by.id('accept-delivery-button')).tap();

    // Verify offline banner appears
    await detoxExpect(element(by.id('offline-banner'))).toBeVisible();
    await detoxExpect(element(by.text('Changes will sync when online'))).toBeVisible();

    // Re-enable network
    await device.setStatusBar({
      networkConnection: 'wifi'
    });

    // Verify sync occurs
    await waitFor(element(by.id('sync-complete-notification')))
      .toBeVisible()
      .withTimeout(10000);

    await detoxExpect(element(by.id('offline-banner'))).not.toBeVisible();
  });
});
