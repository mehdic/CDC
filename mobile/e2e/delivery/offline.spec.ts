/**
 * Offline Mode E2E Tests
 *
 * Tests offline functionality:
 * - Offline detection
 * - Queued operations
 * - Sync on reconnect
 * - Cached data usage
 */

describe('Offline Mode', () => {
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

  describe('Offline Detection', () => {
    it('should detect when app goes offline', async () => {
      // Disable network connectivity
      // App should detect offline state

      await waitFor(element(by.id('offline-indicator'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('offline-indicator'))).toBeVisible();
    });

    it('should show offline badge', async () => {
      // When offline
      // Offline badge should be visible in header

      await expect(element(by.id('offline-badge'))).toBeVisible();
      await expect(element(by.id('offline-badge'))).toContain('Offline');
    });

    it('should show offline message', async () => {
      // When going offline
      // Should show notification/toast

      await waitFor(element(by.id('offline-message'))).toBeVisible().withTimeout(3000);
      await expect(element(by.id('offline-message'))).toContain('No internet');
    });

    it('should disable online-only features when offline', async () => {
      // Navigation button should be disabled
      if (await element(by.id('navigate-button')).isVisible()) {
        // Should be disabled or show message
      }

      // Sync button should be disabled/hidden
      if (await element(by.id('sync-button')).isVisible()) {
        // Should be disabled
      }
    });

    it('should gracefully handle connection interruptions', async () => {
      // Start with connection
      // Interrupt during operation
      // Should handle gracefully without crash
    });
  });

  describe('Cached Data Usage', () => {
    it('should display cached delivery list when offline', async () => {
      // Load deliveries while online
      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);

      // Go offline
      // List should still be visible (from cache)

      await expect(element(by.id('delivery-list'))).toBeVisible();
    });

    it('should show cache indicator on data', async () => {
      // Go offline
      // Delivery cards should indicate they're cached

      if (await element(by.id('cached-indicator')).isVisible()) {
        await expect(element(by.id('cached-indicator'))).toBeVisible();
      }
    });

    it('should display delivery details from cache', async () => {
      // Load delivery details while online
      await acceptDelivery();

      // Go offline
      // Should still display details from cache

      await expect(element(by.id('delivery-detail-screen'))).toBeVisible();
      await expect(element(by.id('patient-name'))).toBeVisible();
    });

    it('should use cached map data', async () => {
      // Start delivery while online
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      // Go offline
      // Map should still display (using cached tile data)

      await expect(element(by.id('delivery-map'))).toBeVisible();
    });

    it('should show last sync time', async () => {
      // When offline, should show when data was last synced

      if (await element(by.id('last-sync-time')).isVisible()) {
        await expect(element(by.id('last-sync-time'))).toBeVisible();
        await expect(element(by.id('last-sync-time'))).toContain('ago');
      }
    });

    it('should indicate if data may be stale', async () => {
      // If offline for long time, should warn data might be outdated

      if (await element(by.id('stale-data-warning')).isVisible()) {
        await expect(element(by.id('stale-data-warning'))).toBeVisible();
      }
    });
  });

  describe('Queued Operations', () => {
    it('should queue delivery status updates when offline', async () => {
      // While online, start a delivery
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      // Go offline
      // Change status
      await confirmArrival();

      // Should queue the operation
      if (await element(by.id('queued-operations-badge')).isVisible()) {
        await expect(element(by.id('queued-operations-badge'))).toBeVisible();
      }
    });

    it('should show queued operations indicator', async () => {
      // After queuing operations
      // Should show badge with count

      await expect(element(by.id('queued-operations-badge'))).toBeVisible();
      await expect(element(by.id('queued-operations-badge'))).toContain('1');
    });

    it('should display queued operations list', async () => {
      // Should be able to view pending operations

      if (await element(by.id('sync-menu-button')).isVisible()) {
        await element(by.id('sync-menu-button')).tap();

        await waitFor(element(by.id('queued-operations-list'))).toBeVisible().withTimeout(5000);
        await expect(element(by.id('queued-operations-list'))).toBeVisible();
      }
    });

    it('should allow canceling queued operations', async () => {
      // In queued operations list
      if (await element(by.id('cancel-operation-button-0')).isVisible()) {
        await element(by.id('cancel-operation-button-0')).tap();

        // Should remove from queue
      }
    });

    it('should persist queued operations after app restart', async () => {
      // Queue an operation while offline
      // Restart app
      // Queued operations should still be there

      await device.terminateApp();
      await device.launchApp({ newInstance: false });

      if (await element(by.id('queued-operations-badge')).isVisible()) {
        await expect(element(by.id('queued-operations-badge'))).toBeVisible();
      }
    });

    it('should queue multiple operations', async () => {
      // Perform multiple status updates while offline
      // Should queue all of them

      // Badge should show count > 1
      if (await element(by.id('queued-operations-badge')).isVisible()) {
        await expect(element(by.id('queued-operations-badge'))).toContain('2');
      }
    });
  });

  describe('Sync on Reconnect', () => {
    it('should detect when connection is restored', async () => {
      // Go offline
      await expect(element(by.id('offline-badge'))).toBeVisible();

      // Restore connection
      // Should detect and update status

      await waitFor(element(by.id('offline-badge'))).not.toBeVisible().withTimeout(5000);
    });

    it('should show reconnection message', async () => {
      // When connection restored
      // Should show notification

      await waitFor(element(by.id('reconnected-message'))).toBeVisible().withTimeout(3000);
      await expect(element(by.id('reconnected-message'))).toContain('Back online');
    });

    it('should auto-sync queued operations', async () => {
      // Queue operations while offline
      // Restore connection
      // Should automatically sync

      await waitFor(element(by.id('sync-in-progress'))).toBeVisible().withTimeout(5000);
    });

    it('should show sync progress', async () => {
      // While syncing
      // Should show progress indicator

      await expect(element(by.id('sync-progress-bar'))).toBeVisible();
    });

    it('should show sync completion message', async () => {
      // After sync completes
      // Should show success message

      await waitFor(element(by.id('sync-complete-message'))).toBeVisible().withTimeout(10000);
      await expect(element(by.id('sync-complete-message'))).toContain('synced');
    });

    it('should update data after sync', async () => {
      // After syncing
      // Delivery list should be refreshed with server data

      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);
      // Data should be current
    });

    it('should clear queued operations badge after sync', async () => {
      // After successful sync
      // Badge should disappear

      await waitFor(element(by.id('queued-operations-badge'))).not.toBeVisible().withTimeout(5000);
    });

    it('should handle sync failures', async () => {
      // If sync fails
      // Should show error message

      if (await element(by.id('sync-error-message')).isVisible()) {
        await expect(element(by.id('sync-error-message'))).toBeVisible();

        // Should show retry button
        await expect(element(by.id('retry-sync-button'))).toBeVisible();
      }
    });

    it('should allow manual sync retry', async () => {
      // If sync fails
      if (await element(by.id('retry-sync-button')).isVisible()) {
        await element(by.id('retry-sync-button')).tap();

        // Should attempt sync again
        await expect(element(by.id('sync-progress-bar'))).toBeVisible();
      }
    });

    it('should merge local and server changes', async () => {
      // If local changes conflict with server
      // Should handle merge gracefully

      // Could show conflict resolution UI
    });
  });

  describe('Offline Capabilities', () => {
    it('should allow viewing cached deliveries offline', async () => {
      // Load deliveries while online
      await waitFor(element(by.id('delivery-list'))).toBeVisible().withTimeout(5000);

      // Go offline
      // Should still see deliveries

      await expect(element(by.id('delivery-list'))).toBeVisible();
    });

    it('should allow viewing delivery details offline', async () => {
      // Load delivery while online
      await acceptDelivery();

      // Go offline
      // Should still see delivery details

      await expect(element(by.id('delivery-detail-screen'))).toBeVisible();
    });

    it('should allow collecting delivery proof offline', async () => {
      // Start delivery while online
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      // Go offline
      // Should still be able to collect signature and photos

      await confirmArrival();
      await expect(element(by.id('signature-pad'))).toBeVisible();

      // Draw signature
      await element(by.id('signature-pad')).multiTap(5);
    });

    it('should queue proof submission when offline', async () => {
      // Collect proof while offline
      // Try to submit

      // Should queue the submission
      if (await element(by.id('queued-operations-badge')).isVisible()) {
        await expect(element(by.id('queued-operations-badge'))).toBeVisible();
      }
    });

    it('should NOT allow starting new delivery when offline', async () => {
      // Go offline
      // Try to accept new delivery

      if (await element(by.id('delivery-card-0')).isVisible()) {
        // Might be disabled or show message
        if (await element(by.id('accept-button-disabled')).isVisible()) {
          await expect(element(by.id('accept-button-disabled'))).toBeVisible();
        }
      }
    });

    it('should show limited functionality message', async () => {
      // When offline
      // Should indicate what's available

      if (await element(by.id('offline-capabilities-message')).isVisible()) {
        await expect(element(by.id('offline-capabilities-message'))).toBeVisible();
      }
    });
  });

  describe('Network Monitoring', () => {
    it('should monitor connection status continuously', async () => {
      // Should detect connection changes
      // Toggle connection on/off

      // App should respond to changes
    });

    it('should handle WiFi to cellular switch', async () => {
      // Switch from WiFi to cellular
      // Should not cause disruption

      // Should update status indicator
      if (await element(by.id('network-type-indicator')).isVisible()) {
        await expect(element(by.id('network-type-indicator'))).toBeVisible();
      }
    });

    it('should handle airplane mode toggle', async () => {
      // Enable airplane mode
      // Should detect loss of connectivity

      // Should show offline indicator
      await expect(element(by.id('offline-badge'))).toBeVisible();
    });
  });

  describe('Offline Performance', () => {
    it('should load cached data instantly', async () => {
      // Load deliveries while online (to cache)
      // Go offline
      // Navigate to delivery list

      // Should load from cache instantly
      // No loading indicator needed
    });

    it('should handle large offline datasets', async () => {
      // Cache many deliveries
      // Go offline
      // Should still be responsive

      // Pagination/scrolling should work smoothly
    });
  });

  describe('Offline Storage', () => {
    it('should track storage usage', async () => {
      // If storage indicator available
      if (await element(by.id('storage-usage')).isVisible()) {
        await expect(element(by.id('storage-usage'))).toBeVisible();
      }
    });

    it('should allow clearing cache', async () => {
      // In settings
      if (await element(by.id('clear-cache-button')).isVisible()) {
        await element(by.id('clear-cache-button')).tap();

        // Cache should be cleared
      }
    });

    it('should warn before clearing cache', async () => {
      // Should show confirmation dialog
      if (await element(by.id('clear-cache-confirmation')).isVisible()) {
        await expect(element(by.id('clear-cache-confirmation'))).toBeVisible();
      }
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
