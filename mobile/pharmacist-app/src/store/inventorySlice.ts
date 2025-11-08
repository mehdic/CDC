/**
 * Inventory Redux Slice
 * State management for inventory data
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import inventoryService, { InventoryItem, InventoryAlert, InventoryAnalytics, ScanRequest } from '../services/inventoryService';

interface InventoryState {
  items: InventoryItem[];
  currentItem: InventoryItem | null;
  alerts: InventoryAlert[];
  analytics: InventoryAnalytics | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  } | null;
}

const initialState: InventoryState = {
  items: [],
  currentItem: null,
  alerts: [],
  analytics: null,
  loading: false,
  error: null,
  pagination: null,
};

// Async thunks
export const scanQRCode = createAsyncThunk(
  'inventory/scanQRCode',
  async (request: ScanRequest) => {
    const response = await inventoryService.scanQRCode(request);
    return response;
  }
);

export const fetchInventoryItems = createAsyncThunk(
  'inventory/fetchItems',
  async (params: Parameters<typeof inventoryService.getItems>[0]) => {
    const response = await inventoryService.getItems(params);
    return response;
  }
);

export const fetchInventoryItem = createAsyncThunk(
  'inventory/fetchItem',
  async ({ id, pharmacy_id }: { id: string; pharmacy_id: string }) => {
    const response = await inventoryService.getItemById(id, pharmacy_id);
    return response.item;
  }
);

export const updateInventoryItem = createAsyncThunk(
  'inventory/updateItem',
  async ({ id, data }: { id: string; data: any }) => {
    const response = await inventoryService.updateItem(id, data);
    return response.item;
  }
);

export const fetchActiveAlerts = createAsyncThunk(
  'inventory/fetchAlerts',
  async (params: Parameters<typeof inventoryService.getAlerts>[0]) => {
    const response = await inventoryService.getAlerts(params);
    return response;
  }
);

export const acknowledgeInventoryAlert = createAsyncThunk(
  'inventory/acknowledgeAlert',
  async ({ id, pharmacy_id, user_id }: { id: string; pharmacy_id: string; user_id: string }) => {
    await inventoryService.acknowledgeAlert(id, pharmacy_id, user_id);
    return id;
  }
);

export const fetchInventoryAnalytics = createAsyncThunk(
  'inventory/fetchAnalytics',
  async (pharmacy_id: string) => {
    const response = await inventoryService.getAnalytics(pharmacy_id);
    return response;
  }
);

// Slice
const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentItem: (state) => {
      state.currentItem = null;
    },
  },
  extraReducers: (builder) => {
    // Scan QR Code
    builder
      .addCase(scanQRCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(scanQRCode.fulfilled, (state, action) => {
        state.loading = false;
        // Optionally update items list with the scanned item
      })
      .addCase(scanQRCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Scan failed';
      });

    // Fetch Items
    builder
      .addCase(fetchInventoryItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventoryItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchInventoryItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch items';
      });

    // Fetch Single Item
    builder
      .addCase(fetchInventoryItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventoryItem.fulfilled, (state, action) => {
        state.loading = false;
        state.currentItem = action.payload;
      })
      .addCase(fetchInventoryItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch item';
      });

    // Fetch Alerts
    builder
      .addCase(fetchActiveAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = action.payload.alerts;
      })
      .addCase(fetchActiveAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch alerts';
      });

    // Fetch Analytics
    builder
      .addCase(fetchInventoryAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventoryAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchInventoryAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch analytics';
      });
  },
});

export const { clearError, clearCurrentItem } = inventorySlice.actions;
export default inventorySlice.reducer;
