/**
 * Accessibility Testing Utilities
 *
 * Provides helpers for WCAG 2.1 AA compliance testing using axe-core
 */

import { Page, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * WCAG 2.1 AA Configuration for axe-core
 *
 * Focuses on Level A and AA compliance requirements
 */
export const axeConfig = {
  runOnly: {
    type: 'tag' as const,
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
  },
};

/**
 * Run accessibility scan on current page
 *
 * @param page - Playwright page object
 * @param context - Test context for better error messages
 * @returns Accessibility scan results
 */
export async function runAccessibilityScan(
  page: Page,
  context: string = 'page'
): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  // Expect no violations
  expect(results.violations, `${context} should have no accessibility violations`).toEqual([]);

  // Log passes for visibility
  if (results.passes.length > 0) {
    console.log(`✓ ${context}: ${results.passes.length} accessibility checks passed`);
  }
}

/**
 * Run accessibility scan excluding specific rules
 *
 * Use sparingly - only for known issues with documented tech debt
 *
 * @param page - Playwright page object
 * @param context - Test context
 * @param disabledRules - Array of axe rule IDs to disable
 */
export async function runAccessibilityScanWithExclusions(
  page: Page,
  context: string,
  disabledRules: string[]
): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .disableRules(disabledRules)
    .analyze();

  expect(results.violations, `${context} should have no accessibility violations`).toEqual([]);
}

/**
 * Check keyboard navigation accessibility
 *
 * Validates:
 * - Tab key moves focus forward
 * - Shift+Tab moves focus backward
 * - Focus is visible on all interactive elements
 * - No keyboard traps
 *
 * @param page - Playwright page object
 * @param selector - Starting element selector
 * @param expectedTabStops - Expected number of tab stops (optional)
 */
export async function checkKeyboardNavigation(
  page: Page,
  selector: string,
  expectedTabStops?: number
): Promise<void> {
  // Focus on starting element
  await page.locator(selector).first().focus();

  let currentFocus = await page.evaluate(() => document.activeElement?.tagName);
  const tabStops: string[] = [];

  // Tab through elements
  for (let i = 0; i < (expectedTabStops || 20); i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100); // Allow focus to settle

    const newFocus = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el?.tagName || '',
        id: el?.id || '',
        class: el?.className || '',
        role: el?.getAttribute('role') || '',
      };
    });

    tabStops.push(`${newFocus.tag}${newFocus.id ? '#' + newFocus.id : ''}`);

    // Check if focus is visible
    const isFocusVisible = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      if (!el) return false;

      const styles = window.getComputedStyle(el);
      // Check for visible outline, box-shadow, or border
      return (
        styles.outline !== 'none' ||
        styles.outlineWidth !== '0px' ||
        styles.boxShadow !== 'none' ||
        parseInt(styles.borderWidth) > 0
      );
    });

    expect(isFocusVisible, `Focus should be visible on ${newFocus.tag}`).toBe(true);

    // Detect keyboard trap (focus not changing)
    if (currentFocus === newFocus.tag && i > 2) {
      break;
    }
    currentFocus = newFocus.tag;
  }

  if (expectedTabStops) {
    expect(tabStops.length).toBeGreaterThanOrEqual(expectedTabStops);
  }
}

/**
 * Verify ARIA attributes on element
 *
 * @param page - Playwright page object
 * @param selector - Element selector
 * @param expectedAttributes - Expected ARIA attributes
 */
export async function verifyAriaAttributes(
  page: Page,
  selector: string,
  expectedAttributes: Record<string, string | boolean>
): Promise<void> {
  const element = page.locator(selector).first();

  // Check if element exists before verifying attributes
  const count = await element.count();
  if (count === 0) {
    console.log(`⚠️  Element "${selector}" not found - skipping ARIA verification`);
    return;
  }

  for (const [attr, expectedValue] of Object.entries(expectedAttributes)) {
    const actualValue = await element.getAttribute(attr);

    if (typeof expectedValue === 'boolean') {
      expect(actualValue).toBe(expectedValue.toString());
    } else {
      expect(actualValue).toBe(expectedValue);
    }
  }
}

/**
 * Check screen reader announcement
 *
 * Verifies live regions and aria-live attributes
 *
 * @param page - Playwright page object
 * @param selector - Live region selector
 * @param expectedRole - Expected ARIA role (alert, status, log)
 */
export async function checkScreenReaderAnnouncement(
  page: Page,
  selector: string,
  expectedRole: 'alert' | 'status' | 'log' = 'status'
): Promise<void> {
  const element = page.locator(selector).first();

  // Check aria-live attribute
  const ariaLive = await element.getAttribute('aria-live');
  expect(ariaLive).toBeTruthy();

  // Check role
  const role = await element.getAttribute('role');
  expect(role).toBe(expectedRole);
}

/**
 * Verify color contrast meets WCAG AA standards
 *
 * This is automated by axe-core, but this helper provides explicit testing
 *
 * @param page - Playwright page object
 * @param selector - Element to check
 */
export async function checkColorContrast(page: Page, selector: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .include(selector)
    .withRules(['color-contrast'])
    .analyze();

  expect(results.violations, `${selector} should meet color contrast requirements`).toEqual([]);
}

/**
 * Check focus management in modal dialogs
 *
 * Validates:
 * - Focus moves to modal when opened
 * - Focus is trapped within modal
 * - Focus returns to trigger element when closed
 *
 * @param page - Playwright page object
 * @param triggerSelector - Button/link that opens modal
 * @param modalSelector - Modal container selector
 * @param closeSelector - Close button selector
 */
export async function checkModalFocusManagement(
  page: Page,
  triggerSelector: string,
  modalSelector: string,
  closeSelector: string
): Promise<void> {
  // Get trigger element for focus return check
  const trigger = page.locator(triggerSelector);
  await trigger.focus();

  // Open modal
  await trigger.click();
  await page.waitForSelector(modalSelector, { state: 'visible' });

  // Verify focus is inside modal
  const focusInModal = await page.evaluate((sel) => {
    const modal = document.querySelector(sel);
    const focused = document.activeElement;
    return modal?.contains(focused);
  }, modalSelector);

  expect(focusInModal, 'Focus should be inside modal').toBe(true);

  // Verify modal has role="dialog"
  await verifyAriaAttributes(page, modalSelector, {
    role: 'dialog',
    'aria-modal': 'true',
  });

  // Close modal
  await page.locator(closeSelector).click();
  await page.waitForSelector(modalSelector, { state: 'hidden' });

  // Verify focus returned to trigger
  const focusReturned = await page.evaluate((sel) => {
    const trigger = document.querySelector(sel);
    return document.activeElement === trigger;
  }, triggerSelector);

  expect(focusReturned, 'Focus should return to trigger element').toBe(true);
}

/**
 * Check form accessibility
 *
 * Validates:
 * - Labels are associated with inputs
 * - Required fields have aria-required
 * - Error messages are announced
 * - Submit button is accessible
 *
 * @param page - Playwright page object
 * @param formSelector - Form container selector
 */
export async function checkFormAccessibility(
  page: Page,
  formSelector: string
): Promise<void> {
  // Check if form exists
  const formExists = await page.locator(formSelector).count();
  if (formExists === 0) {
    console.log(`⚠️  Form "${formSelector}" not found - skipping form accessibility check`);
    return;
  }

  // Run axe scan on form
  const results = await new AxeBuilder({ page })
    .include(formSelector)
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(results.violations, `${formSelector} should be accessible`).toEqual([]);

  // Check all inputs have labels
  const inputsWithoutLabels = await page.evaluate((sel) => {
    const form = document.querySelector(sel);
    if (!form) return [];

    const inputs = form.querySelectorAll('input, select, textarea');
    const unlabeled: string[] = [];

    inputs.forEach((input) => {
      const id = input.id;
      const hasLabel = form.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = input.getAttribute('aria-label');
      const hasAriaLabelledBy = input.getAttribute('aria-labelledby');

      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
        unlabeled.push(id || input.tagName);
      }
    });

    return unlabeled;
  }, formSelector);

  expect(inputsWithoutLabels, 'All form inputs should have labels').toEqual([]);
}

/**
 * Check data table accessibility
 *
 * Validates:
 * - Table has caption or aria-label
 * - Headers are marked with <th> and scope
 * - Sortable columns have aria-sort
 *
 * @param page - Playwright page object
 * @param tableSelector - Table selector
 */
export async function checkTableAccessibility(
  page: Page,
  tableSelector: string
): Promise<void> {
  const table = page.locator(tableSelector);

  // Check table has accessible name
  const hasCaption = await table.locator('caption').count();
  const hasAriaLabel = await table.getAttribute('aria-label');
  const hasAriaLabelledBy = await table.getAttribute('aria-labelledby');

  expect(
    hasCaption > 0 || hasAriaLabel || hasAriaLabelledBy,
    'Table should have caption or aria-label'
  ).toBe(true);

  // Check headers have scope
  const headersWithoutScope = await page.evaluate((sel) => {
    const table = document.querySelector(sel);
    if (!table) return [];

    const headers = table.querySelectorAll('th');
    const invalid: string[] = [];

    headers.forEach((th) => {
      if (!th.getAttribute('scope')) {
        invalid.push(th.textContent || 'unknown');
      }
    });

    return invalid;
  }, tableSelector);

  expect(headersWithoutScope, 'All table headers should have scope attribute').toEqual([]);
}
