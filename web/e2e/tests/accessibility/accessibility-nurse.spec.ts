/**
 * Accessibility E2E Tests - Nurse Role
 *
 * Tests WCAG 2.1 AA compliance for nurse-specific workflows
 */

import { test, expect } from '../../fixtures/api-mocks.fixture';
import {
  runAccessibilityScan,
  checkKeyboardNavigation,
  verifyAriaAttributes,
  checkFormAccessibility,
  checkTableAccessibility,
} from '../../utils/accessibility';

test.describe('Nurse Accessibility', () => {
  test.use({ storageState: '.auth/nurse.json' });

  test('Nurse dashboard should be accessible', async ({ page }) => {
    await page.goto('/nurse/dashboard');
    await page.waitForLoadState('networkidle');

    // Run comprehensive accessibility scan
    await runAccessibilityScan(page, 'Nurse Dashboard');

    // Verify main landmarks
    await verifyAriaAttributes(page, 'main', {
      role: 'main',
    });
  });

  test('Dashboard should support keyboard navigation', async ({ page }) => {
    await page.goto('/nurse/dashboard');
    await page.waitForLoadState('networkidle');

    await checkKeyboardNavigation(page, 'body', 10);
  });

  test('Patient list should be accessible', async ({ page }) => {
    await page.goto('/nurse/patients');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Nurse Patient List');

    // Check patient list/table
    const patientTable = page.locator('[data-testid="patient-list"], table').first();
    if ((await patientTable.count()) > 0) {
      await checkTableAccessibility(page, '[data-testid="patient-list"], table');
    }

    // Check search functionality
    const searchInput = page.locator('input[type="search"], input[role="searchbox"]').first();
    if ((await searchInput.count()) > 0) {
      const ariaLabel = await searchInput.getAttribute('aria-label');
      const id = await searchInput.getAttribute('id');

      if (id) {
        const hasLabel = await page.locator(`label[for="${id}"]`).count();
        expect(hasLabel > 0 || ariaLabel, 'Search input should have label').toBeTruthy();
      }
    }
  });

  test('Medication order form should be accessible', async ({ page }) => {
    await page.goto('/nurse/medication-orders/new');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Medication Order Form');

    // Check form accessibility
    await checkFormAccessibility(page, 'form');

    // Verify all required fields marked
    const requiredFields = page.locator('input[required], select[required]');
    const count = await requiredFields.count();

    for (let i = 0; i < count; i++) {
      const field = requiredFields.nth(i);
      const ariaRequired = await field.getAttribute('aria-required');
      expect(ariaRequired, `Required field ${i} should have aria-required`).toBe('true');
    }
  });

  test('Order tracking should be accessible', async ({ page }) => {
    await page.goto('/nurse/orders');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Order Tracking');

    // Check order list
    const orderList = page.locator('[data-testid="order-list"], [role="list"]').first();
    if ((await orderList.count()) > 0) {
      const role = await orderList.getAttribute('role');
      expect(role).toBeTruthy();
    }

    // Check status filters
    const filters = page.locator('[data-testid="status-filter"], [role="group"]').first();
    if ((await filters.count()) > 0) {
      // Radio buttons should have labels
      const radios = page.locator('input[type="radio"]');
      const radioCount = await radios.count();

      for (let i = 0; i < radioCount; i++) {
        const radio = radios.nth(i);
        const id = await radio.getAttribute('id');

        if (id) {
          const hasLabel = await page.locator(`label[for="${id}"]`).count();
          expect(hasLabel, `Radio button ${i} should have label`).toBeGreaterThan(0);
        }
      }
    }
  });

  test('Delivery tracking should be accessible', async ({ page }) => {
    await page.goto('/nurse/deliveries');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Nurse Delivery Tracking');

    // Check delivery status indicators
    const statusIndicators = page.locator('[data-testid^="delivery-status-"]');
    const count = await statusIndicators.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const indicator = statusIndicators.nth(i);
      const ariaLabel = await indicator.getAttribute('aria-label');
      const textContent = await indicator.textContent();

      expect(ariaLabel || textContent, 'Status indicator should have text').toBeTruthy();
    }
  });

  test('Pharmacy records access should be accessible', async ({ page }) => {
    await page.goto('/nurse/pharmacy-records');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Pharmacy Records');

    // Check records table
    const recordsTable = page.locator('table, [role="table"]').first();
    if ((await recordsTable.count()) > 0) {
      await checkTableAccessibility(page, 'table, [role="table"]');
    }
  });

  test('Notification panel should be accessible', async ({ page }) => {
    await page.goto('/nurse/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for notifications
    const notificationPanel = page.locator('[data-testid="notification-panel"], [role="alert"]');

    if ((await notificationPanel.count()) > 0) {
      // Run accessibility scan
      await runAccessibilityScan(page, 'Notification Panel');

      // Check notifications have proper ARIA
      const notifications = page.locator('[data-testid^="notification-"], [role="alert"]');
      const count = await notifications.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const notification = notifications.nth(i);
        const role = await notification.getAttribute('role');
        const ariaLive = await notification.getAttribute('aria-live');

        expect(role || ariaLive, `Notification ${i} should have role or aria-live`).toBeTruthy();
      }
    }
  });

  test('Shift handover should be accessible', async ({ page }) => {
    await page.goto('/nurse/handover');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Shift Handover');

    // Check handover form
    const handoverForm = page.locator('form').first();
    if ((await handoverForm.count()) > 0) {
      await checkFormAccessibility(page, 'form');
    }

    // Check patient notes have proper structure
    const notes = page.locator('[data-testid^="patient-note-"]');
    const count = await notes.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      const note = notes.nth(i);
      const headings = note.locator('h1, h2, h3, h4');
      const headingCount = await headings.count();

      expect(headingCount, `Note ${i} should have headings`).toBeGreaterThan(0);
    }
  });

  test('PDF export should be accessible', async ({ page }) => {
    await page.goto('/nurse/orders');
    await page.waitForLoadState('networkidle');

    // Look for PDF export button
    const pdfButton = page.locator('button:has-text("PDF"), button[aria-label*="PDF"]').first();

    if ((await pdfButton.count()) > 0) {
      const ariaLabel = await pdfButton.getAttribute('aria-label');
      const textContent = await pdfButton.textContent();

      expect(ariaLabel || textContent, 'PDF button should have accessible name').toBeTruthy();
    }
  });

  test('Messaging interface should be accessible', async ({ page }) => {
    await page.goto('/nurse/messages');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Nurse Messaging');

    // Check message list
    const messageList = page.locator('[data-testid="message-list"], [role="list"]').first();
    if ((await messageList.count()) > 0) {
      const role = await messageList.getAttribute('role');
      expect(role).toBeTruthy();
    }

    // Check message composition
    await checkFormAccessibility(page, 'form');
  });

  test('Settings page should be accessible', async ({ page }) => {
    await page.goto('/nurse/settings');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Nurse Settings');

    // Check settings form
    await checkFormAccessibility(page, 'form');
  });

  test('Error messages should be announced', async ({ page }) => {
    await page.goto('/nurse/medication-orders/new');
    await page.waitForLoadState('networkidle');

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]').first();

    if ((await submitButton.count()) > 0) {
      await submitButton.click();
      await page.waitForTimeout(500);

      // Check for error messages
      const errors = page.locator('[role="alert"], .error');
      const errorCount = await errors.count();

      if (errorCount > 0) {
        // At least one should have role="alert"
        const alerts = await page.locator('[role="alert"]').count();
        expect(alerts).toBeGreaterThan(0);
      }
    }
  });

  test('Focus indicators should be visible', async ({ page }) => {
    await page.goto('/nurse/dashboard');
    await page.waitForLoadState('networkidle');

    // Get all interactive elements
    const interactive = page.locator('button, a, input, select');
    const count = await interactive.count();

    // Sample first 15 elements
    for (let i = 0; i < Math.min(count, 15); i++) {
      const element = interactive.nth(i);
      const isVisible = await element.isVisible();

      if (isVisible) {
        await element.focus();

        const hasFocusIndicator = await element.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return (
            styles.outline !== 'none' ||
            styles.outlineWidth !== '0px' ||
            styles.boxShadow !== 'none'
          );
        });

        const tagName = await element.evaluate((el) => el.tagName);
        expect(hasFocusIndicator, `Focus should be visible on ${tagName}`).toBe(true);
      }
    }
  });
});
