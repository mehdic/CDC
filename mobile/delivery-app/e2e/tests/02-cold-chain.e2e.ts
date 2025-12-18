/**
 * E2E Test: Cold Chain Handling
 *
 * Tests temperature-sensitive medication delivery workflow:
 * - Temperature monitoring during transit
 * - Alerts when temperature goes out of range
 * - Temperature log submission with proof of delivery
 */

import { device, element, by, expect as detoxExpect, waitFor } from 'detox';
import { coldChainDelivery, testUser } from '../helpers/testData';
import { grantLocationPermissions, setDeviceLocation, testLocations } from '../helpers/mockGPS';

describe('Cold Chain Delivery Workflow', () => {
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

  it('should handle cold chain delivery with temperature monitoring', async () => {
    // Step 1: Login
    await detoxExpect(element(by.id('login-screen'))).toBeVisible();
    await element(by.id('email-input')).typeText(testUser.email);
    await element(by.id('password-input')).typeText(testUser.password);
    await element(by.id('login-button')).tap();

    await waitFor(element(by.id('delivery-list-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Step 2: Select cold chain delivery
    const deliveryCard = element(by.id(`delivery-card-${coldChainDelivery.id}`));
    await deliveryCard.tap();

    await waitFor(element(by.id('delivery-detail-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Step 3: Verify cold chain indicators are present
    await detoxExpect(element(by.id('cold-chain-indicator'))).toBeVisible();
    await detoxExpect(element(by.text('Temperature Sensitive'))).toBeVisible();
    await detoxExpect(element(by.text('Keep refrigerated: 2-8°C'))).toBeVisible();

    // Step 4: Accept delivery
    await element(by.id('accept-delivery-button')).tap();

    await waitFor(element(by.text('Accepted')))
      .toBeVisible()
      .withTimeout(2000);

    // Step 5: Navigate to pharmacy
    await element(by.id('navigate-button')).tap();
    await setDeviceLocation(device, testLocations.pharmacyGeneva);

    await waitFor(element(by.id('arrived-at-pharmacy-button')))
      .toBeVisible()
      .withTimeout(5000);

    // Step 6: Pick up cold chain package
    await element(by.id('scan-qr-button')).tap();

    await waitFor(element(by.id('qr-scanner-screen')))
      .toBeVisible()
      .withTimeout(2000);

    await element(by.id('qr-scanner-camera')).tap();

    await waitFor(element(by.id('pickup-acknowledgment-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Verify cold chain warning on pickup
    await detoxExpect(element(by.id('cold-chain-warning'))).toBeVisible();
    await detoxExpect(element(by.text('This medication must be kept cold at all times'))).toBeVisible();

    // Step 7: Check temperature sensor readings
    await detoxExpect(element(by.id('temperature-display'))).toBeVisible();
    await detoxExpect(element(by.id('current-temperature'))).toHaveText('4.5°C');
    await detoxExpect(element(by.id('temperature-status'))).toHaveText('Within Range');

    // Verify temperature log history
    await element(by.id('view-temperature-log-button')).tap();
    await waitFor(element(by.id('temperature-log-modal')))
      .toBeVisible()
      .withTimeout(2000);

    await detoxExpect(element(by.id('temperature-reading-0'))).toBeVisible();
    await detoxExpect(element(by.text('4.5°C - Within Range'))).toBeVisible();

    await element(by.id('close-temperature-log-button')).tap();

    // Confirm pickup
    await element(by.id('confirm-pickup-button')).tap();

    // Step 8: Monitor temperature during transit
    await waitFor(element(by.text('In Transit')))
      .toBeVisible()
      .withTimeout(2000);

    // Verify temperature monitoring is active
    await detoxExpect(element(by.id('temperature-monitor-active'))).toBeVisible();
    await detoxExpect(element(by.id('current-temperature'))).toBeVisible();

    // Simulate temperature readings during transit
    // (In real implementation, this would be from actual sensor data)
    await device.sendUserNotification({
      trigger: {
        type: 'timeInterval',
        timeInterval: 1
      },
      title: 'Temperature Update',
      body: 'Current temperature: 5.2°C - Within Range'
    });

    // Step 9: Arrive at destination
    await setDeviceLocation(device, testLocations.patientHomeGeneva);

    await waitFor(element(by.id('arrived-at-destination-button')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('arrived-at-destination-button')).tap();

    // Step 10: Submit proof of delivery with temperature log
    await waitFor(element(by.id('proof-of-delivery-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Verify temperature log is included in proof
    await detoxExpect(element(by.id('temperature-log-summary'))).toBeVisible();
    await detoxExpect(element(by.text('All readings within range'))).toBeVisible();

    // Enter recipient info
    await element(by.id('recipient-name-input')).typeText('Marie Martin');

    // Capture signature
    await element(by.id('signature-canvas')).swipe('right', 'slow', 0.5);

    // Submit with temperature log
    await element(by.id('submit-proof-button')).tap();

    // Step 11: Verify completion
    await waitFor(element(by.id('delivery-complete-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await detoxExpect(element(by.text('Cold Chain Delivery Completed'))).toBeVisible();
    await detoxExpect(element(by.id('temperature-compliance-badge'))).toBeVisible();
    await detoxExpect(element(by.text('Temperature maintained throughout delivery'))).toBeVisible();
  });

  it('should alert when temperature goes out of range', async () => {
    // Start delivery
    const deliveryCard = element(by.id(`delivery-card-${coldChainDelivery.id}`));
    await deliveryCard.tap();
    await element(by.id('accept-delivery-button')).tap();

    // Pick up package
    await element(by.id('navigate-button')).tap();
    await setDeviceLocation(device, testLocations.pharmacyGeneva);
    await element(by.id('scan-qr-button')).tap();
    await element(by.id('qr-scanner-camera')).tap();
    await element(by.id('confirm-pickup-button')).tap();

    // Simulate temperature spike (out of range)
    await device.sendUserNotification({
      trigger: {
        type: 'timeInterval',
        timeInterval: 1
      },
      title: '⚠️ Temperature Alert',
      body: 'Temperature out of range: 12.5°C (should be 2-8°C)',
      badge: 1,
      sound: 'alert.mp3'
    });

    // Verify alert is shown
    await waitFor(element(by.id('temperature-alert-modal')))
      .toBeVisible()
      .withTimeout(3000);

    await detoxExpect(element(by.text('Temperature Out of Range'))).toBeVisible();
    await detoxExpect(element(by.text('Current: 12.5°C'))).toBeVisible();
    await detoxExpect(element(by.text('Required: 2-8°C'))).toBeVisible();

    // Verify warning actions
    await detoxExpect(element(by.id('contact-pharmacy-button'))).toBeVisible();
    await detoxExpect(element(by.id('report-issue-button'))).toBeVisible();

    // Acknowledge alert
    await element(by.id('acknowledge-alert-button')).tap();

    // Verify temperature status indicator turns red
    await detoxExpect(element(by.id('temperature-status-error'))).toBeVisible();
    await detoxExpect(element(by.id('temperature-status'))).toHaveText('Out of Range');
  });

  it('should prevent delivery completion if temperature was out of range', async () => {
    // Complete delivery flow with out-of-range temperature event
    // ... (abbreviated setup)

    // Attempt to submit proof of delivery
    await waitFor(element(by.id('proof-of-delivery-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Verify temperature compliance warning
    await detoxExpect(element(by.id('temperature-compliance-warning'))).toBeVisible();
    await detoxExpect(element(by.text('Temperature was out of range during delivery'))).toBeVisible();

    await element(by.id('recipient-name-input')).typeText('Marie Martin');
    await element(by.id('signature-canvas')).swipe('right', 'slow', 0.5);

    // Submit button should require additional confirmation
    await element(by.id('submit-proof-button')).tap();

    await waitFor(element(by.id('temperature-issue-confirmation-modal')))
      .toBeVisible()
      .withTimeout(2000);

    await detoxExpect(element(by.text('Temperature Issue Detected'))).toBeVisible();
    await detoxExpect(element(by.text('This delivery had temperature excursions. Contact pharmacist before completing.'))).toBeVisible();

    // Options: Contact pharmacist or report issue
    await detoxExpect(element(by.id('contact-pharmacist-button'))).toBeVisible();
    await detoxExpect(element(by.id('complete-anyway-button'))).toBeVisible();
  });

  it('should display temperature history chart', async () => {
    // Navigate to completed cold chain delivery
    await element(by.id('completed-tab')).tap();

    const completedDelivery = element(by.id(`delivery-card-${coldChainDelivery.id}`));
    await completedDelivery.tap();

    // View temperature history
    await element(by.id('view-temperature-history-button')).tap();

    await waitFor(element(by.id('temperature-history-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Verify chart is displayed
    await detoxExpect(element(by.id('temperature-chart'))).toBeVisible();
    await detoxExpect(element(by.id('temperature-range-indicator'))).toBeVisible();

    // Verify timeline
    await detoxExpect(element(by.text('Pickup Time'))).toBeVisible();
    await detoxExpect(element(by.text('Delivery Time'))).toBeVisible();

    // Verify summary stats
    await detoxExpect(element(by.id('min-temperature'))).toBeVisible();
    await detoxExpect(element(by.id('max-temperature'))).toBeVisible();
    await detoxExpect(element(by.id('avg-temperature'))).toBeVisible();
    await detoxExpect(element(by.id('out-of-range-count'))).toBeVisible();
  });
});
