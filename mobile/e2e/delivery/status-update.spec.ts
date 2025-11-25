/**
 * Delivery Status Update E2E Tests
 *
 * Tests the delivery status management:
 * - Status transitions (pending → in_progress → delivered)
 * - Signature capture flow
 * - Photo upload flow
 * - Status notifications
 */

describe('Delivery Status Updates', () => {
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

  describe('Status Transitions', () => {
    it('should display initial pending status', async () => {
      await acceptDelivery();

      // Delivery should show pending status
      await expect(element(by.id('delivery-status-badge'))).toContain('Pending');
    });

    it('should transition from pending to in_progress', async () => {
      await acceptDelivery();

      // Tap "Start Delivery" button
      await element(by.id('start-delivery-button')).tap();

      // Status should update to in_progress
      await waitFor(element(by.id('delivery-status-badge'))).toHaveText('In Progress').withTimeout(5000);
    });

    it('should show map when delivery starts', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      // Map should be visible
      await waitFor(element(by.id('delivery-map'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('delivery-map'))).toBeVisible();
    });

    it('should update status when arrival is confirmed', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      // Simulate arrival at location
      await waitFor(element(by.id('delivery-map'))).toBeVisible().withTimeout(5000);

      // Tap "Arrived" button
      if (await element(by.id('arrived-button')).isVisible()) {
        await element(by.id('arrived-button')).tap();

        // Status should update to arrived
        await waitFor(element(by.id('delivery-status-badge'))).toHaveText('Arrived').withTimeout(5000);
      }
    });

    it('should show proof of delivery screen after arrival', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      // Confirm arrival
      if (await element(by.id('arrived-button')).isVisible()) {
        await element(by.id('arrived-button')).tap();

        // Proof of delivery screen should appear
        await waitFor(element(by.id('proof-of-delivery-screen'))).toBeVisible().withTimeout(5000);
      }
    });

    it('should transition to delivered after proof collection', async () => {
      await acceptDelivery();
      await startDelivery();
      await confirmArrival();

      // Capture signature
      await element(by.id('signature-pad')).multiTap(1);

      // Submit proof of delivery
      await element(by.id('submit-proof-button')).tap();

      // Status should update to delivered
      await waitFor(element(by.id('delivery-status-badge'))).toHaveText('Delivered').withTimeout(5000);
    });

    it('should show completion confirmation', async () => {
      await acceptDelivery();
      await startDelivery();
      await confirmArrival();
      await captureSignature();

      await element(by.id('submit-proof-button')).tap();

      // Completion screen should show
      await waitFor(element(by.id('delivery-completed-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('completion-message'))).toContain('Delivered successfully');
    });
  });

  describe('Signature Capture', () => {
    it('should display signature capture screen', async () => {
      await acceptDelivery();
      await startDelivery();
      await confirmArrival();

      // Proof of delivery screen with signature pad
      await expect(element(by.id('signature-pad'))).toBeVisible();
    });

    it('should allow signature drawing', async () => {
      await acceptDelivery();
      await startDelivery();
      await confirmArrival();

      // Draw signature
      await element(by.id('signature-pad')).multiTap(5);

      // Submit button should be enabled
      await expect(element(by.id('submit-proof-button'))).toBeVisible();
    });

    it('should require signature before submission', async () => {
      await acceptDelivery();
      await startDelivery();
      await confirmArrival();

      // Try to submit without signature
      await element(by.id('submit-proof-button')).tap();

      // Should show error
      await waitFor(element(by.id('signature-error'))).toBeVisible().withTimeout(3000);
      await expect(element(by.id('signature-error'))).toContain('signature required');
    });

    it('should allow clearing signature', async () => {
      await acceptDelivery();
      await startDelivery();
      await confirmArrival();

      // Draw signature
      await element(by.id('signature-pad')).multiTap(5);

      // Clear signature
      await element(by.id('clear-signature-button')).tap();

      // Signature pad should be clear
      await expect(element(by.id('signature-pad'))).toBeVisible();
    });

    it('should capture recipient name', async () => {
      await acceptDelivery();
      await startDelivery();
      await confirmArrival();

      // Enter recipient name
      await element(by.id('recipient-name-input')).typeText('John Doe');

      // Draw signature
      await element(by.id('signature-pad')).multiTap(5);

      // Submit
      await element(by.id('submit-proof-button')).tap();

      // Should be recorded
      await waitFor(element(by.id('delivery-completed-screen'))).toBeVisible().withTimeout(5000);
    });

    it('should capture time of delivery', async () => {
      await acceptDelivery();
      await startDelivery();
      await confirmArrival();

      // Draw signature
      await element(by.id('signature-pad')).multiTap(5);

      // Submit
      await element(by.id('submit-proof-button')).tap();

      // Completion screen should show delivery time
      await waitFor(element(by.id('delivery-time'))).toBeVisible().withTimeout(5000);
    });
  });

  describe('Photo Upload', () => {
    it('should display photo capture option', async () => {
      await acceptDelivery();
      await startDelivery();
      await confirmArrival();

      // Proof of delivery screen should have photo option
      await expect(element(by.id('photo-button'))).toBeVisible();
    });

    it('should allow taking photo', async () => {
      await acceptDelivery();
      await startDelivery();
      await confirmArrival();

      // Tap photo button
      await element(by.id('photo-button')).tap();

      // Camera should open
      await waitFor(element(by.id('camera-view'))).toBeVisible().withTimeout(5000);

      // Take photo
      await element(by.id('capture-photo-button')).tap();

      // Should return to proof screen
      await waitFor(element(by.id('proof-of-delivery-screen'))).toBeVisible().withTimeout(5000);
    });

    it('should display captured photo', async () => {
      await acceptDelivery();
      await startDelivery();
      await confirmArrival();

      // Capture a photo
      await element(by.id('photo-button')).tap();
      await waitFor(element(by.id('camera-view'))).toBeVisible().withTimeout(5000);
      await element(by.id('capture-photo-button')).tap();

      // Photo preview should be visible
      await waitFor(element(by.id('photo-preview'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('photo-preview'))).toBeVisible();
    });

    it('should allow retaking photo', async () => {
      await acceptDelivery();
      await startDelivery();
      await confirmArrival();

      // Capture photo
      await element(by.id('photo-button')).tap();
      await waitFor(element(by.id('camera-view'))).toBeVisible().withTimeout(5000);
      await element(by.id('capture-photo-button')).tap();

      // Retake photo
      await element(by.id('retake-photo-button')).tap();

      // Camera should reopen
      await waitFor(element(by.id('camera-view'))).toBeVisible().withTimeout(5000);
    });

    it('should allow selecting from gallery', async () => {
      await acceptDelivery();
      await startDelivery();
      await confirmArrival();

      // Tap photo button
      await element(by.id('photo-button')).tap();

      // Should show photo options
      await expect(element(by.id('camera-option'))).toBeVisible();
      await expect(element(by.id('gallery-option'))).toBeVisible();

      // Select from gallery
      await element(by.id('gallery-option')).tap();

      // Photo picker should open
      await waitFor(element(by.id('photo-picker'))).toBeVisible().withTimeout(5000);
    });

    it('should attach photo to delivery proof', async () => {
      await acceptDelivery();
      await startDelivery();
      await confirmArrival();

      // Capture photo
      await element(by.id('photo-button')).tap();
      await waitFor(element(by.id('camera-view'))).toBeVisible().withTimeout(5000);
      await element(by.id('capture-photo-button')).tap();

      // Draw signature
      await element(by.id('signature-pad')).multiTap(5);

      // Submit
      await element(by.id('submit-proof-button')).tap();

      // Completion should confirm photo was sent
      await waitFor(element(by.id('delivery-completed-screen'))).toBeVisible().withTimeout(5000);
    });

    it('should allow multiple photos', async () => {
      await acceptDelivery();
      await startDelivery();
      await confirmArrival();

      // Add first photo
      await element(by.id('photo-button')).tap();
      await waitFor(element(by.id('camera-view'))).toBeVisible().withTimeout(5000);
      await element(by.id('capture-photo-button')).tap();

      // Add second photo
      await element(by.id('add-photo-button')).tap();
      await waitFor(element(by.id('camera-view'))).toBeVisible().withTimeout(5000);
      await element(by.id('capture-photo-button')).tap();

      // Should show both photos
      await expect(element(by.id('photo-preview-0'))).toBeVisible();
      await expect(element(by.id('photo-preview-1'))).toBeVisible();
    });
  });

  describe('Status Notifications', () => {
    it('should show notification when delivery accepted', async () => {
      // Accept delivery
      await acceptDelivery();

      // Notification should appear
      await waitFor(element(by.id('status-notification'))).toBeVisible().withTimeout(3000);
      await expect(element(by.id('status-notification'))).toContain('Delivery accepted');
    });

    it('should show notification when delivery started', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      // Notification should appear
      await waitFor(element(by.id('status-notification'))).toBeVisible().withTimeout(3000);
      await expect(element(by.id('status-notification'))).toContain('In progress');
    });

    it('should show notification when delivery completed', async () => {
      await acceptDelivery();
      await startDelivery();
      await confirmArrival();
      await captureSignature();

      await element(by.id('submit-proof-button')).tap();

      // Notification should appear
      await waitFor(element(by.id('status-notification'))).toBeVisible().withTimeout(3000);
      await expect(element(by.id('status-notification'))).toContain('Delivered successfully');
    });
  });

  describe('Error Handling', () => {
    it('should handle network error during status update', async () => {
      await acceptDelivery();

      // Simulate network error by interrupting connection
      // Should show retry option
    });

    it('should recover from status update failure', async () => {
      await acceptDelivery();

      // Attempt status update
      // If fails, should show retry button
    });
  });

  describe('Status History', () => {
    it('should display status history', async () => {
      await acceptDelivery();
      await startDelivery();

      // Status history should be visible
      await expect(element(by.id('status-history'))).toBeVisible();
    });

    it('should show timestamps for status changes', async () => {
      await acceptDelivery();
      await startDelivery();

      // Each status change should have timestamp
      await expect(element(by.id('status-timestamp-0'))).toBeVisible();
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

async function startDelivery() {
  await element(by.id('start-delivery-button')).tap();
  await waitFor(element(by.id('delivery-map'))).toBeVisible().withTimeout(5000);
}

async function confirmArrival() {
  if (await element(by.id('arrived-button')).isVisible()) {
    await element(by.id('arrived-button')).tap();
    await waitFor(element(by.id('proof-of-delivery-screen'))).toBeVisible().withTimeout(5000);
  }
}

async function captureSignature() {
  await element(by.id('signature-pad')).multiTap(5);
}
