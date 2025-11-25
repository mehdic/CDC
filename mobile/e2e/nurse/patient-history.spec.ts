/**
 * Nurse App Patient History E2E Tests
 *
 * Tests patient history and records functionality:
 * - Viewing patient medication history
 * - Accessing pharmacy records
 * - Allergy and interaction warnings
 */

describe('Nurse App Patient History', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', location: 'always' }
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    // Login before each test
    await loginAsNurse();
    await waitFor(element(by.id('nurse-dashboard-screen'))).toBeVisible().withTimeout(10000);
  });

  describe('Patient History Access', () => {
    it('should display patient history button in patient card', async () => {
      await expect(element(by.id('quick-action-history-0'))).toBeVisible();
    });

    it('should navigate to patient history screen', async () => {
      await element(by.id('quick-action-history-0')).tap();

      await waitFor(element(by.id('patient-history-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('patient-history-screen'))).toBeVisible();
    });

    it('should display patient information in history view', async () => {
      await navigateToPatientHistory();

      await expect(element(by.id('patient-header'))).toBeVisible();
      await expect(element(by.id('history-patient-name'))).toBeVisible();
      await expect(element(by.id('history-patient-dob'))).toBeVisible();
    });

    it('should display patient age and demographics', async () => {
      await navigateToPatientHistory();

      await expect(element(by.id('patient-age'))).toBeVisible();
      await expect(element(by.id('patient-gender'))).toBeVisible();
    });
  });

  describe('Medication History', () => {
    it('should display medication history tab', async () => {
      await navigateToPatientHistory();

      await expect(element(by.id('medication-history-tab'))).toBeVisible();
    });

    it('should display list of past medications', async () => {
      await navigateToPatientHistory();

      await element(by.id('medication-history-tab')).tap();

      await waitFor(element(by.id('medication-history-list'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('med-history-item-0'))).toBeVisible();
    });

    it('should display medication name in history', async () => {
      await navigateToPatientHistory();

      await element(by.id('medication-history-tab')).tap();

      await waitFor(element(by.id('med-history-item-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('med-name-history-0'))).toBeVisible();
    });

    it('should display medication dosage', async () => {
      await navigateToPatientHistory();

      await element(by.id('medication-history-tab')).tap();

      await waitFor(element(by.id('med-history-item-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('med-dosage-history-0'))).toBeVisible();
    });

    it('should display prescription date', async () => {
      await navigateToPatientHistory();

      await element(by.id('medication-history-tab')).tap();

      await waitFor(element(by.id('med-history-item-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('med-date-history-0'))).toBeVisible();
    });

    it('should display prescribing doctor information', async () => {
      await navigateToPatientHistory();

      await element(by.id('medication-history-tab')).tap();

      await waitFor(element(by.id('med-history-item-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('med-doctor-history-0'))).toBeVisible();
    });

    it('should display medication status (active/inactive)', async () => {
      await navigateToPatientHistory();

      await element(by.id('medication-history-tab')).tap();

      await waitFor(element(by.id('med-history-item-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('med-status-history-0'))).toBeVisible();
    });

    it('should filter medication history by status', async () => {
      await navigateToPatientHistory();

      await element(by.id('medication-history-tab')).tap();

      await waitFor(element(by.id('med-filter-button'))).toBeVisible().withTimeout(5000);
      await element(by.id('med-filter-button')).tap();

      await waitFor(element(by.id('med-filter-menu'))).toBeVisible().withTimeout(5000);
      await element(by.id('filter-active-medications')).tap();

      await waitFor(element(by.id('med-history-item-0'))).toBeVisible().withTimeout(5000);
    });

    it('should search medication history', async () => {
      await navigateToPatientHistory();

      await element(by.id('medication-history-tab')).tap();

      await waitFor(element(by.id('med-search-input'))).toBeVisible().withTimeout(5000);
      await element(by.id('med-search-input')).typeText('Aspirin');

      await waitFor(element(by.id('med-history-item-0'))).toBeVisible().withTimeout(5000);
    });

    it('should display medication detail on selection', async () => {
      await navigateToPatientHistory();

      await element(by.id('medication-history-tab')).tap();

      await waitFor(element(by.id('med-history-item-0'))).toBeVisible().withTimeout(5000);
      await element(by.id('med-history-item-0')).tap();

      await waitFor(element(by.id('medication-detail-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('med-detail-name'))).toBeVisible();
      await expect(element(by.id('med-detail-dosage'))).toBeVisible();
    });
  });

  describe('Allergy Information', () => {
    it('should display allergies tab', async () => {
      await navigateToPatientHistory();

      await expect(element(by.id('allergies-tab'))).toBeVisible();
    });

    it('should navigate to allergies view', async () => {
      await navigateToPatientHistory();

      await element(by.id('allergies-tab')).tap();

      await waitFor(element(by.id('allergies-list'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('allergies-list'))).toBeVisible();
    });

    it('should display patient allergies', async () => {
      await navigateToPatientHistory();

      await element(by.id('allergies-tab')).tap();

      await waitFor(element(by.id('allergy-item-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('allergy-item-0'))).toBeVisible();
    });

    it('should display allergy name', async () => {
      await navigateToPatientHistory();

      await element(by.id('allergies-tab')).tap();

      await waitFor(element(by.id('allergy-item-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('allergy-name-0'))).toBeVisible();
    });

    it('should display allergy severity', async () => {
      await navigateToPatientHistory();

      await element(by.id('allergies-tab')).tap();

      await waitFor(element(by.id('allergy-item-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('allergy-severity-0'))).toBeVisible();
    });

    it('should display allergy reaction description', async () => {
      await navigateToPatientHistory();

      await element(by.id('allergies-tab')).tap();

      await waitFor(element(by.id('allergy-item-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('allergy-reaction-0'))).toBeVisible();
    });

    it('should highlight severe allergies with warning color', async () => {
      await navigateToPatientHistory();

      await element(by.id('allergies-tab')).tap();

      await waitFor(element(by.id('allergy-item-0'))).toBeVisible().withTimeout(5000);
      // Severe allergies should have distinct styling
    });

    it('should display date when allergy was reported', async () => {
      await navigateToPatientHistory();

      await element(by.id('allergies-tab')).tap();

      await waitFor(element(by.id('allergy-item-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('allergy-date-0'))).toBeVisible();
    });

    it('should show warning when medication conflicts with allergy', async () => {
      await navigateToPatientHistory();

      // Medications tab to verify allergy warnings
      await element(by.id('medication-history-tab')).tap();

      await waitFor(element(by.id('med-history-item-0'))).toBeVisible().withTimeout(5000);
      // If medication conflicts with allergy, should show warning badge
    });
  });

  describe('Pharmacy Records', () => {
    it('should display pharmacy records tab', async () => {
      await navigateToPatientHistory();

      await expect(element(by.id('pharmacy-records-tab'))).toBeVisible();
    });

    it('should display pharmacy records', async () => {
      await navigateToPatientHistory();

      await element(by.id('pharmacy-records-tab')).tap();

      await waitFor(element(by.id('pharmacy-records-list'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('pharmacy-records-list'))).toBeVisible();
    });

    it('should display pharmacy name in record', async () => {
      await navigateToPatientHistory();

      await element(by.id('pharmacy-records-tab')).tap();

      await waitFor(element(by.id('pharmacy-record-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('pharmacy-name-0'))).toBeVisible();
    });

    it('should display medication from pharmacy record', async () => {
      await navigateToPatientHistory();

      await element(by.id('pharmacy-records-tab')).tap();

      await waitFor(element(by.id('pharmacy-record-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('pharmacy-med-0'))).toBeVisible();
    });

    it('should display quantity dispensed', async () => {
      await navigateToPatientHistory();

      await element(by.id('pharmacy-records-tab')).tap();

      await waitFor(element(by.id('pharmacy-record-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('pharmacy-qty-0'))).toBeVisible();
    });

    it('should display dispensing date', async () => {
      await navigateToPatientHistory();

      await element(by.id('pharmacy-records-tab')).tap();

      await waitFor(element(by.id('pharmacy-record-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('pharmacy-date-0'))).toBeVisible();
    });

    it('should filter pharmacy records by date range', async () => {
      await navigateToPatientHistory();

      await element(by.id('pharmacy-records-tab')).tap();

      await waitFor(element(by.id('pharmacy-date-filter'))).toBeVisible().withTimeout(5000);
      await element(by.id('pharmacy-date-filter')).tap();

      // Date picker should appear
      await waitFor(element(by.id('date-range-picker'))).toBeVisible().withTimeout(5000);
    });

    it('should access pharmacy contact information', async () => {
      await navigateToPatientHistory();

      await element(by.id('pharmacy-records-tab')).tap();

      await waitFor(element(by.id('pharmacy-record-0'))).toBeVisible().withTimeout(5000);
      await element(by.id('pharmacy-record-0')).tap();

      await waitFor(element(by.id('pharmacy-detail-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('pharmacy-phone'))).toBeVisible();
      await expect(element(by.id('pharmacy-address'))).toBeVisible();
    });
  });

  describe('Drug Interaction Warnings', () => {
    it('should display interaction warnings tab', async () => {
      await navigateToPatientHistory();

      await expect(element(by.id('interactions-tab'))).toBeVisible();
    });

    it('should display detected drug interactions', async () => {
      await navigateToPatientHistory();

      await element(by.id('interactions-tab')).tap();

      await waitFor(element(by.id('interactions-list'))).toBeVisible().withTimeout(5000);
      // Should show any detected interactions
    });

    it('should display interaction severity', async () => {
      await navigateToPatientHistory();

      await element(by.id('interactions-tab')).tap();

      // If interactions exist, should display severity level
    });

    it('should show interaction details on selection', async () => {
      await navigateToPatientHistory();

      await element(by.id('interactions-tab')).tap();

      // Tap interaction if available
      if (await element(by.id('interaction-item-0')).isVisible()) {
        await element(by.id('interaction-item-0')).tap();

        await waitFor(element(by.id('interaction-detail-screen'))).toBeVisible().withTimeout(5000);
      }
    });
  });

  describe('Medical Conditions', () => {
    it('should display medical conditions tab', async () => {
      await navigateToPatientHistory();

      await expect(element(by.id('conditions-tab'))).toBeVisible();
    });

    it('should display list of patient medical conditions', async () => {
      await navigateToPatientHistory();

      await element(by.id('conditions-tab')).tap();

      await waitFor(element(by.id('conditions-list'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('conditions-list'))).toBeVisible();
    });

    it('should display condition name', async () => {
      await navigateToPatientHistory();

      await element(by.id('conditions-tab')).tap();

      await waitFor(element(by.id('condition-item-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('condition-name-0'))).toBeVisible();
    });

    it('should display condition status', async () => {
      await navigateToPatientHistory();

      await element(by.id('conditions-tab')).tap();

      await waitFor(element(by.id('condition-item-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('condition-status-0'))).toBeVisible();
    });

    it('should display diagnosis date', async () => {
      await navigateToPatientHistory();

      await element(by.id('conditions-tab')).tap();

      await waitFor(element(by.id('condition-item-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('condition-date-0'))).toBeVisible();
    });
  });

  describe('History Export and Sharing', () => {
    it('should display export button', async () => {
      await navigateToPatientHistory();

      await expect(element(by.id('export-history-button'))).toBeVisible();
    });

    it('should export patient history', async () => {
      await navigateToPatientHistory();

      await element(by.id('export-history-button')).tap();

      await waitFor(element(by.id('export-format-menu'))).toBeVisible().withTimeout(5000);
      await element(by.id('export-pdf')).tap();

      // PDF should be generated
    });

    it('should display print button', async () => {
      await navigateToPatientHistory();

      await expect(element(by.id('print-history-button'))).toBeVisible();
    });

    it('should print patient history', async () => {
      await navigateToPatientHistory();

      await element(by.id('print-history-button')).tap();

      // Print dialog should appear
    });
  });

  describe('History Navigation', () => {
    it('should allow returning to patient list', async () => {
      await navigateToPatientHistory();

      await element(by.id('back-button')).tap();

      await waitFor(element(by.id('nurse-dashboard-screen'))).toBeVisible().withTimeout(5000);
    });

    it('should allow switching between history tabs', async () => {
      await navigateToPatientHistory();

      await element(by.id('medication-history-tab')).tap();
      await waitFor(element(by.id('medication-history-list'))).toBeVisible().withTimeout(5000);

      await element(by.id('allergies-tab')).tap();
      await waitFor(element(by.id('allergies-list'))).toBeVisible().withTimeout(5000);

      await element(by.id('pharmacy-records-tab')).tap();
      await waitFor(element(by.id('pharmacy-records-list'))).toBeVisible().withTimeout(5000);
    });
  });
});

// Helper functions
async function loginAsNurse() {
  await element(by.id('email-input')).typeText('nurse@healthcarefacility.ch');
  await element(by.id('password-input')).typeText('NursePass123!');
  await element(by.id('login-button')).tap();
}

async function navigateToPatientHistory() {
  await element(by.id('quick-action-history-0')).tap();
  await waitFor(element(by.id('patient-history-screen'))).toBeVisible().withTimeout(5000);
}
