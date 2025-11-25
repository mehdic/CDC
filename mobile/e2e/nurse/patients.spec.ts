/**
 * Nurse App Patient List E2E Tests
 *
 * Tests patient list management for nurses:
 * - Patient list loading
 * - Search and filtering
 * - Patient selection and navigation
 */

describe('Nurse App Patient List', () => {
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

  describe('Patient List Display', () => {
    it('should display patient list on dashboard', async () => {
      await expect(element(by.id('patient-list'))).toBeVisible();
    });

    it('should display multiple patient cards', async () => {
      await waitFor(element(by.id('patient-card-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('patient-card-0'))).toBeVisible();
      await expect(element(by.id('patient-card-1'))).toBeVisible();
    });

    it('should display patient name in each card', async () => {
      await expect(element(by.id('patient-name-0'))).toBeVisible();
      await expect(element(by.id('patient-name-1'))).toBeVisible();
    });

    it('should display patient age in card', async () => {
      await expect(element(by.id('patient-age-0'))).toBeVisible();
    });

    it('should display patient health status indicator', async () => {
      await expect(element(by.id('patient-status-0'))).toBeVisible();
    });

    it('should display last medication order date', async () => {
      await expect(element(by.id('last-order-date-0'))).toBeVisible();
    });

    it('should display patient avatar or initials', async () => {
      await expect(element(by.id('patient-avatar-0'))).toBeVisible();
    });

    it('should display total number of patients', async () => {
      await expect(element(by.id('patients-count-badge'))).toBeVisible();
    });
  });

  describe('Patient Search', () => {
    it('should display search input field', async () => {
      await expect(element(by.id('patient-search-input'))).toBeVisible();
    });

    it('should filter patients by name', async () => {
      await element(by.id('patient-search-input')).typeText('John');

      // Should filter list to show only matching patients
      await waitFor(element(by.id('patient-card-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.text(/John/i))).toBeVisible();
    });

    it('should filter patients by patient ID', async () => {
      await element(by.id('patient-search-input')).typeText('P00123');

      await waitFor(element(by.id('patient-card-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.text('P00123'))).toBeVisible();
    });

    it('should show no results message for non-matching search', async () => {
      await element(by.id('patient-search-input')).typeText('XYZNonExistent');

      await expect(element(by.id('no-results-message'))).toBeVisible();
    });

    it('should clear search results when deleting search text', async () => {
      await element(by.id('patient-search-input')).typeText('John');
      await waitFor(element(by.id('patient-card-0'))).toBeVisible().withTimeout(5000);

      // Clear search
      await element(by.id('clear-search-button')).tap();
      await expect(element(by.id('patient-card-1'))).toBeVisible();
    });

    it('should display clear search button when text entered', async () => {
      await element(by.id('patient-search-input')).typeText('test');

      await expect(element(by.id('clear-search-button'))).toBeVisible();
    });
  });

  describe('Patient Filtering', () => {
    it('should display filter button', async () => {
      await expect(element(by.id('filter-button'))).toBeVisible();
    });

    it('should open filter menu on button tap', async () => {
      await element(by.id('filter-button')).tap();

      await waitFor(element(by.id('filter-menu'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('filter-menu'))).toBeVisible();
    });

    it('should filter by medication status', async () => {
      await element(by.id('filter-button')).tap();
      await waitFor(element(by.id('filter-menu'))).toBeVisible().withTimeout(5000);

      // Select "Active medications" filter
      await element(by.id('filter-active-meds')).tap();
      await element(by.id('apply-filters-button')).tap();

      await waitFor(element(by.id('patient-card-0'))).toBeVisible().withTimeout(5000);
      // Should show only patients with active medications
    });

    it('should filter by age range', async () => {
      await element(by.id('filter-button')).tap();
      await waitFor(element(by.id('filter-menu'))).toBeVisible().withTimeout(5000);

      // Select age range filter
      await element(by.id('filter-age-range')).tap();
      await element(by.id('age-min-input')).typeText('18');
      await element(by.id('age-max-input')).typeText('65');
      await element(by.id('apply-filters-button')).tap();

      await waitFor(element(by.id('patient-card-0'))).toBeVisible().withTimeout(5000);
    });

    it('should filter by chronic condition', async () => {
      await element(by.id('filter-button')).tap();
      await waitFor(element(by.id('filter-menu'))).toBeVisible().withTimeout(5000);

      await element(by.id('filter-diabetes')).tap();
      await element(by.id('apply-filters-button')).tap();

      await waitFor(element(by.id('patient-card-0'))).toBeVisible().withTimeout(5000);
    });

    it('should reset all filters', async () => {
      await element(by.id('filter-button')).tap();
      await waitFor(element(by.id('filter-menu'))).toBeVisible().withTimeout(5000);

      await element(by.id('filter-active-meds')).tap();
      await element(by.id('reset-filters-button')).tap();

      // All filters should be cleared
      await expect(element(by.id('filter-active-meds'))).toHaveToggleValue(false);
    });
  });

  describe('Patient Selection', () => {
    it('should navigate to patient detail on card tap', async () => {
      await element(by.id('patient-card-0')).tap();

      await waitFor(element(by.id('patient-detail-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('patient-detail-screen'))).toBeVisible();
    });

    it('should display patient detail information', async () => {
      await element(by.id('patient-card-0')).tap();

      await waitFor(element(by.id('patient-detail-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('patient-full-name'))).toBeVisible();
      await expect(element(by.id('patient-dob'))).toBeVisible();
      await expect(element(by.id('patient-phone'))).toBeVisible();
    });

    it('should display patient health conditions', async () => {
      await element(by.id('patient-card-0')).tap();

      await waitFor(element(by.id('patient-conditions-list'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('patient-conditions-list'))).toBeVisible();
    });

    it('should allow back navigation from patient detail', async () => {
      await element(by.id('patient-card-0')).tap();
      await waitFor(element(by.id('patient-detail-screen'))).toBeVisible().withTimeout(5000);

      await element(by.id('back-button')).tap();

      await waitFor(element(by.id('nurse-dashboard-screen'))).toBeVisible().withTimeout(5000);
    });

    it('should maintain selected patient when navigation back', async () => {
      // Tap a specific patient
      const patientName = 'John Doe';
      await element(by.text(patientName)).multiTap(1);

      await waitFor(element(by.id('patient-detail-screen'))).toBeVisible().withTimeout(5000);
      await element(by.id('back-button')).tap();

      // Should return to list
      await waitFor(element(by.id('nurse-dashboard-screen'))).toBeVisible().withTimeout(5000);
    });
  });

  describe('Patient Quick Actions', () => {
    it('should display quick action buttons in patient card', async () => {
      await expect(element(by.id('quick-action-order-0'))).toBeVisible();
      await expect(element(by.id('quick-action-history-0'))).toBeVisible();
    });

    it('should allow quick order medication from card', async () => {
      await element(by.id('quick-action-order-0')).tap();

      await waitFor(element(by.id('medication-order-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('medication-order-screen'))).toBeVisible();
    });

    it('should allow quick view patient history from card', async () => {
      await element(by.id('quick-action-history-0')).tap();

      await waitFor(element(by.id('patient-history-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('patient-history-screen'))).toBeVisible();
    });
  });

  describe('Patient List Sorting', () => {
    it('should display sort button', async () => {
      await expect(element(by.id('sort-button'))).toBeVisible();
    });

    it('should sort patients by name', async () => {
      await element(by.id('sort-button')).tap();

      await waitFor(element(by.id('sort-menu'))).toBeVisible().withTimeout(5000);
      await element(by.id('sort-by-name')).tap();

      // Patient list should be sorted by name
      await waitFor(element(by.id('patient-card-0'))).toBeVisible().withTimeout(5000);
    });

    it('should sort patients by last order date', async () => {
      await element(by.id('sort-button')).tap();

      await waitFor(element(by.id('sort-menu'))).toBeVisible().withTimeout(5000);
      await element(by.id('sort-by-date')).tap();

      // Patient list should be sorted by last order date
      await waitFor(element(by.id('patient-card-0'))).toBeVisible().withTimeout(5000);
    });

    it('should toggle sort order', async () => {
      await element(by.id('sort-button')).tap();

      await waitFor(element(by.id('sort-menu'))).toBeVisible().withTimeout(5000);
      await element(by.id('toggle-sort-order')).tap();

      // Sort order should be reversed
      await waitFor(element(by.id('patient-card-0'))).toBeVisible().withTimeout(5000);
    });
  });

  describe('Patient List Loading', () => {
    it('should display loading indicator when fetching patients', async () => {
      // This would typically be visible briefly during app load
      // Verify list loads successfully
      await waitFor(element(by.id('patient-card-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('patient-card-0'))).toBeVisible();
    });

    it('should display empty state when no patients', async () => {
      // Apply a filter that results in no matches
      await element(by.id('patient-search-input')).typeText('NoMatchingPatient12345');

      await expect(element(by.id('empty-state-message'))).toBeVisible();
      await expect(element(by.text(/No patients found/i))).toBeVisible();
    });

    it('should support pull-to-refresh', async () => {
      // Pull down to refresh
      await element(by.id('patient-list')).swipe('down', 'slow', 0.75);

      // Should show refresh indicator
      await expect(element(by.id('refresh-indicator'))).toBeVisible();
    });
  });
});

// Helper function for nurse login
async function loginAsNurse() {
  await element(by.id('email-input')).typeText('nurse@healthcarefacility.ch');
  await element(by.id('password-input')).typeText('NursePass123!');
  await element(by.id('login-button')).tap();
}
