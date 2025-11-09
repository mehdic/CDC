/**
 * Doctor Prescription Creation E2E Tests
 *
 * Tests the complete prescription workflow including:
 * - Create new prescription
 * - Select medications from database
 * - Set dosage and duration
 * - Add patient instructions
 * - Send to pharmacy
 * - Renew existing prescription
 */

describe('Doctor Prescription Creation', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
    });
    // Complete login
    await completeLogin();
  });

  beforeEach(async () => {
    // Navigate to prescription creation screen
    await element(by.id('create-prescription-button')).tap();
    await expect(element(by.id('prescription-form-screen'))).toBeVisible();
  });

  describe('Create New Prescription', () => {
    it('should display prescription creation form', async () => {
      await expect(element(by.id('patient-search-input'))).toBeVisible();
      await expect(element(by.id('medication-search-button'))).toBeVisible();
      await expect(element(by.id('prescription-submit-button'))).toBeVisible();
    });

    it('should search and select patient', async () => {
      await element(by.id('patient-search-input')).typeText('John Smith');
      await element(by.id('patient-search-button')).tap();

      await waitFor(element(by.id('patient-results-list'))).toBeVisible().withTimeout(5000);
      await element(by.id('patient-result-0')).tap();

      await expect(element(by.id('selected-patient-name'))).toHaveText('John Smith');
      await expect(element(by.id('selected-patient-dob'))).toBeVisible();
    });

    it('should add medication to prescription', async () => {
      // Select patient first
      await selectPatient('John Smith');

      // Search medication
      await element(by.id('medication-search-button')).tap();
      await expect(element(by.id('medication-search-screen'))).toBeVisible();

      await element(by.id('medication-search-input')).typeText('Amoxicillin');
      await element(by.id('medication-search-submit')).tap();

      await waitFor(element(by.id('medication-results-list'))).toBeVisible().withTimeout(5000);
      await element(by.id('medication-result-0')).tap();

      // Should return to prescription form with medication added
      await expect(element(by.id('prescription-form-screen'))).toBeVisible();
      await expect(element(by.id('medication-item-0'))).toBeVisible();
      await expect(element(by.id('medication-item-0-name'))).toHaveText('Amoxicillin 500mg');
    });

    it('should set dosage instructions for medication', async () => {
      await selectPatient('John Smith');
      await addMedication('Amoxicillin');

      // Edit dosage
      await element(by.id('medication-item-0-edit')).tap();
      await expect(element(by.id('dosage-modal'))).toBeVisible();

      // Set dosage
      await element(by.id('dosage-amount-input')).replaceText('1');
      await element(by.id('dosage-frequency-picker')).tap();
      await element(by.text('3 times per day')).tap();
      await element(by.id('dosage-duration-input')).replaceText('7');

      // Add special instructions
      await element(by.id('dosage-instructions-input')).typeText('Take with food');

      await element(by.id('dosage-save-button')).tap();

      // Verify dosage is saved
      await expect(element(by.id('medication-item-0-dosage'))).toHaveText('1 tablet, 3 times per day for 7 days');
      await expect(element(by.id('medication-item-0-instructions'))).toHaveText('Take with food');
    });

    it('should add multiple medications to single prescription', async () => {
      await selectPatient('John Smith');
      await addMedication('Amoxicillin');
      await addMedication('Ibuprofen');

      await expect(element(by.id('medication-item-0'))).toBeVisible();
      await expect(element(by.id('medication-item-1'))).toBeVisible();
      await expect(element(by.id('prescription-medication-count'))).toHaveText('2 medications');
    });

    it('should validate required fields before submission', async () => {
      // Try to submit without patient
      await element(by.id('prescription-submit-button')).tap();
      await expect(element(by.id('validation-error'))).toBeVisible();
      await expect(element(by.id('validation-error'))).toHaveText('Please select a patient');

      // Add patient but no medication
      await selectPatient('John Smith');
      await element(by.id('prescription-submit-button')).tap();
      await expect(element(by.id('validation-error'))).toHaveText('Please add at least one medication');
    });
  });

  describe('Send Prescription to Pharmacy', () => {
    beforeEach(async () => {
      // Create complete prescription
      await selectPatient('John Smith');
      await addMedication('Amoxicillin');
      await setDosage(0, '1', '3 times per day', '7', 'Take with food');
    });

    it('should display pharmacy selection screen', async () => {
      await element(by.id('prescription-submit-button')).tap();
      await expect(element(by.id('pharmacy-selection-screen'))).toBeVisible();
      await expect(element(by.id('pharmacy-search-input'))).toBeVisible();
    });

    it('should search and select pharmacy', async () => {
      await element(by.id('prescription-submit-button')).tap();

      await element(by.id('pharmacy-search-input')).typeText('Central Pharmacy');
      await element(by.id('pharmacy-search-button')).tap();

      await waitFor(element(by.id('pharmacy-results-list'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('pharmacy-result-0-name'))).toHaveText('Central Pharmacy');

      await element(by.id('pharmacy-result-0')).tap();
      await element(by.id('pharmacy-confirm-button')).tap();

      // Should show success confirmation
      await expect(element(by.id('prescription-sent-confirmation'))).toBeVisible();
      await expect(element(by.id('prescription-sent-message'))).toHaveText('Prescription sent successfully');
    });

    it('should allow sending to patient preferred pharmacy', async () => {
      await element(by.id('prescription-submit-button')).tap();

      // Patient has preferred pharmacy
      await expect(element(by.id('preferred-pharmacy-banner'))).toBeVisible();
      await element(by.id('use-preferred-pharmacy-button')).tap();
      await element(by.id('pharmacy-confirm-button')).tap();

      await expect(element(by.id('prescription-sent-confirmation'))).toBeVisible();
    });

    it('should show prescription summary before sending', async () => {
      await element(by.id('prescription-submit-button')).tap();
      await element(by.id('pharmacy-result-0')).tap();

      // Summary screen
      await expect(element(by.id('prescription-summary-screen'))).toBeVisible();
      await expect(element(by.id('summary-patient-name'))).toHaveText('John Smith');
      await expect(element(by.id('summary-medication-count'))).toHaveText('1 medication');
      await expect(element(by.id('summary-pharmacy-name'))).toHaveText('Central Pharmacy');

      await element(by.id('pharmacy-confirm-button')).tap();
      await expect(element(by.id('prescription-sent-confirmation'))).toBeVisible();
    });
  });

  describe('Renew Existing Prescription', () => {
    it('should display patient prescription history', async () => {
      await element(by.id('back-button')).tap(); // Go back to dashboard
      await element(by.id('prescriptions-tab')).tap();
      await element(by.id('patient-search-input')).typeText('John Smith');
      await element(by.id('search-button')).tap();

      await waitFor(element(by.id('prescription-history-list'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('prescription-history-item-0'))).toBeVisible();
    });

    it('should open prescription renewal form', async () => {
      await navigateToPrescriptionHistory('John Smith');

      await element(by.id('prescription-history-item-0')).tap();
      await expect(element(by.id('prescription-detail-screen'))).toBeVisible();
      await expect(element(by.id('renew-prescription-button'))).toBeVisible();

      await element(by.id('renew-prescription-button')).tap();
      await expect(element(by.id('prescription-renewal-screen'))).toBeVisible();
    });

    it('should pre-fill renewal form with previous prescription data', async () => {
      await navigateToPrescriptionHistory('John Smith');
      await element(by.id('prescription-history-item-0')).tap();
      await element(by.id('renew-prescription-button')).tap();

      await expect(element(by.id('selected-patient-name'))).toHaveText('John Smith');
      await expect(element(by.id('medication-item-0'))).toBeVisible();
      await expect(element(by.id('medication-item-0-name'))).toHaveText('Amoxicillin 500mg');
    });

    it('should allow modifying dosage before renewing', async () => {
      await navigateToPrescriptionHistory('John Smith');
      await element(by.id('prescription-history-item-0')).tap();
      await element(by.id('renew-prescription-button')).tap();

      // Modify dosage
      await element(by.id('medication-item-0-edit')).tap();
      await element(by.id('dosage-duration-input')).replaceText('10');
      await element(by.id('dosage-save-button')).tap();

      await expect(element(by.id('medication-item-0-dosage'))).toContain('10 days');
    });

    it('should successfully send renewed prescription', async () => {
      await navigateToPrescriptionHistory('John Smith');
      await element(by.id('prescription-history-item-0')).tap();
      await element(by.id('renew-prescription-button')).tap();

      await element(by.id('prescription-submit-button')).tap();
      await element(by.id('use-preferred-pharmacy-button')).tap();
      await element(by.id('pharmacy-confirm-button')).tap();

      await expect(element(by.id('prescription-sent-confirmation'))).toBeVisible();
    });
  });

  describe('Drug Interaction Warnings', () => {
    it('should warn about drug interactions', async () => {
      await selectPatient('John Smith');
      await addMedication('Warfarin');
      await addMedication('Aspirin'); // Known interaction with Warfarin

      await expect(element(by.id('interaction-warning'))).toBeVisible();
      await expect(element(by.id('interaction-warning-text'))).toContain('Drug interaction detected');
    });

    it('should show detailed interaction information', async () => {
      await selectPatient('John Smith');
      await addMedication('Warfarin');
      await addMedication('Aspirin');

      await element(by.id('interaction-warning-details-button')).tap();
      await expect(element(by.id('interaction-details-modal'))).toBeVisible();
      await expect(element(by.id('interaction-severity'))).toHaveText('Moderate');
    });

    it('should allow proceeding with acknowledgment', async () => {
      await selectPatient('John Smith');
      await addMedication('Warfarin');
      await addMedication('Aspirin');

      await element(by.id('interaction-acknowledge-checkbox')).tap();
      await expect(element(by.id('prescription-submit-button'))).toBeEnabled();
    });
  });
});

/**
 * Helper Functions
 */

async function completeLogin() {
  await element(by.id('eid-login-button')).tap();
  await waitFor(element(by.id('eid-username-input'))).toBeVisible().withTimeout(5000);
  await element(by.id('eid-username-input')).typeText('doctor@hin.ch');
  await element(by.id('eid-password-input')).typeText('ValidPassword123!');
  await element(by.id('eid-submit-button')).tap();
  await waitFor(element(by.id('mfa-screen'))).toBeVisible().withTimeout(10000);
  await element(by.id('mfa-code-input')).typeText('123456');
  await element(by.id('mfa-submit-button')).tap();
  await waitFor(element(by.id('doctor-dashboard'))).toBeVisible().withTimeout(10000);
}

async function selectPatient(patientName: string) {
  await element(by.id('patient-search-input')).typeText(patientName);
  await element(by.id('patient-search-button')).tap();
  await waitFor(element(by.id('patient-results-list'))).toBeVisible().withTimeout(5000);
  await element(by.id('patient-result-0')).tap();
}

async function addMedication(medicationName: string) {
  await element(by.id('medication-search-button')).tap();
  await expect(element(by.id('medication-search-screen'))).toBeVisible();
  await element(by.id('medication-search-input')).typeText(medicationName);
  await element(by.id('medication-search-submit')).tap();
  await waitFor(element(by.id('medication-results-list'))).toBeVisible().withTimeout(5000);
  await element(by.id('medication-result-0')).tap();
}

async function setDosage(
  index: number,
  amount: string,
  frequency: string,
  duration: string,
  instructions: string
) {
  await element(by.id(`medication-item-${index}-edit`)).tap();
  await expect(element(by.id('dosage-modal'))).toBeVisible();
  await element(by.id('dosage-amount-input')).replaceText(amount);
  await element(by.id('dosage-frequency-picker')).tap();
  await element(by.text(frequency)).tap();
  await element(by.id('dosage-duration-input')).replaceText(duration);
  await element(by.id('dosage-instructions-input')).typeText(instructions);
  await element(by.id('dosage-save-button')).tap();
}

async function navigateToPrescriptionHistory(patientName: string) {
  await element(by.id('back-button')).tap();
  await element(by.id('prescriptions-tab')).tap();
  await element(by.id('patient-search-input')).typeText(patientName);
  await element(by.id('search-button')).tap();
  await waitFor(element(by.id('prescription-history-list'))).toBeVisible().withTimeout(5000);
}
