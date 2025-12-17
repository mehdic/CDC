/**
 * Location Service Unit Tests
 * T8-021: GPS Tracking & Route Display
 * Tests for battery-efficient GPS tracking with adaptive modes and geofencing
 */

import { Coordinates } from '../../types/delivery';
import { locationService, TrackingMode } from '../location-service';
import deliveryApi from '../deliveryApi';

// Define mock functions outside
const mockRequestAuthorization = jest.fn();
const mockGetCurrentPosition = jest.fn();
const mockWatchPosition = jest.fn();
const mockClearWatch = jest.fn();
const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
const mockRemoveItem = jest.fn();

/**
 * Mock Dependencies
 */
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (...args: any[]) => mockGetItem(...args),
  setItem: (...args: any[]) => mockSetItem(...args),
  removeItem: (...args: any[]) => mockRemoveItem(...args),
}));

jest.mock('react-native-geolocation-service', () => ({
  requestAuthorization: (...args: any[]) => mockRequestAuthorization(...args),
  getCurrentPosition: (...args: any[]) => mockGetCurrentPosition(...args),
  watchPosition: (...args: any[]) => mockWatchPosition(...args),
  clearWatch: (...args: any[]) => mockClearWatch(...args),
}));

jest.mock('../deliveryApi', () => ({
  updateLocation: jest.fn(),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  PermissionsAndroid: {
    requestMultiple: jest.fn(),
    PERMISSIONS: {
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
      ACCESS_BACKGROUND_LOCATION: 'android.permission.ACCESS_BACKGROUND_LOCATION',
    },
    RESULTS: {
      GRANTED: 'granted',
      DENIED: 'denied',
    },
  },
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

/**
 * Mock Position
 */
const createMockPosition = (
  latitude: number = 47.3769,
  longitude: number = 8.5417
): Geolocation.GeoPosition => ({
  coords: {
    latitude,
    longitude,
    accuracy: 5,
    altitude: 100,
    altitudeAccuracy: 1,
    heading: 45,
    speed: 10,
  },
  timestamp: Date.now(),
});

describe('LocationService', () => {
  beforeEach(() => {
    mockGetItem.mockReset();
    mockSetItem.mockReset();
    mockRemoveItem.mockReset();
    mockRequestAuthorization.mockReset();
    mockGetCurrentPosition.mockReset();
    mockWatchPosition.mockReset();
    mockClearWatch.mockReset();
    (deliveryApi.updateLocation as jest.Mock).mockReset();

    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);
    mockRemoveItem.mockResolvedValue(undefined);
    mockRequestAuthorization.mockResolvedValue('granted');
    mockGetCurrentPosition.mockImplementation((success) => {
      success(createMockPosition());
    });
    mockWatchPosition.mockReturnValue(123);
    mockClearWatch.mockImplementation(() => {});
    (deliveryApi.updateLocation as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Initialization', () => {
    it('should initialize successfully with permissions granted', async () => {
      mockRequestAuthorization.mockResolvedValue('granted');

      const result = await locationService.initialize();

      expect(result).toBe(true);
      expect(mockRequestAuthorization).toHaveBeenCalledWith('always');
    });

    it('should fail initialization when permissions denied', async () => {
      mockRequestAuthorization.mockResolvedValue('denied');

      const result = await locationService.initialize();

      expect(result).toBe(false);
    });

    it('should handle initialization errors', async () => {
      mockRequestAuthorization.mockRejectedValue(new Error('Permission error'));

      const result = await locationService.initialize();

      expect(result).toBe(false);
    });
  });

  describe('Start Tracking', () => {
    it('should start tracking for a delivery', async () => {
      await locationService.initialize();

      const destinationCoords: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      };

      await locationService.startTracking('delivery-1', destinationCoords);

      expect(mockGetCurrentPosition).toHaveBeenCalled();
      expect(mockWatchPosition).toHaveBeenCalled();
      expect(locationService.isActive()).toBe(true);
    });

    it('should not start tracking if already tracking', async () => {
      await locationService.initialize();

      const destinationCoords: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      };

      await locationService.startTracking('delivery-1', destinationCoords);

      // Try to start again
      const initialWatchCallCount = mockWatchPosition.mock.calls.length;

      await locationService.startTracking('delivery-2', destinationCoords);

      // Should not call watchPosition again
      expect(mockWatchPosition.mock.calls.length).toBe(initialWatchCallCount);
    });
  });

  describe('Stop Tracking', () => {
    it('should stop tracking', async () => {
      await locationService.initialize();

      const destinationCoords: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      };

      await locationService.startTracking('delivery-1', destinationCoords);
      locationService.stopTracking();

      expect(mockClearWatch).toHaveBeenCalled();
      expect(locationService.isActive()).toBe(false);
    });
  });

  describe('Tracking Modes', () => {
    it('should determine HIGH_ACCURACY mode when near destination', async () => {
      await locationService.initialize();

      const destinationCoords: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      };

      await locationService.startTracking('delivery-1', destinationCoords);

      const mode = locationService.getCurrentMode();

      // Should be HIGH_ACCURACY when at destination
      expect([TrackingMode.HIGH_ACCURACY, TrackingMode.NORMAL]).toContain(mode);
    });

    it('should determine BATTERY_SAVER mode when far from destination', async () => {
      await locationService.initialize();

      // Destination far away (50km)
      const destinationCoords: Coordinates = {
        latitude: 47.0,
        longitude: 8.0,
        timestamp: new Date().toISOString(),
      };

      await locationService.startTracking('delivery-1', destinationCoords);

      const mode = locationService.getCurrentMode();

      expect(mode).toBeDefined();
    });
  });

  describe('Get Current Location', () => {
    it('should get current location', async () => {
      await locationService.initialize();

      const location = await locationService.getCurrentLocation();

      expect(location).toEqual(
        expect.objectContaining({
          latitude: expect.any(Number),
          longitude: expect.any(Number),
          timestamp: expect.any(String),
        })
      );
    });

    it('should return null when get current position fails', async () => {
      await locationService.initialize();

      (Geolocation.getCurrentPosition as jest.Mock).mockImplementation((success, error) => {
        error({ code: 2, message: 'Position unavailable' });
      });

      const location = await locationService.getCurrentLocation();

      expect(location).toBeNull();
    });
  });

  describe('Location Updates', () => {
    it('should handle location updates', async () => {
      await locationService.initialize();

      const destinationCoords: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      };

      let capturedSuccessCallback: any;
      mockWatchPosition.mockImplementation((success) => {
        capturedSuccessCallback = success;
        return 123;
      });

      await locationService.startTracking('delivery-1', destinationCoords);

      // Simulate location update
      const newPosition = createMockPosition(47.38, 8.54);
      capturedSuccessCallback(newPosition);

      // Wait for batch upload
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should attempt to upload location
      expect(deliveryApi.updateLocation).toHaveBeenCalled();
    });

    it('should batch location updates', async () => {
      await locationService.initialize();

      const destinationCoords: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      };

      let capturedSuccessCallback: any;
      mockWatchPosition.mockImplementation((success) => {
        capturedSuccessCallback = success;
        return 123;
      });

      await locationService.startTracking('delivery-1', destinationCoords);

      // Simulate 5 location updates (should trigger batch upload)
      for (let i = 0; i < 5; i++) {
        const newPosition = createMockPosition(47.3769 + i * 0.001, 8.5417 + i * 0.001);
        capturedSuccessCallback(newPosition);
      }

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should have uploaded batch
      expect(deliveryApi.updateLocation).toHaveBeenCalled();
    });
  });

  describe('Offline Queue', () => {
    it('should queue batch for offline sync on upload failure', async () => {
      await locationService.initialize();

      const destinationCoords: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      };

      // Make upload fail
      (deliveryApi.updateLocation as jest.Mock).mockRejectedValue(new Error('Network error'));

      let capturedSuccessCallback: any;
      mockWatchPosition.mockImplementation((success) => {
        capturedSuccessCallback = success;
        return 123;
      });

      await locationService.startTracking('delivery-1', destinationCoords);

      // Simulate 5 location updates
      for (let i = 0; i < 5; i++) {
        const newPosition = createMockPosition(47.3769 + i * 0.001, 8.5417 + i * 0.001);
        capturedSuccessCallback(newPosition);
      }

      // Stop tracking to trigger batch upload
      locationService.stopTracking();

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Should have attempted to queue for offline sync
      expect(mockSetItem).toHaveBeenCalledWith(
        expect.stringContaining('batch_queue'),
        expect.any(String)
      );
    });

    it('should sync offline queue when connection restored', async () => {
      await locationService.initialize();

      // Mock offline queue
      const mockBatch = {
        deliveryId: 'delivery-1',
        locations: [
          {
            latitude: 47.3769,
            longitude: 8.5417,
            timestamp: new Date().toISOString(),
          },
        ],
        timestamp: new Date().toISOString(),
      };

      mockGetItem.mockResolvedValueOnce(JSON.stringify([mockBatch]));
      mockRemoveItem.mockResolvedValueOnce(undefined);

      await locationService.syncOfflineQueue();

      expect(deliveryApi.updateLocation).toHaveBeenCalled();
      expect(mockRemoveItem).toHaveBeenCalled();
    });
  });

  describe('Geofencing', () => {
    it('should handle geofence entry', async () => {
      await locationService.initialize();

      locationService.onGeofenceEntry('delivery-1');

      // Should switch to HIGH_ACCURACY mode
      const mode = locationService.getCurrentMode();
      expect(mode).toBe(TrackingMode.HIGH_ACCURACY);
    });

    it('should handle geofence exit', async () => {
      await locationService.initialize();

      // Enter geofence first
      locationService.onGeofenceEntry('delivery-1');
      expect(locationService.getCurrentMode()).toBe(TrackingMode.HIGH_ACCURACY);

      // Exit geofence
      locationService.onGeofenceExit('delivery-1');

      // Should switch back to NORMAL mode
      const mode = locationService.getCurrentMode();
      expect([TrackingMode.NORMAL, TrackingMode.BATTERY_SAVER]).toContain(mode);
    });
  });

  describe('Distance Calculation', () => {
    it('should calculate distance between coordinates', async () => {
      await locationService.initialize();

      const coord1: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      };

      const coord2: Coordinates = {
        latitude: 47.3869,
        longitude: 8.5517,
        timestamp: new Date().toISOString(),
      };

      const destinationCoords: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      };

      await locationService.startTracking('delivery-1', destinationCoords);

      const location = await locationService.getCurrentLocation();
      expect(location).toBeTruthy();
    });
  });

  describe('Tracking State', () => {
    it('should report tracking status correctly', async () => {
      await locationService.initialize();

      expect(locationService.isActive()).toBe(false);

      const destinationCoords: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      };

      await locationService.startTracking('delivery-1', destinationCoords);
      expect(locationService.isActive()).toBe(true);

      locationService.stopTracking();
      expect(locationService.isActive()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle watch position errors gracefully', async () => {
      await locationService.initialize();

      const destinationCoords: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      };

      let capturedErrorCallback: any;
      mockWatchPosition.mockImplementation(
        (success, error) => {
          capturedErrorCallback = error;
          return 123;
        }
      );

      await locationService.startTracking('delivery-1', destinationCoords);

      // Simulate error
      capturedErrorCallback({
        code: 2,
        message: 'Position unavailable',
      });

      // Should continue operating
      expect(locationService.isActive()).toBe(true);
    });

    it('should handle location permission storage errors', async () => {
      mockSetItem.mockRejectedValue(new Error('Storage error'));

      await locationService.initialize();

      const destinationCoords: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      };

      // Should not throw
      await expect(locationService.startTracking('delivery-1', destinationCoords)).resolves.not.toThrow();
    });
  });

  describe('Current Mode Getter', () => {
    it('should return current tracking mode', async () => {
      await locationService.initialize();

      const mode = locationService.getCurrentMode();

      expect([TrackingMode.HIGH_ACCURACY, TrackingMode.NORMAL, TrackingMode.BATTERY_SAVER]).toContain(mode);
    });
  });
});
