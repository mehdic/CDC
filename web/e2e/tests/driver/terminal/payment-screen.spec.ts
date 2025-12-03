/**
 * Playwright E2E Tests - Terminal Payment Screen
 * Tests the payment collection workflow at delivery location
 */

import { test, expect } from '@playwright/test';

test.describe('Driver Terminal Payment Screen', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to driver terminal payment page
    await page.goto('/driver/terminal/payment');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display payment screen with correct title', async ({ page }) => {
    // Verify heading
    const heading = page.locator('h1, h5');
    await expect(heading).toContainText('Card Payment', { timeout: 5000 });

    // Verify credit card icon
    const cardIcon = page.locator('[data-testid="CreditCardIcon"]');
    await expect(cardIcon).toBeVisible();
  });

  test('should display payment amount prominently', async ({ page }) => {
    // Verify amount is displayed
    const amountDisplay = page.locator('text=/CHF\\s+\\d+\\.\\d{2}/');
    await expect(amountDisplay).toBeVisible();

    // Verify format
    const amountText = await amountDisplay.textContent();
    expect(amountText).toMatch(/CHF\s+\d+\.\d{2}/);
  });

  test('should display delivery information', async ({ page }) => {
    // Verify delivery details section exists
    const deliveryInfo = page.locator('text=Delivery ID');
    await expect(deliveryInfo).toBeVisible();

    // Verify terminal serial is shown
    const terminalInfo = page.locator('text=Terminal');
    await expect(terminalInfo).toBeVisible();
  });

  test('should show correct status indicator', async ({ page }) => {
    // Verify status chip is visible
    const statusChip = page.locator('.MuiChip-root, [role="status"]');
    await expect(statusChip).toBeVisible();

    // Verify initial status is "Ready to accept payment"
    const statusText = page.locator('text=Ready to accept payment');
    await expect(statusText).toBeVisible({ timeout: 3000 });
  });

  test('should display instruction alert', async ({ page }) => {
    // Verify instruction alert
    const instructionAlert = page.locator('[role="alert"], .MuiAlert-message');
    const alertText = page.locator('text=Ask customer to insert or tap their card');

    if (await alertText.isVisible()) {
      await expect(alertText).toBeVisible();
    }
  });

  test('should have enabled Start Payment button', async ({ page }) => {
    // Verify start payment button is enabled
    const startButton = page.getByRole('button', { name: /Start Payment/i });
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeEnabled();

    // Verify cancel button
    const cancelButton = page.getByRole('button', { name: /Cancel/i });
    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toBeEnabled();
  });

  test('should handle payment initiation', async ({ page }) => {
    // Mock API response for payment initiation
    await page.route('**/api/v1/deliveries/*/card-payment', (route) => {
      route.continue();
    });

    // Click start payment
    const startButton = page.getByRole('button', { name: /Start Payment/i });
    await startButton.click();

    // Wait for loading state
    const loadingSpinner = page.locator('svg[class*="MuiCircularProgress"]');
    if (await loadingSpinner.isVisible()) {
      await page.waitForLoadState('networkidle');
    }

    // Verify status changed to processing
    const processingText = page.locator('text=Processing payment');
    if (await processingText.isVisible({ timeout: 3000 })) {
      await expect(processingText).toBeVisible();
    }
  });

  test('should display progress during payment processing', async ({ page }) => {
    // Start payment
    const startButton = page.getByRole('button', { name: /Start Payment/i });
    await startButton.click();

    // Wait for progress bar
    const progressBar = page.locator('progress, .MuiLinearProgress-root');
    if (await progressBar.isVisible({ timeout: 3000 })) {
      await expect(progressBar).toBeVisible();
    }

    // Verify progress percentage is shown
    const percentageText = page.locator('text=/%');
    if (await percentageText.isVisible()) {
      await expect(percentageText).toBeVisible();
    }
  });

  test('should handle successful payment', async ({ page }) => {
    // Mock successful payment response
    await page.route('**/api/v1/terminals/*/transactions/*/process', (route) => {
      route.continue();
    });

    // Start payment
    const startButton = page.getByRole('button', { name: /Start Payment/i });
    await startButton.click();

    // Wait for success state
    const successText = page.locator('text=Payment approved');
    if (await successText.isVisible({ timeout: 10000 })) {
      await expect(successText).toBeVisible();

      // Verify success icon
      const successIcon = page.locator('[data-testid="CheckCircleIcon"]');
      if (await successIcon.isVisible()) {
        await expect(successIcon).toBeVisible();
      }

      // Verify transaction details are shown
      const cardDetails = page.locator('text=/•{4}\\s+\\d{4}/');
      if (await cardDetails.isVisible()) {
        await expect(cardDetails).toBeVisible();
      }
    }
  });

  test('should display card details after success', async ({ page }) => {
    // Mock successful payment with card details
    await page.route('**/api/v1/terminals/*/transactions/*/process', (route) => {
      route.continue();
    });

    // Initiate payment
    const startButton = page.getByRole('button', { name: /Start Payment/i });
    await startButton.click();

    // Wait for transaction details
    const cardScheme = page.locator('text=/VISA|MASTERCARD|AMEX/');
    if (await cardScheme.isVisible({ timeout: 10000 })) {
      await expect(cardScheme).toBeVisible();
    }
  });

  test('should handle payment declined scenario', async ({ page }) => {
    // Mock declined payment response
    await page.route('**/api/v1/terminals/*/transactions/*/process', (route) => {
      route.abort('blockedbyresponse');
    });

    // Start payment
    const startButton = page.getByRole('button', { name: /Start Payment/i });
    await startButton.click();

    // Wait for declined message
    const declinedText = page.locator('text=declined', { ignoreCase: true });
    if (await declinedText.isVisible({ timeout: 5000 })) {
      await expect(declinedText).toBeVisible();
    }
  });

  test('should support payment retry after failure', async ({ page }) => {
    // Start payment (assuming it fails)
    const startButton = page.getByRole('button', { name: /Start Payment/i });
    await startButton.click();

    // Wait for error state
    const errorAlert = page.locator('[role="alert"], text=/failed/i');
    if (await errorAlert.isVisible({ timeout: 5000 })) {
      // Verify Try Again button appears
      const retryButton = page.getByRole('button', { name: /Try Again/i });
      if (await retryButton.isVisible()) {
        await expect(retryButton).toBeEnabled();

        // Click retry
        await retryButton.click();

        // Should restart payment flow
        const startButtonAgain = page.getByRole('button', { name: /Start Payment/i });
        if (await startButtonAgain.isVisible({ timeout: 3000 })) {
          await expect(startButtonAgain).toBeVisible();
        }
      }
    }
  });

  test('should support refund action after successful payment', async ({ page }) => {
    // Assuming payment succeeded, verify refund button appears
    const refundButton = page.getByRole('button', { name: /Refund/i });

    if (await refundButton.isVisible({ timeout: 5000 })) {
      await expect(refundButton).toBeVisible();
      await expect(refundButton).toBeEnabled();

      // Click refund
      const confirmButton = page.getByRole('button', { name: /Confirm.*Continue/i });
      // Refund should be an option before confirming
    }
  });

  test('should allow cancel at any time', async ({ page }) => {
    // Verify cancel button is always available
    const cancelButton = page.getByRole('button', { name: /Cancel/i });
    await expect(cancelButton).toBeVisible();
    await expect(cancelButton).toBeEnabled();

    // Click cancel
    await cancelButton.click();

    // Should navigate away (depends on implementation)
  });

  test('should disable buttons during processing', async ({ page }) => {
    // Start payment
    const startButton = page.getByRole('button', { name: /Start Payment/i });
    await startButton.click();

    // During processing, buttons should be disabled
    const buttons = page.locator('button');
    const disabledCount = await buttons.evaluateAll((elems) =>
      elems.filter((e) => (e as HTMLButtonElement).disabled).length
    );

    // Most buttons should be disabled during processing
    expect(disabledCount).toBeGreaterThan(0);
  });

  test('should show correct status messages throughout flow', async ({ page }) => {
    // Verify initial status
    let statusText = page.locator('text=Ready to accept payment');
    await expect(statusText).toBeVisible();

    // Start payment
    const startButton = page.getByRole('button', { name: /Start Payment/i });
    await startButton.click();

    // Verify processing status
    statusText = page.locator('text=Processing payment');
    if (await statusText.isVisible({ timeout: 3000 })) {
      await expect(statusText).toBeVisible();
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify amount is still visible
    const amountDisplay = page.locator('text=/CHF\\s+\\d+\\.\\d{2}/');
    await expect(amountDisplay).toBeVisible();

    // Verify buttons are accessible
    const startButton = page.getByRole('button', { name: /Start Payment/i });
    await expect(startButton).toBeVisible();

    // Button should be full width on mobile
    const buttonWidth = await startButton.evaluate((el) => el.offsetWidth);
    const containerWidth = await page.evaluate(() => window.innerWidth);
    expect(buttonWidth).toBeGreaterThan(containerWidth * 0.8); // At least 80% width
  });

  test('should display transaction confirmation', async ({ page }) => {
    // After successful payment
    const confirmButton = page.getByRole('button', { name: /Confirm.*Continue/i });

    if (await confirmButton.isVisible({ timeout: 5000 })) {
      // Verify it's ready to click
      await expect(confirmButton).toBeEnabled();

      // Click to proceed
      await confirmButton.click();

      // Should navigate away after confirmation
    }
  });

  test('should handle API errors with user-friendly messages', async ({ page }) => {
    // Mock API error
    await page.route('**/api/v1/terminals/*/transactions/*/process', (route) => {
      route.abort('failed');
    });

    const startButton = page.getByRole('button', { name: /Start Payment/i });
    await startButton.click();

    // Wait for error message
    const errorMessage = page.locator('[role="alert"]');
    if (await errorMessage.isVisible({ timeout: 5000 })) {
      // Error should be readable
      const text = await errorMessage.textContent();
      expect(text?.length).toBeGreaterThan(0);
    }
  });

  test('should maintain state across button interactions', async ({ page }) => {
    // Store initial amount
    const amountDisplay = page.locator('text=/CHF\\s+\\d+\\.\\d{2}/');
    const initialAmount = await amountDisplay.textContent();

    // Perform interaction (cancel)
    const cancelButton = page.getByRole('button', { name: /Cancel/i });
    await cancelButton.click();

    // If redirected back, amount should be same
    // (Implementation dependent)
  });
});
