/**
 * Nurse App Medication Order E2E Tests
 *
 * Tests medication ordering workflow for nurses:
 * - Ordering medications for patients
 * - Order confirmation
 * - Order history tracking
 */

describe('Nurse App Medication Ordering', () => {
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

  describe('Medication Order Initiation', () => {
    it('should display medication order button on patient card', async () => {
      await expect(element(by.id('quick-action-order-0'))).toBeVisible();
    });

    it('should navigate to medication order screen on button tap', async () => {
      await element(by.id('quick-action-order-0')).tap();

      await waitFor(element(by.id('medication-order-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('medication-order-screen'))).toBeVisible();
    });

    it('should display selected patient information', async () => {
      await element(by.id('quick-action-order-0')).tap();

      await waitFor(element(by.id('medication-order-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('patient-name-display'))).toBeVisible();
      await expect(element(by.id('patient-id-display'))).toBeVisible();
    });

    it('should display medication search field', async () => {
      await element(by.id('quick-action-order-0')).tap();

      await waitFor(element(by.id('medication-order-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('medication-search-input'))).toBeVisible();
    });

    it('should display medication list', async () => {
      await element(by.id('quick-action-order-0')).tap();

      await waitFor(element(by.id('medication-order-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('medication-list'))).toBeVisible();
    });
  });

  describe('Medication Selection', () => {
    it('should search medications by name', async () => {
      await navigateToMedicationOrder();

      await element(by.id('medication-search-input')).typeText('Aspirin');
      await waitFor(element(by.id('medication-item-0'))).toBeVisible().withTimeout(5000);

      await expect(element(by.text(/Aspirin/i))).toBeVisible();
    });

    it('should display medication details in search results', async () => {
      await navigateToMedicationOrder();

      await element(by.id('medication-search-input')).typeText('Ibuprofen');
      await waitFor(element(by.id('medication-item-0'))).toBeVisible().withTimeout(5000);

      await expect(element(by.id('med-name-0'))).toBeVisible();
      await expect(element(by.id('med-dosage-0'))).toBeVisible();
      await expect(element(by.id('med-price-0'))).toBeVisible();
    });

    it('should filter medications by category', async () => {
      await navigateToMedicationOrder();

      await element(by.id('category-filter')).tap();
      await waitFor(element(by.id('category-menu'))).toBeVisible().withTimeout(5000);

      await element(by.id('category-pain-relief')).tap();
      await element(by.id('apply-category-filter')).tap();

      await waitFor(element(by.id('medication-item-0'))).toBeVisible().withTimeout(5000);
    });

    it('should select medication from list', async () => {
      await navigateToMedicationOrder();

      await element(by.id('medication-search-input')).typeText('Paracetamol');
      await waitFor(element(by.id('medication-item-0'))).toBeVisible().withTimeout(5000);

      await element(by.id('medication-item-0')).tap();

      // Should show selected medication in order form
      await expect(element(by.id('selected-medication-display'))).toBeVisible();
    });

    it('should display medication allergy warning if applicable', async () => {
      await navigateToMedicationOrder();

      // Search for a medication the patient is allergic to
      await element(by.id('medication-search-input')).typeText('Penicillin');
      await waitFor(element(by.id('medication-item-0'))).toBeVisible().withTimeout(5000);

      // Should display allergy warning
      await expect(element(by.id('allergy-warning-banner'))).toBeVisible();
      await expect(element(by.text(/Allergic to/i))).toBeVisible();
    });

    it('should display drug interaction warning if applicable', async () => {
      await navigateToMedicationOrder();

      // Search for a medication with interactions
      await element(by.id('medication-search-input')).typeText('Warfarin');
      await waitFor(element(by.id('medication-item-0'))).toBeVisible().withTimeout(5000);

      // Should display interaction warning
      await expect(element(by.id('interaction-warning-banner'))).toBeVisible();
      await expect(element(by.text(/Drug interaction/i))).toBeVisible();
    });
  });

  describe('Order Quantity and Details', () => {
    it('should display quantity input field', async () => {
      await navigateToMedicationOrderWithSelection();

      await expect(element(by.id('quantity-input'))).toBeVisible();
    });

    it('should set medication quantity', async () => {
      await navigateToMedicationOrderWithSelection();

      await element(by.id('quantity-input')).typeText('10');

      await expect(element(by.id('quantity-input'))).toHaveText('10');
    });

    it('should display total price calculation', async () => {
      await navigateToMedicationOrderWithSelection();

      await element(by.id('quantity-input')).typeText('5');

      await waitFor(element(by.id('total-price'))).toBeVisible().withTimeout(3000);
      await expect(element(by.id('total-price'))).toBeVisible();
    });

    it('should display delivery address options', async () => {
      await navigateToMedicationOrderWithSelection();

      await expect(element(by.id('delivery-address-selector'))).toBeVisible();
    });

    it('should select delivery address', async () => {
      await navigateToMedicationOrderWithSelection();

      await element(by.id('delivery-address-selector')).tap();
      await waitFor(element(by.id('address-list'))).toBeVisible().withTimeout(5000);

      await element(by.id('address-option-0')).tap();

      await expect(element(by.id('selected-address-display'))).toBeVisible();
    });

    it('should display special instructions field', async () => {
      await navigateToMedicationOrderWithSelection();

      await expect(element(by.id('special-instructions-field'))).toBeVisible();
    });

    it('should add special instructions for delivery', async () => {
      await navigateToMedicationOrderWithSelection();

      await element(by.id('special-instructions-field')).typeText('Ring bell twice');

      await expect(element(by.id('special-instructions-field'))).toHaveText('Ring bell twice');
    });
  });

  describe('Order Confirmation', () => {
    it('should display order summary', async () => {
      await navigateToMedicationOrderWithSelection();

      await element(by.id('quantity-input')).typeText('5');

      await expect(element(by.id('order-summary'))).toBeVisible();
      await expect(element(by.id('summary-patient-name'))).toBeVisible();
      await expect(element(by.id('summary-medication'))).toBeVisible();
      await expect(element(by.id('summary-quantity'))).toBeVisible();
      await expect(element(by.id('summary-total-price'))).toBeVisible();
    });

    it('should display confirm order button', async () => {
      await navigateToMedicationOrderWithSelection();

      await element(by.id('quantity-input')).typeText('5');

      await expect(element(by.id('confirm-order-button'))).toBeVisible();
    });

    it('should confirm medication order', async () => {
      await navigateToMedicationOrderWithSelection();

      await element(by.id('quantity-input')).typeText('5');
      await element(by.id('delivery-address-selector')).tap();
      await waitFor(element(by.id('address-list'))).toBeVisible().withTimeout(5000);
      await element(by.id('address-option-0')).tap();

      await element(by.id('confirm-order-button')).tap();

      // Should show success confirmation
      await waitFor(element(by.id('order-confirmation-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('order-success-message'))).toBeVisible();
    });

    it('should display order confirmation details', async () => {
      await confirmMedicationOrder();

      await expect(element(by.id('confirmation-order-number'))).toBeVisible();
      await expect(element(by.id('confirmation-timestamp'))).toBeVisible();
      await expect(element(by.id('confirmation-delivery-status'))).toBeVisible();
    });

    it('should allow printing order confirmation', async () => {
      await confirmMedicationOrder();

      await expect(element(by.id('print-confirmation-button'))).toBeVisible();
      await element(by.id('print-confirmation-button')).tap();
    });

    it('should allow sharing order confirmation', async () => {
      await confirmMedicationOrder();

      await expect(element(by.id('share-confirmation-button'))).toBeVisible();
    });

    it('should allow returning to patient list', async () => {
      await confirmMedicationOrder();

      await element(by.id('return-to-patients-button')).tap();

      await waitFor(element(by.id('nurse-dashboard-screen'))).toBeVisible().withTimeout(5000);
    });
  });

  describe('Order History', () => {
    it('should display order history tab', async () => {
      await expect(element(by.id('order-history-tab'))).toBeVisible();
    });

    it('should navigate to order history screen', async () => {
      await element(by.id('order-history-tab')).tap();

      await waitFor(element(by.id('order-history-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('order-history-screen'))).toBeVisible();
    });

    it('should display list of past orders', async () => {
      await element(by.id('order-history-tab')).tap();

      await waitFor(element(by.id('order-history-list'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('order-item-0'))).toBeVisible();
    });

    it('should display order details in history', async () => {
      await element(by.id('order-history-tab')).tap();

      await waitFor(element(by.id('order-item-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('order-date-0'))).toBeVisible();
      await expect(element(by.id('order-medication-0'))).toBeVisible();
      await expect(element(by.id('order-status-0'))).toBeVisible();
    });

    it('should filter orders by status', async () => {
      await element(by.id('order-history-tab')).tap();

      await waitFor(element(by.id('status-filter'))).toBeVisible().withTimeout(5000);
      await element(by.id('status-filter')).tap();

      await element(by.id('filter-delivered')).tap();
      await element(by.id('apply-filter-button')).tap();

      // Should show only delivered orders
      await waitFor(element(by.id('order-item-0'))).toBeVisible().withTimeout(5000);
    });

    it('should search order history', async () => {
      await element(by.id('order-history-tab')).tap();

      await waitFor(element(by.id('order-search-input'))).toBeVisible().withTimeout(5000);
      await element(by.id('order-search-input')).typeText('Aspirin');

      // Should filter to matching orders
      await waitFor(element(by.id('order-item-0'))).toBeVisible().withTimeout(5000);
    });

    it('should display order details on selection', async () => {
      await element(by.id('order-history-tab')).tap();

      await waitFor(element(by.id('order-item-0'))).toBeVisible().withTimeout(5000);
      await element(by.id('order-item-0')).tap();

      await waitFor(element(by.id('order-detail-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('full-order-details'))).toBeVisible();
    });
  });

  describe('Order Validation', () => {
    it('should prevent order without medication selected', async () => {
      await navigateToMedicationOrder();

      await expect(element(by.id('confirm-order-button'))).toHaveToggleValue(false);
    });

    it('should prevent order with zero quantity', async () => {
      await navigateToMedicationOrderWithSelection();

      await element(by.id('quantity-input')).typeText('0');

      await expect(element(by.id('confirm-order-button'))).toHaveToggleValue(false);
      await expect(element(by.id('quantity-error'))).toBeVisible();
    });

    it('should require delivery address', async () => {
      await navigateToMedicationOrderWithSelection();

      await element(by.id('quantity-input')).typeText('5');

      await expect(element(by.id('confirm-order-button'))).toHaveToggleValue(false);
      await expect(element(by.id('address-error'))).toBeVisible();
    });

    it('should show warning for large quantity orders', async () => {
      await navigateToMedicationOrderWithSelection();

      await element(by.id('quantity-input')).typeText('100');

      await expect(element(by.id('large-quantity-warning'))).toBeVisible();
    });

    it('should show warning for high total cost orders', async () => {
      await navigateToMedicationOrderWithSelection();

      // Assuming expensive medication is selected
      await element(by.id('quantity-input')).typeText('50');

      await expect(element(by.id('high-cost-warning'))).toBeVisible();
    });
  });
});

// Helper functions
async function loginAsNurse() {
  await element(by.id('email-input')).typeText('nurse@healthcarefacility.ch');
  await element(by.id('password-input')).typeText('NursePass123!');
  await element(by.id('login-button')).tap();
}

async function navigateToMedicationOrder() {
  await element(by.id('quick-action-order-0')).tap();
  await waitFor(element(by.id('medication-order-screen'))).toBeVisible().withTimeout(5000);
}

async function navigateToMedicationOrderWithSelection() {
  await navigateToMedicationOrder();
  await element(by.id('medication-search-input')).typeText('Aspirin');
  await waitFor(element(by.id('medication-item-0'))).toBeVisible().withTimeout(5000);
  await element(by.id('medication-item-0')).tap();
  await waitFor(element(by.id('selected-medication-display'))).toBeVisible().withTimeout(5000);
}

async function confirmMedicationOrder() {
  await navigateToMedicationOrderWithSelection();
  await element(by.id('quantity-input')).typeText('5');
  await element(by.id('delivery-address-selector')).tap();
  await waitFor(element(by.id('address-list'))).toBeVisible().withTimeout(5000);
  await element(by.id('address-option-0')).tap();
  await element(by.id('confirm-order-button')).tap();
  await waitFor(element(by.id('order-confirmation-screen'))).toBeVisible().withTimeout(5000);
}
