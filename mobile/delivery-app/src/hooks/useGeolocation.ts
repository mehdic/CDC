/**
 * Geolocation Hook
 * Manages GPS tracking with background updates
 */

import { useEffect, useState, useRef } from 'react';
import { Platform, PermissionsAndroid, AppState, AppStateStatus } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

import { setCurrentLocation, updateLocationAsync } from '../store/deliverySlice';
import { Coordinates } from '../types/delivery';

import { useAppDispatch, useAppSelector } from './useRedux';


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
 * Geolocation Hook
 */
export const useGeolocation = (enableTracking: boolean = false, updateInterval: number = 30000) => {
  const dispatch = useAppDispatch();
  const { currentLocation, isTracking } = useAppSelector((state) => state.delivery);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const appState = useRef(AppState.currentState);

  /**
   * Request Permission
   */
  useEffect(() => {
    const checkPermission = async () => {
      const granted = await requestLocationPermission();
      setHasPermission(granted);
      if (!granted) {
        setError('Location permission denied');
      }
    };

    checkPermission();
  }, []);

  /**
   * Start/Stop Tracking
   */
  useEffect(() => {
    if (!hasPermission || !enableTracking || !isTracking) {
      return;
    }

    // Get initial position
    Geolocation.getCurrentPosition(
      (position) => {
        const coords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toISOString(),
        };
        dispatch(setCurrentLocation(coords));
        dispatch(updateLocationAsync(coords));
      },
      (err) => {
        setError(`Location error: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );

    // Watch position with interval
    watchIdRef.current = Geolocation.watchPosition(
      (position) => {
        const coords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toISOString(),
        };
        dispatch(setCurrentLocation(coords));

        // Send to backend every updateInterval
        dispatch(updateLocationAsync(coords));
      },
      (err) => {
        setError(`Location error: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 50, // Update every 50 meters
        interval: updateInterval, // 30 seconds default
        fastestInterval: updateInterval / 2,
        showLocationDialog: true,
      }
    );

    // Cleanup
    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [hasPermission, enableTracking, isTracking, updateInterval, dispatch]);

  /**
   * Handle App State Changes (continue tracking in background)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground - refresh location
        if (hasPermission && isTracking) {
          Geolocation.getCurrentPosition(
            (position) => {
              const coords: Coordinates = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: new Date(position.timestamp).toISOString(),
              };
              dispatch(setCurrentLocation(coords));
            },
            () => {},
            { enableHighAccuracy: true }
          );
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription?.remove();
    };
  }, [hasPermission, isTracking, dispatch]);

  return {
    currentLocation,
    hasPermission,
    error,
  };
};
