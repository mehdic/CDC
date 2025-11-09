/**
 * Doctor Patient Records Access E2E Tests
 *
 * Tests patient record access functionality:
 * - Search for patient
 * - View patient medical history
 * - Check patient consent
 * - Access Swiss cantonal health records (mock e-santé API)
 * - View patient prescriptions
 * - Add medical notes
 */

describe('Doctor Patient Records Access', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await completeLogin();
  });

  beforeEach(async () => {
    // Navigate to patient records tab
    await element(by.id('patient-records-tab')).tap();
    await expect(element(by.id('patient-records-screen'))).toBeVisible();
  });

  describe('Search for Patient', () => {
    it('should display patient search interface', async () => {
      await expect(element(by.id('patient-search-input'))).toBeVisible();
      await expect(element(by.id('patient-search-button'))).toBeVisible();
      await expect(element(by.id('search-by-filters-button'))).toBeVisible();
    });

    it('should search patient by name', async () => {
      await element(by.id('patient-search-input')).typeText('John Smith');
      await element(by.id('patient-search-button')).tap();

      await waitFor(element(by.id('patient-search-results'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('patient-result-0'))).toBeVisible();
      await expect(element(by.id('patient-result-0-name'))).toHaveText('John Smith');
    });

    it('should search patient by insurance number', async () => {
      await element(by.id('search-by-filters-button')).tap();
      await expect(element(by.id('advanced-search-modal'))).toBeVisible();

      await element(by.id('search-insurance-number-input')).typeText('756.1234.5678.90');
      await element(by.id('advanced-search-submit')).tap();

      await waitFor(element(by.id('patient-search-results'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('patient-result-0'))).toBeVisible();
    });

    it('should search patient by date of birth', async () => {
      await element(by.id('search-by-filters-button')).tap();
      await element(by.id('search-dob-input')).tap();

      // Use date picker
      await element(by.id('date-picker-year')).tap();
      await element(by.text('1985')).tap();
      await element(by.id('date-picker-month')).tap();
      await element(by.text('March')).tap();
      await element(by.id('date-picker-day')).tap();
      await element(by.text('15')).tap();
      await element(by.id('date-picker-confirm')).tap();

      await element(by.id('advanced-search-submit')).tap();

      await waitFor(element(by.id('patient-search-results'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('patient-result-0'))).toBeVisible();
    });

    it('should show no results message for invalid search', async () => {
      await element(by.id('patient-search-input')).typeText('NonexistentPatient9999');
      await element(by.id('patient-search-button')).tap();

      await waitFor(element(by.id('no-results-message'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('no-results-message'))).toHaveText('No patients found');
    });
  });

  describe('View Patient Medical History', () => {
    beforeEach(async () => {
      await searchAndSelectPatient('John Smith');
    });

    it('should display patient overview', async () => {
      await expect(element(by.id('patient-detail-screen'))).toBeVisible();
      await expect(element(by.id('patient-name'))).toHaveText('John Smith');
      await expect(element(by.id('patient-dob'))).toBeVisible();
      await expect(element(by.id('patient-insurance-number'))).toBeVisible();
    });

    it('should display medical history timeline', async () => {
      await element(by.id('medical-history-tab')).tap();
      await expect(element(by.id('medical-history-timeline'))).toBeVisible();

      await expect(element(by.id('history-item-0'))).toBeVisible();
      await expect(element(by.id('history-item-0-date'))).toBeVisible();
      await expect(element(by.id('history-item-0-type'))).toBeVisible();
    });

    it('should view detailed medical event', async () => {
      await element(by.id('medical-history-tab')).tap();
      await element(by.id('history-item-0')).tap();

      await expect(element(by.id('medical-event-detail-modal'))).toBeVisible();
      await expect(element(by.id('event-date'))).toBeVisible();
      await expect(element(by.id('event-diagnosis'))).toBeVisible();
      await expect(element(by.id('event-treatment'))).toBeVisible();
      await expect(element(by.id('event-provider'))).toBeVisible();
    });

    it('should display chronic conditions', async () => {
      await element(by.id('conditions-tab')).tap();
      await expect(element(by.id('chronic-conditions-list'))).toBeVisible();

      await expect(element(by.id('condition-0'))).toBeVisible();
      await expect(element(by.id('condition-0-name'))).toHaveText('Hypertension');
      await expect(element(by.id('condition-0-since'))).toBeVisible();
    });

    it('should display allergies and contraindications', async () => {
      await element(by.id('allergies-tab')).tap();
      await expect(element(by.id('allergies-list'))).toBeVisible();

      await expect(element(by.id('allergy-0'))).toBeVisible();
      await expect(element(by.id('allergy-0-name'))).toHaveText('Penicillin');
      await expect(element(by.id('allergy-0-severity'))).toHaveText('Severe');
      await expect(element(by.id('allergy-0-reaction'))).toBeVisible();
    });
  });

  describe('Check Patient Consent', () => {
    beforeEach(async () => {
      await searchAndSelectPatient('John Smith');
    });

    it('should display patient consent status', async () => {
      await element(by.id('consent-tab')).tap();
      await expect(element(by.id('consent-status-screen'))).toBeVisible();

      await expect(element(by.id('data-sharing-consent'))).toBeVisible();
      await expect(element(by.id('data-sharing-consent-status'))).toHaveText('Granted');
    });

    it('should show consent history', async () => {
      await element(by.id('consent-tab')).tap();
      await element(by.id('consent-history-button')).tap();

      await expect(element(by.id('consent-history-list'))).toBeVisible();
      await expect(element(by.id('consent-history-item-0'))).toBeVisible();
      await expect(element(by.id('consent-history-item-0-date'))).toBeVisible();
      await expect(element(by.id('consent-history-item-0-action'))).toBeVisible();
    });

    it('should warn when accessing records without consent', async () => {
      // Search for patient without consent
      await element(by.id('back-button')).tap();
      await searchAndSelectPatient('Jane Doe NoConsent');

      await expect(element(by.id('consent-warning-modal'))).toBeVisible();
      await expect(element(by.id('consent-warning-message'))).toContain('does not have active consent');
    });

    it('should allow emergency access override', async () => {
      await element(by.id('back-button')).tap();
      await searchAndSelectPatient('Jane Doe NoConsent');

      await expect(element(by.id('consent-warning-modal'))).toBeVisible();
      await element(by.id('emergency-access-checkbox')).tap();
      await element(by.id('emergency-reason-input')).typeText('Medical emergency - immediate treatment required');
      await element(by.id('emergency-access-confirm')).tap();

      // Should grant access with audit log
      await expect(element(by.id('patient-detail-screen'))).toBeVisible();
      await expect(element(by.id('emergency-access-banner'))).toBeVisible();
    });
  });

  describe('Access Swiss Cantonal Health Records', () => {
    beforeEach(async () => {
      await searchAndSelectPatient('John Smith');
    });

    it('should display e-santé integration option', async () => {
      await element(by.id('esante-records-tab')).tap();
      await expect(element(by.id('esante-records-screen'))).toBeVisible();
      await expect(element(by.id('fetch-esante-button'))).toBeVisible();
    });

    it('should fetch records from e-santé API', async () => {
      await element(by.id('esante-records-tab')).tap();
      await element(by.id('fetch-esante-button')).tap();

      await waitFor(element(by.id('esante-loading'))).toBeVisible().withTimeout(2000);
      await waitFor(element(by.id('esante-records-list'))).toBeVisible().withTimeout(10000);

      await expect(element(by.id('esante-record-0'))).toBeVisible();
    });

    it('should display canton-specific records', async () => {
      await element(by.id('esante-records-tab')).tap();
      await element(by.id('fetch-esante-button')).tap();
      await waitFor(element(by.id('esante-records-list'))).toBeVisible().withTimeout(10000);

      await expect(element(by.id('esante-record-0-canton'))).toHaveText('Canton: Vaud');
      await expect(element(by.id('esante-record-0-facility'))).toBeVisible();
    });

    it('should handle e-santé API errors gracefully', async () => {
      // Simulate API error (patient not in cantonal system)
      await element(by.id('back-button')).tap();
      await searchAndSelectPatient('New Patient NoCantonal');

      await element(by.id('esante-records-tab')).tap();
      await element(by.id('fetch-esante-button')).tap();

      await waitFor(element(by.id('esante-error-message'))).toBeVisible().withTimeout(10000);
      await expect(element(by.id('esante-error-message'))).toContain('No cantonal records found');
    });

    it('should sync e-santé records to local system', async () => {
      await element(by.id('esante-records-tab')).tap();
      await element(by.id('fetch-esante-button')).tap();
      await waitFor(element(by.id('esante-records-list'))).toBeVisible().withTimeout(10000);

      await element(by.id('sync-esante-records-button')).tap();
      await waitFor(element(by.id('sync-success-message'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('sync-success-message'))).toHaveText('Records synchronized');
    });
  });

  describe('View Patient Prescriptions', () => {
    beforeEach(async () => {
      await searchAndSelectPatient('John Smith');
    });

    it('should display patient prescription history', async () => {
      await element(by.id('prescriptions-tab')).tap();
      await expect(element(by.id('patient-prescriptions-list'))).toBeVisible();

      await expect(element(by.id('prescription-0'))).toBeVisible();
      await expect(element(by.id('prescription-0-date'))).toBeVisible();
      await expect(element(by.id('prescription-0-medication'))).toBeVisible();
    });

    it('should filter prescriptions by date range', async () => {
      await element(by.id('prescriptions-tab')).tap();
      await element(by.id('filter-prescriptions-button')).tap();

      await expect(element(by.id('prescription-filter-modal'))).toBeVisible();
      await element(by.id('filter-last-6-months')).tap();
      await element(by.id('apply-filter-button')).tap();

      await expect(element(by.id('patient-prescriptions-list'))).toBeVisible();
      await expect(element(by.id('active-filter-badge'))).toHaveText('Last 6 months');
    });

    it('should view prescription details', async () => {
      await element(by.id('prescriptions-tab')).tap();
      await element(by.id('prescription-0')).tap();

      await expect(element(by.id('prescription-detail-modal'))).toBeVisible();
      await expect(element(by.id('prescription-medication-name'))).toBeVisible();
      await expect(element(by.id('prescription-dosage'))).toBeVisible();
      await expect(element(by.id('prescription-prescriber'))).toBeVisible();
      await expect(element(by.id('prescription-pharmacy'))).toBeVisible();
    });

    it('should identify current active prescriptions', async () => {
      await element(by.id('prescriptions-tab')).tap();

      await expect(element(by.id('prescription-0-status'))).toHaveText('Active');
      await expect(element(by.id('prescription-0-active-badge'))).toBeVisible();
    });
  });

  describe('Add Medical Notes', () => {
    beforeEach(async () => {
      await searchAndSelectPatient('John Smith');
    });

    it('should open note creation form', async () => {
      await element(by.id('add-note-button')).tap();
      await expect(element(by.id('note-creation-modal'))).toBeVisible();
      await expect(element(by.id('note-text-input'))).toBeVisible();
    });

    it('should create medical note with timestamp', async () => {
      await element(by.id('add-note-button')).tap();

      const noteText = 'Patient reports improvement in symptoms. Continue current treatment plan.';
      await element(by.id('note-text-input')).typeText(noteText);
      await element(by.id('note-type-picker')).tap();
      await element(by.text('Clinical Note')).tap();
      await element(by.id('save-note-button')).tap();

      await expect(element(by.id('note-success-message'))).toBeVisible();

      // Verify note appears in notes list
      await element(by.id('notes-tab')).tap();
      await expect(element(by.id('note-0-text'))).toHaveText(noteText);
      await expect(element(by.id('note-0-author'))).toHaveText('Dr. John Smith');
    });

    it('should categorize notes by type', async () => {
      await element(by.id('notes-tab')).tap();
      await element(by.id('filter-notes-button')).tap();

      await expect(element(by.id('note-filter-modal'))).toBeVisible();
      await element(by.id('filter-clinical-notes')).tap();
      await element(by.id('apply-note-filter')).tap();

      await expect(element(by.id('notes-list'))).toBeVisible();
      // All notes should be clinical type
      await expect(element(by.id('note-0-type'))).toHaveText('Clinical Note');
    });

    it('should add confidential note with restricted access', async () => {
      await element(by.id('add-note-button')).tap();

      await element(by.id('note-text-input')).typeText('Sensitive information - psychiatric evaluation');
      await element(by.id('note-confidential-checkbox')).tap();
      await element(by.id('save-note-button')).tap();

      await expect(element(by.id('note-success-message'))).toBeVisible();

      await element(by.id('notes-tab')).tap();
      await expect(element(by.id('note-0-confidential-badge'))).toBeVisible();
    });
  });

  describe('Audit Log', () => {
    it('should log all patient record accesses', async () => {
      await searchAndSelectPatient('John Smith');

      await element(by.id('patient-menu-button')).tap();
      await element(by.id('view-audit-log-option')).tap();

      await expect(element(by.id('audit-log-screen'))).toBeVisible();
      await expect(element(by.id('audit-entry-0'))).toBeVisible();
      await expect(element(by.id('audit-entry-0-action'))).toHaveText('Record Accessed');
      await expect(element(by.id('audit-entry-0-user'))).toHaveText('Dr. John Smith');
      await expect(element(by.id('audit-entry-0-timestamp'))).toBeVisible();
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

async function searchAndSelectPatient(patientName: string) {
  await element(by.id('patient-search-input')).typeText(patientName);
  await element(by.id('patient-search-button')).tap();
  await waitFor(element(by.id('patient-search-results'))).toBeVisible().withTimeout(5000);
  await element(by.id('patient-result-0')).tap();
  await expect(element(by.id('patient-detail-screen'))).toBeVisible();
}
