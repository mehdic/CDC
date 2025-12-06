/**
 * useGeolocation Hook Tests
 */

import { renderHook, act } from '@testing-library/react-native';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useGeolocation } from '../../src/hooks/useGeolocation';
import deliveryReducer from '../../src/store/deliverySlice';
import authReducer from '../../src/store/authSlice';

// Define mock functions outside to avoid resetMocks issues
const mockRequestAuthorization = jest.fn();
const mockGetCurrentPosition = jest.fn();
const mockWatchPosition = jest.fn();
const mockClearWatch = jest.fn();

// Mock Geolocation
jest.mock('react-native-geolocation-service', () => ({
  requestAuthorization: (...args: unknown[]) => mockRequestAuthorization(...args),
  getCurrentPosition: (...args: unknown[]) => mockGetCurrentPosition(...args),
  watchPosition: (...args: unknown[]) => mockWatchPosition(...args),
  clearWatch: (...args: unknown[]) => mockClearWatch(...args),
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
    mockRequestAuthorization.mockReset();
    mockGetCurrentPosition.mockReset();
    mockWatchPosition.mockReset();
    mockClearWatch.mockReset();
    mockRequestAuthorization.mockResolvedValue('granted');
  });

  it('should request location permission', async () => {
    const wrapper = ({ children }: any) => <Provider store={store}>{children}</Provider>;

    renderHook(() => useGeolocation(false), { wrapper });

    expect(mockRequestAuthorization).toHaveBeenCalledWith('whenInUse');
  });

  it('should return permission denied error when not granted', async () => {
    mockRequestAuthorization.mockResolvedValue('denied');

    const wrapper = ({ children }: any) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useGeolocation(false), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.hasPermission).toBe(false);
    expect(result.current.error).toBe('Location permission denied');
  });

  it('should start tracking when enabled', async () => {
    mockRequestAuthorization.mockResolvedValue('granted');
    mockGetCurrentPosition.mockImplementation((success: (position: any) => void) => {
      success({
        coords: { latitude: 46.8182, longitude: 8.2275, accuracy: 10 },
        timestamp: Date.now(),
      });
    });
    mockWatchPosition.mockReturnValue(1);

    const wrapper = ({ children }: any) => <Provider store={store}>{children}</Provider>;

    // Enable tracking in store
    store.dispatch({ type: 'delivery/startTracking' });

    renderHook(() => useGeolocation(true, 30000), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(mockGetCurrentPosition).toHaveBeenCalled();
    expect(mockWatchPosition).toHaveBeenCalled();
  });

  it('should clear watch on unmount', async () => {
    mockRequestAuthorization.mockResolvedValue('granted');
    mockWatchPosition.mockReturnValue(1);

    const wrapper = ({ children }: any) => <Provider store={store}>{children}</Provider>;

    store.dispatch({ type: 'delivery/startTracking' });

    const { unmount } = renderHook(() => useGeolocation(true), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    unmount();

    expect(mockClearWatch).toHaveBeenCalledWith(1);
  });
});
