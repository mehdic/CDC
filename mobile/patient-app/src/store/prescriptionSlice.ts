/**
 * Redux Slice for Prescription State Management
 * Manages prescription data, loading states, and errors for the Patient App
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Prescription,
  PrescriptionStatus,
  ListPrescriptionsRequest,
} from '@metapharm/api-types';
import prescriptionService from '../services/prescriptionService';

// State interface
export interface PrescriptionState {
  prescriptions: Prescription[];
  selectedPrescription: Prescription | null;
  loading: boolean;
  uploading: boolean;
  error: string | null;
  uploadProgress: number;
  filters: {
    status?: PrescriptionStatus[];
    searchQuery?: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Initial state
const initialState: PrescriptionState = {
  prescriptions: [],
  selectedPrescription: null,
  loading: false,
  uploading: false,
  error: null,
  uploadProgress: 0,
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  },
};

// Async thunks

/**
 * Upload a prescription image
 */
export const uploadPrescription = createAsyncThunk(
  'prescriptions/upload',
  async (
    { imageUri, patientId }: { imageUri: string; patientId: string },
    { rejectWithValue }
  ) => {
    try {
      const prescription = await prescriptionService.uploadPrescription(imageUri, patientId);
      return prescription;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to upload prescription');
    }
  }
);

/**
 * Trigger AI transcription
 */
export const transcribePrescription = createAsyncThunk(
  'prescriptions/transcribe',
  async (prescriptionId: string, { rejectWithValue }) => {
    try {
      const prescription = await prescriptionService.transcribePrescription(prescriptionId);
      return prescription;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to transcribe prescription');
    }
  }
);

/**
 * Fetch list of prescriptions
 */
export const fetchPrescriptions = createAsyncThunk(
  'prescriptions/fetchList',
  async (params: ListPrescriptionsRequest | undefined, { rejectWithValue }) => {
    try {
      const response = await prescriptionService.listPrescriptions(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch prescriptions');
    }
  }
);

/**
 * Fetch a single prescription by ID
 */
export const fetchPrescription = createAsyncThunk(
  'prescriptions/fetchOne',
  async (prescriptionId: string, { rejectWithValue }) => {
    try {
      const prescription = await prescriptionService.getPrescription(prescriptionId);
      return prescription;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch prescription');
    }
  }
);

/**
 * Refresh prescriptions (pull-to-refresh)
 */
export const refreshPrescriptions = createAsyncThunk(
  'prescriptions/refresh',
  async (params: ListPrescriptionsRequest | undefined, { rejectWithValue }) => {
    try {
      const response = await prescriptionService.listPrescriptions({
        ...params,
        page: 1,
      });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to refresh prescriptions');
    }
  }
);

/**
 * Load more prescriptions (pagination)
 */
export const loadMorePrescriptions = createAsyncThunk(
  'prescriptions/loadMore',
  async (
    params: ListPrescriptionsRequest | undefined,
    { getState, rejectWithValue }
  ) => {
    try {
      const state = (getState() as any).prescriptions as PrescriptionState;
      const response = await prescriptionService.listPrescriptions({
        ...params,
        page: state.pagination.page + 1,
      });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load more prescriptions');
    }
  }
);

// Slice
const prescriptionSlice = createSlice({
  name: 'prescriptions',
  initialState,
  reducers: {
    // Set selected prescription
    setSelectedPrescription: (state, action: PayloadAction<Prescription | null>) => {
      state.selectedPrescription = action.payload;
    },

    // Update filters
    setFilters: (
      state,
      action: PayloadAction<{ status?: PrescriptionStatus[]; searchQuery?: string }>
    ) => {
      state.filters = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Clear prescriptions (logout)
    clearPrescriptions: (state) => {
      state.prescriptions = [];
      state.selectedPrescription = null;
      state.pagination = initialState.pagination;
    },

    // Update upload progress
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },

    // Update prescription in list (real-time updates)
    updatePrescription: (state, action: PayloadAction<Prescription>) => {
      const index = state.prescriptions.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.prescriptions[index] = action.payload;
      }
      if (state.selectedPrescription?.id === action.payload.id) {
        state.selectedPrescription = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Upload prescription
    builder
      .addCase(uploadPrescription.pending, (state) => {
        state.uploading = true;
        state.error = null;
        state.uploadProgress = 0;
      })
      .addCase(uploadPrescription.fulfilled, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 100;
        // Add new prescription to the beginning of the list
        state.prescriptions.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(uploadPrescription.rejected, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 0;
        state.error = action.payload as string;
      });

    // Transcribe prescription
    builder
      .addCase(transcribePrescription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(transcribePrescription.fulfilled, (state, action) => {
        state.loading = false;
        // Update prescription in list
        const index = state.prescriptions.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.prescriptions[index] = action.payload;
        }
        if (state.selectedPrescription?.id === action.payload.id) {
          state.selectedPrescription = action.payload;
        }
      })
      .addCase(transcribePrescription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch prescriptions
    builder
      .addCase(fetchPrescriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrescriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.prescriptions = action.payload.prescriptions;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          hasMore: action.payload.hasMore,
        };
      })
      .addCase(fetchPrescriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch single prescription
    builder
      .addCase(fetchPrescription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrescription.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedPrescription = action.payload;
        // Update in list if exists
        const index = state.prescriptions.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.prescriptions[index] = action.payload;
        }
      })
      .addCase(fetchPrescription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Refresh prescriptions
    builder
      .addCase(refreshPrescriptions.pending, (state) => {
        state.error = null;
        // Don't set loading true for pull-to-refresh
      })
      .addCase(refreshPrescriptions.fulfilled, (state, action) => {
        state.prescriptions = action.payload.prescriptions;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          hasMore: action.payload.hasMore,
        };
      })
      .addCase(refreshPrescriptions.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Load more prescriptions
    builder
      .addCase(loadMorePrescriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadMorePrescriptions.fulfilled, (state, action) => {
        state.loading = false;
        // Append new prescriptions to existing list
        state.prescriptions = [...state.prescriptions, ...action.payload.prescriptions];
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          hasMore: action.payload.hasMore,
        };
      })
      .addCase(loadMorePrescriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  setSelectedPrescription,
  setFilters,
  clearError,
  clearPrescriptions,
  setUploadProgress,
  updatePrescription,
} = prescriptionSlice.actions;

// Export reducer
export default prescriptionSlice.reducer;

// Selectors
export const selectPrescriptions = (state: { prescriptions: PrescriptionState }) =>
  state.prescriptions.prescriptions;

export const selectSelectedPrescription = (state: { prescriptions: PrescriptionState }) =>
  state.prescriptions.selectedPrescription;

export const selectLoading = (state: { prescriptions: PrescriptionState }) =>
  state.prescriptions.loading;

export const selectUploading = (state: { prescriptions: PrescriptionState }) =>
  state.prescriptions.uploading;

export const selectError = (state: { prescriptions: PrescriptionState }) =>
  state.prescriptions.error;

export const selectUploadProgress = (state: { prescriptions: PrescriptionState }) =>
  state.prescriptions.uploadProgress;

export const selectFilters = (state: { prescriptions: PrescriptionState }) =>
  state.prescriptions.filters;

export const selectPagination = (state: { prescriptions: PrescriptionState }) =>
  state.prescriptions.pagination;
