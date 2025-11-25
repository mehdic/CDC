/**
 * Delivery Slice Tests
 */

import deliveryReducer, {
  setCurrentLocation,
  startTracking,
  stopTracking,
  setActiveDelivery,
  clearRoute,
  setOnlineStatus,
  addToSyncQueue,
  removeFromSyncQueue,
} from '../../src/store/deliverySlice';
import { DeliveryState, Coordinates, DeliveryRequest, SyncQueueItem } from '../../src/types/delivery';

describe('deliverySlice', () => {
  const initialState: DeliveryState = {
    requests: [],
    activeDelivery: null,
    route: null,
    currentLocation: null,
    locationHistory: [],
    isTracking: false,
    stats: null,
    syncQueue: [],
    isOnline: true,
  };

  it('should handle initial state', () => {
    expect(deliveryReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setCurrentLocation', () => {
    const location: Coordinates = {
      latitude: 46.8182,
      longitude: 8.2275,
      accuracy: 10,
      timestamp: new Date().toISOString(),
    };

    const actual = deliveryReducer(initialState, setCurrentLocation(location));
    expect(actual.currentLocation).toEqual(location);
    expect(actual.locationHistory).toHaveLength(1);
  });

  it('should limit location history to 100 entries', () => {
    let state = initialState;

    // Add 150 locations
    for (let i = 0; i < 150; i++) {
      state = deliveryReducer(
        state,
        setCurrentLocation({
          latitude: 46.8182 + i * 0.001,
          longitude: 8.2275 + i * 0.001,
          timestamp: new Date().toISOString(),
        })
      );
    }

    expect(state.locationHistory).toHaveLength(100);
  });

  it('should handle startTracking', () => {
    const actual = deliveryReducer(initialState, startTracking());
    expect(actual.isTracking).toBe(true);
  });

  it('should handle stopTracking', () => {
    const trackingState = { ...initialState, isTracking: true };
    const actual = deliveryReducer(trackingState, stopTracking());
    expect(actual.isTracking).toBe(false);
  });

  it('should handle setActiveDelivery', () => {
    const delivery: DeliveryRequest = {
      id: '1',
      pharmacyId: 'p1',
      pharmacyName: 'Test Pharmacy',
      patient: {
        id: 'pat1',
        name: 'John Doe',
        phone: '+41791234567',
        address: {
          street: 'Test St',
          city: 'Zurich',
          postalCode: '8000',
          canton: 'ZH',
          country: 'Switzerland',
        },
      },
      packages: [],
      status: 'pending',
      priority: 'medium',
      estimatedDuration: 30,
      distance: 5.2,
      paymentMethod: 'insurance',
      createdAt: new Date().toISOString(),
    };

    const actual = deliveryReducer(initialState, setActiveDelivery(delivery));
    expect(actual.activeDelivery).toEqual(delivery);
  });

  it('should handle clearRoute', () => {
    const stateWithRoute = { ...initialState, route: { id: 'r1' } as any };
    const actual = deliveryReducer(stateWithRoute, clearRoute());
    expect(actual.route).toBeNull();
  });

  it('should handle setOnlineStatus', () => {
    const actual = deliveryReducer(initialState, setOnlineStatus(false));
    expect(actual.isOnline).toBe(false);
  });

  it('should handle addToSyncQueue', () => {
    const queueItem: SyncQueueItem = {
      id: 'sync1',
      type: 'status_update',
      data: { id: '1', status: 'delivered' },
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    const actual = deliveryReducer(initialState, addToSyncQueue(queueItem));
    expect(actual.syncQueue).toHaveLength(1);
    expect(actual.syncQueue[0]).toEqual(queueItem);
  });

  it('should handle removeFromSyncQueue', () => {
    const queueItem: SyncQueueItem = {
      id: 'sync1',
      type: 'status_update',
      data: {},
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    const stateWithQueue = { ...initialState, syncQueue: [queueItem] };
    const actual = deliveryReducer(stateWithQueue, removeFromSyncQueue('sync1'));
    expect(actual.syncQueue).toHaveLength(0);
  });
});
