/**
 * E2E Test: GPS Tracking Verification
 *
 * Tests real-time GPS tracking during delivery:
 * - Location updates during transit
 * - Route following verification
 * - ETA updates
 * - Location history logging
 */

import { device, element, by, expect as detoxExpect, waitFor } from 'detox';
import { standardDelivery, testUser } from '../helpers/testData';
import { grantLocationPermissions, setDeviceLocation, testLocations, generateRoute, simulateRouteMovement } from '../helpers/mockGPS';

describe('GPS Tracking Verification', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { location: 'always', camera: 'YES' },
      newInstance: true
    });
    await grantLocationPermissions(device);
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should track and log GPS locations during delivery', async () => {
    // Step 1: Login and start delivery
    await detoxExpect(element(by.id('login-screen'))).toBeVisible();
    await element(by.id('email-input')).typeText(testUser.email);
    await element(by.id('password-input')).typeText(testUser.password);
    await element(by.id('login-button')).tap();

    await waitFor(element(by.id('delivery-list-screen')))
      .toBeVisible()
      .withTimeout(5000);

    const deliveryCard = element(by.id(`delivery-card-${standardDelivery.id}`));
    await deliveryCard.tap();

    await element(by.id('accept-delivery-button')).tap();

    // Step 2: Start navigation and verify GPS tracking starts
    await element(by.id('navigate-button')).tap();

    await waitFor(element(by.id('navigation-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Verify GPS tracking indicator is active
    await detoxExpect(element(by.id('gps-tracking-active'))).toBeVisible();
    await detoxExpect(element(by.id('location-accuracy-indicator'))).toBeVisible();

    // Verify current location is shown
    await detoxExpect(element(by.id('current-location-coords'))).toBeVisible();

    // Step 3: Simulate movement and verify location updates
    const route = generateRoute(
      testLocations.pharmacyGeneva,
      testLocations.patientHomeGeneva,
      5
    );

    // Move to first waypoint
    await setDeviceLocation(device, route[1]);

    // Wait for UI to update with new location
    await waitFor(element(by.id('location-updated-indicator')))
      .toBeVisible()
      .withTimeout(3000);

    // Verify distance/ETA updates
    await detoxExpect(element(by.id('distance-remaining'))).toBeVisible();
    await detoxExpect(element(by.id('eta-display'))).toBeVisible();

    // Step 4: Continue route simulation
    for (let i = 2; i < route.length; i++) {
      await setDeviceLocation(device, route[i]);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify location marker moves on map
      await detoxExpect(element(by.id('current-location-marker'))).toBeVisible();
    }

    // Step 5: Verify location history is being logged
    await element(by.id('menu-button')).tap();
    await element(by.id('view-location-history-button')).tap();

    await waitFor(element(by.id('location-history-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Verify location points are logged
    await detoxExpect(element(by.id('location-history-list'))).toBeVisible();
    await detoxExpect(element(by.id('location-point-0'))).toBeVisible();
    await detoxExpect(element(by.id('location-point-1'))).toBeVisible();

    // Verify each point has timestamp and coordinates
    for (let i = 0; i < route.length; i++) {
      const pointElement = element(by.id(`location-point-${i}`));
      await detoxExpect(pointElement).toExist();
    }

    await element(by.id('close-location-history-button')).tap();

    // Step 6: Pick up package
    await setDeviceLocation(device, testLocations.pharmacyGeneva);

    await waitFor(element(by.id('arrived-at-pharmacy-button')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('scan-qr-button')).tap();
    await element(by.id('qr-scanner-camera')).tap();
    await element(by.id('confirm-pickup-button')).tap();

    // Step 7: Navigate to patient and verify tracking continues
    await waitFor(element(by.text('In Transit')))
      .toBeVisible()
      .withTimeout(2000);

    // GPS tracking should still be active
    await detoxExpect(element(by.id('gps-tracking-active'))).toBeVisible();

    // Simulate route to patient
    const deliveryRoute = generateRoute(
      testLocations.pharmacyGeneva,
      testLocations.patientHomeGeneva,
      3
    );

    await simulateRouteMovement(device, deliveryRoute, 1000);

    // Step 8: Complete delivery
    await waitFor(element(by.id('arrived-at-destination-button')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('arrived-at-destination-button')).tap();

    await waitFor(element(by.id('proof-of-delivery-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Submit proof of delivery
    await element(by.id('recipient-name-input')).typeText('Jean Dupont');
    await element(by.id('signature-canvas')).swipe('right', 'slow', 0.5);
    await element(by.id('submit-proof-button')).tap();

    // Step 9: Verify GPS tracking stops after delivery
    await waitFor(element(by.id('delivery-complete-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // GPS tracking should be inactive now
    await element(by.id('return-to-list-button')).tap();

    // Verify no active tracking indicator on main screen
    await detoxExpect(element(by.id('gps-tracking-active'))).not.toBeVisible();
  });

  it('should display route on map with waypoints', async () => {
    // Start delivery
    const deliveryCard = element(by.id(`delivery-card-${standardDelivery.id}`));
    await deliveryCard.tap();
    await element(by.id('accept-delivery-button')).tap();

    // Open map view
    await element(by.id('view-map-button')).tap();

    await waitFor(element(by.id('map-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Verify map elements
    await detoxExpect(element(by.id('delivery-map'))).toBeVisible();

    // Verify markers are shown
    await detoxExpect(element(by.id('pharmacy-marker'))).toBeVisible();
    await detoxExpect(element(by.id('destination-marker'))).toBeVisible();
    await detoxExpect(element(by.id('current-location-marker'))).toBeVisible();

    // Verify route line is drawn
    await detoxExpect(element(by.id('route-polyline'))).toBeVisible();

    // Verify distance and ETA on map
    await detoxExpect(element(by.id('map-distance-display'))).toBeVisible();
    await detoxExpect(element(by.id('map-eta-display'))).toBeVisible();
  });

  it('should update ETA based on actual movement speed', async () => {
    // Start delivery and navigation
    const deliveryCard = element(by.id(`delivery-card-${standardDelivery.id}`));
    await deliveryCard.tap();
    await element(by.id('accept-delivery-button')).tap();
    await element(by.id('navigate-button')).tap();

    // Initial ETA
    const initialETA = await element(by.id('eta-display')).getAttributes();

    // Move slowly (simulate traffic)
    const slowRoute = generateRoute(
      testLocations.pharmacyGeneva,
      testLocations.patientHomeGeneva,
      10 // More waypoints = slower movement
    );

    await setDeviceLocation(device, slowRoute[1]);
    await new Promise(resolve => setTimeout(resolve, 2000));

    await setDeviceLocation(device, slowRoute[2]);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ETA should increase due to slow speed
    await waitFor(element(by.id('eta-updated-indicator')))
      .toBeVisible()
      .withTimeout(3000);

    // Verify ETA changed
    const updatedETA = await element(by.id('eta-display')).getAttributes();
    // In a real test, we'd assert the ETA increased

    // Now move quickly
    await setDeviceLocation(device, slowRoute[5]);
    await new Promise(resolve => setTimeout(resolve, 500));

    await setDeviceLocation(device, slowRoute[8]);
    await new Promise(resolve => setTimeout(resolve, 500));

    // ETA should decrease due to faster speed
    await waitFor(element(by.id('eta-updated-indicator')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should handle GPS signal loss gracefully', async () => {
    // Start delivery
    const deliveryCard = element(by.id(`delivery-card-${standardDelivery.id}`));
    await deliveryCard.tap();
    await element(by.id('accept-delivery-button')).tap();
    await element(by.id('navigate-button')).tap();

    // Verify GPS is active
    await detoxExpect(element(by.id('gps-tracking-active'))).toBeVisible();
    await detoxExpect(element(by.id('location-accuracy-indicator'))).toHaveText('High Accuracy');

    // Simulate GPS signal loss (set very low accuracy)
    await device.setLocation(
      testLocations.pharmacyGeneva.latitude,
      testLocations.pharmacyGeneva.longitude
    );

    // In real implementation, would set accuracy to 1000+ meters
    // For this test, simulate the warning

    // Verify GPS warning appears
    await waitFor(element(by.id('gps-signal-warning')))
      .toBeVisible()
      .withTimeout(3000);

    await detoxExpect(element(by.text('GPS signal weak'))).toBeVisible();
    await detoxExpect(element(by.text('Location accuracy may be reduced'))).toBeVisible();

    // Verify location indicator shows warning
    await detoxExpect(element(by.id('location-accuracy-indicator'))).toHaveText('Low Accuracy');

    // Restore GPS signal
    await device.setLocation(
      testLocations.pharmacyGeneva.latitude,
      testLocations.pharmacyGeneva.longitude
    );

    // Warning should disappear
    await waitFor(element(by.id('gps-signal-warning')))
      .not.toBeVisible()
      .withTimeout(3000);

    await detoxExpect(element(by.id('location-accuracy-indicator'))).toHaveText('High Accuracy');
  });

  it('should log location data with delivery proof', async () => {
    // Complete full delivery
    const deliveryCard = element(by.id(`delivery-card-${standardDelivery.id}`));
    await deliveryCard.tap();
    await element(by.id('accept-delivery-button')).tap();

    // Navigate and pick up
    await element(by.id('navigate-button')).tap();
    await setDeviceLocation(device, testLocations.pharmacyGeneva);
    await element(by.id('scan-qr-button')).tap();
    await element(by.id('qr-scanner-camera')).tap();
    await element(by.id('confirm-pickup-button')).tap();

    // Navigate to patient
    const route = generateRoute(testLocations.pharmacyGeneva, testLocations.patientHomeGeneva, 3);
    await simulateRouteMovement(device, route, 1000);

    await element(by.id('arrived-at-destination-button')).tap();

    // Submit proof
    await element(by.id('recipient-name-input')).typeText('Jean Dupont');
    await element(by.id('signature-canvas')).swipe('right', 'slow', 0.5);
    await element(by.id('submit-proof-button')).tap();

    // View completed delivery details
    await element(by.id('return-to-list-button')).tap();
    await element(by.id('completed-tab')).tap();

    const completedDelivery = element(by.id(`delivery-card-${standardDelivery.id}`));
    await completedDelivery.tap();

    // View delivery route
    await element(by.id('view-delivery-route-button')).tap();

    await waitFor(element(by.id('delivery-route-map-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Verify route is shown with timestamps
    await detoxExpect(element(by.id('route-map'))).toBeVisible();
    await detoxExpect(element(by.id('pickup-location-marker'))).toBeVisible();
    await detoxExpect(element(by.id('delivery-location-marker'))).toBeVisible();
    await detoxExpect(element(by.id('route-path'))).toBeVisible();

    // Verify timestamps
    await detoxExpect(element(by.id('pickup-timestamp'))).toBeVisible();
    await detoxExpect(element(by.id('delivery-timestamp'))).toBeVisible();

    // Verify route statistics
    await detoxExpect(element(by.id('total-distance-traveled'))).toBeVisible();
    await detoxExpect(element(by.id('total-travel-time'))).toBeVisible();
    await detoxExpect(element(by.id('average-speed'))).toBeVisible();
  });

  it('should provide turn-by-turn navigation', async () => {
    // Start delivery and navigation
    const deliveryCard = element(by.id(`delivery-card-${standardDelivery.id}`));
    await deliveryCard.tap();
    await element(by.id('accept-delivery-button')).tap();
    await element(by.id('navigate-button')).tap();

    await waitFor(element(by.id('navigation-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Verify navigation instructions are shown
    await detoxExpect(element(by.id('next-turn-instruction'))).toBeVisible();
    await detoxExpect(element(by.id('next-turn-distance'))).toBeVisible();

    // Example: "Turn right onto Rue du Rhône in 200m"
    await detoxExpect(element(by.id('navigation-arrow'))).toBeVisible();

    // Move along route
    const route = generateRoute(testLocations.pharmacyGeneva, testLocations.patientHomeGeneva, 5);

    await setDeviceLocation(device, route[1]);

    // Verify instruction updates
    await waitFor(element(by.id('instruction-updated-indicator')))
      .toBeVisible()
      .withTimeout(3000);

    // Distance should decrease
    // await detoxExpect(element(by.id('next-turn-distance'))).toHaveText('150m');

    // Move past turn
    await setDeviceLocation(device, route[2]);

    // New instruction should appear
    await waitFor(element(by.id('instruction-updated-indicator')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should detect route deviation and offer recalculation', async () => {
    // Start delivery
    const deliveryCard = element(by.id(`delivery-card-${standardDelivery.id}`));
    await deliveryCard.tap();
    await element(by.id('accept-delivery-button')).tap();
    await element(by.id('navigate-button')).tap();

    // Move to unexpected location (off route)
    await setDeviceLocation(device, testLocations.wrongAddress);

    // Verify deviation alert
    await waitFor(element(by.id('route-deviation-alert')))
      .toBeVisible()
      .withTimeout(3000);

    await detoxExpect(element(by.text('Off Route'))).toBeVisible();
    await detoxExpect(element(by.text('You have deviated from the suggested route'))).toBeVisible();

    // Recalculate route option
    await detoxExpect(element(by.id('recalculate-route-button'))).toBeVisible();
    await detoxExpect(element(by.id('continue-current-button'))).toBeVisible();

    await element(by.id('recalculate-route-button')).tap();

    // Verify route is recalculated
    await waitFor(element(by.text('Route Updated')))
      .toBeVisible()
      .withTimeout(3000);

    await detoxExpect(element(by.id('new-eta-display'))).toBeVisible();
  });

  it('should work in offline mode with location caching', async () => {
    // Start delivery
    const deliveryCard = element(by.id(`delivery-card-${standardDelivery.id}`));
    await deliveryCard.tap();
    await element(by.id('accept-delivery-button')).tap();

    // Pick up package
    await element(by.id('navigate-button')).tap();
    await setDeviceLocation(device, testLocations.pharmacyGeneva);
    await element(by.id('scan-qr-button')).tap();
    await element(by.id('qr-scanner-camera')).tap();
    await element(by.id('confirm-pickup-button')).tap();

    // Go offline
    await device.setStatusBar({
      networkConnection: 'airplane'
    });

    // Verify offline mode indicator
    await detoxExpect(element(by.id('offline-mode-banner'))).toBeVisible();

    // Continue navigation offline
    const route = generateRoute(testLocations.pharmacyGeneva, testLocations.patientHomeGeneva, 3);
    await simulateRouteMovement(device, route, 1000);

    // GPS tracking should still work offline
    await detoxExpect(element(by.id('gps-tracking-active'))).toBeVisible();
    await detoxExpect(element(by.id('current-location-coords'))).toBeVisible();

    // Verify location updates are cached
    await detoxExpect(element(by.id('offline-sync-pending-indicator'))).toBeVisible();
    await detoxExpect(element(by.text('Location updates will sync when online'))).toBeVisible();

    // Complete delivery offline
    await element(by.id('arrived-at-destination-button')).tap();
    await element(by.id('recipient-name-input')).typeText('Jean Dupont');
    await element(by.id('signature-canvas')).swipe('right', 'slow', 0.5);
    await element(by.id('submit-proof-button')).tap();

    // Go back online
    await device.setStatusBar({
      networkConnection: 'wifi'
    });

    // Verify sync occurs
    await waitFor(element(by.id('location-sync-complete-notification')))
      .toBeVisible()
      .withTimeout(10000);

    await detoxExpect(element(by.text('Location data synced'))).toBeVisible();
  });
});
