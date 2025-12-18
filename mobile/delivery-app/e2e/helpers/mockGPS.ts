/**
 * GPS Mocking Helpers for E2E Tests
 *
 * Provides utilities to mock GPS locations during E2E tests
 */

import { Coordinates } from '../../src/types/delivery';

/**
 * Predefined test locations in Switzerland
 */
export const testLocations = {
  pharmacyGeneva: {
    latitude: 46.2044,
    longitude: 6.1432,
    accuracy: 10,
    timestamp: new Date().toISOString()
  } as Coordinates,

  patientHomeGeneva: {
    latitude: 46.2097,
    longitude: 6.1432,
    accuracy: 10,
    timestamp: new Date().toISOString()
  } as Coordinates,

  pharmacyZurich: {
    latitude: 47.3769,
    longitude: 8.5417,
    accuracy: 10,
    timestamp: new Date().toISOString()
  } as Coordinates,

  patientHomeZurich: {
    latitude: 47.3863,
    longitude: 8.5416,
    accuracy: 10,
    timestamp: new Date().toISOString()
  } as Coordinates,

  wrongAddress: {
    latitude: 47.5596,
    longitude: 7.5886, // Basel - different city
    accuracy: 10,
    timestamp: new Date().toISOString()
  } as Coordinates
};

/**
 * Generate route between two points with intermediate waypoints
 */
export function generateRoute(
  start: Coordinates,
  end: Coordinates,
  steps: number = 5
): Coordinates[] {
  const route: Coordinates[] = [];
  const latStep = (end.latitude - start.latitude) / steps;
  const lngStep = (end.longitude - start.longitude) / steps;

  for (let i = 0; i <= steps; i++) {
    route.push({
      latitude: start.latitude + (latStep * i),
      longitude: start.longitude + (lngStep * i),
      accuracy: 10,
      speed: i > 0 && i < steps ? 30 : 0, // km/h while moving
      heading: Math.atan2(lngStep, latStep) * (180 / Math.PI),
      timestamp: new Date(Date.now() + (i * 60000)).toISOString() // 1 minute intervals
    });
  }

  return route;
}

/**
 * Mock location permissions grant for Detox
 */
export async function grantLocationPermissions(device: any): Promise<void> {
  if (device.getPlatform() === 'ios') {
    await device.setLocation(testLocations.pharmacyGeneva.latitude, testLocations.pharmacyGeneva.longitude);
  } else {
    // Android permission granting
    await device.launchApp({
      permissions: { location: 'always' }
    });
  }
}

/**
 * Set device location for testing
 */
export async function setDeviceLocation(device: any, location: Coordinates): Promise<void> {
  await device.setLocation(location.latitude, location.longitude);
}

/**
 * Simulate movement along a route
 */
export async function simulateRouteMovement(
  device: any,
  route: Coordinates[],
  delayMs: number = 2000
): Promise<void> {
  for (const point of route) {
    await device.setLocation(point.latitude, point.longitude);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}
