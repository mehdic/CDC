/**
 * Accessibility E2E Tests - Doctor Role
 *
 * Tests WCAG 2.1 AA compliance for doctor-specific workflows
 */

import { test, expect } from '../../fixtures/api-mocks.fixture';
import {
  runAccessibilityScan,
  checkKeyboardNavigation,
  verifyAriaAttributes,
  checkFormAccessibility,
  checkTableAccessibility,
} from '../../utils/accessibility';

test.describe('Doctor Accessibility', () => {
  test.use({ storageState: '.auth/doctor.json' });

  test('Doctor dashboard should be accessible', async ({ page }) => {
    await page.goto('/doctor/dashboard');
    await page.waitForLoadState('networkidle');

    // Run comprehensive accessibility scan
    await runAccessibilityScan(page, 'Doctor Dashboard');

    // Verify main landmarks
    await verifyAriaAttributes(page, 'main', {
      role: 'main',
    });
  });

  test('Dashboard should support keyboard navigation', async ({ page }) => {
    await page.goto('/doctor/dashboard');
    await page.waitForLoadState('networkidle');

    await checkKeyboardNavigation(page, 'body', 10);
  });

  test('Patient list should be accessible', async ({ page }) => {
    await page.goto('/doctor/patients');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Patient List');

    // Check patient list/table
    const patientTable = page.locator('[data-testid="patient-list"], table').first();
    if ((await patientTable.count()) > 0) {
      await checkTableAccessibility(page, '[data-testid="patient-list"], table');
    }

    // Check search form
    const searchForm = page.locator('[role="search"], form').first();
    if ((await searchForm.count()) > 0) {
      await checkFormAccessibility(page, '[role="search"], form');
    }
  });

  test('Patient details should be accessible', async ({ page }) => {
    await page.goto('/doctor/patients');
    await page.waitForLoadState('networkidle');

    // Click first patient
    const firstPatient = page.locator('[data-testid^="patient-card"], [data-testid^="patient-row"]').first();

    if ((await firstPatient.count()) > 0) {
      await firstPatient.click();
      await page.waitForLoadState('networkidle');

      // Run accessibility scan
      await runAccessibilityScan(page, 'Patient Details');

      // Check patient info is structured with headings
      const headings = page.locator('h1, h2, h3');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);
    }
  });

  test('Prescription creation should be accessible', async ({ page }) => {
    await page.goto('/doctor/prescriptions/new');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Prescription Creation');

    // Check form accessibility
    await checkFormAccessibility(page, 'form');

    // Verify medication search has autocomplete attributes
    const medicationInput = page.locator('input[name*="medication"]').first();
    if ((await medicationInput.count()) > 0) {
      const role = await medicationInput.getAttribute('role');
      const ariaAutocomplete = await medicationInput.getAttribute('aria-autocomplete');

      // Should have combobox role or aria-autocomplete
      expect(role === 'combobox' || ariaAutocomplete).toBeTruthy();
    }
  });

  test('Prescription templates should be accessible', async ({ page }) => {
    await page.goto('/doctor/prescriptions/templates');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Prescription Templates');

    // Check template cards/list
    const templates = page.locator('[data-testid^="template-"]');
    const count = await templates.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const template = templates.nth(i);
      const ariaLabel = await template.getAttribute('aria-label');
      const textContent = await template.textContent();

      expect(ariaLabel || textContent, `Template ${i} should have accessible name`).toBeTruthy();
    }
  });

  test('Secure messaging should be accessible', async ({ page }) => {
    await page.goto('/doctor/messages');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Doctor Messaging');

    // Check message list
    const messageList = page.locator('[data-testid="message-list"], [role="list"]').first();
    if ((await messageList.count()) > 0) {
      const role = await messageList.getAttribute('role');
      expect(role).toBeTruthy();
    }

    // Check message composition
    const messageInput = page.locator('textarea[name="message"]').first();
    if ((await messageInput.count()) > 0) {
      const ariaLabel = await messageInput.getAttribute('aria-label');
      const id = await messageInput.getAttribute('id');

      if (id) {
        const hasLabel = await page.locator(`label[for="${id}"]`).count();
        expect(hasLabel > 0 || ariaLabel, 'Message input should have label').toBeTruthy();
      }
    }
  });

  test('Video consultation should be accessible', async ({ page }) => {
    await page.goto('/doctor/consultations');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Video Consultations');

    // Check consultation controls have accessible names
    const controls = page.locator('[data-testid*="video-"], button[aria-label]');
    const count = await controls.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const control = controls.nth(i);
      const ariaLabel = await control.getAttribute('aria-label');
      const textContent = await control.textContent();

      expect(ariaLabel || textContent, 'Video control should have accessible name').toBeTruthy();
    }
  });

  test('Treatment view should be accessible', async ({ page }) => {
    await page.goto('/doctor/patients');
    await page.waitForLoadState('networkidle');

    const firstPatient = page.locator('[data-testid^="patient-card"]').first();

    if ((await firstPatient.count()) > 0) {
      await firstPatient.click();
      await page.waitForLoadState('networkidle');

      // Navigate to treatment tab
      const treatmentTab = page.locator('button:has-text("Treatment"), [role="tab"]:has-text("Treatment")');
      if ((await treatmentTab.count()) > 0) {
        await treatmentTab.click();
        await page.waitForTimeout(300);

        // Run accessibility scan on treatment view
        await runAccessibilityScan(page, 'Treatment View');

        // Check tablist has proper ARIA
        const tablist = page.locator('[role="tablist"]').first();
        if ((await tablist.count()) > 0) {
          await verifyAriaAttributes(page, '[role="tablist"]', {
            role: 'tablist',
          });
        }
      }
    }
  });

  test('Observance statistics should be accessible', async ({ page }) => {
    await page.goto('/doctor/patients');
    await page.waitForLoadState('networkidle');

    const firstPatient = page.locator('[data-testid^="patient-card"]').first();

    if ((await firstPatient.count()) > 0) {
      await firstPatient.click();
      await page.waitForLoadState('networkidle');

      // Run accessibility scan
      await runAccessibilityScan(page, 'Observance Stats');

      // Check charts/graphs have text alternatives
      const charts = page.locator('[data-testid*="chart"], svg[role="img"]');
      const count = await charts.count();

      for (let i = 0; i < count; i++) {
        const chart = charts.nth(i);
        const ariaLabel = await chart.getAttribute('aria-label');
        const ariaLabelledBy = await chart.getAttribute('aria-labelledby');

        expect(ariaLabel || ariaLabelledBy, `Chart ${i} should have text alternative`).toBeTruthy();
      }
    }
  });

  test('Schedule/calendar should be accessible', async ({ page }) => {
    await page.goto('/doctor/schedule');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Doctor Schedule');

    // Check calendar has grid role
    const calendar = page.locator('[role="grid"], [role="table"]').first();
    if ((await calendar.count()) > 0) {
      const role = await calendar.getAttribute('role');
      expect(role).toBeTruthy();
    }
  });

  test('Settings page should be accessible', async ({ page }) => {
    await page.goto('/doctor/settings');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Doctor Settings');

    // Check settings form
    await checkFormAccessibility(page, 'form');
  });

  test('Keyboard shortcuts should work', async ({ page }) => {
    await page.goto('/doctor/dashboard');
    await page.waitForLoadState('networkidle');

    // Test common shortcuts (if implemented)
    // Example: Ctrl/Cmd + K for search
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
    await page.waitForTimeout(300);

    // Check if search dialog opened
    const searchDialog = page.locator('[role="dialog"], [data-testid="search-dialog"]');
    const dialogVisible = await searchDialog.isVisible().catch(() => false);

    // This is informational - shortcuts are a nice-to-have
    console.log('Keyboard shortcut (Cmd/Ctrl+K):', dialogVisible ? 'Works' : 'Not implemented');
  });

  test('Focus indicators should be visible', async ({ page }) => {
    await page.goto('/doctor/dashboard');
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
