/**
 * useOfflineSync Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useOfflineSync } from '../../src/hooks/useOfflineSync';
import deliveryReducer from '../../src/store/deliverySlice';
import authReducer from '../../src/store/authSlice';

// Define mock functions outside to avoid resetMocks issues
const mockAddEventListener = jest.fn();
const mockUpdateDeliveryStatus = jest.fn();
const mockUpdateLocation = jest.fn();
const mockSubmitProofOfDelivery = jest.fn();
const mockAcceptDelivery = jest.fn();

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: (...args: unknown[]) => mockAddEventListener(...args),
}));

// Mock deliveryApi
jest.mock('../../src/services/deliveryApi', () => ({
  updateDeliveryStatus: (...args: unknown[]) => mockUpdateDeliveryStatus(...args),
  updateLocation: (...args: unknown[]) => mockUpdateLocation(...args),
  submitProofOfDelivery: (...args: unknown[]) => mockSubmitProofOfDelivery(...args),
  acceptDelivery: (...args: unknown[]) => mockAcceptDelivery(...args),
}));

const createMockStore = (initialState?: any) =>
  configureStore({
    reducer: {
      auth: authReducer,
      delivery: deliveryReducer,
    },
    preloadedState: initialState,
  });

describe('useOfflineSync', () => {
  beforeEach(() => {
    mockAddEventListener.mockReset();
    mockUpdateDeliveryStatus.mockReset();
    mockUpdateLocation.mockReset();
    mockSubmitProofOfDelivery.mockReset();
    mockAcceptDelivery.mockReset();
  });

  it('should monitor network status', () => {
    const store = createMockStore();
    const wrapper = ({ children }: any) => <Provider store={store}>{children}</Provider>;

    renderHook(() => useOfflineSync(), { wrapper });

    expect(mockAddEventListener).toHaveBeenCalled();
  });

  it('should process sync queue when online', async () => {
    const initialState = {
      delivery: {
        requests: [],
        activeDelivery: null,
        route: null,
        currentLocation: null,
        locationHistory: [],
        isTracking: false,
        stats: null,
        isOnline: true,
        syncQueue: [
          {
            id: 'sync1',
            type: 'status_update' as const,
            data: { id: 'del1', status: 'delivered' },
            timestamp: new Date().toISOString(),
            retryCount: 0,
          },
        ],
      },
      auth: {
        isAuthenticated: true,
        personnel: null,
        token: 'test-token',
        hinEIDVerified: false,
      },
    };

    const store = createMockStore(initialState);
    const wrapper = ({ children }: any) => <Provider store={store}>{children}</Provider>;

    mockUpdateDeliveryStatus.mockResolvedValue({ success: true });

    renderHook(() => useOfflineSync(), { wrapper });

    await waitFor(() => {
      expect(mockUpdateDeliveryStatus).toHaveBeenCalledWith(
        'del1',
        'delivered',
        undefined,
        undefined
      );
    });
  });

  it('should not process queue when offline', async () => {
    const initialState = {
      delivery: {
        requests: [],
        activeDelivery: null,
        route: null,
        currentLocation: null,
        locationHistory: [],
        isTracking: false,
        stats: null,
        isOnline: false,
        syncQueue: [
          {
            id: 'sync1',
            type: 'status_update' as const,
            data: { id: 'del1', status: 'delivered' },
            timestamp: new Date().toISOString(),
            retryCount: 0,
          },
        ],
      },
      auth: {
        isAuthenticated: true,
        personnel: null,
        token: 'test-token',
        hinEIDVerified: false,
      },
    };

    const store = createMockStore(initialState);
    const wrapper = ({ children }: any) => <Provider store={store}>{children}</Provider>;

    renderHook(() => useOfflineSync(), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockUpdateDeliveryStatus).not.toHaveBeenCalled();
  });
});
