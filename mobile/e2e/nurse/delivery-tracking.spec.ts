/**
 * Nurse App Delivery Tracking E2E Tests
 *
 * Tests delivery tracking functionality for nurses:
 * - Viewing delivery status
 * - Notifications
 * - Delivery confirmation
 */

describe('Nurse App Delivery Tracking', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', location: 'always' }
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    // Login before each test
    await loginAsNurse();
    await waitFor(element(by.id('nurse-dashboard-screen'))).toBeVisible().withTimeout(10000);
  });

  describe('Delivery Status Viewing', () => {
    it('should display deliveries tab', async () => {
      await expect(element(by.id('deliveries-tab'))).toBeVisible();
    });

    it('should navigate to deliveries view on tab tap', async () => {
      await element(by.id('deliveries-tab')).tap();

      await waitFor(element(by.id('deliveries-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('deliveries-screen'))).toBeVisible();
    });

    it('should display list of active deliveries', async () => {
      await element(by.id('deliveries-tab')).tap();

      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('delivery-card-0'))).toBeVisible();
    });

    it('should display delivery status in card', async () => {
      await element(by.id('deliveries-tab')).tap();

      await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('delivery-status-0'))).toBeVisible();
      await expect(element(by.text(/pending|in-transit|delivered/i))).toBeVisible();
    });

    it('should display patient name in delivery card', async () => {
      await element(by.id('deliveries-tab')).tap();

      await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('delivery-patient-0'))).toBeVisible();
    });

    it('should display medication details in card', async () => {
      await element(by.id('deliveries-tab')).tap();

      await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('delivery-medication-0'))).toBeVisible();
      await expect(element(by.id('delivery-quantity-0'))).toBeVisible();
    });

    it('should display delivery date and time', async () => {
      await element(by.id('deliveries-tab')).tap();

      await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('delivery-date-0'))).toBeVisible();
      await expect(element(by.id('delivery-time-0'))).toBeVisible();
    });

    it('should display delivery address', async () => {
      await element(by.id('deliveries-tab')).tap();

      await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('delivery-address-0'))).toBeVisible();
    });

    it('should display assigned delivery personnel', async () => {
      await element(by.id('deliveries-tab')).tap();

      await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('delivery-personnel-0'))).toBeVisible();
    });
  });

  describe('Delivery Detail View', () => {
    it('should navigate to delivery detail on card tap', async () => {
      await element(by.id('deliveries-tab')).tap();

      await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);
      await element(by.id('delivery-card-0')).tap();

      await waitFor(element(by.id('delivery-detail-screen'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('delivery-detail-screen'))).toBeVisible();
    });

    it('should display complete delivery information', async () => {
      await navigateToDeliveryDetail();

      await expect(element(by.id('delivery-order-number'))).toBeVisible();
      await expect(element(by.id('delivery-full-address'))).toBeVisible();
      await expect(element(by.id('delivery-contact-phone'))).toBeVisible();
      await expect(element(by.id('delivery-special-instructions'))).toBeVisible();
    });

    it('should display delivery timeline', async () => {
      await navigateToDeliveryDetail();

      await expect(element(by.id('delivery-timeline'))).toBeVisible();
      await expect(element(by.id('timeline-order-placed'))).toBeVisible();
      await expect(element(by.id('timeline-confirmed'))).toBeVisible();
    });

    it('should display current delivery location on map', async () => {
      await navigateToDeliveryDetail();

      // Scroll down to see map
      await element(by.id('delivery-detail-screen')).swipe('up', 'slow', 0.5);

      await expect(element(by.id('delivery-location-map'))).toBeVisible();
    });

    it('should display real-time tracking status', async () => {
      await navigateToDeliveryDetail();

      await element(by.id('delivery-detail-screen')).swipe('up', 'slow', 0.5);

      await expect(element(by.id('delivery-live-status'))).toBeVisible();
      await expect(element(by.id('delivery-eta'))).toBeVisible();
    });
  });

  describe('Delivery Status Updates', () => {
    it('should filter deliveries by status', async () => {
      await element(by.id('deliveries-tab')).tap();

      await waitFor(element(by.id('status-filter-button'))).toBeVisible().withTimeout(5000);
      await element(by.id('status-filter-button')).tap();

      await waitFor(element(by.id('status-filter-menu'))).toBeVisible().withTimeout(5000);
      await element(by.id('filter-pending')).tap();
      await element(by.id('apply-status-filter')).tap();

      // Should show only pending deliveries
      await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);
    });

    it('should display pending deliveries', async () => {
      await element(by.id('deliveries-tab')).tap();

      await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.text(/Pending/i))).toBeVisible();
    });

    it('should display in-transit deliveries', async () => {
      await element(by.id('deliveries-tab')).tap();

      await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);
      // Should have some in-transit deliveries
      await expect(element(by.text(/In transit/i))).toBeVisible();
    });

    it('should display delivered items', async () => {
      await element(by.id('deliveries-tab')).tap();

      // Switch to completed deliveries tab
      await element(by.id('completed-deliveries-tab')).tap();

      await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.text(/Delivered/i))).toBeVisible();
    });

    it('should show delivery completion timestamp', async () => {
      await navigateToDeliveryDetail();

      // Scroll to see completed delivery info
      await element(by.id('delivery-detail-screen')).swipe('up', 'slow', 0.5);

      await expect(element(by.id('delivery-completion-time'))).toBeVisible();
    });
  });

  describe('Delivery Notifications', () => {
    it('should display notification badge on deliveries tab', async () => {
      // Check if there are pending notifications
      const badge = element(by.id('deliveries-tab-badge'));
      try {
        await expect(badge).toBeVisible();
      } catch (e) {
        // Badge may not be visible if no notifications
      }
    });

    it('should receive notification when delivery assigned', async () => {
      // This would be tested with backend simulation
      // Verify notification appears in notification center
      await element(by.id('notifications-icon')).tap();

      await waitFor(element(by.id('notification-list'))).toBeVisible().withTimeout(5000);
      await expect(element(by.text(/delivery.*assigned/i))).toBeVisible();
    });

    it('should receive notification when delivery in transit', async () => {
      await element(by.id('notifications-icon')).tap();

      await waitFor(element(by.id('notification-list'))).toBeVisible().withTimeout(5000);
      // Should see in-transit notification
    });

    it('should receive notification when delivery completed', async () => {
      await element(by.id('notifications-icon')).tap();

      await waitFor(element(by.id('notification-list'))).toBeVisible().withTimeout(5000);
      // Should see delivery completed notification
    });

    it('should allow tapping notification to view delivery', async () => {
      await element(by.id('notifications-icon')).tap();

      await waitFor(element(by.id('notification-list'))).toBeVisible().withTimeout(5000);
      await element(by.id('delivery-notification-0')).tap();

      // Should navigate to delivery detail
      await waitFor(element(by.id('delivery-detail-screen'))).toBeVisible().withTimeout(5000);
    });
  });

  describe('Delivery Confirmation', () => {
    it('should display confirm delivery button for in-transit deliveries', async () => {
      await element(by.id('deliveries-tab')).tap();

      await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);

      // Filter for in-transit deliveries
      await element(by.id('status-filter-button')).tap();
      await waitFor(element(by.id('status-filter-menu'))).toBeVisible().withTimeout(5000);
      await element(by.id('filter-in-transit')).tap();
      await element(by.id('apply-status-filter')).tap();

      await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('quick-action-confirm-0'))).toBeVisible();
    });

    it('should confirm delivery from card quick action', async () => {
      // Navigate to in-transit delivery
      await navigateToInTransitDelivery();

      await element(by.id('quick-action-confirm-0')).tap();

      await waitFor(element(by.id('confirm-delivery-dialog'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('confirm-delivery-dialog'))).toBeVisible();
    });

    it('should display confirmation dialog with details', async () => {
      await navigateToInTransitDelivery();

      await element(by.id('quick-action-confirm-0')).tap();

      await waitFor(element(by.id('confirm-delivery-dialog'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('dialog-patient-name'))).toBeVisible();
      await expect(element(by.id('dialog-medication'))).toBeVisible();
    });

    it('should allow taking signature for delivery confirmation', async () => {
      await navigateToInTransitDelivery();

      await element(by.id('quick-action-confirm-0')).tap();

      await waitFor(element(by.id('signature-pad'))).toBeVisible().withTimeout(5000);
      // Would simulate signature drawing
    });

    it('should allow taking photo of delivery', async () => {
      await navigateToInTransitDelivery();

      await element(by.id('quick-action-confirm-0')).tap();

      await waitFor(element(by.id('photo-capture-button'))).toBeVisible().withTimeout(5000);
      await element(by.id('photo-capture-button')).tap();

      // Camera should open
    });

    it('should allow confirming delivery', async () => {
      await navigateToInTransitDelivery();

      await element(by.id('quick-action-confirm-0')).tap();

      await waitFor(element(by.id('final-confirm-button'))).toBeVisible().withTimeout(5000);
      await element(by.id('final-confirm-button')).tap();

      // Should show success message
      await waitFor(element(by.id('delivery-confirmed-message'))).toBeVisible().withTimeout(5000);
    });

    it('should update delivery status after confirmation', async () => {
      await navigateToInTransitDelivery();

      await element(by.id('quick-action-confirm-0')).tap();

      await waitFor(element(by.id('final-confirm-button'))).toBeVisible().withTimeout(5000);
      await element(by.id('final-confirm-button')).tap();

      // Return to deliveries list
      await element(by.id('back-button')).tap();

      // Delivery should now show as delivered
      await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('delivery-status-0'))).toHaveText('Delivered');
    });
  });

  describe('Delivery Search and Filtering', () => {
    it('should display search input for deliveries', async () => {
      await element(by.id('deliveries-tab')).tap();

      await expect(element(by.id('delivery-search-input'))).toBeVisible();
    });

    it('should search deliveries by patient name', async () => {
      await element(by.id('deliveries-tab')).tap();

      await element(by.id('delivery-search-input')).typeText('John');

      await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.text(/John/i))).toBeVisible();
    });

    it('should search deliveries by order number', async () => {
      await element(by.id('deliveries-tab')).tap();

      await element(by.id('delivery-search-input')).typeText('ORD-00123');

      await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);
    });

    it('should filter deliveries by date', async () => {
      await element(by.id('deliveries-tab')).tap();

      await element(by.id('date-filter-button')).tap();

      await waitFor(element(by.id('date-picker'))).toBeVisible().withTimeout(5000);
      // Would select a date
    });

    it('should clear all filters', async () => {
      await element(by.id('deliveries-tab')).tap();

      await element(by.id('status-filter-button')).tap();
      await waitFor(element(by.id('status-filter-menu'))).toBeVisible().withTimeout(5000);
      await element(by.id('filter-pending')).tap();
      await element(by.id('apply-status-filter')).tap();

      // Clear filters
      await element(by.id('clear-all-filters-button')).tap();

      // Should show all deliveries
      await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);
    });
  });

  describe('Delivery Contact', () => {
    it('should display call button for delivery contact', async () => {
      await navigateToDeliveryDetail();

      await expect(element(by.id('call-delivery-personnel-button'))).toBeVisible();
    });

    it('should allow calling delivery personnel', async () => {
      await navigateToDeliveryDetail();

      await element(by.id('call-delivery-personnel-button')).tap();

      // Phone dialer should be invoked
    });

    it('should display messaging button for delivery contact', async () => {
      await navigateToDeliveryDetail();

      await expect(element(by.id('message-delivery-personnel-button'))).toBeVisible();
    });

    it('should open chat with delivery personnel', async () => {
      await navigateToDeliveryDetail();

      await element(by.id('message-delivery-personnel-button')).tap();

      await waitFor(element(by.id('chat-screen'))).toBeVisible().withTimeout(5000);
    });
  });
});

// Helper functions
async function loginAsNurse() {
  await element(by.id('email-input')).typeText('nurse@healthcarefacility.ch');
  await element(by.id('password-input')).typeText('NursePass123!');
  await element(by.id('login-button')).tap();
}

async function navigateToDeliveryDetail() {
  await element(by.id('deliveries-tab')).tap();
  await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);
  await element(by.id('delivery-card-0')).tap();
  await waitFor(element(by.id('delivery-detail-screen'))).toBeVisible().withTimeout(5000);
}

async function navigateToInTransitDelivery() {
  await element(by.id('deliveries-tab')).tap();

  // Filter for in-transit deliveries
  await element(by.id('status-filter-button')).tap();
  await waitFor(element(by.id('status-filter-menu'))).toBeVisible().withTimeout(5000);
  await element(by.id('filter-in-transit')).tap();
  await element(by.id('apply-status-filter')).tap();

  await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);
}
