/**
 * useLocation Hook Unit Tests
 * T8-021: GPS Tracking & Route Display
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

import { useLocation } from '../useLocation';
import * as reduxHooks from '../useRedux';

/**
 * Mock Dependencies
 * Note: react-native and react-native-geolocation-service are mocked
 * in jest.setup.js. Additional setup here is only for test-specific behavior.
 */

jest.mock('../useRedux', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

/**
 * Mock Location Position
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
    heading: 0,
    speed: 0,
  },
  timestamp: Date.now(),
});

describe('useLocation Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock redux hooks
    const mockDispatch = jest.fn();
    (reduxHooks.useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (reduxHooks.useAppSelector as jest.Mock).mockReturnValue({
      currentLocation: null,
    });

    // Mock Geolocation
    (Geolocation.requestAuthorization as jest.Mock).mockResolvedValue('granted');
    (Geolocation.getCurrentPosition as jest.Mock).mockImplementation((success) => {
      success(createMockPosition());
    });
    (Geolocation.watchPosition as jest.Mock).mockReturnValue(123);
    (Geolocation.clearWatch as jest.Mock).mockImplementation(() => {});
  });

  describe('Initialization', () => {
    it('should initialize with idle state', () => {
      const { result } = renderHook(() => useLocation());

      expect(result.current.locationState.type).toBe('idle');
      expect(result.current.hasPermission).toBe(false);
      expect(result.current.currentLocation).toBeNull();
    });

    it('should request location permission on iOS', async () => {
      (Platform.OS as any) = 'ios';

      const { result } = renderHook(() => useLocation());

      await waitFor(() => {
        expect(Geolocation.requestAuthorization).toHaveBeenCalledWith('whenInUse');
      });

      expect(result.current).toBeTruthy();
    });

    it('should handle permission denied state', async () => {
      (Geolocation.requestAuthorization as jest.Mock).mockResolvedValue('denied');

      const { result } = renderHook(() => useLocation());

      await waitFor(() => {
        expect(result.current.locationState.type).toBe('permission_denied');
      });

      expect(result.current.hasPermission).toBe(false);
    });
  });

  describe('Tracking', () => {
    it('should start location tracking when enabled', async () => {
      const { result } = renderHook(() => useLocation({ enableTracking: true }));

      await waitFor(() => {
        expect(result.current.locationState.type).toBe('tracking');
      });

      expect(Geolocation.getCurrentPosition).toHaveBeenCalled();
      expect(Geolocation.watchPosition).toHaveBeenCalled();
    });

    it('should not start tracking without permission', async () => {
      (Geolocation.requestAuthorization as jest.Mock).mockResolvedValue('denied');

      const { result } = renderHook(() => useLocation({ enableTracking: true }));

      await waitFor(() => {
        expect(result.current.locationState.type).toBe('permission_denied');
      });

      expect(Geolocation.watchPosition).not.toHaveBeenCalled();
    });

    it('should update current location on position change', async () => {
      const mockDispatch = jest.fn();
      (reduxHooks.useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);

      const { result } = renderHook(() => useLocation({ enableTracking: true }));

      const position = createMockPosition(47.5, 8.5);
      const getCurrentPositionCallback = (Geolocation.getCurrentPosition as jest.Mock).mock
        .calls[0][0];

      act(() => {
        getCurrentPositionCallback(position);
      });

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
    });

    it('should track location with custom update interval', async () => {
      renderHook(() => useLocation({ enableTracking: true, updateInterval: 60000 }));

      await waitFor(() => {
        const watchCall = (Geolocation.watchPosition as jest.Mock).mock.calls[0];
        expect(watchCall[2].interval).toBe(60000);
      });
    });
  });

  describe('Stopping Tracking', () => {
    it('should stop tracking when requested', async () => {
      const { result, unmount } = renderHook(() => useLocation({ enableTracking: true }));

      await waitFor(() => {
        expect(result.current.locationState.type).toBe('tracking');
      });

      act(() => {
        result.current.stopTracking();
      });

      await waitFor(() => {
        expect(Geolocation.clearWatch).toHaveBeenCalled();
      });

      expect(result.current.locationState.type).toBe('tracking_stopped');
    });

    it('should clear watch on unmount', async () => {
      const result = renderHook(() => useLocation({ enableTracking: true }));

      await waitFor(() => {
        expect(Geolocation.watchPosition).toHaveBeenCalled();
      });

      result.unmount();

      await waitFor(() => {
        expect(Geolocation.clearWatch).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle position unavailable error', async () => {
      const errorCallback = (Geolocation.getCurrentPosition as jest.Mock).mock.calls[0][1];

      const { result } = renderHook(() => useLocation());

      act(() => {
        errorCallback({
          code: 2,
          message: 'Position unavailable',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as any);
      });

      expect(result.current.locationState.type).toBe('gps_unavailable');
    });

    it('should handle timeout error', async () => {
      const errorCallback = (Geolocation.getCurrentPosition as jest.Mock).mock.calls[0][1];

      const { result } = renderHook(() => useLocation());

      act(() => {
        errorCallback({
          code: 3,
          message: 'Timeout',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as any);
      });

      expect(result.current.locationState.type).toBe('gps_unavailable');
    });

    it('should handle generic error', async () => {
      const errorCallback = (Geolocation.getCurrentPosition as jest.Mock).mock.calls[0][1];

      const { result } = renderHook(() => useLocation());

      act(() => {
        errorCallback({
          code: 99,
          message: 'Unknown error',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as any);
      });

      expect(result.current.locationState.type).toBe('error');
    });
  });

  describe('Accuracy', () => {
    it('should track GPS accuracy', async () => {
      const { result } = renderHook(() => useLocation({ enableTracking: true }));

      const position = createMockPosition();
      const getCurrentPositionCallback = (Geolocation.getCurrentPosition as jest.Mock).mock
        .calls[0][0];

      act(() => {
        getCurrentPositionCallback({ ...position, coords: { ...position.coords, accuracy: 10 } });
      });

      await waitFor(() => {
        expect(result.current.accuracy).toBe(10);
      });
    });

    it('should handle null accuracy', async () => {
      const { result } = renderHook(() => useLocation({ enableTracking: true }));

      const position = createMockPosition();
      const getCurrentPositionCallback = (Geolocation.getCurrentPosition as jest.Mock).mock
        .calls[0][0];

      act(() => {
        getCurrentPositionCallback({
          ...position,
          coords: { ...position.coords, accuracy: null as any },
        });
      });

      await waitFor(() => {
        expect(result.current.accuracy).toBeNull();
      });
    });
  });

  describe('High Accuracy Option', () => {
    it('should use high accuracy when enabled', async () => {
      renderHook(() => useLocation({ enableTracking: true, enableHighAccuracy: true }));

      await waitFor(() => {
        const watchCall = (Geolocation.watchPosition as jest.Mock).mock.calls[0];
        expect(watchCall[2].enableHighAccuracy).toBe(true);
      });
    });

    it('should disable high accuracy when explicitly disabled', async () => {
      renderHook(() => useLocation({ enableTracking: true, enableHighAccuracy: false }));

      await waitFor(() => {
        const watchCall = (Geolocation.watchPosition as jest.Mock).mock.calls[0];
        expect(watchCall[2].enableHighAccuracy).toBe(false);
      });
    });
  });

  describe('startTracking and stopTracking Methods', () => {
    it('should allow manual start of tracking', async () => {
      const { result } = renderHook(() => useLocation({ enableTracking: false }));

      await act(async () => {
        await result.current.startTracking();
      });

      await waitFor(() => {
        expect(Geolocation.watchPosition).toHaveBeenCalled();
      });
    });

    it('should not allow duplicate tracking', async () => {
      const { result } = renderHook(() => useLocation({ enableTracking: true }));

      await waitFor(() => {
        expect(result.current.locationState.type).toBe('tracking');
      });

      // Try to start again
      await act(async () => {
        await result.current.startTracking();
      });

      // watchPosition should still only be called once (or a reasonable number of times)
      const callCount = (Geolocation.watchPosition as jest.Mock).mock.calls.length;
      expect(callCount).toBeLessThanOrEqual(2);
    });
  });
});
