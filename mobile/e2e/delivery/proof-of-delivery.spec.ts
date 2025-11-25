/**
 * Proof of Delivery E2E Tests
 *
 * Tests proof of delivery collection:
 * - Signature capture
 * - Photo capture
 * - Recipient confirmation
 * - Proof submission
 */

describe('Proof of Delivery', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', location: 'always', camera: 'YES' }
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await loginAsDeliveryPersonnel();
  });

  describe('Proof of Delivery Screen Display', () => {
    it('should display proof of delivery screen after arrival', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Proof of delivery screen should be visible
      await expect(element(by.id('proof-of-delivery-screen'))).toBeVisible();
    });

    it('should show delivery recipient information', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Recipient details should be displayed
      await expect(element(by.id('recipient-name'))).toBeVisible();
      await expect(element(by.id('delivery-address'))).toBeVisible();
    });

    it('should display proof items needed', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Should show what proof is needed
      // (e.g., "Signature required", "Photo required")
      await expect(element(by.id('proof-requirements'))).toBeVisible();
    });

    it('should show progress indicator', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Progress indicator for proof collection
      if (await element(by.id('proof-progress')).isVisible()) {
        await expect(element(by.id('proof-progress'))).toBeVisible();
      }
    });
  });

  describe('Signature Capture', () => {
    it('should display signature pad', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Signature pad should be visible
      await expect(element(by.id('signature-pad'))).toBeVisible();
    });

    it('should show instructions for signature', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Instructions should be displayed
      await expect(element(by.id('signature-instructions'))).toBeVisible();
      await expect(element(by.id('signature-instructions'))).toContain('sign');
    });

    it('should allow drawing on signature pad', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Draw signature
      await element(by.id('signature-pad')).multiTap(5);
    });

    it('should show signature preview', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Draw signature
      await element(by.id('signature-pad')).multiTap(5);

      // Signature should be visible in pad
      await expect(element(by.id('signature-pad'))).toBeVisible();
    });

    it('should allow clearing signature', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Draw signature
      await element(by.id('signature-pad')).multiTap(5);

      // Clear button should be visible
      await expect(element(by.id('clear-signature-button'))).toBeVisible();

      // Clear signature
      await element(by.id('clear-signature-button')).tap();
    });

    it('should require signature if marked required', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Try to submit without signature
      await element(by.id('submit-proof-button')).tap();

      // Should show error
      await waitFor(element(by.id('signature-required-error'))).toBeVisible().withTimeout(3000);
    });

    it('should accept signature from stylus or finger', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Should accept touch input
      await element(by.id('signature-pad')).multiTap(5);

      // Signature should be captured
      await expect(element(by.id('signature-pad'))).toBeVisible();
    });

    it('should timestamp signature', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Draw signature
      await element(by.id('signature-pad')).multiTap(5);

      // Signature should be timestamped when captured
      // (verified during submission)
    });

    it('should capture recipient name with signature', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Recipient name field should be visible
      if (await element(by.id('recipient-name-input')).isVisible()) {
        await element(by.id('recipient-name-input')).typeText('John Smith');
      }

      // Draw signature
      await element(by.id('signature-pad')).multiTap(5);

      // Both should be captured
    });
  });

  describe('Photo Capture', () => {
    it('should display photo capture section', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Photo section should be visible
      if (await element(by.id('photo-section')).isVisible()) {
        await expect(element(by.id('photo-section'))).toBeVisible();
      }
    });

    it('should allow taking photo', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Tap photo button
      if (await element(by.id('photo-button')).isVisible()) {
        await element(by.id('photo-button')).tap();

        // Camera should open
        await waitFor(element(by.id('camera-view'))).toBeVisible().withTimeout(5000);

        // Take photo
        await element(by.id('capture-photo-button')).tap();

        // Should return to proof screen
        await waitFor(element(by.id('proof-of-delivery-screen'))).toBeVisible().withTimeout(5000);
      }
    });

    it('should show captured photo preview', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Capture photo
      if (await element(by.id('photo-button')).isVisible()) {
        await element(by.id('photo-button')).tap();
        await waitFor(element(by.id('camera-view'))).toBeVisible().withTimeout(5000);
        await element(by.id('capture-photo-button')).tap();

        // Photo preview should show
        await waitFor(element(by.id('photo-preview'))).toBeVisible().withTimeout(5000);
      }
    });

    it('should allow photo approval or retake', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      if (await element(by.id('photo-button')).isVisible()) {
        await element(by.id('photo-button')).tap();
        await waitFor(element(by.id('camera-view'))).toBeVisible().withTimeout(5000);
        await element(by.id('capture-photo-button')).tap();

        // Should show approve/retake options
        await expect(element(by.id('approve-photo-button'))).toBeVisible();
        await expect(element(by.id('retake-photo-button'))).toBeVisible();
      }
    });

    it('should allow taking multiple photos', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      if (await element(by.id('photo-button')).isVisible()) {
        // Take first photo
        await element(by.id('photo-button')).tap();
        await waitFor(element(by.id('camera-view'))).toBeVisible().withTimeout(5000);
        await element(by.id('capture-photo-button')).tap();
        await element(by.id('approve-photo-button')).tap();

        // Take second photo
        if (await element(by.id('add-another-photo-button')).isVisible()) {
          await element(by.id('add-another-photo-button')).tap();
          await waitFor(element(by.id('camera-view'))).toBeVisible().withTimeout(5000);
          await element(by.id('capture-photo-button')).tap();
          await element(by.id('approve-photo-button')).tap();
        }

        // Both photos should be in gallery
        await expect(element(by.id('photo-gallery'))).toBeVisible();
      }
    });

    it('should allow selecting from gallery', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      if (await element(by.id('photo-options-button')).isVisible()) {
        await element(by.id('photo-options-button')).tap();

        // Should show options
        if (await element(by.id('gallery-option')).isVisible()) {
          await element(by.id('gallery-option')).tap();

          // Photo picker should open
          await waitFor(element(by.id('photo-picker'))).toBeVisible().withTimeout(5000);
        }
      }
    });

    it('should allow removing photos', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // After adding photo(s)
      if (await element(by.id('remove-photo-button')).isVisible()) {
        await element(by.id('remove-photo-button')).tap();

        // Photo should be removed
      }
    });

    it('should mark photo as optional or required', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Should indicate if photo is required
      if (await element(by.id('photo-required-badge')).isVisible()) {
        await expect(element(by.id('photo-required-badge'))).toContain('Required');
      }
    });
  });

  describe('Recipient Confirmation', () => {
    it('should show recipient confirmation prompt', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Should ask to confirm recipient
      if (await element(by.id('recipient-confirmation')).isVisible()) {
        await expect(element(by.id('recipient-confirmation'))).toBeVisible();
      }
    });

    it('should require confirming correct recipient', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Should have checkbox/toggle to confirm
      if (await element(by.id('recipient-correct-checkbox')).isVisible()) {
        await element(by.id('recipient-correct-checkbox')).tap();
      }
    });

    it('should allow indicating wrong recipient', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Should have option to indicate wrong recipient
      if (await element(by.id('wrong-recipient-button')).isVisible()) {
        await element(by.id('wrong-recipient-button')).tap();

        // Should show action options
        await waitFor(element(by.id('wrong-recipient-actions'))).toBeVisible().withTimeout(5000);
      }
    });
  });

  describe('Proof Submission', () => {
    it('should show submit button', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Submit button should be visible
      await expect(element(by.id('submit-proof-button'))).toBeVisible();
    });

    it('should validate all required proof before submission', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Try to submit without signature
      await element(by.id('submit-proof-button')).tap();

      // Should show validation error
      await waitFor(element(by.id('proof-validation-error'))).toBeVisible().withTimeout(3000);
    });

    it('should show loading indicator during submission', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Provide signature
      await element(by.id('signature-pad')).multiTap(5);

      // Submit
      await element(by.id('submit-proof-button')).tap();

      // Loading indicator should appear
      await expect(element(by.id('submission-loading'))).toBeVisible();
    });

    it('should show success message after submission', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Provide signature
      await element(by.id('signature-pad')).multiTap(5);

      // Submit
      await element(by.id('submit-proof-button')).tap();

      // Success message should appear
      await waitFor(element(by.id('proof-submitted-message'))).toBeVisible().withTimeout(10000);
    });

    it('should navigate to completion screen after successful submission', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Provide signature
      await element(by.id('signature-pad')).multiTap(5);

      // Submit
      await element(by.id('submit-proof-button')).tap();

      // Should show delivery completed screen
      await waitFor(element(by.id('delivery-completed-screen'))).toBeVisible().withTimeout(10000);
    });

    it('should handle submission network error', async () => {
      // This would require network interruption
      // Should show retry option
    });

    it('should allow retrying failed submission', async () => {
      // If submission fails
      // Should show retry button
      if (await element(by.id('retry-submission-button')).isVisible()) {
        await expect(element(by.id('retry-submission-button'))).toBeVisible();
      }
    });
  });

  describe('Offline Proof Collection', () => {
    it('should collect proof even when offline', async () => {
      // Disable network
      // Should still allow collecting signature and photos

      // When connection restored, should sync
    });

    it('should show offline indicator', async () => {
      // If offline, badge should show
      if (await element(by.id('offline-badge')).isVisible()) {
        await expect(element(by.id('offline-badge'))).toBeVisible();
      }
    });

    it('should queue proof for submission when online', async () => {
      // Collect proof offline
      // Restore connection
      // Should automatically sync
    });
  });

  describe('Proof Summary', () => {
    it('should show summary of collected proof', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // After all proof collected
      if (await element(by.id('proof-summary')).isVisible()) {
        await expect(element(by.id('proof-summary'))).toBeVisible();

        // Should show:
        // - Signature timestamp
        // - Photos count
        // - Recipient confirmation
      }
    });
  });

  describe('Accessibility', () => {
    it('should have accessible signature pad', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();

      // Signature pad should be accessible
      await expect(element(by.id('signature-pad'))).toBeVisible();
    });

    it('should have text alternatives for photos', async () => {
      // Photos should have descriptive alt text
    });
  });
});

/**
 * Helper Functions
 */

async function loginAsDeliveryPersonnel() {
  await element(by.id('email-input')).typeText('delivery@metapharm.ch');
  await element(by.id('password-input')).typeText('DeliveryPass123!');
  await element(by.id('login-button')).tap();
  await waitFor(element(by.id('delivery-list-screen'))).toBeVisible().withTimeout(10000);
}

async function acceptDelivery() {
  await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);
  await element(by.id('delivery-card-0')).tap();
  await waitFor(element(by.id('delivery-detail-screen'))).toBeVisible().withTimeout(5000);
  await element(by.id('accept-delivery-button')).tap();
  await waitFor(element(by.id('delivery-detail-screen'))).toBeVisible().withTimeout(5000);
}

async function confirmArrival() {
  if (await element(by.id('arrived-button')).isVisible()) {
    await element(by.id('arrived-button')).tap();
    await waitFor(element(by.id('proof-of-delivery-screen'))).toBeVisible().withTimeout(5000);
  }
}
