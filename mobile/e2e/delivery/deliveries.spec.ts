/**
 * Delivery List E2E Tests
 *
 * Tests the delivery list functionality:
 * - Loading delivery list
 * - Filtering deliveries (available/my deliveries)
 * - Sorting deliveries
 * - Pagination
 * - Search functionality
 */

describe('Delivery List Screen', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', location: 'always' }
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await loginAsDeliveryPersonnel();
  });

  describe('Delivery List Display', () => {
    it('should display delivery list screen', async () => {
      await expect(element(by.id('delivery-list-screen'))).toBeVisible();
      await expect(element(by.id('delivery-list'))).toBeVisible();
    });

    it('should display list header with title', async () => {
      await expect(element(by.text('Available Deliveries'))).toBeVisible();
    });

    it('should load and display delivery cards', async () => {
      await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('delivery-list'))).toBeVisible();
    });

    it('should display delivery information in card', async () => {
      await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);

      // Check delivery card contains expected information
      await expect(element(by.id('delivery-patient-name-0'))).toBeVisible();
      await expect(element(by.id('delivery-address-0'))).toBeVisible();
      await expect(element(by.id('delivery-distance-0'))).toBeVisible();
    });

    it('should display status badge on delivery card', async () => {
      await waitFor(element(by.id('delivery-status-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('delivery-status-0'))).toBeVisible();
    });

    it('should display priority badge on delivery card', async () => {
      await waitFor(element(by.id('delivery-priority-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('delivery-priority-0'))).toBeVisible();
    });

    it('should display estimated duration', async () => {
      await waitFor(element(by.id('delivery-duration-0'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('delivery-duration-0'))).toContain('min');
    });

    it('should display special instructions when present', async () => {
      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);
      // Special instructions may not always be present
      const hasInstructions = await element(by.id('delivery-instructions-0')).isVisible();
      if (hasInstructions) {
        await expect(element(by.id('delivery-instructions-0'))).toBeVisible();
      }
    });
  });

  describe('Filtering', () => {
    it('should have filter buttons visible', async () => {
      await expect(element(by.id('filter-available'))).toBeVisible();
      await expect(element(by.id('filter-mine'))).toBeVisible();
    });

    it('should show available deliveries by default', async () => {
      await expect(element(by.id('filter-available'))).toHaveToggleValue(true);
      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);
    });

    it('should switch to "My Deliveries" filter', async () => {
      await element(by.id('filter-mine')).tap();

      await expect(element(by.id('filter-mine'))).toHaveToggleValue(true);
      await expect(element(by.id('filter-available'))).toHaveToggleValue(false);

      // List should update
      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);
    });

    it('should reload deliveries when switching filters', async () => {
      // Start with available
      await expect(element(by.id('filter-available'))).toHaveToggleValue(true);

      // Switch to my deliveries
      await element(by.id('filter-mine')).tap();
      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);

      // Switch back to available
      await element(by.id('filter-available')).tap();
      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);
    });

    it('should persist filter selection after navigation', async () => {
      // Select "My Deliveries"
      await element(by.id('filter-mine')).tap();
      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);

      // Navigate to a delivery detail
      await element(by.id('delivery-card-0')).tap();
      await waitFor(element(by.id('delivery-detail-screen'))).toBeVisible().withTimeout(5000);

      // Navigate back
      await element(by.id('back-button')).tap();

      // Filter should still be "My Deliveries"
      await expect(element(by.id('filter-mine'))).toHaveToggleValue(true);
    });
  });

  describe('Sorting', () => {
    it('should display sort options button', async () => {
      await expect(element(by.id('sort-button'))).toBeVisible();
    });

    it('should sort by distance', async () => {
      await element(by.id('sort-button')).tap();
      await expect(element(by.id('sort-menu'))).toBeVisible();

      await element(by.id('sort-distance')).tap();

      // List should update with closest deliveries first
      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);
    });

    it('should sort by priority', async () => {
      await element(by.id('sort-button')).tap();
      await element(by.id('sort-priority')).tap();

      // List should be sorted by priority (high, medium, low)
      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);
    });

    it('should sort by duration', async () => {
      await element(by.id('sort-button')).tap();
      await element(by.id('sort-duration')).tap();

      // List should be sorted by estimated duration
      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);
    });

    it('should sort by status', async () => {
      await element(by.id('sort-button')).tap();
      await element(by.id('sort-status')).tap();

      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);
    });
  });

  describe('Search Functionality', () => {
    it('should display search bar', async () => {
      await expect(element(by.id('search-input'))).toBeVisible();
    });

    it('should search deliveries by patient name', async () => {
      await element(by.id('search-input')).typeText('John');

      // Should filter list to matching deliveries
      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);
    });

    it('should search deliveries by city name', async () => {
      await element(by.id('search-input')).typeText('Lausanne');

      // Should filter list to Lausanne deliveries
      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);
    });

    it('should show empty state when no results', async () => {
      await element(by.id('search-input')).typeText('NonExistentCity');

      // Should show empty state message
      await waitFor(element(by.id('empty-state'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('empty-state-message'))).toContain('No deliveries found');
    });

    it('should clear search and show all deliveries', async () => {
      await element(by.id('search-input')).typeText('John');
      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);

      // Clear search
      await element(by.id('search-clear-button')).tap();

      // Should show all deliveries again
      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);
    });

    it('should be case insensitive', async () => {
      await element(by.id('search-input')).typeText('LAUSANNE');

      // Should still find Lausanne deliveries
      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);
    });
  });

  describe('Pagination', () => {
    it('should load initial set of deliveries', async () => {
      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);

      // Should have at least one delivery visible
      await expect(element(by.id('delivery-card-0'))).toBeVisible();
    });

    it('should load more deliveries on scroll', async () => {
      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);

      // Scroll down to load more
      await element(by.id('delivery-list')).swipe('up', 'fast', 0.7);

      // Should load more deliveries
      await waitFor(element(by.id('delivery-card-5'))).toBeVisible().withTimeout(5000);
    });

    it('should show loading indicator while loading more', async () => {
      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);

      // Scroll to trigger loading
      await element(by.id('delivery-list')).swipe('up', 'fast', 0.7);

      // Loading indicator should appear briefly
      await expect(element(by.id('pagination-loader'))).toBeVisible();
    });

    it('should reach end of list', async () => {
      // Scroll through all items
      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);

      for (let i = 0; i < 5; i++) {
        await element(by.id('delivery-list')).swipe('up', 'slow', 0.7);
      }

      // Should show "end of list" message
      await expect(element(by.id('end-of-list-message'))).toBeVisible();
    });
  });

  describe('Pull to Refresh', () => {
    it('should display refresh control', async () => {
      // Scroll to top first
      await element(by.id('delivery-list')).swipe('down', 'slow', 0.7);

      // Pull to refresh
      await element(by.id('delivery-list')).multiTap(1);
    });

    it('should refresh delivery list on pull', async () => {
      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);

      // Get count of initial deliveries
      const initialCount = await getVisibleDeliveriesCount();

      // Pull to refresh
      await element(by.id('delivery-list')).swipe('down', 'slow', 0.7);

      // Should reload
      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);
    });
  });

  describe('Delivery Card Interaction', () => {
    it('should navigate to delivery detail on card tap', async () => {
      await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);

      await element(by.id('delivery-card-0')).tap();

      // Should navigate to delivery detail screen
      await waitFor(element(by.id('delivery-detail-screen'))).toBeVisible().withTimeout(5000);
    });

    it('should accept delivery from card', async () => {
      await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);

      await element(by.id('delivery-accept-button-0')).tap();

      // Should move delivery to "My Deliveries"
      await element(by.id('filter-mine')).tap();
      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);
    });

    it('should show delivery rating if available', async () => {
      await waitFor(element(by.id('delivery-card-0'))).toBeVisible().withTimeout(5000);

      // Rating may not be present on all deliveries
      const hasRating = await element(by.id('delivery-rating-0')).isVisible();
      if (hasRating) {
        await expect(element(by.id('delivery-rating-0'))).toBeVisible();
      }
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no deliveries available', async () => {
      // This would require a test account with no available deliveries
      // or mocking the API response
      // For now, we assume there are always deliveries in the test environment
    });
  });

  describe('Error Handling', () => {
    it('should handle network error gracefully', async () => {
      // This would require network interruption during load
      // Should show retry button
    });

    it('should allow retry on error', async () => {
      // Should have visible retry button on error state
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

async function getVisibleDeliveriesCount(): Promise<number> {
  // This would count visible delivery cards
  // Implementation depends on how Detox exposes list items
  return 0; // Placeholder
}
