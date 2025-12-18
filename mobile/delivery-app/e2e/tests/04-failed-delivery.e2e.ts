/**
 * E2E Test: Failed Delivery Scenarios
 *
 * Tests various failure scenarios:
 * - Patient absent
 * - Wrong address
 * - Refused delivery
 * - Return to pharmacy workflow
 */

import { device, element, by, expect as detoxExpect, waitFor } from 'detox';
import { failedDelivery, testUser } from '../helpers/testData';
import { grantLocationPermissions, setDeviceLocation, testLocations } from '../helpers/mockGPS';

describe('Failed Delivery Scenarios', () => {
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

  it('should handle patient absent scenario and return to pharmacy', async () => {
    // Step 1: Login
    await detoxExpect(element(by.id('login-screen'))).toBeVisible();
    await element(by.id('email-input')).typeText(testUser.email);
    await element(by.id('password-input')).typeText(testUser.password);
    await element(by.id('login-button')).tap();

    await waitFor(element(by.id('delivery-list-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Step 2: Accept delivery
    const deliveryCard = element(by.id(`delivery-card-${failedDelivery.id}`));
    await deliveryCard.tap();

    await waitFor(element(by.id('delivery-detail-screen')))
      .toBeVisible()
      .withTimeout(3000);

    await element(by.id('accept-delivery-button')).tap();

    // Step 3: Pick up package
    await element(by.id('navigate-button')).tap();
    await setDeviceLocation(device, testLocations.pharmacyGeneva);

    await waitFor(element(by.id('arrived-at-pharmacy-button')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('scan-qr-button')).tap();

    await waitFor(element(by.id('qr-scanner-screen')))
      .toBeVisible()
      .withTimeout(2000);

    await element(by.id('qr-scanner-camera')).tap();

    await waitFor(element(by.id('pickup-acknowledgment-screen')))
      .toBeVisible()
      .withTimeout(3000);

    await element(by.id('confirm-pickup-button')).tap();

    // Step 4: Navigate to patient address
    await setDeviceLocation(device, testLocations.patientHomeGeneva);

    await waitFor(element(by.id('arrived-at-destination-button')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('arrived-at-destination-button')).tap();

    // Step 5: Mark patient as absent
    await waitFor(element(by.id('proof-of-delivery-screen')))
      .toBeVisible()
      .withTimeout(3000);

    await element(by.id('delivery-failed-button')).tap();

    await waitFor(element(by.id('failed-delivery-modal')))
      .toBeVisible()
      .withTimeout(2000);

    await detoxExpect(element(by.text('Mark Delivery as Failed'))).toBeVisible();

    // Step 6: Select failure reason
    await element(by.id('failure-reason-picker')).tap();

    await waitFor(element(by.id('failure-reason-options')))
      .toBeVisible()
      .withTimeout(2000);

    await element(by.text('Patient Absent')).tap();

    // Step 7: Add notes about the failure
    await element(by.id('failure-notes-input')).typeText('Patient not home. Rang doorbell multiple times. No answer. Called phone - no response.');

    // Step 8: Take photo of delivery location (proof of attempt)
    await element(by.id('take-failure-photo-button')).tap();

    await waitFor(element(by.id('camera-screen')))
      .toBeVisible()
      .withTimeout(2000);

    await element(by.id('capture-photo-button')).tap();

    await waitFor(element(by.id('photo-preview')))
      .toBeVisible()
      .withTimeout(2000);

    await element(by.id('confirm-photo-button')).tap();

    // Step 9: Confirm return to pharmacy
    await element(by.id('confirm-failed-delivery-button')).tap();

    await waitFor(element(by.id('return-confirmation-modal')))
      .toBeVisible()
      .withTimeout(2000);

    await detoxExpect(element(by.text('Return Package to Pharmacy'))).toBeVisible();
    await detoxExpect(element(by.text('This delivery will be marked as failed. Package must be returned to pharmacy.'))).toBeVisible();

    await element(by.id('confirm-return-button')).tap();

    // Step 10: Verify status changes to "failed" and navigation starts
    await waitFor(element(by.text('Failed - Returning to Pharmacy')))
      .toBeVisible()
      .withTimeout(2000);

    await detoxExpect(element(by.id('navigation-screen'))).toBeVisible();
    await detoxExpect(element(by.text('Return to: ' + failedDelivery.pharmacyName))).toBeVisible();

    // Step 11: Navigate back to pharmacy
    await setDeviceLocation(device, testLocations.pharmacyGeneva);

    await waitFor(element(by.id('arrived-at-pharmacy-button')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('arrived-at-pharmacy-button')).tap();

    // Step 12: Scan QR code to return package
    await waitFor(element(by.id('return-package-screen')))
      .toBeVisible()
      .withTimeout(3000);

    await detoxExpect(element(by.text('Return Package to Pharmacy'))).toBeVisible();
    await detoxExpect(element(by.text('Scan package QR code to confirm return'))).toBeVisible();

    await element(by.id('scan-return-qr-button')).tap();

    await waitFor(element(by.id('qr-scanner-screen')))
      .toBeVisible()
      .withTimeout(2000);

    await element(by.id('qr-scanner-camera')).tap();

    // Step 13: Confirm package return
    await waitFor(element(by.id('return-confirmation-screen')))
      .toBeVisible()
      .withTimeout(3000);

    await detoxExpect(element(by.text('Confirm Package Return'))).toBeVisible();
    await detoxExpect(element(by.text(failedDelivery.packages[0].qrCode))).toBeVisible();

    await element(by.id('confirm-return-complete-button')).tap();

    // Step 14: Verify completion
    await waitFor(element(by.id('return-complete-screen')))
      .toBeVisible()
      .withTimeout(3000);

    await detoxExpect(element(by.text('Package Returned'))).toBeVisible();
    await detoxExpect(element(by.text('The pharmacy has been notified'))).toBeVisible();

    await element(by.id('back-to-deliveries-button')).tap();

    // Step 15: Verify delivery is in failed list
    await element(by.id('failed-tab')).tap();

    await detoxExpect(element(by.id(`delivery-card-${failedDelivery.id}`))).toBeVisible();
    await detoxExpect(element(by.text('Failed'))).toBeVisible();
    await detoxExpect(element(by.text('Patient Absent'))).toBeVisible();
  });

  it('should handle wrong address scenario', async () => {
    // Start delivery flow
    const deliveryCard = element(by.id(`delivery-card-${failedDelivery.id}`));
    await deliveryCard.tap();
    await element(by.id('accept-delivery-button')).tap();

    // Pick up package
    await element(by.id('navigate-button')).tap();
    await setDeviceLocation(device, testLocations.pharmacyGeneva);
    await element(by.id('scan-qr-button')).tap();
    await element(by.id('qr-scanner-camera')).tap();
    await element(by.id('confirm-pickup-button')).tap();

    // Arrive at address
    await setDeviceLocation(device, testLocations.patientHomeGeneva);
    await element(by.id('arrived-at-destination-button')).tap();

    // Mark as failed - wrong address
    await element(by.id('delivery-failed-button')).tap();

    await waitFor(element(by.id('failed-delivery-modal')))
      .toBeVisible()
      .withTimeout(2000);

    await element(by.id('failure-reason-picker')).tap();
    await element(by.text('Wrong Address')).tap();

    await element(by.id('failure-notes-input')).typeText('Address does not exist. Building number incorrect. Contacted patient - provided correct address.');

    // Enter correct address
    await element(by.id('enter-correct-address-button')).tap();

    await waitFor(element(by.id('address-correction-modal')))
      .toBeVisible()
      .withTimeout(2000);

    await element(by.id('correct-street-input')).typeText('Rue du Rhône 20');
    await element(by.id('correct-city-input')).typeText('Geneva');
    await element(by.id('correct-postal-code-input')).typeText('1204');

    await element(by.id('save-correct-address-button')).tap();

    // Options: Attempt delivery at correct address OR return to pharmacy
    await element(by.id('attempt-correct-address-button')).tap();

    // Verify navigation updates to correct address
    await detoxExpect(element(by.id('navigation-screen'))).toBeVisible();
    await detoxExpect(element(by.text('Updated Destination'))).toBeVisible();
  });

  it('should handle refused delivery scenario', async () => {
    // ... (setup and navigation)

    await element(by.id('arrived-at-destination-button')).tap();

    await waitFor(element(by.id('proof-of-delivery-screen')))
      .toBeVisible()
      .withTimeout(3000);

    await element(by.id('delivery-failed-button')).tap();

    await waitFor(element(by.id('failed-delivery-modal')))
      .toBeVisible()
      .withTimeout(2000);

    await element(by.id('failure-reason-picker')).tap();
    await element(by.text('Refused Delivery')).tap();

    await element(by.id('failure-notes-input')).typeText('Patient refused delivery. Stated they did not order medication. Pharmacist verification needed.');

    // For refused delivery, require signature from person refusing
    await detoxExpect(element(by.text('Refusal signature required'))).toBeVisible();

    await element(by.id('refusal-signature-canvas')).swipe('right', 'slow', 0.5);

    await element(by.id('refusal-name-input')).typeText('Pierre Dubois');

    await element(by.id('confirm-failed-delivery-button')).tap();

    // Verify return to pharmacy workflow initiates
    await waitFor(element(by.text('Failed - Returning to Pharmacy')))
      .toBeVisible()
      .withTimeout(2000);
  });

  it('should prevent delivery to wrong address when GPS validation fails', async () => {
    // Setup delivery
    const deliveryCard = element(by.id(`delivery-card-${failedDelivery.id}`));
    await deliveryCard.tap();
    await element(by.id('accept-delivery-button')).tap();

    // Pick up package
    await element(by.id('navigate-button')).tap();
    await setDeviceLocation(device, testLocations.pharmacyGeneva);
    await element(by.id('scan-qr-button')).tap();
    await element(by.id('qr-scanner-camera')).tap();
    await element(by.id('confirm-pickup-button')).tap();

    // Navigate but end up at WRONG location (Basel instead of Geneva)
    await setDeviceLocation(device, testLocations.wrongAddress);

    // Try to mark as arrived
    await element(by.id('arrived-at-destination-button')).tap();

    // GPS validation should fail
    await waitFor(element(by.id('location-mismatch-alert')))
      .toBeVisible()
      .withTimeout(3000);

    await detoxExpect(element(by.text('Location Mismatch'))).toBeVisible();
    await detoxExpect(element(by.text('Your current location does not match the delivery address'))).toBeVisible();
    await detoxExpect(element(by.text('Expected: Rue de Lausanne 100, Geneva'))).toBeVisible();
    await detoxExpect(element(by.text('Current: Basel area'))).toBeVisible();

    // Options shown
    await detoxExpect(element(by.id('continue-anyway-button'))).toBeVisible();
    await detoxExpect(element(by.id('report-wrong-address-button'))).toBeVisible();
    await detoxExpect(element(by.id('cancel-arrival-button'))).toBeVisible();

    // Cancel and navigate to correct location
    await element(by.id('cancel-arrival-button')).tap();

    // Verify back to navigation
    await detoxExpect(element(by.id('navigation-screen'))).toBeVisible();
  });

  it('should allow contact with patient before marking as failed', async () => {
    // ... (setup and arrival)

    await waitFor(element(by.id('proof-of-delivery-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Try to contact patient first
    await element(by.id('contact-patient-button')).tap();

    await waitFor(element(by.id('contact-options-modal')))
      .toBeVisible()
      .withTimeout(2000);

    await detoxExpect(element(by.text('Contact Patient'))).toBeVisible();
    await detoxExpect(element(by.id('call-patient-button'))).toBeVisible();
    await detoxExpect(element(by.id('sms-patient-button'))).toBeVisible();

    // Call patient
    await element(by.id('call-patient-button')).tap();

    // This would trigger phone dialer in real device
    // For E2E, verify call was logged
    await waitFor(element(by.text('Call initiated')))
      .toBeVisible()
      .withTimeout(2000);

    await element(by.id('close-notification')).tap();

    // After call, can log outcome
    await element(by.id('log-contact-attempt-button')).tap();

    await waitFor(element(by.id('contact-log-modal')))
      .toBeVisible()
      .withTimeout(2000);

    await element(by.id('contact-outcome-picker')).tap();
    await element(by.text('No Answer')).tap();

    await element(by.id('contact-notes-input')).typeText('Called patient at 14:30. No answer. Left voicemail.');

    await element(by.id('save-contact-log-button')).tap();

    // Now can proceed to mark as failed
    await element(by.id('delivery-failed-button')).tap();

    // Contact attempts should be shown in failure report
    await detoxExpect(element(by.text('Contact attempts: 1'))).toBeVisible();
  });

  it('should track failed delivery statistics separately', async () => {
    // Complete failed delivery flow
    // ... (full flow)

    // Navigate to earnings/stats
    await element(by.id('earnings-tab')).tap();

    await waitFor(element(by.id('earnings-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Verify failed delivery stats
    await detoxExpect(element(by.id('today-failed-count'))).toBeVisible();
    await detoxExpect(element(by.id('today-success-rate'))).toBeVisible();

    // Failed deliveries should not count toward earnings
    // but should affect success rate
    await element(by.id('view-detailed-stats-button')).tap();

    await detoxExpect(element(by.text('Failed Deliveries: 1'))).toBeVisible();
    await detoxExpect(element(by.text('Success Rate: 66.7%'))).toBeVisible(); // 2 completed, 1 failed = 66.7%
  });
});
