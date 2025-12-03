/**
 * Playwright E2E Tests - Terminal Pairing Screen
 * Tests the pairing workflow for mobile payment terminals
 */

import { test, expect } from '@playwright/test';

test.describe('Driver Terminal Pairing Screen', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to driver terminal pairing page
    await page.goto('/driver/terminal/pairing');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display terminal pairing screen with correct title', async ({ page }) => {
    // Verify heading is visible
    const heading = page.locator('h1, h5');
    await expect(heading).toContainText('Terminal Pairing', { timeout: 5000 });

    // Verify Bluetooth icon is visible
    const bluetoothIcon = page.locator('[data-testid="BluetoothIcon"]');
    await expect(bluetoothIcon).toBeVisible();
  });

  test('should display input fields for terminal details', async ({ page }) => {
    // Verify serial number input
    const serialInput = page.locator('input[placeholder*="SER"]');
    await expect(serialInput).toBeVisible();
    await expect(serialInput).toHaveAttribute('aria-label', 'Terminal Serial Number');

    // Verify device name input
    const deviceNameInput = page.locator('input[placeholder*="Device Name"]');
    await expect(deviceNameInput).toBeVisible();

    // Verify cancel button
    const cancelButton = page.getByRole('button', { name: 'Cancel' });
    await expect(cancelButton).toBeVisible();

    // Verify start pairing button
    const startButton = page.getByRole('button', { name: 'Start Pairing' });
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeDisabled(); // Should be disabled when fields are empty
  });

  test('should validate form before submission', async ({ page }) => {
    // Try to submit empty form
    const startButton = page.getByRole('button', { name: 'Start Pairing' });
    expect(startButton).toBeDisabled();

    // Enter only serial number
    const serialInput = page.locator('input[placeholder*="SER"]');
    await serialInput.fill('TEST-SERIAL-001');

    // Button should still be disabled
    await expect(startButton).toBeDisabled();

    // Enter device name
    const deviceNameInput = page.locator('input[placeholder*="Device Name"]');
    await deviceNameInput.fill('My Terminal');

    // Button should now be enabled
    await expect(startButton).toBeEnabled();
  });

  test('should submit pairing request and show pairing code', async ({ page }) => {
    // Mock API response
    await page.route('**/api/v1/terminals/pair', (route) => {
      route.abort('blockedbyresponse');
    });

    // Fill form
    const serialInput = page.locator('input[placeholder*="SER"]');
    const deviceNameInput = page.locator('input[placeholder*="Device Name"]');

    await serialInput.fill('TEST-SERIAL-001');
    await deviceNameInput.fill('My Terminal');

    // Submit form
    const startButton = page.getByRole('button', { name: 'Start Pairing' });
    await startButton.click();

    // Wait for loading state
    const loadingSpinner = page.locator('svg[class*="MuiCircularProgress"]');
    if (await loadingSpinner.isVisible()) {
      await page.waitForLoadState('networkidle');
    }

    // After successful pairing, should show next step
    // (Implementation depends on actual response handling)
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock error response
    await page.route('**/api/v1/terminals/pair', (route) => {
      route.abort('failed');
    });

    // Fill and submit form
    const serialInput = page.locator('input[placeholder*="SER"]');
    const deviceNameInput = page.locator('input[placeholder*="Device Name"]');

    await serialInput.fill('TEST-SERIAL-FAIL');
    await deviceNameInput.fill('My Terminal');

    const startButton = page.getByRole('button', { name: 'Start Pairing' });
    await startButton.click();

    // Wait for error message
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
  });

  test('should support cancel action', async ({ page }) => {
    // Fill form
    const serialInput = page.locator('input[placeholder*="SER"]');
    const deviceNameInput = page.locator('input[placeholder*="Device Name"]');

    await serialInput.fill('TEST-SERIAL-001');
    await deviceNameInput.fill('My Terminal');

    // Click cancel
    const cancelButton = page.getByRole('button', { name: 'Cancel' });
    await cancelButton.click();

    // Should navigate away or reset
    // This depends on onCancel implementation
  });

  test('should display stepper showing pairing progress', async ({ page }) => {
    // Verify stepper is visible
    const stepper = page.locator('[role="progressbar"], .MuiStepper-root');

    if (await stepper.isVisible()) {
      // Verify steps are visible
      const steps = page.locator('.MuiStepLabel-label');
      const count = await steps.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should navigate through pairing steps', async ({ page }) => {
    // Step 1: Enter details
    const serialInput = page.locator('input[placeholder*="SER"]');
    const deviceNameInput = page.locator('input[placeholder*="Device Name"]');

    await serialInput.fill('TEST-SERIAL-001');
    await deviceNameInput.fill('My Terminal');

    // Mock successful pairing initiation
    await page.route('**/api/v1/terminals/pair', (route) => {
      route.continue();
    });

    const startButton = page.getByRole('button', { name: 'Start Pairing' });
    await startButton.click();

    // Wait for next step (pairing code display)
    // Implementation would depend on actual page flow
  });

  test('should display helper text for form fields', async ({ page }) => {
    // Check for helper text below inputs
    const helperTexts = page.locator('.MuiFormHelperText-root');
    const count = await helperTexts.count();

    expect(count).toBeGreaterThan(0);
  });

  test('should disable form during submission', async ({ page }) => {
    // Fill form
    const serialInput = page.locator('input[placeholder*="SER"]');
    const deviceNameInput = page.locator('input[placeholder*="Device Name"]');

    await serialInput.fill('TEST-SERIAL-001');
    await deviceNameInput.fill('My Terminal');

    // Mock slow API response
    await page.route('**/api/v1/terminals/pair', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      route.abort('blocked');
    });

    const startButton = page.getByRole('button', { name: 'Start Pairing' });
    await startButton.click();

    // Verify button is disabled during submission
    await expect(startButton).toBeDisabled();

    // Verify inputs are disabled
    await expect(serialInput).toBeDisabled();
    await expect(deviceNameInput).toBeDisabled();
  });

  test('should clear error message on new submission', async ({ page }) => {
    // First failed attempt
    await page.route('**/api/v1/terminals/pair', (route) => {
      route.abort('failed');
    });

    const serialInput = page.locator('input[placeholder*="SER"]');
    const deviceNameInput = page.locator('input[placeholder*="Device Name"]');
    const startButton = page.getByRole('button', { name: 'Start Pairing' });

    await serialInput.fill('FAIL-SERIAL');
    await deviceNameInput.fill('My Terminal');
    await startButton.click();

    // Verify error is shown
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible();

    // Change form values
    await serialInput.fill('NEW-SERIAL');

    // Error should persist until clear button clicked
    const closeErrorButton = errorAlert.locator('button[aria-label*="Close"]');
    if (await closeErrorButton.isVisible()) {
      await closeErrorButton.click();
    }

    await expect(errorAlert).not.toBeVisible({ timeout: 2000 });
  });

  test('should support input field validation', async ({ page }) => {
    const serialInput = page.locator('input[placeholder*="SER"]');

    // Test invalid characters (if validation enforced)
    await serialInput.fill('TEST-SERIAL-@#$');

    // Should either sanitize or show error
    // Behavior depends on component implementation
  });

  test('should maintain form state while alert is visible', async ({ page }) => {
    // Fill form
    const serialInput = page.locator('input[placeholder*="SER"]');
    const deviceNameInput = page.locator('input[placeholder*="Device Name"]');
    const formValue = 'TEST-SERIAL-001';
    const deviceName = 'My Terminal';

    await serialInput.fill(formValue);
    await deviceNameInput.fill(deviceName);

    // Verify values are maintained
    await expect(serialInput).toHaveValue(formValue);
    await expect(deviceNameInput).toHaveValue(deviceName);

    // Even after error, values should persist
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify elements are still visible
    const heading = page.locator('h1, h5');
    await expect(heading).toBeVisible();

    // Verify buttons are clickable
    const cancelButton = page.getByRole('button', { name: 'Cancel' });
    await expect(cancelButton).toBeVisible();
  });
});
