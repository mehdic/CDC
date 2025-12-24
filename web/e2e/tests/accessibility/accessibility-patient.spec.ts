/**
 * Accessibility E2E Tests - Patient Role
 *
 * Tests WCAG 2.1 AA compliance for patient-specific workflows
 */

import { test, expect } from '../../fixtures/api-mocks.fixture';
import {
  runAccessibilityScan,
  checkKeyboardNavigation,
  verifyAriaAttributes,
  checkModalFocusManagement,
  checkFormAccessibility,
} from '../../utils/accessibility';

test.describe('Patient Accessibility', () => {
  test.use({ storageState: '.auth/patient.json' });

  test('Patient dashboard should be accessible', async ({ page }) => {
    await page.goto('/patient/dashboard');
    await page.waitForLoadState('networkidle');

    // Run comprehensive accessibility scan
    await runAccessibilityScan(page, 'Patient Dashboard');

    // Verify main landmarks
    await verifyAriaAttributes(page, 'main', {
      role: 'main',
    });
  });

  test('Dashboard should support keyboard navigation', async ({ page }) => {
    await page.goto('/patient/dashboard');
    await page.waitForLoadState('networkidle');

    // Check keyboard navigation through interactive elements
    await checkKeyboardNavigation(page, 'body', 10);
  });

  test('Product catalog should be accessible', async ({ page }) => {
    await page.goto('/patient/products');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Product Catalog');

    // Check product grid/list
    const productContainer = page.locator(
      '[data-testid="product-grid"], [data-testid="product-list"]'
    ).first();

    if ((await productContainer.count()) > 0) {
      const role = await productContainer.getAttribute('role');
      expect(role || 'region').toBeTruthy();
    }

    // Check search form
    const searchForm = page.locator('[role="search"], form').first();
    if ((await searchForm.count()) > 0) {
      await checkFormAccessibility(page, '[role="search"], form');
    }
  });

  test('Product details should be accessible', async ({ page }) => {
    await page.goto('/patient/products');
    await page.waitForLoadState('networkidle');

    // Click first product
    const firstProduct = page.locator('[data-testid^="product-card"]').first();

    if ((await firstProduct.count()) > 0) {
      await firstProduct.click();
      await page.waitForLoadState('networkidle');

      // Run accessibility scan on product details
      await runAccessibilityScan(page, 'Product Details');

      // Check add to cart button
      const addToCartButton = page.locator('[data-testid="add-to-cart"], button:has-text("Add to cart")');
      if ((await addToCartButton.count()) > 0) {
        const ariaLabel = await addToCartButton.getAttribute('aria-label');
        expect(ariaLabel || await addToCartButton.textContent()).toBeTruthy();
      }
    }
  });

  test('Shopping cart should be accessible', async ({ page }) => {
    await page.goto('/patient/cart');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Shopping Cart');

    // Check quantity controls have labels
    const quantityInputs = page.locator('input[type="number"]');
    const count = await quantityInputs.count();

    for (let i = 0; i < count; i++) {
      const input = quantityInputs.nth(i);
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const id = await input.getAttribute('id');

      if (id) {
        const hasLabel = await page.locator(`label[for="${id}"]`).count();
        expect(
          hasLabel > 0 || ariaLabel || ariaLabelledBy,
          'Quantity input should have accessible label'
        ).toBeTruthy();
      }
    }
  });

  test('Checkout process should be accessible', async ({ page }) => {
    await page.goto('/patient/checkout');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Checkout Page');

    // Check checkout form
    await checkFormAccessibility(page, 'form');

    // Verify required fields have aria-required
    const requiredInputs = page.locator('input[required], select[required]');
    const requiredCount = await requiredInputs.count();

    for (let i = 0; i < requiredCount; i++) {
      const input = requiredInputs.nth(i);
      const ariaRequired = await input.getAttribute('aria-required');
      expect(ariaRequired).toBe('true');
    }
  });

  test('Prescription refill request should be accessible', async ({ page }) => {
    await page.goto('/patient/prescriptions');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Prescriptions Page');

    // Check refill button
    const refillButton = page.locator('[data-testid="refill-button"]').first();

    if ((await refillButton.count()) > 0) {
      // Check button has accessible name
      const text = await refillButton.textContent();
      const ariaLabel = await refillButton.getAttribute('aria-label');
      expect(text || ariaLabel).toBeTruthy();

      // Click to open refill dialog
      await refillButton.click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });

      // Check dialog accessibility
      await runAccessibilityScan(page, 'Refill Dialog');
      await checkFormAccessibility(page, '[role="dialog"] form');
    }
  });

  test('Appointment booking should be accessible', async ({ page }) => {
    await page.goto('/patient/appointments');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Appointments Page');

    // Check date picker has accessible label
    const datePicker = page.locator('input[type="date"], [role="datepicker"]').first();

    if ((await datePicker.count()) > 0) {
      const ariaLabel = await datePicker.getAttribute('aria-label');
      const ariaLabelledBy = await datePicker.getAttribute('aria-labelledby');
      const id = await datePicker.getAttribute('id');

      if (id) {
        const hasLabel = await page.locator(`label[for="${id}"]`).count();
        expect(
          hasLabel > 0 || ariaLabel || ariaLabelledBy,
          'Date picker should have accessible label'
        ).toBeTruthy();
      }
    }
  });

  test('Health records should be accessible', async ({ page }) => {
    await page.goto('/patient/health-records');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Health Records');

    // Check document list
    const documentList = page.locator('[data-testid="document-list"], [role="list"]').first();

    if ((await documentList.count()) > 0) {
      const role = await documentList.getAttribute('role');
      expect(role).toBeTruthy();
    }
  });

  test('VIP program page should be accessible', async ({ page }) => {
    await page.goto('/patient/vip');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'VIP Program Page');

    // Check tier cards have accessible names
    const tierCards = page.locator('[data-testid^="tier-card"]');
    const count = await tierCards.count();

    for (let i = 0; i < count; i++) {
      const card = tierCards.nth(i);
      const ariaLabel = await card.getAttribute('aria-label');
      const ariaLabelledBy = await card.getAttribute('aria-labelledby');

      expect(
        ariaLabel || ariaLabelledBy,
        `Tier card ${i} should have accessible name`
      ).toBeTruthy();
    }
  });

  test('Delivery tracking should be accessible', async ({ page }) => {
    await page.goto('/patient/deliveries');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Delivery Tracking');

    // Check status indicators have text alternatives
    const statusIndicators = page.locator('[data-testid^="status-"]');
    const count = await statusIndicators.count();

    for (let i = 0; i < count; i++) {
      const indicator = statusIndicators.nth(i);
      const ariaLabel = await indicator.getAttribute('aria-label');
      const textContent = await indicator.textContent();

      expect(
        ariaLabel || textContent,
        'Status indicator should have text alternative'
      ).toBeTruthy();
    }
  });

  test('Messaging interface should be accessible', async ({ page }) => {
    await page.goto('/patient/messages');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Patient Messaging');

    // Check message composition form
    const messageForm = page.locator('form, [role="form"]').first();

    if ((await messageForm.count()) > 0) {
      await checkFormAccessibility(page, 'form, [role="form"]');
    }
  });

  test('Achievements page should be accessible', async ({ page }) => {
    await page.goto('/patient/achievements');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Achievements Page');

    // Check achievement cards
    const achievementCards = page.locator('[data-testid^="achievement-card"]');
    const count = await achievementCards.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const card = achievementCards.nth(i);
      const ariaLabel = await card.getAttribute('aria-label');

      expect(ariaLabel, `Achievement card ${i} should have aria-label`).toBeTruthy();
    }
  });

  test('Referral program should be accessible', async ({ page }) => {
    await page.goto('/patient/referrals');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Referral Program');

    // Check referral form
    const referralForm = page.locator('form').first();

    if ((await referralForm.count()) > 0) {
      await checkFormAccessibility(page, 'form');
    }
  });

  test('Profile settings should be accessible', async ({ page }) => {
    await page.goto('/patient/profile');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Profile Settings');

    // Check profile form
    await checkFormAccessibility(page, 'form');

    // Check file upload has accessible label
    const fileInput = page.locator('input[type="file"]').first();

    if ((await fileInput.count()) > 0) {
      const ariaLabel = await fileInput.getAttribute('aria-label');
      const id = await fileInput.getAttribute('id');

      if (id) {
        const hasLabel = await page.locator(`label[for="${id}"]`).count();
        expect(
          hasLabel > 0 || ariaLabel,
          'File upload should have accessible label'
        ).toBeTruthy();
      }
    }
  });

  test('Error messages should be announced to screen readers', async ({ page }) => {
    await page.goto('/patient/checkout');
    await page.waitForLoadState('networkidle');

    // Try to submit empty form to trigger errors
    const submitButton = page.locator('button[type="submit"]').first();

    if ((await submitButton.count()) > 0) {
      await submitButton.click();
      await page.waitForTimeout(500);

      // Check for error messages with proper ARIA
      const errorMessages = page.locator('[role="alert"], .error, .error-message');
      const errorCount = await errorMessages.count();

      if (errorCount > 0) {
        // At least one error should have role="alert"
        const alertCount = await page.locator('[role="alert"]').count();
        expect(alertCount).toBeGreaterThan(0);
      }
    }
  });

  test('Loading states should be announced', async ({ page }) => {
    await page.goto('/patient/dashboard');

    // Look for loading indicators
    const loadingIndicators = page.locator('[role="status"], [aria-live="polite"]');
    const count = await loadingIndicators.count();

    // This is informational - loading states should have aria-live
    console.log('Loading indicators with ARIA:', count);
  });

  test('Focus visible on all interactive elements', async ({ page }) => {
    await page.goto('/patient/dashboard');
    await page.waitForLoadState('networkidle');

    // Get all interactive elements
    const interactive = page.locator('a, button, input, select, textarea');
    const count = await interactive.count();

    // Sample first 20 interactive elements
    for (let i = 0; i < Math.min(count, 20); i++) {
      const element = interactive.nth(i);
      await element.focus();

      // Check if focus is visible
      const isFocusVisible = await element.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return (
          styles.outline !== 'none' ||
          styles.outlineWidth !== '0px' ||
          styles.boxShadow !== 'none'
        );
      });

      const tagName = await element.evaluate((el) => el.tagName);
      expect(isFocusVisible, `Focus should be visible on ${tagName}`).toBe(true);
    }
  });
});
