/**
 * useOfflineSync Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import NetInfo from '@react-native-community/netinfo';
import { useOfflineSync } from '../../src/hooks/useOfflineSync';
import deliveryReducer from '../../src/store/deliverySlice';
import authReducer from '../../src/store/authSlice';
import deliveryApi from '../../src/services/deliveryApi';

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
}));

// Mock deliveryApi
jest.mock('../../src/services/deliveryApi', () => ({
  updateDeliveryStatus: jest.fn(),
  updateLocation: jest.fn(),
  submitProofOfDelivery: jest.fn(),
  acceptDelivery: jest.fn(),
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
    jest.clearAllMocks();
  });

  it('should monitor network status', () => {
    const store = createMockStore();
    const wrapper = ({ children }: any) => <Provider store={store}>{children}</Provider>;

    renderHook(() => useOfflineSync(), { wrapper });

    expect(NetInfo.addEventListener).toHaveBeenCalled();
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
            type: 'status_update',
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

    (deliveryApi.updateDeliveryStatus as jest.Mock).mockResolvedValue({ success: true });

    renderHook(() => useOfflineSync(), { wrapper });

    await waitFor(() => {
      expect(deliveryApi.updateDeliveryStatus).toHaveBeenCalledWith(
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
            type: 'status_update',
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

    expect(deliveryApi.updateDeliveryStatus).not.toHaveBeenCalled();
  });
});
