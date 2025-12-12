/**
 * useLocation Hook
 * T8-021: GPS Tracking & Route Display
 * Manages location tracking with error handling and battery optimization
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid, AppState, AppStateStatus } from 'react-native';
import { Coordinates } from '../types/delivery';
import { useAppDispatch, useAppSelector } from './useRedux';
import { setCurrentLocation, updateLocationAsync } from '../store/deliverySlice';

/**
 * Location state with discriminated union
 */
export type LocationState =
  | { type: 'idle' }
  | { type: 'requesting_permission' }
  | { type: 'permission_denied'; reason: string }
  | { type: 'tracking'; location: Coordinates | null }
  | { type: 'tracking_stopped' }
  | { type: 'gps_unavailable'; lastKnownLocation: Coordinates | null }
  | { type: 'error'; error: Error };

/**
 * Location Hook Options
 */
interface UseLocationOptions {
  enableTracking?: boolean;
  updateInterval?: number;
  distanceFilter?: number;
  enableHighAccuracy?: boolean;
  timeout?: number;
}

/**
 * Location Hook Return Type
 */
interface UseLocationReturn {
  currentLocation: Coordinates | null;
  locationState: LocationState;
  accuracy: number | null;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  hasPermission: boolean;
}

/**
 * Location Permission Request
 */
const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    const auth = await Geolocation.requestAuthorization('whenInUse');
    return auth === 'granted';
  }

  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  return false;
};

/**
 * useLocation Hook
 */
export const useLocation = (options: UseLocationOptions = {}): UseLocationReturn => {
  const {
    enableTracking = false,
    updateInterval = 30000,
    distanceFilter = 50,
    enableHighAccuracy = true,
    timeout = 15000,
  } = options;

  const dispatch = useAppDispatch();
  const { currentLocation } = useAppSelector((state) => state.delivery);

  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [locationState, setLocationState] = useState<LocationState>({ type: 'idle' });
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const isTrackingRef = useRef(false);
  const lastLocationRef = useRef<Coordinates | null>(null);

  /**
   * Request Location Permission
   */
  useEffect(() => {
    const checkPermission = async () => {
      try {
        setLocationState({ type: 'requesting_permission' });
        const granted = await requestLocationPermission();
        setHasPermission(granted);

        if (!granted) {
          setLocationState({
            type: 'permission_denied',
            reason: 'User denied location permission',
          });
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setLocationState({ type: 'error', error: err });
      }
    };

    checkPermission();
  }, []);

  /**
   * Handle Location Update
   */
  const handleLocationUpdate = useCallback(
    (position: Geolocation.GeoPosition) => {
      const coords: Coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? undefined,
        speed: position.coords.speed ?? undefined,
        heading: position.coords.heading ?? undefined,
        timestamp: new Date(position.timestamp).toISOString(),
      };

      lastLocationRef.current = coords;
      setAccuracy(position.coords.accuracy ?? null);
      dispatch(setCurrentLocation(coords));
      dispatch(updateLocationAsync(coords));
      setLocationState({ type: 'tracking', location: coords });
    },
    [dispatch]
  );

  /**
   * Handle Location Error
   */
  const handleLocationError = useCallback((error: Geolocation.GeoError) => {
    console.error('[useLocation] Location error:', error);

    if (error.code === 1) {
      // Permission denied
      setLocationState({
        type: 'permission_denied',
        reason: error.message,
      });
    } else if (error.code === 2) {
      // Position unavailable
      setLocationState({
        type: 'gps_unavailable',
        lastKnownLocation: lastLocationRef.current,
      });
    } else if (error.code === 3) {
      // Timeout
      setLocationState({
        type: 'gps_unavailable',
        lastKnownLocation: lastLocationRef.current,
      });
    } else {
      setLocationState({
        type: 'error',
        error: new Error(error.message || 'Unknown location error'),
      });
    }
  }, []);

  /**
   * Start Tracking
   */
  const startTracking = useCallback(async () => {
    if (!hasPermission) {
      setLocationState({
        type: 'permission_denied',
        reason: 'Location permission not granted',
      });
      return;
    }

    if (isTrackingRef.current) {
      console.warn('[useLocation] Already tracking');
      return;
    }

    try {
      isTrackingRef.current = true;
      setLocationState({ type: 'tracking', location: null });

      // Get initial position
      Geolocation.getCurrentPosition(
        handleLocationUpdate,
        handleLocationError,
        {
          enableHighAccuracy,
          timeout,
          maximumAge: 10000,
        }
      );

      // Start watching position
      watchIdRef.current = Geolocation.watchPosition(
        handleLocationUpdate,
        handleLocationError,
        {
          enableHighAccuracy,
          distanceFilter,
          interval: updateInterval,
          fastestInterval: updateInterval / 2,
          showLocationDialog: true,
        }
      );

      console.log('[useLocation] Location tracking started');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setLocationState({ type: 'error', error: err });
      isTrackingRef.current = false;
    }
  }, [hasPermission, handleLocationUpdate, handleLocationError, enableHighAccuracy, timeout, distanceFilter, updateInterval]);

  /**
   * Stop Tracking
   */
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    isTrackingRef.current = false;
    setLocationState({ type: 'tracking_stopped' });
    console.log('[useLocation] Location tracking stopped');
  }, []);

  /**
   * Start/Stop Tracking Based on enableTracking Option
   */
  useEffect(() => {
    if (enableTracking && hasPermission && !isTrackingRef.current) {
      startTracking();
    } else if (!enableTracking && isTrackingRef.current) {
      stopTracking();
    }

    return () => {
      if (isTrackingRef.current) {
        stopTracking();
      }
    };
  }, [enableTracking, hasPermission, startTracking, stopTracking]);

  /**
   * Handle App State Changes (Continue tracking in background)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        isTrackingRef.current &&
        hasPermission
      ) {
        // App came to foreground - refresh location
        Geolocation.getCurrentPosition(
          handleLocationUpdate,
          handleLocationError,
          { enableHighAccuracy, timeout }
        );
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription?.remove();
    };
  }, [hasPermission, handleLocationUpdate, handleLocationError, enableHighAccuracy, timeout]);

  return {
    currentLocation,
    locationState,
    accuracy,
    startTracking,
    stopTracking,
    hasPermission,
  };
};
