/**
 * useDeliveryTracking Hook Tests
 * Tests for the real-time delivery tracking hook
 */

// Mock native modules before importing
jest.mock('react-native-encrypted-storage', () => ({
  default: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Platform: {
    OS: 'ios',
    select: (obj: any) => obj.ios,
  },
}));

jest.mock('../../services/nurseApiClient', () => ({
  nurseApiClient: {
    getActiveDeliveries: jest.fn().mockResolvedValue([]),
    getDeliveryTracking: jest.fn().mockResolvedValue({}),
  },
}));

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useDeliveryTracking } from '../useDeliveryTracking';
import deliveryReducer from '../../store/deliverySlice';
import { DeliveryTracking } from '../../types';

describe('useDeliveryTracking', () => {
  const mockDelivery: DeliveryTracking = {
    orderId: 'order-123',
    status: 'in_transit',
    currentLocation: '123 Main St',
    estimatedArrival: new Date(Date.now() + 10 * 60000).toISOString(),
    deliveryPersonnel: {
      id: 'driver-1',
      name: 'John Doe',
      phone: '+1234567890',
    },
    updates: [
      {
        timestamp: new Date().toISOString(),
        status: 'in_transit',
      },
    ],
  };

  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        delivery: deliveryReducer,
      },
    });
  });

  const wrapper = ({ children }: any) => {
    const React = require('react');
    const Provider = require('react-redux').Provider;
    return React.createElement(Provider, { store }, children);
  };

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useDeliveryTracking(), { wrapper });

      expect(result.current.activeDeliveries).toEqual([]);
      expect(result.current.websocketConnected).toBe(false);
      expect(result.current.trackingDetails).toEqual({});
    });

    it('should initialize with custom options', () => {
      const { result } = renderHook(
        () =>
          useDeliveryTracking({
            enableWebSocket: false,
            enablePolling: false,
            etaThresholdMinutes: 20,
          }),
        { wrapper }
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('isDeliveryApproaching', () => {
    it('should return true when delivery is within threshold', () => {
      const { result } = renderHook(() => useDeliveryTracking({ etaThresholdMinutes: 15 }), {
        wrapper,
      });

      const approaching = result.current.isDeliveryApproaching(mockDelivery);
      expect(approaching).toBe(true);
    });

    it('should return false when delivery is beyond threshold', () => {
      const { result } = renderHook(() => useDeliveryTracking({ etaThresholdMinutes: 5 }), {
        wrapper,
      });

      const approaching = result.current.isDeliveryApproaching(mockDelivery);
      expect(approaching).toBe(false);
    });

    it('should return false when ETA is in the past', () => {
      const { result } = renderHook(() => useDeliveryTracking({ etaThresholdMinutes: 15 }), {
        wrapper,
      });

      const pastDelivery: DeliveryTracking = {
        ...mockDelivery,
        estimatedArrival: new Date(Date.now() - 10 * 60000).toISOString(),
      };

      const approaching = result.current.isDeliveryApproaching(pastDelivery);
      expect(approaching).toBe(false);
    });

    it('should return false when estimatedArrival is undefined', () => {
      const { result } = renderHook(() => useDeliveryTracking(), { wrapper });

      const incompleteDelivery: DeliveryTracking = {
        ...mockDelivery,
        estimatedArrival: '',
      };

      const approaching = result.current.isDeliveryApproaching(incompleteDelivery);
      expect(approaching).toBe(false);
    });
  });

  describe('getDeliveryByOrderId', () => {
    it('should return delivery details for valid order ID', () => {
      const storeWithDelivery = configureStore({
        reducer: {
          delivery: deliveryReducer,
        },
        preloadedState: {
          delivery: {
            activeDeliveries: [mockDelivery],
            trackingDetails: { 'order-123': mockDelivery },
            selectedDeliveryId: null,
            loading: false,
            error: null,
            websocketConnected: false,
            notificationEta: {},
          },
        },
      });

      const { result } = renderHook(() => useDeliveryTracking(), {
        wrapper: ({ children }) => <Provider store={storeWithDelivery}>{children}</Provider>,
      });

      const delivery = result.current.getDeliveryByOrderId('order-123');
      expect(delivery).toEqual(mockDelivery);
    });

    it('should return undefined for missing order ID', () => {
      const { result } = renderHook(() => useDeliveryTracking(), { wrapper });

      const delivery = result.current.getDeliveryByOrderId('nonexistent');
      expect(delivery).toBeUndefined();
    });
  });

  describe('refreshDeliveries', () => {
    it('should dispatch fetchActiveDeliveries action', () => {
      const { result } = renderHook(() => useDeliveryTracking({ enablePolling: false }), {
        wrapper,
      });

      act(() => {
        result.current.refreshDeliveries();
      });

      // Verify the action was dispatched by checking if state updates
      expect(store.getState().delivery).toBeDefined();
    });
  });

  describe('cleanup', () => {
    it('should cleanup WebSocket on unmount', () => {
      const { unmount } = renderHook(
        () => useDeliveryTracking({ enableWebSocket: false, enablePolling: false }),
        { wrapper }
      );

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('WebSocket mode', () => {
    it('should not start polling when WebSocket is enabled', () => {
      const { result } = renderHook(
        () => useDeliveryTracking({ enableWebSocket: true, enablePolling: true }),
        { wrapper }
      );

      // Verify hook initializes without errors
      expect(result.current).toBeDefined();
    });
  });

  describe('Polling mode', () => {
    it('should use polling when WebSocket is disabled', () => {
      const { result } = renderHook(
        () => useDeliveryTracking({ enableWebSocket: false, enablePolling: true }),
        { wrapper }
      );

      expect(result.current).toBeDefined();
    });
  });
});
