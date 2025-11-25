/**
 * Medication Slice - Medication Management State
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MedicationState, MedicationOrder, MedicationAdministration } from '../../types';
import nurseApiClient from '../../services/nurseApiClient';

const initialState: MedicationState = {
  medications: [],
  administrations: [],
  orders: [],
  loading: false,
  error: null,
};

// Async thunks
export const loadPatientMedications = createAsyncThunk(
  'medications/loadForPatient',
  async (patientId: string, { rejectWithValue }) => {
    try {
      const medications = await nurseApiClient.getPatientMedications(patientId);
      return medications;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load medications');
    }
  }
);

export const recordAdministration = createAsyncThunk(
  'medications/recordAdministration',
  async (data: Omit<MedicationAdministration, 'id'>, { rejectWithValue }) => {
    try {
      const administration = await nurseApiClient.recordAdministration(data);
      return administration;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to record administration');
    }
  }
);

export const createMedicationOrder = createAsyncThunk(
  'medications/createOrder',
  async (order: Omit<MedicationOrder, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const newOrder = await nurseApiClient.createMedicationOrder(order);
      return newOrder;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create order');
    }
  }
);

export const loadMedicationOrders = createAsyncThunk(
  'medications/loadOrders',
  async (_, { rejectWithValue }) => {
    try {
      const orders = await nurseApiClient.getMedicationOrders();
      return orders;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load orders');
    }
  }
);

const medicationSlice = createSlice({
  name: 'medications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addAdministration: (state, action: PayloadAction<MedicationAdministration>) => {
      state.administrations.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    // Load patient medications
    builder.addCase(loadPatientMedications.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loadPatientMedications.fulfilled, (state, action) => {
      state.loading = false;
      state.medications = action.payload;
    });
    builder.addCase(loadPatientMedications.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Record administration
    builder.addCase(recordAdministration.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(recordAdministration.fulfilled, (state, action) => {
      state.loading = false;
      state.administrations.push(action.payload);
    });
    builder.addCase(recordAdministration.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create medication order
    builder.addCase(createMedicationOrder.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createMedicationOrder.fulfilled, (state, action) => {
      state.loading = false;
      state.orders.push(action.payload);
    });
    builder.addCase(createMedicationOrder.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Load orders
    builder.addCase(loadMedicationOrders.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loadMedicationOrders.fulfilled, (state, action) => {
      state.loading = false;
      state.orders = action.payload;
    });
    builder.addCase(loadMedicationOrders.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError, addAdministration } = medicationSlice.actions;
export default medicationSlice.reducer;
