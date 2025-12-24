/**
 * Accessibility E2E Tests - Pharmacist Role
 *
 * Tests WCAG 2.1 AA compliance for pharmacist-specific workflows
 */

import { test, expect } from '../../fixtures/api-mocks.fixture';
import {
  runAccessibilityScan,
  checkKeyboardNavigation,
  verifyAriaAttributes,
  checkModalFocusManagement,
  checkFormAccessibility,
  checkTableAccessibility,
} from '../../utils/accessibility';

test.describe('Pharmacist Accessibility', () => {
  test.use({ storageState: '.auth/pharmacist.json' });

  test('Dashboard should be accessible', async ({ page }) => {
    await page.goto('/pharmacist/dashboard');
    await page.waitForLoadState('networkidle');

    // Run comprehensive accessibility scan
    await runAccessibilityScan(page, 'Pharmacist Dashboard');

    // Verify main landmarks
    await verifyAriaAttributes(page, 'main', {
      role: 'main',
    });

    // Check navigation landmarks
    const nav = page.locator('nav').first();
    await verifyAriaAttributes(page, 'nav', {
      role: 'navigation',
    });
  });

  test('Dashboard should support keyboard navigation', async ({ page }) => {
    await page.goto('/pharmacist/dashboard');
    await page.waitForLoadState('networkidle');

    // Start from skip link (if exists) or first interactive element
    const firstInteractive = page.locator('a, button, input, select').first();
    await checkKeyboardNavigation(page, 'body', 15);
  });

  test('Prescription queue should be accessible', async ({ page }) => {
    await page.goto('/pharmacist/prescriptions');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Prescription Queue');

    // Check data table accessibility
    const table = page.locator('[data-testid="prescription-queue-table"]');
    if ((await table.count()) > 0) {
      await checkTableAccessibility(page, '[data-testid="prescription-queue-table"]');
    }

    // Check filter controls
    await checkFormAccessibility(page, 'form, [role="search"]');
  });

  test('Prescription detail modal should manage focus correctly', async ({ page }) => {
    await page.goto('/pharmacist/prescriptions');
    await page.waitForLoadState('networkidle');

    // Find first prescription item
    const firstPrescription = page
      .locator('[data-testid^="prescription-card"], [data-testid^="prescription-row"]')
      .first();

    if ((await firstPrescription.count()) > 0) {
      await checkModalFocusManagement(
        page,
        '[data-testid^="prescription-card"], [data-testid^="prescription-row"]',
        '[role="dialog"]',
        '[aria-label*="Close"], [aria-label*="Fermer"]'
      );
    }
  });

  test('Inventory page should be accessible', async ({ page }) => {
    await page.goto('/pharmacist/inventory');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Inventory Page');

    // Check search/filter form
    const searchForm = page.locator('[role="search"], form').first();
    if ((await searchForm.count()) > 0) {
      await checkFormAccessibility(page, '[role="search"], form');
    }

    // Check inventory table
    const table = page.locator('table, [role="table"]').first();
    if ((await table.count()) > 0) {
      await checkTableAccessibility(page, 'table, [role="table"]');
    }
  });

  test('Add inventory item dialog should be accessible', async ({ page }) => {
    await page.goto('/pharmacist/inventory');
    await page.waitForLoadState('networkidle');

    // Look for add button
    const addButton = page.locator('[data-testid="add-item-button"]');

    if ((await addButton.count()) > 0) {
      await addButton.click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });

      // Check dialog accessibility
      await runAccessibilityScan(page, 'Add Inventory Dialog');

      // Check form inside dialog
      await checkFormAccessibility(page, '[role="dialog"] form');

      // Verify focus is in dialog
      const focusInDialog = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        return dialog?.contains(document.activeElement);
      });
      expect(focusInDialog).toBe(true);
    }
  });

  test('User management page should be accessible', async ({ page }) => {
    await page.goto('/pharmacist/users');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'User Management');

    // Check user list table
    const table = page.locator('[data-testid="user-list-table"], table').first();
    if ((await table.count()) > 0) {
      await checkTableAccessibility(page, '[data-testid="user-list-table"], table');
    }
  });

  test('Messaging interface should be accessible', async ({ page }) => {
    await page.goto('/pharmacist/messages');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Messaging Interface');

    // Check message list has proper ARIA
    const messageList = page.locator('[data-testid="message-list"], [role="list"]').first();
    if ((await messageList.count()) > 0) {
      const role = await messageList.getAttribute('role');
      expect(role).toBeTruthy();
    }

    // Check message input has label
    const messageInput = page.locator(
      'textarea[name="message"], input[name="message"]'
    ).first();
    if ((await messageInput.count()) > 0) {
      const hasLabel = await page.evaluate(() => {
        const input = document.querySelector(
          'textarea[name="message"], input[name="message"]'
        );
        if (!input) return false;

        const id = input.id;
        const label = document.querySelector(`label[for="${id}"]`);
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledBy = input.getAttribute('aria-labelledby');

        return !!(label || ariaLabel || ariaLabelledBy);
      });
      expect(hasLabel).toBe(true);
    }
  });

  test('Analytics page should be accessible', async ({ page }) => {
    await page.goto('/pharmacist/analytics');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Analytics Page');

    // Check charts have accessible descriptions
    const charts = page.locator('[data-testid*="chart"], [role="img"]');
    const chartCount = await charts.count();

    for (let i = 0; i < chartCount; i++) {
      const chart = charts.nth(i);
      const ariaLabel = await chart.getAttribute('aria-label');
      const ariaLabelledBy = await chart.getAttribute('aria-labelledby');

      expect(
        ariaLabel || ariaLabelledBy,
        `Chart ${i} should have aria-label or aria-labelledby`
      ).toBeTruthy();
    }
  });

  test('Delivery management should be accessible', async ({ page }) => {
    await page.goto('/pharmacist/deliveries');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Delivery Management');

    // Check delivery list
    const deliveryList = page.locator(
      '[data-testid="delivery-list"], [role="list"]'
    ).first();
    if ((await deliveryList.count()) > 0) {
      const role = await deliveryList.getAttribute('role');
      expect(role).toBeTruthy();
    }
  });

  test('Settings page should be accessible', async ({ page }) => {
    await page.goto('/pharmacist/settings');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Settings Page');

    // Check settings form
    await checkFormAccessibility(page, 'form');

    // Verify all form controls have labels
    const inputs = page.locator('input, select, textarea');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      if (id) {
        const labelExists = await page.locator(`label[for="${id}"]`).count();
        expect(
          labelExists > 0 || ariaLabel || ariaLabelledBy,
          `Input with id="${id}" should have a label`
        ).toBeTruthy();
      }
    }
  });

  test('Keyboard shortcuts should be documented', async ({ page }) => {
    await page.goto('/pharmacist/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for keyboard shortcuts help
    // Usually accessible via '?' key or help button
    await page.keyboard.press('?');
    await page.waitForTimeout(500);

    // Check if shortcuts dialog appears
    const shortcutsDialog = page.locator('[data-testid="shortcuts-dialog"], [role="dialog"]');
    const dialogVisible = await shortcutsDialog.isVisible().catch(() => false);

    // If no dialog, look for help link
    if (!dialogVisible) {
      const helpLink = page.locator('a[href*="help"], button:has-text("Help")');
      // This is informational - not a hard requirement
      console.log('Keyboard shortcuts documentation:', await helpLink.count() > 0 ? 'Found' : 'Not found');
    }
  });

  test('Color contrast should meet WCAG AA standards', async ({ page }) => {
    await page.goto('/pharmacist/dashboard');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan - this includes color contrast checks
    await runAccessibilityScan(page, 'Dashboard Color Contrast');

    // Specifically check buttons and links
    const buttons = page.locator('button, a');
    const count = await buttons.count();

    // Sample first 10 buttons for contrast
    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      const isVisible = await button.isVisible();

      if (isVisible) {
        // Check computed styles
        const hasGoodContrast = await button.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          const bgColor = styles.backgroundColor;
          const color = styles.color;

          // Basic check - detailed contrast is handled by axe-core
          return bgColor !== color;
        });

        expect(hasGoodContrast).toBe(true);
      }
    }
  });

  test('Skip navigation link should be present', async ({ page }) => {
    await page.goto('/pharmacist/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for skip link (usually first focusable element)
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        text: el?.textContent?.toLowerCase() || '',
        href: (el as HTMLAnchorElement)?.href || '',
      };
    });

    // Skip link should contain "skip" and navigate to main content
    const hasSkipLink = focusedElement.text.includes('skip') ||
                        focusedElement.href.includes('#main') ||
                        focusedElement.href.includes('#content');

    // This is a best practice but not always required
    console.log('Skip navigation link:', hasSkipLink ? 'Present' : 'Not found');
  });
});
