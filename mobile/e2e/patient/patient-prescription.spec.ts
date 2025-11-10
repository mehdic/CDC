/**
 * Patient Prescription Management E2E Tests
 *
 * Tests prescription management functionality for patients:
 * - Upload prescription photo (OCR mock)
 * - Track prescription status
 * - View prescription history
 * - Request renewal
 * - Receive notifications
 */

describe('Patient Prescription Management', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await loginAsPatient();
  });

  beforeEach(async () => {
    // Navigate to prescriptions tab
    await element(by.id('prescriptions-tab')).tap();
    await expect(element(by.id('prescriptions-screen'))).toBeVisible();
  });

  describe('Upload Prescription Photo', () => {
    it('should display upload prescription option', async () => {
      await expect(element(by.id('upload-prescription-button'))).toBeVisible();
      await expect(element(by.id('upload-prescription-button'))).toHaveText('Upload Prescription');
    });

    it('should choose photo from camera', async () => {
      await element(by.id('upload-prescription-button')).tap();
      await expect(element(by.id('upload-options-modal'))).toBeVisible();

      await element(by.id('take-photo-option')).tap();

      // Camera permission and capture
      await waitFor(element(by.id('camera-view'))).toBeVisible().withTimeout(5000);
      await element(by.id('capture-button')).tap();

      // Preview and confirm
      await expect(element(by.id('photo-preview'))).toBeVisible();
      await element(by.id('confirm-photo-button')).tap();

      // OCR processing
      await waitFor(element(by.id('ocr-processing'))).toBeVisible().withTimeout(2000);
      await waitFor(element(by.id('prescription-details-screen'))).toBeVisible().withTimeout(10000);
    });

    it('should choose photo from gallery', async () => {
      await element(by.id('upload-prescription-button')).tap();
      await element(by.id('choose-from-gallery-option')).tap();

      // Photo picker
      await waitFor(element(by.id('photo-picker'))).toBeVisible().withTimeout(5000);
      await element(by.id('photo-0')).tap();

      await expect(element(by.id('photo-preview'))).toBeVisible();
      await element(by.id('confirm-photo-button')).tap();

      await waitFor(element(by.id('prescription-details-screen'))).toBeVisible().withTimeout(10000);
    });

    it('should display OCR results for verification', async () => {
      await uploadPrescriptionPhoto();

      await expect(element(by.id('prescription-details-screen'))).toBeVisible();
      await expect(element(by.id('ocr-patient-name'))).toBeVisible();
      await expect(element(by.id('ocr-medication-name'))).toBeVisible();
      await expect(element(by.id('ocr-dosage'))).toBeVisible();
      await expect(element(by.id('ocr-doctor-name'))).toBeVisible();
    });

    it('should allow editing OCR results', async () => {
      await uploadPrescriptionPhoto();

      await element(by.id('edit-medication-button')).tap();
      await element(by.id('medication-name-input')).replaceText('Corrected Medication Name');
      await element(by.id('save-medication-button')).tap();

      await expect(element(by.id('ocr-medication-name'))).toHaveText('Corrected Medication Name');
    });

    it('should select pharmacy for prescription', async () => {
      await uploadPrescriptionPhoto();

      await element(by.id('select-pharmacy-button')).tap();
      await expect(element(by.id('pharmacy-selection-screen'))).toBeVisible();

      await element(by.id('pharmacy-search-input')).typeText('Central Pharmacy');
      await element(by.id('pharmacy-search-button')).tap();

      await waitFor(element(by.id('pharmacy-results-list'))).toBeVisible().withTimeout(5000);
      await element(by.id('pharmacy-result-0')).tap();

      await expect(element(by.id('selected-pharmacy-name'))).toHaveText('Central Pharmacy');
    });

    it('should submit prescription to pharmacy', async () => {
      await uploadPrescriptionPhoto();

      // Select pharmacy
      await element(by.id('select-pharmacy-button')).tap();
      await element(by.id('pharmacy-result-0')).tap();

      // Submit
      await element(by.id('submit-prescription-button')).tap();

      await expect(element(by.id('prescription-submitted-success'))).toBeVisible();
      await expect(element(by.id('success-message'))).toHaveText('Prescription submitted successfully');

      // Should navigate to prescription tracking
      await waitFor(element(by.id('prescription-tracking-screen'))).toBeVisible().withTimeout(5000);
    });

    it('should handle OCR errors gracefully', async () => {
      // Upload illegible prescription
      await element(by.id('upload-prescription-button')).tap();
      await element(by.id('choose-from-gallery-option')).tap();
      await waitFor(element(by.id('photo-picker'))).toBeVisible().withTimeout(5000);
      await element(by.id('photo-illegible')).tap(); // Mock illegible photo
      await element(by.id('confirm-photo-button')).tap();

      await waitFor(element(by.id('ocr-error-message'))).toBeVisible().withTimeout(10000);
      await expect(element(by.id('ocr-error-message'))).toContain('Unable to read prescription');
      await expect(element(by.id('retry-button'))).toBeVisible();
      await expect(element(by.id('manual-entry-button'))).toBeVisible();
    });
  });

  describe('Track Prescription Status', () => {
    beforeEach(async () => {
      // Assume prescription is uploaded and being processed
      await uploadAndSubmitPrescription();
    });

    it('should display prescription status', async () => {
      await expect(element(by.id('prescription-0'))).toBeVisible();
      await expect(element(by.id('prescription-0-status'))).toBeVisible();
      await expect(element(by.id('prescription-0-medication'))).toBeVisible();
    });

    it('should show status progression timeline', async () => {
      await element(by.id('prescription-0')).tap();
      await expect(element(by.id('prescription-detail-screen'))).toBeVisible();

      await expect(element(by.id('status-timeline'))).toBeVisible();
      await expect(element(by.id('status-submitted'))).toBeVisible();
      await expect(element(by.id('status-submitted-icon'))).toHaveClass('completed');
    });

    it('should update status in real-time', async () => {
      await element(by.id('prescription-0')).tap();

      // Initial status
      await expect(element(by.id('current-status'))).toHaveText('Processing');

      // Simulate status update from backend
      await new Promise(resolve => setTimeout(resolve, 3000));
      await element(by.id('refresh-status-button')).tap();

      await waitFor(element(by.id('current-status')))
        .toHaveText('Ready for pickup')
        .withTimeout(5000);
    });

    it('should show estimated ready time', async () => {
      await element(by.id('prescription-0')).tap();

      await expect(element(by.id('estimated-ready-time'))).toBeVisible();
      await expect(element(by.id('estimated-ready-time'))).toContain('Estimated ready');
    });

    it('should display pharmacy contact information', async () => {
      await element(by.id('prescription-0')).tap();

      await expect(element(by.id('pharmacy-info-section'))).toBeVisible();
      await expect(element(by.id('pharmacy-name'))).toHaveText('Central Pharmacy');
      await expect(element(by.id('pharmacy-address'))).toBeVisible();
      await expect(element(by.id('pharmacy-phone'))).toBeVisible();
      await expect(element(by.id('call-pharmacy-button'))).toBeVisible();
    });
  });

  describe('View Prescription History', () => {
    it('should display all past prescriptions', async () => {
      await element(by.id('history-tab')).tap();
      await expect(element(by.id('prescription-history-list'))).toBeVisible();

      await expect(element(by.id('history-item-0'))).toBeVisible();
      await expect(element(by.id('history-item-1'))).toBeVisible();
    });

    it('should filter prescription history by date', async () => {
      await element(by.id('history-tab')).tap();
      await element(by.id('filter-history-button')).tap();

      await expect(element(by.id('filter-modal'))).toBeVisible();
      await element(by.id('filter-last-30-days')).tap();
      await element(by.id('apply-filter-button')).tap();

      await expect(element(by.id('active-filter-badge'))).toHaveText('Last 30 days');
      await expect(element(by.id('prescription-history-list'))).toBeVisible();
    });

    it('should search prescription history', async () => {
      await element(by.id('history-tab')).tap();
      await element(by.id('search-history-input')).typeText('Amoxicillin');

      await waitFor(element(by.id('search-results-list'))).toBeVisible().withTimeout(3000);
      await expect(element(by.id('search-result-0'))).toBeVisible();
      await expect(element(by.id('search-result-0-medication'))).toContain('Amoxicillin');
    });

    it('should view historical prescription details', async () => {
      await element(by.id('history-tab')).tap();
      await element(by.id('history-item-0')).tap();

      await expect(element(by.id('prescription-detail-modal'))).toBeVisible();
      await expect(element(by.id('detail-medication'))).toBeVisible();
      await expect(element(by.id('detail-dosage'))).toBeVisible();
      await expect(element(by.id('detail-pharmacy'))).toBeVisible();
      await expect(element(by.id('detail-date'))).toBeVisible();
      await expect(element(by.id('detail-doctor'))).toBeVisible();
    });

    it('should export prescription history', async () => {
      await element(by.id('history-tab')).tap();
      await element(by.id('history-menu-button')).tap();
      await element(by.id('export-history-option')).tap();

      await expect(element(by.id('export-options-modal'))).toBeVisible();
      await element(by.id('export-pdf-option')).tap();

      await waitFor(element(by.id('export-success'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('export-success'))).toHaveText('History exported successfully');
    });
  });

  describe('Request Renewal', () => {
    it('should identify renewable prescriptions', async () => {
      await element(by.id('history-tab')).tap();

      await expect(element(by.id('history-item-renewable-0'))).toBeVisible();
      await expect(element(by.id('history-item-renewable-0-badge'))).toHaveText('Can renew');
    });

    it('should request prescription renewal', async () => {
      await element(by.id('history-tab')).tap();
      await element(by.id('history-item-renewable-0')).tap();

      await expect(element(by.id('prescription-detail-modal'))).toBeVisible();
      await element(by.id('request-renewal-button')).tap();

      await expect(element(by.id('renewal-confirmation-modal'))).toBeVisible();
      await expect(element(by.id('renewal-medication-name'))).toBeVisible();
      await element(by.id('confirm-renewal-button')).tap();

      await expect(element(by.id('renewal-submitted-success'))).toBeVisible();
      await expect(element(by.id('success-message'))).toContain('Renewal request sent');
    });

    it('should select pharmacy for renewal', async () => {
      await element(by.id('history-tab')).tap();
      await element(by.id('history-item-renewable-0')).tap();
      await element(by.id('request-renewal-button')).tap();

      // Change pharmacy
      await element(by.id('change-pharmacy-button')).tap();
      await element(by.id('pharmacy-search-input')).typeText('City Pharmacy');
      await element(by.id('pharmacy-search-button')).tap();
      await waitFor(element(by.id('pharmacy-results-list'))).toBeVisible().withTimeout(5000);
      await element(by.id('pharmacy-result-0')).tap();

      await element(by.id('confirm-renewal-button')).tap();
      await expect(element(by.id('renewal-submitted-success'))).toBeVisible();
    });

    it('should add notes to renewal request', async () => {
      await element(by.id('history-tab')).tap();
      await element(by.id('history-item-renewable-0')).tap();
      await element(by.id('request-renewal-button')).tap();

      await element(by.id('renewal-notes-input')).typeText('Need higher dosage, symptoms returning');
      await element(by.id('confirm-renewal-button')).tap();

      await expect(element(by.id('renewal-submitted-success'))).toBeVisible();
    });

    it('should handle non-renewable prescriptions', async () => {
      await element(by.id('history-tab')).tap();
      await element(by.id('history-item-controlled-0')).tap(); // Controlled substance

      await expect(element(by.id('prescription-detail-modal'))).toBeVisible();
      await expect(element(by.id('renewal-not-available-message'))).toBeVisible();
      await expect(element(by.id('renewal-not-available-message'))).toContain('requires new prescription');
      await expect(element(by.id('request-renewal-button'))).not.toBeVisible();
    });
  });

  describe('Receive Notifications', () => {
    it('should receive notification when prescription is ready', async () => {
      // Background the app
      await device.sendToHome();

      // Simulate prescription ready notification
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Launch app from notification
      await device.launchApp({ newInstance: false });

      // Should navigate to prescription detail
      await waitFor(element(by.id('prescription-detail-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('current-status'))).toHaveText('Ready for pickup');
    });

    it('should display in-app notification badge', async () => {
      // Simulate new status update while app is active
      await new Promise(resolve => setTimeout(resolve, 2000));

      await expect(element(by.id('prescriptions-tab-badge'))).toBeVisible();
      await expect(element(by.id('prescriptions-tab-badge'))).toHaveText('1');
    });

    it('should show notification in notification center', async () => {
      await element(by.id('notifications-button')).tap();
      await expect(element(by.id('notifications-screen'))).toBeVisible();

      await expect(element(by.id('notification-0'))).toBeVisible();
      await expect(element(by.id('notification-0-title'))).toHaveText('Prescription Ready');
      await expect(element(by.id('notification-0-message'))).toContain('ready for pickup');
    });

    it('should tap notification to view prescription', async () => {
      await element(by.id('notifications-button')).tap();
      await element(by.id('notification-0')).tap();

      await expect(element(by.id('prescription-detail-screen'))).toBeVisible();
    });

    it('should manage notification preferences', async () => {
      await element(by.id('profile-tab')).tap();
      await element(by.id('notification-settings-button')).tap();

      await expect(element(by.id('prescription-status-notifications-toggle'))).toBeVisible();
      await element(by.id('prescription-status-notifications-toggle')).tap();

      await expect(element(by.id('settings-saved'))).toBeVisible();
    });
  });

  describe('Prescription QR Code', () => {
    it('should display QR code for prescription', async () => {
      await element(by.id('prescription-0')).tap();
      await element(by.id('show-qr-code-button')).tap();

      await expect(element(by.id('qr-code-modal'))).toBeVisible();
      await expect(element(by.id('qr-code-image'))).toBeVisible();
      await expect(element(by.id('qr-code-instructions'))).toContain('Show this QR code');
    });

    it('should adjust QR code brightness for scanning', async () => {
      await element(by.id('prescription-0')).tap();
      await element(by.id('show-qr-code-button')).tap();

      // QR code screen should have increased brightness
      await expect(element(by.id('qr-code-modal'))).toBeVisible();
      await expect(element(by.id('brightness-indicator'))).toHaveText('Brightness increased');
    });
  });
});

/**
 * Helper Functions
 */

async function loginAsPatient() {
  await element(by.id('login-button')).tap();
  await element(by.id('login-email-input')).typeText('patient@example.com');
  await element(by.id('login-password-input')).typeText('ValidPassword123!');
  await element(by.id('login-submit-button')).tap();
  await waitFor(element(by.id('patient-dashboard'))).toBeVisible().withTimeout(10000);
}

async function uploadPrescriptionPhoto() {
  await element(by.id('upload-prescription-button')).tap();
  await element(by.id('choose-from-gallery-option')).tap();
  await waitFor(element(by.id('photo-picker'))).toBeVisible().withTimeout(5000);
  await element(by.id('photo-0')).tap();
  await element(by.id('confirm-photo-button')).tap();
  await waitFor(element(by.id('prescription-details-screen'))).toBeVisible().withTimeout(10000);
}

async function uploadAndSubmitPrescription() {
  await uploadPrescriptionPhoto();
  await element(by.id('select-pharmacy-button')).tap();
  await element(by.id('pharmacy-result-0')).tap();
  await element(by.id('submit-prescription-button')).tap();
  await waitFor(element(by.id('prescription-submitted-success'))).toBeVisible().withTimeout(5000);
  await element(by.id('back-to-prescriptions-button')).tap();
}
