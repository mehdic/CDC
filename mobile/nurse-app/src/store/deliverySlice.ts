/**
 * Delivery Slice
 * Redux state management for delivery tracking
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DeliveryTracking, MedicationOrder } from '../types';
import { nurseApiClient } from '../services/nurseApiClient';

export interface DeliveryState {
  activeDeliveries: DeliveryTracking[];
  trackingDetails: Record<string, DeliveryTracking>;
  selectedDeliveryId: string | null;
  loading: boolean;
  error: string | null;
  websocketConnected: boolean;
  notificationEta: Record<string, boolean>; // Track which deliveries have triggered ETA notifications
}

const initialState: DeliveryState = {
  activeDeliveries: [],
  trackingDetails: {},
  selectedDeliveryId: null,
  loading: false,
  error: null,
  websocketConnected: false,
  notificationEta: {},
};

/**
 * Async thunk to fetch active deliveries
 */
export const fetchActiveDeliveries = createAsyncThunk(
  'delivery/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const deliveries = await nurseApiClient.getActiveDeliveries();
      return deliveries;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch active deliveries');
    }
  }
);

/**
 * Async thunk to fetch delivery tracking details for a specific order
 */
export const fetchDeliveryTracking = createAsyncThunk(
  'delivery/fetchTracking',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const tracking = await nurseApiClient.getDeliveryTracking(orderId);
      return { orderId, tracking };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch delivery tracking');
    }
  }
);

const deliverySlice = createSlice({
  name: 'delivery',
  initialState,
  reducers: {
    /**
     * Select a delivery to view details
     */
    selectDelivery: (state, action: PayloadAction<string | null>) => {
      state.selectedDeliveryId = action.payload;
    },

    /**
     * Update delivery tracking data from WebSocket
     */
    updateDeliveryTracking: (state, action: PayloadAction<DeliveryTracking>) => {
      const delivery = action.payload;
      state.trackingDetails[delivery.orderId] = delivery;

      // Update in active deliveries list
      const index = state.activeDeliveries.findIndex(d => d.orderId === delivery.orderId);
      if (index !== -1) {
        state.activeDeliveries[index] = delivery;
      } else {
        state.activeDeliveries.push(delivery);
      }

      state.error = null;
    },

    /**
     * Mark ETA notification as triggered for a delivery
     */
    markEtaNotificationTriggered: (state, action: PayloadAction<string>) => {
      state.notificationEta[action.payload] = true;
    },

    /**
     * Set WebSocket connection status
     */
    setWebsocketConnected: (state, action: PayloadAction<boolean>) => {
      state.websocketConnected = action.payload;
    },

    /**
     * Clear error message
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Remove a completed delivery from active list
     */
    removeActiveDelivery: (state, action: PayloadAction<string>) => {
      state.activeDeliveries = state.activeDeliveries.filter(d => d.orderId !== action.payload);
      if (state.selectedDeliveryId === action.payload) {
        state.selectedDeliveryId = null;
      }
    },

    /**
     * Reset delivery state
     */
    resetDeliveryState: (state) => {
      state.activeDeliveries = [];
      state.trackingDetails = {};
      state.selectedDeliveryId = null;
      state.loading = false;
      state.error = null;
      state.websocketConnected = false;
      state.notificationEta = {};
    },
  },

  extraReducers: (builder) => {
    // Fetch active deliveries
    builder
      .addCase(fetchActiveDeliveries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveDeliveries.fulfilled, (state, action) => {
        state.loading = false;
        state.activeDeliveries = action.payload;
        // Populate tracking details
        action.payload.forEach(delivery => {
          state.trackingDetails[delivery.orderId] = delivery;
        });
      })
      .addCase(fetchActiveDeliveries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch delivery tracking for specific order
    builder
      .addCase(fetchDeliveryTracking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeliveryTracking.fulfilled, (state, action) => {
        state.loading = false;
        const { orderId, tracking } = action.payload;
        state.trackingDetails[orderId] = tracking;
        state.error = null;
      })
      .addCase(fetchDeliveryTracking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  selectDelivery,
  updateDeliveryTracking,
  markEtaNotificationTriggered,
  setWebsocketConnected,
  clearError,
  removeActiveDelivery,
  resetDeliveryState,
} = deliverySlice.actions;

export default deliverySlice.reducer;
