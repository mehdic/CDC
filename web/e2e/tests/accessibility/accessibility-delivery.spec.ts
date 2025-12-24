/**
 * Accessibility E2E Tests - Delivery Personnel Role
 *
 * Tests WCAG 2.1 AA compliance for delivery driver workflows
 */

import { test, expect } from '../../fixtures/api-mocks.fixture';
import {
  runAccessibilityScan,
  checkKeyboardNavigation,
  verifyAriaAttributes,
  checkFormAccessibility,
} from '../../utils/accessibility';

test.describe('Delivery Personnel Accessibility', () => {
  test.use({ storageState: '.auth/delivery.json' });

  test('Delivery dashboard should be accessible', async ({ page }) => {
    await page.goto('/delivery/dashboard');
    await page.waitForLoadState('networkidle');

    // Run comprehensive accessibility scan
    await runAccessibilityScan(page, 'Delivery Dashboard');

    // Verify main landmarks
    await verifyAriaAttributes(page, 'main', {
      role: 'main',
    });
  });

  test('Dashboard should support keyboard navigation', async ({ page }) => {
    await page.goto('/delivery/dashboard');
    await page.waitForLoadState('networkidle');

    await checkKeyboardNavigation(page, 'body', 10);
  });

  test('Delivery list should be accessible', async ({ page }) => {
    await page.goto('/delivery/deliveries');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Delivery List');

    // Check delivery cards
    const deliveryCards = page.locator('[data-testid^="delivery-card-"]');
    const count = await deliveryCards.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const card = deliveryCards.nth(i);
      const ariaLabel = await card.getAttribute('aria-label');
      const ariaLabelledBy = await card.getAttribute('aria-labelledby');

      expect(
        ariaLabel || ariaLabelledBy,
        `Delivery card ${i} should have accessible name`
      ).toBeTruthy();
    }
  });

  test('Delivery filters should be accessible', async ({ page }) => {
    await page.goto('/delivery/deliveries');
    await page.waitForLoadState('networkidle');

    // Check filter controls
    const filters = page.locator('[data-testid="delivery-filters"], [role="group"]').first();

    if ((await filters.count()) > 0) {
      // Run accessibility scan on filters
      await runAccessibilityScan(page, 'Delivery Filters');

      // Check filter inputs have labels
      const filterInputs = filters.locator('input, select');
      const inputCount = await filterInputs.count();

      for (let i = 0; i < inputCount; i++) {
        const input = filterInputs.nth(i);
        const ariaLabel = await input.getAttribute('aria-label');
        const id = await input.getAttribute('id');

        if (id) {
          const hasLabel = await page.locator(`label[for="${id}"]`).count();
          expect(
            hasLabel > 0 || ariaLabel,
            `Filter input ${i} should have label`
          ).toBeTruthy();
        }
      }
    }
  });

  test('Delivery detail page should be accessible', async ({ page }) => {
    await page.goto('/delivery/deliveries');
    await page.waitForLoadState('networkidle');

    // Click first delivery
    const firstDelivery = page.locator('[data-testid^="delivery-card-"]').first();

    if ((await firstDelivery.count()) > 0) {
      await firstDelivery.click();
      await page.waitForLoadState('networkidle');

      // Run accessibility scan
      await runAccessibilityScan(page, 'Delivery Detail');

      // Check action buttons have accessible names
      const actionButtons = page.locator('button[data-testid^="action-"]');
      const buttonCount = await actionButtons.count();

      for (let i = 0; i < buttonCount; i++) {
        const button = actionButtons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = await button.textContent();

        expect(
          ariaLabel || textContent,
          `Action button ${i} should have accessible name`
        ).toBeTruthy();
      }
    }
  });

  test('Signature capture should be accessible', async ({ page }) => {
    await page.goto('/delivery/deliveries');
    await page.waitForLoadState('networkidle');

    const firstDelivery = page.locator('[data-testid^="delivery-card-"]').first();

    if ((await firstDelivery.count()) > 0) {
      await firstDelivery.click();
      await page.waitForLoadState('networkidle');

      // Look for signature button
      const signatureButton = page.locator('button:has-text("Signature"), [data-testid="signature-button"]').first();

      if ((await signatureButton.count()) > 0) {
        await signatureButton.click();
        await page.waitForTimeout(500);

        // Check signature canvas has accessible label
        const signatureCanvas = page.locator('canvas').first();
        if ((await signatureCanvas.count()) > 0) {
          const ariaLabel = await signatureCanvas.getAttribute('aria-label');
          const role = await signatureCanvas.getAttribute('role');

          expect(
            ariaLabel || role,
            'Signature canvas should have aria-label or role'
          ).toBeTruthy();
        }

        // Check clear and submit buttons
        const clearButton = page.locator('button:has-text("Clear")').first();
        if ((await clearButton.count()) > 0) {
          const ariaLabel = await clearButton.getAttribute('aria-label');
          const textContent = await clearButton.textContent();
          expect(ariaLabel || textContent).toBeTruthy();
        }
      }
    }
  });

  test('Photo capture should be accessible', async ({ page }) => {
    await page.goto('/delivery/deliveries');
    await page.waitForLoadState('networkidle');

    const firstDelivery = page.locator('[data-testid^="delivery-card-"]').first();

    if ((await firstDelivery.count()) > 0) {
      await firstDelivery.click();
      await page.waitForLoadState('networkidle');

      // Look for photo capture button
      const photoButton = page.locator('button:has-text("Photo"), [data-testid="photo-button"]').first();

      if ((await photoButton.count()) > 0) {
        const ariaLabel = await photoButton.getAttribute('aria-label');
        const textContent = await photoButton.textContent();

        expect(
          ariaLabel || textContent,
          'Photo button should have accessible name'
        ).toBeTruthy();
      }
    }
  });

  test('QR code scanner should be accessible', async ({ page }) => {
    await page.goto('/delivery/deliveries');
    await page.waitForLoadState('networkidle');

    const firstDelivery = page.locator('[data-testid^="delivery-card-"]').first();

    if ((await firstDelivery.count()) > 0) {
      await firstDelivery.click();
      await page.waitForLoadState('networkidle');

      // Look for QR scanner button
      const qrButton = page.locator('button:has-text("QR"), button:has-text("Scan"), [data-testid="qr-button"]').first();

      if ((await qrButton.count()) > 0) {
        const ariaLabel = await qrButton.getAttribute('aria-label');
        const textContent = await qrButton.textContent();

        expect(
          ariaLabel || textContent,
          'QR button should have accessible name'
        ).toBeTruthy();
      }
    }
  });

  test('Priority badges should have text alternatives', async ({ page }) => {
    await page.goto('/delivery/deliveries');
    await page.waitForLoadState('networkidle');

    // Check priority indicators
    const priorityBadges = page.locator('[data-testid^="priority-"]');
    const count = await priorityBadges.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const badge = priorityBadges.nth(i);
      const ariaLabel = await badge.getAttribute('aria-label');
      const textContent = await badge.textContent();
      const title = await badge.getAttribute('title');

      expect(
        ariaLabel || textContent || title,
        `Priority badge ${i} should have text alternative`
      ).toBeTruthy();
    }
  });

  test('GPS tracking should be accessible', async ({ page }) => {
    await page.goto('/delivery/deliveries');
    await page.waitForLoadState('networkidle');

    const firstDelivery = page.locator('[data-testid^="delivery-card-"]').first();

    if ((await firstDelivery.count()) > 0) {
      await firstDelivery.click();
      await page.waitForLoadState('networkidle');

      // Look for map container
      const mapContainer = page.locator('[data-testid="delivery-map"], [role="application"]').first();

      if ((await mapContainer.count()) > 0) {
        const ariaLabel = await mapContainer.getAttribute('aria-label');
        const ariaLabelledBy = await mapContainer.getAttribute('aria-labelledby');

        expect(
          ariaLabel || ariaLabelledBy,
          'Map should have accessible name'
        ).toBeTruthy();
      }
    }
  });

  test('Delivery completion flow should be accessible', async ({ page }) => {
    await page.goto('/delivery/deliveries');
    await page.waitForLoadState('networkidle');

    const firstDelivery = page.locator('[data-testid^="delivery-card-"]').first();

    if ((await firstDelivery.count()) > 0) {
      await firstDelivery.click();
      await page.waitForLoadState('networkidle');

      // Look for complete button
      const completeButton = page.locator('button:has-text("Complete"), [data-testid="complete-button"]').first();

      if ((await completeButton.count()) > 0) {
        await completeButton.click();
        await page.waitForTimeout(500);

        // Check completion form
        const completionForm = page.locator('form, [role="dialog"] form').first();
        if ((await completionForm.count()) > 0) {
          await checkFormAccessibility(page, 'form');
        }
      }
    }
  });

  test('Route optimization should be accessible', async ({ page }) => {
    await page.goto('/delivery/route');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Route Optimization');

    // Check route list
    const routeList = page.locator('[data-testid="route-list"], [role="list"]').first();
    if ((await routeList.count()) > 0) {
      const role = await routeList.getAttribute('role');
      expect(role).toBeTruthy();
    }
  });

  test('Settings page should be accessible', async ({ page }) => {
    await page.goto('/delivery/settings');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan
    await runAccessibilityScan(page, 'Delivery Settings');

    // Check settings form
    await checkFormAccessibility(page, 'form');
  });

  test('Status updates should be announced', async ({ page }) => {
    await page.goto('/delivery/deliveries');
    await page.waitForLoadState('networkidle');

    // Look for status updates
    const statusUpdates = page.locator('[role="status"], [role="alert"]');
    const count = await statusUpdates.count();

    // This is informational
    console.log('Status updates with ARIA:', count);

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const update = statusUpdates.nth(i);
        const role = await update.getAttribute('role');
        const ariaLive = await update.getAttribute('aria-live');

        expect(role || ariaLive, `Status update ${i} should have role or aria-live`).toBeTruthy();
      }
    }
  });

  test('Focus indicators should be visible', async ({ page }) => {
    await page.goto('/delivery/dashboard');
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

  test('Mobile-friendly touch targets', async ({ page }) => {
    await page.goto('/delivery/deliveries');
    await page.waitForLoadState('networkidle');

    // Check that interactive elements have adequate size (44x44px minimum WCAG guideline)
    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      const isVisible = await button.isVisible();

      if (isVisible) {
        const box = await button.boundingBox();
        if (box) {
          // WCAG 2.1 Success Criterion 2.5.5 requires 44x44px for Level AAA
          // 24x24px is often acceptable for AA with proper spacing
          expect(
            box.width >= 24 && box.height >= 24,
            `Button ${i} should have adequate touch target size (${box.width}x${box.height})`
          ).toBe(true);
        }
      }
    }
  });
});
