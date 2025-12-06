/**
 * useGeolocation Hook Tests
 */

import { renderHook, act } from '@testing-library/react-native';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Geolocation from 'react-native-geolocation-service';
import { useGeolocation } from '../../src/hooks/useGeolocation';
import deliveryReducer from '../../src/store/deliverySlice';
import authReducer from '../../src/store/authSlice';

// Mock Geolocation
jest.mock('react-native-geolocation-service', () => ({
  requestAuthorization: jest.fn(),
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
}));

// Mock PermissionsAndroid
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  PermissionsAndroid: {
    PERMISSIONS: { ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION' },
    RESULTS: { GRANTED: 'granted' },
    request: jest.fn(),
  },
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

const createMockStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      delivery: deliveryReducer,
    },
  });

describe('useGeolocation', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    store = createMockStore();
    jest.clearAllMocks();
    (Geolocation.requestAuthorization as jest.Mock).mockResolvedValue('granted');
  });

  it('should request location permission', async () => {
    const wrapper = ({ children }: any) => <Provider store={store}>{children}</Provider>;

    renderHook(() => useGeolocation(false), { wrapper });

    expect(Geolocation.requestAuthorization).toHaveBeenCalledWith('whenInUse');
  });

  it('should return permission denied error when not granted', async () => {
    (Geolocation.requestAuthorization as jest.Mock).mockResolvedValue('denied');

    const wrapper = ({ children }: any) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useGeolocation(false), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.hasPermission).toBe(false);
    expect(result.current.error).toBe('Location permission denied');
  });

  it('should start tracking when enabled', async () => {
    (Geolocation.requestAuthorization as jest.Mock).mockResolvedValue('granted');
    (Geolocation.getCurrentPosition as jest.Mock).mockImplementation((success) => {
      success({
        coords: { latitude: 46.8182, longitude: 8.2275, accuracy: 10 },
        timestamp: Date.now(),
      });
    });
    (Geolocation.watchPosition as jest.Mock).mockReturnValue(1);

    const wrapper = ({ children }: any) => <Provider store={store}>{children}</Provider>;

    // Enable tracking in store
    store.dispatch({ type: 'delivery/startTracking' });

    renderHook(() => useGeolocation(true, 30000), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(Geolocation.getCurrentPosition).toHaveBeenCalled();
    expect(Geolocation.watchPosition).toHaveBeenCalled();
  });

  it('should clear watch on unmount', async () => {
    (Geolocation.requestAuthorization as jest.Mock).mockResolvedValue('granted');
    (Geolocation.watchPosition as jest.Mock).mockReturnValue(1);

    const wrapper = ({ children }: any) => <Provider store={store}>{children}</Provider>;

    store.dispatch({ type: 'delivery/startTracking' });

    const { unmount } = renderHook(() => useGeolocation(true), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    unmount();

    expect(Geolocation.clearWatch).toHaveBeenCalledWith(1);
  });
});
