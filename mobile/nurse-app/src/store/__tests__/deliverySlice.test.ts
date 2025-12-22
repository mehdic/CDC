/**
 * Delivery Slice Tests
 * Unit tests for delivery Redux slice
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

import deliveryReducer, {
  selectDelivery,
  updateDeliveryTracking,
  markEtaNotificationTriggered,
  setWebsocketConnected,
  clearError,
  removeActiveDelivery,
  resetDeliveryState,
  fetchActiveDeliveries,
  fetchDeliveryTracking,
} from '../deliverySlice';
import { DeliveryTracking } from '../../types';

describe('deliverySlice', () => {
  const initialState = {
    activeDeliveries: [],
    trackingDetails: {},
    selectedDeliveryId: null,
    loading: false,
    error: null,
    websocketConnected: false,
    notificationEta: {},
  };

  const mockDelivery: DeliveryTracking = {
    orderId: 'order-123',
    status: 'in_transit',
    currentLocation: '123 Main St',
    estimatedArrival: new Date(Date.now() + 15 * 60000).toISOString(),
    deliveryPersonnel: {
      id: 'driver-1',
      name: 'John Doe',
      phone: '+1234567890',
    },
    updates: [
      {
        timestamp: new Date().toISOString(),
        status: 'in_transit',
        location: '123 Main St',
      },
    ],
  };

  describe('reducers', () => {
    it('should return initial state', () => {
      const state = deliveryReducer(undefined, { type: 'unknown' });
      expect(state).toEqual(initialState);
    });

    describe('selectDelivery', () => {
      it('should set selectedDeliveryId', () => {
        const state = deliveryReducer(initialState, selectDelivery('order-123'));
        expect(state.selectedDeliveryId).toBe('order-123');
      });

      it('should clear selectedDeliveryId when null', () => {
        const state = deliveryReducer(
          { ...initialState, selectedDeliveryId: 'order-123' },
          selectDelivery(null)
        );
        expect(state.selectedDeliveryId).toBeNull();
      });
    });

    describe('updateDeliveryTracking', () => {
      it('should add new delivery to activeDeliveries', () => {
        const state = deliveryReducer(initialState, updateDeliveryTracking(mockDelivery));
        expect(state.activeDeliveries).toHaveLength(1);
        expect(state.activeDeliveries[0]).toEqual(mockDelivery);
        expect(state.trackingDetails['order-123']).toEqual(mockDelivery);
      });

      it('should update existing delivery', () => {
        const stateWithDelivery = {
          ...initialState,
          activeDeliveries: [mockDelivery],
          trackingDetails: { 'order-123': mockDelivery },
        };

        const updatedDelivery: DeliveryTracking = {
          ...mockDelivery,
          status: 'arrived',
        };

        const state = deliveryReducer(stateWithDelivery, updateDeliveryTracking(updatedDelivery));
        expect(state.activeDeliveries[0].status).toBe('arrived');
        expect(state.trackingDetails['order-123'].status).toBe('arrived');
      });

      it('should clear error on successful update', () => {
        const stateWithError = {
          ...initialState,
          error: 'Previous error',
        };

        const state = deliveryReducer(stateWithError, updateDeliveryTracking(mockDelivery));
        expect(state.error).toBeNull();
      });
    });

    describe('markEtaNotificationTriggered', () => {
      it('should mark ETA notification as triggered', () => {
        const state = deliveryReducer(initialState, markEtaNotificationTriggered('order-123'));
        expect(state.notificationEta['order-123']).toBe(true);
      });
    });

    describe('setWebsocketConnected', () => {
      it('should set websocket connected status', () => {
        const state = deliveryReducer(initialState, setWebsocketConnected(true));
        expect(state.websocketConnected).toBe(true);
      });

      it('should set websocket disconnected', () => {
        const connectedState = {
          ...initialState,
          websocketConnected: true,
        };
        const state = deliveryReducer(connectedState, setWebsocketConnected(false));
        expect(state.websocketConnected).toBe(false);
      });
    });

    describe('clearError', () => {
      it('should clear error message', () => {
        const stateWithError = {
          ...initialState,
          error: 'Some error',
        };
        const state = deliveryReducer(stateWithError, clearError());
        expect(state.error).toBeNull();
      });
    });

    describe('removeActiveDelivery', () => {
      it('should remove delivery from activeDeliveries', () => {
        const stateWithDelivery = {
          ...initialState,
          activeDeliveries: [mockDelivery],
        };
        const state = deliveryReducer(stateWithDelivery, removeActiveDelivery('order-123'));
        expect(state.activeDeliveries).toHaveLength(0);
      });

      it('should clear selectedDeliveryId if it matches', () => {
        const stateWithSelection = {
          ...initialState,
          activeDeliveries: [mockDelivery],
          selectedDeliveryId: 'order-123',
        };
        const state = deliveryReducer(stateWithSelection, removeActiveDelivery('order-123'));
        expect(state.selectedDeliveryId).toBeNull();
      });

      it('should keep selectedDeliveryId if different', () => {
        const stateWithSelection = {
          ...initialState,
          activeDeliveries: [mockDelivery],
          selectedDeliveryId: 'order-456',
        };
        const state = deliveryReducer(stateWithSelection, removeActiveDelivery('order-123'));
        expect(state.selectedDeliveryId).toBe('order-456');
      });
    });

    describe('resetDeliveryState', () => {
      it('should reset to initial state', () => {
        const complexState = {
          activeDeliveries: [mockDelivery],
          trackingDetails: { 'order-123': mockDelivery },
          selectedDeliveryId: 'order-123',
          loading: true,
          error: 'Some error',
          websocketConnected: true,
          notificationEta: { 'order-123': true },
        };
        const state = deliveryReducer(complexState as any, resetDeliveryState());
        expect(state.activeDeliveries).toEqual([]);
        expect(state.trackingDetails).toEqual({});
        expect(state.selectedDeliveryId).toBeNull();
        expect(state.loading).toBe(false);
        expect(state.error).toBeNull();
        expect(state.websocketConnected).toBe(false);
        expect(state.notificationEta).toEqual({});
      });
    });
  });

  describe('async thunks', () => {
    describe('fetchActiveDeliveries', () => {
      it('should set loading on pending', () => {
        const action = { type: fetchActiveDeliveries.pending };
        const state = deliveryReducer(initialState, action);
        expect(state.loading).toBe(true);
        expect(state.error).toBeNull();
      });

      it('should populate deliveries on fulfilled', () => {
        const action = {
          type: fetchActiveDeliveries.fulfilled,
          payload: [mockDelivery],
        };
        const state = deliveryReducer(initialState, action);
        expect(state.loading).toBe(false);
        expect(state.activeDeliveries).toEqual([mockDelivery]);
        expect(state.trackingDetails['order-123']).toEqual(mockDelivery);
      });

      it('should set error on rejected', () => {
        const action = {
          type: fetchActiveDeliveries.rejected,
          payload: 'Failed to fetch',
        };
        const state = deliveryReducer(initialState, action);
        expect(state.loading).toBe(false);
        expect(state.error).toBe('Failed to fetch');
      });
    });

    describe('fetchDeliveryTracking', () => {
      it('should set loading on pending', () => {
        const action = { type: fetchDeliveryTracking.pending };
        const state = deliveryReducer(initialState, action);
        expect(state.loading).toBe(true);
      });

      it('should update tracking details on fulfilled', () => {
        const action = {
          type: fetchDeliveryTracking.fulfilled,
          payload: { orderId: 'order-123', tracking: mockDelivery },
        };
        const state = deliveryReducer(initialState, action);
        expect(state.loading).toBe(false);
        expect(state.trackingDetails['order-123']).toEqual(mockDelivery);
        expect(state.error).toBeNull();
      });

      it('should set error on rejected', () => {
        const action = {
          type: fetchDeliveryTracking.rejected,
          payload: 'Failed to fetch tracking',
        };
        const state = deliveryReducer(initialState, action);
        expect(state.loading).toBe(false);
        expect(state.error).toBe('Failed to fetch tracking');
      });
    });
  });
});
