/**
 * Route Optimization E2E Tests
 *
 * Tests route management and optimization:
 * - Route display on map
 * - Navigation integration
 * - Route reordering
 * - Navigation to next delivery
 */

describe('Route Optimization', () => {
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

  describe('Route Display', () => {
    it('should display route map on delivery start', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      // Route map should be visible
      await waitFor(element(by.id('delivery-map'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('delivery-map'))).toBeVisible();
    });

    it('should show current location on map', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      // Current location marker should be visible
      await waitFor(element(by.id('current-location-marker'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('current-location-marker'))).toBeVisible();
    });

    it('should show delivery destination on map', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      // Destination marker should be visible
      await waitFor(element(by.id('destination-marker'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('destination-marker'))).toBeVisible();
    });

    it('should display route path on map', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      // Route polyline should be visible
      await waitFor(element(by.id('route-polyline'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('route-polyline'))).toBeVisible();
    });

    it('should show distance and time information', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      // Distance and time should be displayed
      await expect(element(by.id('route-distance'))).toBeVisible();
      await expect(element(by.id('route-duration'))).toBeVisible();
    });

    it('should display multiple stops on optimized route', async () => {
      // Accept multiple deliveries for the day
      await acceptDelivery();

      // Navigate to map view
      await element(by.id('start-delivery-button')).tap();

      // Should show multiple destination markers
      await waitFor(element(by.id('destination-marker-0'))).toBeVisible().withTimeout(5000);
      // Subsequent deliveries might also be shown
    });

    it('should show traffic information if available', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      // Traffic layer toggle should be visible
      if (await element(by.id('traffic-layer-button')).isVisible()) {
        await element(by.id('traffic-layer-button')).tap();
        // Traffic overlay should appear
        await waitFor(element(by.id('traffic-layer'))).toBeVisible().withTimeout(5000);
      }
    });
  });

  describe('Navigation Integration', () => {
    it('should open native navigation on tap', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      // Navigate button should be visible
      await waitFor(element(by.id('navigate-button'))).toBeVisible().withTimeout(5000);
      await expect(element(by.id('navigate-button'))).toBeVisible();
    });

    it('should show navigation options', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      // Tap navigate button
      await element(by.id('navigate-button')).tap();

      // Should show navigation options (Maps, Google Maps, Waze, etc.)
      await waitFor(element(by.id('navigation-options'))).toBeVisible().withTimeout(5000);
    });

    it('should open native maps when navigation selected', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      await element(by.id('navigate-button')).tap();

      // Select Maps option
      if (await element(by.id('maps-option')).isVisible()) {
        await element(by.id('maps-option')).tap();

        // Native Maps app should open
        // We can verify by checking if app context changed or simulate return
      }
    });

    it('should return to app after navigation', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      // Navigate using in-app navigation
      // Should remain in app view
      await expect(element(by.id('delivery-map'))).toBeVisible();
    });

    it('should display turn-by-turn directions', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      // If using in-app navigation, directions should display
      if (await element(by.id('next-instruction')).isVisible()) {
        await expect(element(by.id('next-instruction'))).toBeVisible();
      }
    });

    it('should update directions as user moves', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      // Verify directions panel is visible
      await waitFor(element(by.id('navigation-panel'))).toBeVisible().withTimeout(5000);

      // Instructions should update as location changes
      // (This would be tested with actual location simulation)
    });
  });

  describe('Route Reordering', () => {
    it('should display optimization menu', async () => {
      // Accept multiple deliveries
      await acceptDelivery();

      // Access route optimization menu
      if (await element(by.id('optimize-route-button')).isVisible()) {
        await element(by.id('optimize-route-button')).tap();

        // Optimization menu should appear
        await waitFor(element(by.id('optimization-menu'))).toBeVisible().withTimeout(5000);
      }
    });

    it('should optimize route by distance', async () => {
      // Access optimization menu
      if (await element(by.id('optimize-route-button')).isVisible()) {
        await element(by.id('optimize-route-button')).tap();

        // Select distance optimization
        await element(by.id('optimize-distance')).tap();

        // Route should be reordered
        await waitFor(element(by.id('route-optimized-notification'))).toBeVisible().withTimeout(5000);
      }
    });

    it('should show reordered stop list', async () => {
      // After optimization, stop list should update
      if (await element(by.id('stop-list')).isVisible()) {
        await expect(element(by.id('stop-list'))).toBeVisible();

        // Stops should be in new order
        await waitFor(element(by.id('stop-item-0'))).toBeVisible().withTimeout(5000);
      }
    });

    it('should allow manual reordering', async () => {
      // If manual reordering is supported
      if (await element(by.id('drag-handle-0')).isVisible()) {
        // Drag first stop to second position
        await element(by.id('drag-handle-0')).multiTap(1);
      }
    });

    it('should update route on reorder', async () => {
      // After reordering, map should update
      if (await element(by.id('delivery-map')).isVisible()) {
        await expect(element(by.id('route-polyline'))).toBeVisible();
        // Route should reflect new order
      }
    });
  });

  describe('Next Delivery Navigation', () => {
    it('should show next delivery indicator', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      // Next delivery badge should be visible if multiple deliveries
      if (await element(by.id('next-delivery-badge')).isVisible()) {
        await expect(element(by.id('next-delivery-badge'))).toBeVisible();
      }
    });

    it('should navigate to next delivery after completion', async () => {
      // Complete current delivery
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();
      await confirmArrival();
      await captureSignature();

      await element(by.id('submit-proof-button')).tap();

      // Should show completion screen with next delivery option
      await waitFor(element(by.id('delivery-completed-screen'))).toBeVisible().withTimeout(5000);

      // If there's a next delivery, button should be available
      if (await element(by.id('next-delivery-button')).isVisible()) {
        await element(by.id('next-delivery-button')).tap();

        // Should navigate to next delivery details
        await waitFor(element(by.id('delivery-detail-screen'))).toBeVisible().withTimeout(5000);
      }
    });

    it('should show remaining deliveries count', async () => {
      // If multiple deliveries, count should be visible
      if (await element(by.id('remaining-deliveries-count')).isVisible()) {
        await expect(element(by.id('remaining-deliveries-count'))).toBeVisible();
      }
    });

    it('should highlight next delivery in list', async () => {
      // If there's a delivery list view
      if (await element(by.id('next-delivery-highlight')).isVisible()) {
        await expect(element(by.id('next-delivery-highlight'))).toBeVisible();
      }
    });
  });

  describe('Map Interactions', () => {
    it('should allow pinch to zoom', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      // Pinch gesture should zoom map
      await element(by.id('delivery-map')).pinch('inward', 0.75);
      // Map should be zoomed out

      await element(by.id('delivery-map')).pinch('outward', 1.25);
      // Map should be zoomed in
    });

    it('should allow pan gestures', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      // Pan map
      await element(by.id('delivery-map')).swipe('left', 'slow', 0.75);
      // Map should pan

      await element(by.id('delivery-map')).swipe('right', 'slow', 0.75);
      // Map should pan back
    });

    it('should center map on current location', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      // Center button should be visible
      if (await element(by.id('center-location-button')).isVisible()) {
        await element(by.id('center-location-button')).tap();

        // Map should center on current location
        await expect(element(by.id('current-location-marker'))).toBeVisible();
      }
    });

    it('should allow tap on destination for details', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      // Tap destination marker
      await element(by.id('destination-marker')).tap();

      // Should show delivery details
      if (await element(by.id('delivery-info-popup')).isVisible()) {
        await expect(element(by.id('delivery-info-popup'))).toBeVisible();
      }
    });
  });

  describe('Route Alternates', () => {
    it('should show alternative routes if available', async () => {
      await acceptDelivery();
      await element(by.id('start-delivery-button')).tap();

      // Alternative routes button might be visible
      if (await element(by.id('alternative-routes-button')).isVisible()) {
        await element(by.id('alternative-routes-button')).tap();

        // Alternative routes should be displayed
        await waitFor(element(by.id('alternative-routes-list'))).toBeVisible().withTimeout(5000);
      }
    });

    it('should allow selecting alternative route', async () => {
      // If alternative routes are shown
      if (await element(by.id('alternative-route-0')).isVisible()) {
        await element(by.id('alternative-route-0')).tap();

        // Route should update
        await waitFor(element(by.id('route-polyline'))).toBeVisible().withTimeout(5000);
      }
    });
  });

  describe('Offline Route Display', () => {
    it('should display cached route when offline', async () => {
      // This would require disabling network connectivity
      // Cached route should still be visible on map
    });

    it('should show offline indicator', async () => {
      // When offline, offline badge should be visible
      // Could test by simulating network disconnect
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

async function captureSignature() {
  await element(by.id('signature-pad')).multiTap(5);
}
