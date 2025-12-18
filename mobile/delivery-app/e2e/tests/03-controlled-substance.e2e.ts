/**
 * E2E Test: Controlled Substance Delivery Workflow
 *
 * Tests narcotics delivery with enhanced security:
 * - ID verification required
 * - Signature mandatory
 * - Photo documentation
 * - Patient must be present (no proxy delivery)
 */

import { device, element, by, expect as detoxExpect, waitFor } from 'detox';
import { controlledSubstanceDelivery, testUser } from '../helpers/testData';
import { grantLocationPermissions, setDeviceLocation, testLocations } from '../helpers/mockGPS';

describe('Controlled Substance Delivery Workflow', () => {
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

  it('should complete controlled substance delivery with all security checks', async () => {
    // Step 1: Login
    await detoxExpect(element(by.id('login-screen'))).toBeVisible();
    await element(by.id('email-input')).typeText(testUser.email);
    await element(by.id('password-input')).typeText(testUser.password);
    await element(by.id('login-button')).tap();

    await waitFor(element(by.id('delivery-list-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Step 2: Select controlled substance delivery
    const deliveryCard = element(by.id(`delivery-card-${controlledSubstanceDelivery.id}`));
    await deliveryCard.tap();

    await waitFor(element(by.id('delivery-detail-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Step 3: Verify controlled substance indicators
    await detoxExpect(element(by.id('controlled-substance-badge'))).toBeVisible();
    await detoxExpect(element(by.text('CONTROLLED SUBSTANCE'))).toBeVisible();
    await detoxExpect(element(by.id('narcotics-icon'))).toBeVisible();

    // Verify security requirements are listed
    await detoxExpect(element(by.text('ID verification required'))).toBeVisible();
    await detoxExpect(element(by.text('Signature required'))).toBeVisible();
    await detoxExpect(element(by.text('Patient must be present'))).toBeVisible();

    // Step 4: Review special instructions
    await detoxExpect(element(by.id('special-instructions'))).toBeVisible();
    await detoxExpect(element(by.text('CONTROLLED SUBSTANCE: Verify patient ID and obtain signature. Patient must be present.'))).toBeVisible();

    // Step 5: Accept delivery with security acknowledgment
    await element(by.id('accept-delivery-button')).tap();

    await waitFor(element(by.id('security-acknowledgment-modal')))
      .toBeVisible()
      .withTimeout(2000);

    await detoxExpect(element(by.text('Controlled Substance Delivery'))).toBeVisible();
    await detoxExpect(element(by.text('I acknowledge that I will verify patient ID and obtain signature before delivery'))).toBeVisible();

    await element(by.id('security-acknowledgment-checkbox')).tap();
    await element(by.id('confirm-acknowledgment-button')).tap();

    await waitFor(element(by.text('Accepted')))
      .toBeVisible()
      .withTimeout(2000);

    // Step 6: Navigate to pharmacy and pick up
    await element(by.id('navigate-button')).tap();
    await setDeviceLocation(device, testLocations.pharmacyZurich);

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

    // Verify controlled substance warnings
    await detoxExpect(element(by.id('controlled-substance-warning'))).toBeVisible();
    await detoxExpect(element(by.text('NARCOTICS - Handle with care'))).toBeVisible();

    // Verify medication details
    await detoxExpect(element(by.text(controlledSubstanceDelivery.packages[0].medications[0].name))).toBeVisible();
    await detoxExpect(element(by.text('60 tablets, 30mg'))).toBeVisible();

    // Confirm pickup
    await element(by.id('confirm-pickup-button')).tap();

    await waitFor(element(by.text('In Transit')))
      .toBeVisible()
      .withTimeout(2000);

    // Step 7: Navigate to patient address
    await setDeviceLocation(device, testLocations.patientHomeZurich);

    await waitFor(element(by.id('arrived-at-destination-button')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('arrived-at-destination-button')).tap();

    // Step 8: Proof of delivery with enhanced security
    await waitFor(element(by.id('proof-of-delivery-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Verify security requirements are highlighted
    await detoxExpect(element(by.id('security-requirements-panel'))).toBeVisible();
    await detoxExpect(element(by.id('id-verification-required-indicator'))).toBeVisible();
    await detoxExpect(element(by.id('signature-required-indicator'))).toBeVisible();

    // Step 9: Verify patient ID
    await element(by.id('verify-id-button')).tap();

    await waitFor(element(by.id('id-verification-screen')))
      .toBeVisible()
      .withTimeout(2000);

    // Capture photo of ID
    await detoxExpect(element(by.text('Capture Patient ID'))).toBeVisible();
    await detoxExpect(element(by.text('Take a clear photo of the patient\'s government-issued ID'))).toBeVisible();

    await element(by.id('capture-id-photo-button')).tap();

    await waitFor(element(by.id('camera-screen')))
      .toBeVisible()
      .withTimeout(2000);

    await element(by.id('camera-capture-button')).tap();

    // Review captured ID photo
    await waitFor(element(by.id('id-photo-preview')))
      .toBeVisible()
      .withTimeout(2000);

    await element(by.id('confirm-id-photo-button')).tap();

    // Manually verify ID details match patient
    await waitFor(element(by.id('id-verification-form')))
      .toBeVisible()
      .withTimeout(2000);

    await element(by.id('patient-name-matches-checkbox')).tap();
    await element(by.id('id-is-valid-checkbox')).tap();
    await element(by.id('patient-age-verified-checkbox')).tap();

    await element(by.id('id-number-input')).typeText('ID-123456789');

    await element(by.id('complete-id-verification-button')).tap();

    // Return to proof of delivery
    await waitFor(element(by.id('proof-of-delivery-screen')))
      .toBeVisible()
      .withTimeout(2000);

    // Verify ID verification is complete
    await detoxExpect(element(by.id('id-verified-checkmark'))).toBeVisible();

    // Step 10: Collect recipient signature
    await element(by.id('recipient-name-input')).typeText('Hans Mueller');

    await detoxExpect(element(by.id('signature-canvas'))).toBeVisible();
    await detoxExpect(element(by.text('Patient signature required for controlled substances'))).toBeVisible();

    await element(by.id('signature-canvas')).swipe('right', 'slow', 0.5);
    await element(by.id('signature-canvas')).swipe('left', 'slow', 0.3);

    // Verify signature is captured
    await detoxExpect(element(by.id('signature-preview'))).toBeVisible();

    // Step 11: Take delivery photo (optional but recommended)
    await element(by.id('take-photo-button')).tap();

    await waitFor(element(by.id('camera-screen')))
      .toBeVisible()
      .withTimeout(2000);

    await element(by.id('capture-photo-button')).tap();

    await waitFor(element(by.id('photo-preview')))
      .toBeVisible()
      .withTimeout(2000);

    await element(by.id('confirm-photo-button')).tap();

    // Step 12: Add delivery notes
    await element(by.id('delivery-notes-input')).typeText('Verified patient ID. Signature obtained. Medication handed directly to patient.');

    // Step 13: Submit proof of delivery
    await element(by.id('submit-proof-button')).tap();

    // Verify all security requirements are met before submission
    await waitFor(element(by.id('security-checklist-modal')))
      .toBeVisible()
      .withTimeout(2000);

    await detoxExpect(element(by.text('Security Checklist'))).toBeVisible();
    await detoxExpect(element(by.id('id-verified-check'))).toBeVisible();
    await detoxExpect(element(by.id('signature-obtained-check'))).toBeVisible();
    await detoxExpect(element(by.id('photo-taken-check'))).toBeVisible();

    await element(by.id('confirm-submission-button')).tap();

    // Step 14: Verify completion
    await waitFor(element(by.id('delivery-complete-screen')))
      .toBeVisible()
      .withTimeout(5000);

    await detoxExpect(element(by.text('Controlled Substance Delivery Completed'))).toBeVisible();
    await detoxExpect(element(by.id('security-compliance-badge'))).toBeVisible();
    await detoxExpect(element(by.text('All security requirements met'))).toBeVisible();
  });

  it('should prevent delivery without ID verification', async () => {
    // Start delivery
    const deliveryCard = element(by.id(`delivery-card-${controlledSubstanceDelivery.id}`));
    await deliveryCard.tap();
    await element(by.id('accept-delivery-button')).tap();
    await element(by.id('security-acknowledgment-checkbox')).tap();
    await element(by.id('confirm-acknowledgment-button')).tap();

    // Navigate and pick up
    await element(by.id('navigate-button')).tap();
    await setDeviceLocation(device, testLocations.pharmacyZurich);
    await element(by.id('scan-qr-button')).tap();
    await element(by.id('qr-scanner-camera')).tap();
    await element(by.id('confirm-pickup-button')).tap();

    // Arrive at destination
    await setDeviceLocation(device, testLocations.patientHomeZurich);
    await element(by.id('arrived-at-destination-button')).tap();

    // Attempt to submit without ID verification
    await waitFor(element(by.id('proof-of-delivery-screen')))
      .toBeVisible()
      .withTimeout(3000);

    await element(by.id('recipient-name-input')).typeText('Hans Mueller');
    await element(by.id('signature-canvas')).swipe('right', 'slow', 0.5);

    // Submit button should be disabled
    await detoxExpect(element(by.id('submit-proof-button'))).not.toBeEnabled();

    // Error message should be shown
    await detoxExpect(element(by.text('ID verification required for controlled substances'))).toBeVisible();
  });

  it('should prevent delivery without signature', async () => {
    // ... (abbreviated setup)

    await waitFor(element(by.id('proof-of-delivery-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Complete ID verification
    await element(by.id('verify-id-button')).tap();
    // ... (ID verification steps)

    // Enter recipient name but skip signature
    await element(by.id('recipient-name-input')).typeText('Hans Mueller');

    // Submit button should be disabled
    await detoxExpect(element(by.id('submit-proof-button'))).not.toBeEnabled();

    // Error message should be shown
    await detoxExpect(element(by.text('Signature required for controlled substances'))).toBeVisible();
  });

  it('should handle patient unavailability for controlled substance', async () => {
    // ... (setup and navigation)

    await waitFor(element(by.id('arrived-at-destination-button')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('arrived-at-destination-button')).tap();

    await waitFor(element(by.id('proof-of-delivery-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Mark as patient unavailable
    await element(by.id('patient-unavailable-button')).tap();

    await waitFor(element(by.id('failed-delivery-modal')))
      .toBeVisible()
      .withTimeout(2000);

    await detoxExpect(element(by.text('Patient Not Available'))).toBeVisible();
    await detoxExpect(element(by.text('Controlled substances cannot be left with anyone else. You must return the medication to the pharmacy.'))).toBeVisible();

    // Select reason
    await element(by.id('failure-reason-picker')).tap();
    await element(by.text('Patient Absent')).tap();

    // Add notes
    await element(by.id('failure-notes-input')).typeText('Patient not home. No one else available. Will return to pharmacy.');

    // Confirm return to pharmacy
    await element(by.id('confirm-return-to-pharmacy-button')).tap();

    // Verify status changes to "returned"
    await waitFor(element(by.text('Returning to Pharmacy')))
      .toBeVisible()
      .withTimeout(2000);

    // Verify navigation starts back to pharmacy
    await detoxExpect(element(by.id('navigation-screen'))).toBeVisible();
    await detoxExpect(element(by.text('Return to: ' + controlledSubstanceDelivery.pharmacyName))).toBeVisible();
  });

  it('should log audit trail for controlled substance delivery', async () => {
    // Complete delivery
    // ... (full workflow)

    // View audit trail
    await element(by.id('completed-tab')).tap();

    const completedDelivery = element(by.id(`delivery-card-${controlledSubstanceDelivery.id}`));
    await completedDelivery.tap();

    await element(by.id('view-audit-trail-button')).tap();

    await waitFor(element(by.id('audit-trail-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Verify audit events are logged
    await detoxExpect(element(by.text('Delivery Assigned'))).toBeVisible();
    await detoxExpect(element(by.text('Delivery Accepted'))).toBeVisible();
    await detoxExpect(element(by.text('Security Acknowledgment Signed'))).toBeVisible();
    await detoxExpect(element(by.text('Package Picked Up'))).toBeVisible();
    await detoxExpect(element(by.text('Patient ID Verified'))).toBeVisible();
    await detoxExpect(element(by.text('Signature Obtained'))).toBeVisible();
    await detoxExpect(element(by.text('Delivery Completed'))).toBeVisible();

    // Each event should have timestamp
    await detoxExpect(element(by.id('audit-event-timestamp-0'))).toBeVisible();
    await detoxExpect(element(by.id('audit-event-timestamp-1'))).toBeVisible();
  });
});
