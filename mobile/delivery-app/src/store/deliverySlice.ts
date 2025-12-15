/**
 * Delivery Redux Slice
 * Manages delivery requests, routes, and tracking state
 */

import NetInfo from '@react-native-community/netinfo';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import deliveryApi from '../services/deliveryApi';
import {
  DeliveryState,
  DeliveryRequest,
  DeliveryRoute,
  Coordinates,
  DeliveryStats,
  SyncQueueItem,
  DeliveryStatus,
  ProofOfDelivery,
} from '../types/delivery';

/**
 * Initial State
 */
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

/**
 * Async Thunks
 */
export const fetchAvailableRequests = createAsyncThunk(
  'delivery/fetchAvailable',
  async (filters: { radius?: number; maxDistance?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await deliveryApi.getAvailableRequests(filters);
      if (response.success && response.data) {
        return response.data.items;
      }
      return rejectWithValue(response.error || 'Failed to fetch requests');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMyDeliveries = createAsyncThunk(
  'delivery/fetchMy',
  async (status: DeliveryStatus | undefined, { rejectWithValue }) => {
    try {
      const response = await deliveryApi.getMyDeliveries(status);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue(response.error || 'Failed to fetch deliveries');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const acceptDeliveryAsync = createAsyncThunk(
  'delivery/accept',
  async (deliveryId: string, { rejectWithValue }) => {
    try {
      const response = await deliveryApi.acceptDelivery(deliveryId);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue(response.error || 'Failed to accept delivery');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateDeliveryStatusAsync = createAsyncThunk(
  'delivery/updateStatus',
  async (
    {
      id,
      status,
      location,
      notes,
    }: {
      id: string;
      status: DeliveryStatus;
      location?: Coordinates;
      notes?: string;
    },
    { rejectWithValue, getState }
  ) => {
    const state = getState() as { delivery: DeliveryState };

    // If offline, queue the update
    if (!state.delivery.isOnline) {
      return { id, status, queued: true };
    }

    try {
      const response = await deliveryApi.updateDeliveryStatus(id, status, location, notes);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue(response.error || 'Failed to update status');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const submitProofOfDeliveryAsync = createAsyncThunk(
  'delivery/submitProof',
  async (
    { deliveryId, proof }: { deliveryId: string; proof: ProofOfDelivery },
    { rejectWithValue, getState }
  ) => {
    const state = getState() as { delivery: DeliveryState };

    // If offline, queue the submission
    if (!state.delivery.isOnline) {
      return { deliveryId, queued: true };
    }

    try {
      const response = await deliveryApi.submitProofOfDelivery(deliveryId, proof);
      if (response.success) {
        return { deliveryId, success: true };
      }
      return rejectWithValue(response.error || 'Failed to submit proof');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchStatsAsync = createAsyncThunk(
  'delivery/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const [todayRes, weekRes, monthRes] = await Promise.all([
        deliveryApi.getStats('today'),
        deliveryApi.getStats('week'),
        deliveryApi.getStats('month'),
      ]);

      if (todayRes.success && weekRes.success && monthRes.success) {
        return {
          today: todayRes.data!,
          week: weekRes.data!,
          month: monthRes.data!,
        };
      }
      return rejectWithValue('Failed to fetch stats');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const optimizeRouteAsync = createAsyncThunk(
  'delivery/optimizeRoute',
  async (deliveryIds: string[], { rejectWithValue }) => {
    try {
      const response = await deliveryApi.getOptimizedRoute(deliveryIds);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue(response.error || 'Failed to optimize route');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateLocationAsync = createAsyncThunk(
  'delivery/updateLocation',
  async (location: Coordinates, { getState, rejectWithValue }) => {
    const state = getState() as { delivery: DeliveryState };

    // If offline, queue the update
    if (!state.delivery.isOnline) {
      return { location, queued: true };
    }

    try {
      await deliveryApi.updateLocation(location);
      return { location, queued: false };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Delivery Slice
 */
const deliverySlice = createSlice({
  name: 'delivery',
  initialState,
  reducers: {
    setCurrentLocation: (state, action: PayloadAction<Coordinates>) => {
      state.currentLocation = action.payload;
      state.locationHistory.push(action.payload);

      // Keep only last 100 locations
      if (state.locationHistory.length > 100) {
        state.locationHistory = state.locationHistory.slice(-100);
      }
    },
    startTracking: (state) => {
      state.isTracking = true;
    },
    stopTracking: (state) => {
      state.isTracking = false;
    },
    setActiveDelivery: (state, action: PayloadAction<DeliveryRequest | null>) => {
      state.activeDelivery = action.payload;
    },
    clearRoute: (state) => {
      state.route = null;
    },
    updateRouteProgress: (state, action: PayloadAction<number>) => {
      if (state.route) {
        state.route.currentWaypointIndex = action.payload;
      }
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    addToSyncQueue: (state, action: PayloadAction<SyncQueueItem>) => {
      state.syncQueue.push(action.payload);
    },
    removeFromSyncQueue: (state, action: PayloadAction<string>) => {
      state.syncQueue = state.syncQueue.filter((item) => item.id !== action.payload);
    },
    clearSyncQueue: (state) => {
      state.syncQueue = [];
    },
    updateDeliveryInList: (state, action: PayloadAction<DeliveryRequest>) => {
      const index = state.requests.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.requests[index] = action.payload;
      }
      if (state.activeDelivery?.id === action.payload.id) {
        state.activeDelivery = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Available Requests
    builder.addCase(fetchAvailableRequests.fulfilled, (state, action) => {
      state.requests = action.payload;
    });

    // Fetch My Deliveries
    builder.addCase(fetchMyDeliveries.fulfilled, (state, action) => {
      state.requests = action.payload;
    });

    // Accept Delivery
    builder.addCase(acceptDeliveryAsync.fulfilled, (state, action) => {
      state.activeDelivery = action.payload;
      const index = state.requests.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.requests[index] = action.payload;
      }
    });

    // Update Status
    builder.addCase(updateDeliveryStatusAsync.fulfilled, (state, action: any) => {
      if (action.payload.queued) {
        // Add to sync queue
        state.syncQueue.push({
          id: `status_${action.payload.id}_${Date.now()}`,
          type: 'status_update',
          data: action.payload,
          timestamp: new Date().toISOString(),
          retryCount: 0,
        });
      } else {
        // Update in store
        const index = state.requests.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.requests[index] = action.payload;
        }
        if (state.activeDelivery?.id === action.payload.id) {
          state.activeDelivery = action.payload;
        }
      }
    });

    // Fetch Stats
    builder.addCase(fetchStatsAsync.fulfilled, (state, action: any) => {
      state.stats = action.payload;
    });

    // Optimize Route
    builder.addCase(optimizeRouteAsync.fulfilled, (state, action) => {
      state.route = action.payload;
    });

    // Update Location
    builder.addCase(updateLocationAsync.fulfilled, (state, action: any) => {
      if (action.payload.queued) {
        state.syncQueue.push({
          id: `location_${Date.now()}`,
          type: 'location_update',
          data: action.payload.location,
          timestamp: new Date().toISOString(),
          retryCount: 0,
        });
      }
      state.currentLocation = action.payload.location;
    });
  },
});

export const {
  setCurrentLocation,
  startTracking,
  stopTracking,
  setActiveDelivery,
  clearRoute,
  updateRouteProgress,
  setOnlineStatus,
  addToSyncQueue,
  removeFromSyncQueue,
  clearSyncQueue,
  updateDeliveryInList,
} = deliverySlice.actions;

export default deliverySlice.reducer;
