/**
 * Redux Slice for Prescription Queue
 * Manages prescription queue state, filtering, and pagination
 * T114 - User Story 1: Prescription Processing & Validation
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import prescriptionService, {
  Prescription,
  PrescriptionStatus,
  ListPrescriptionsParams,
  ListPrescriptionsResponse,
  ValidatePrescriptionResponse,
  ApprovePrescriptionRequest,
  ApprovePrescriptionResponse,
  RejectPrescriptionRequest,
  RejectPrescriptionResponse,
} from '../services/prescriptionService';

// ============================================================================
// Types
// ============================================================================

export interface QueueFilters {
  status: PrescriptionStatus[];
  has_safety_warnings?: boolean;
  has_low_confidence?: boolean;
  search_term?: string;
}

export interface QueueState {
  prescriptions: Prescription[];
  selectedPrescription: Prescription | null;
  validationResult: ValidatePrescriptionResponse | null;
  filters: QueueFilters;
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
  loading: {
    queue: boolean;
    validation: boolean;
    approval: boolean;
    rejection: boolean;
  };
  error: string | null;
  lastRefresh: number | null;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: QueueState = {
  prescriptions: [],
  selectedPrescription: null,
  validationResult: null,
  filters: {
    status: [PrescriptionStatus.PENDING, PrescriptionStatus.IN_REVIEW],
    has_safety_warnings: undefined,
    has_low_confidence: undefined,
    search_term: undefined,
  },
  pagination: {
    page: 1,
    limit: 20,
    total_items: 0,
    total_pages: 0,
    has_next_page: false,
    has_prev_page: false,
  },
  loading: {
    queue: false,
    validation: false,
    approval: false,
    rejection: false,
  },
  error: null,
  lastRefresh: null,
};

// ============================================================================
// Async Thunks
// ============================================================================

/**
 * Fetch prescription queue with current filters
 */
export const fetchPrescriptionQueue = createAsyncThunk(
  'queue/fetchPrescriptionQueue',
  async (params?: Partial<ListPrescriptionsParams>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { queue: QueueState };
      const { filters, pagination } = state.queue;

      const apiParams: ListPrescriptionsParams = {
        status: filters.status.join(','),
        has_safety_warnings: filters.has_safety_warnings,
        has_low_confidence: filters.has_low_confidence,
        page: pagination.page,
        limit: pagination.limit,
        sort_by: 'created_at',
        sort_order: 'asc',
        ...params,
      };

      const response = await prescriptionService.getPrescriptionQueue(apiParams);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Fetch single prescription details
 */
export const fetchPrescriptionDetails = createAsyncThunk(
  'queue/fetchPrescriptionDetails',
  async (prescriptionId: string, { rejectWithValue }) => {
    try {
      const prescription = await prescriptionService.getPrescription(prescriptionId);
      return prescription;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Validate prescription - Run safety checks
 */
export const validatePrescription = createAsyncThunk(
  'queue/validatePrescription',
  async (prescriptionId: string, { rejectWithValue }) => {
    try {
      const result = await prescriptionService.validatePrescription(prescriptionId);
      return result;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Approve prescription
 */
export const approvePrescription = createAsyncThunk(
  'queue/approvePrescription',
  async (
    { prescriptionId, data }: { prescriptionId: string; data: ApprovePrescriptionRequest },
    { rejectWithValue }
  ) => {
    try {
      const result = await prescriptionService.approvePrescription(prescriptionId, data);
      return result;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Reject prescription with mandatory reason
 */
export const rejectPrescription = createAsyncThunk(
  'queue/rejectPrescription',
  async (
    { prescriptionId, data }: { prescriptionId: string; data: RejectPrescriptionRequest },
    { rejectWithValue }
  ) => {
    try {
      const result = await prescriptionService.rejectPrescription(prescriptionId, data);
      return result;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

/**
 * Update prescription items (for pharmacist corrections)
 */
export const updatePrescriptionItems = createAsyncThunk(
  'queue/updatePrescriptionItems',
  async (
    { prescriptionId, items }: { prescriptionId: string; items: any[] },
    { rejectWithValue }
  ) => {
    try {
      const prescription = await prescriptionService.updatePrescriptionItems(
        prescriptionId,
        items
      );
      return prescription;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// ============================================================================
// Slice
// ============================================================================

const queueSlice = createSlice({
  name: 'queue',
  initialState,
  reducers: {
    /**
     * Set selected prescription for review
     */
    setSelectedPrescription: (state, action: PayloadAction<Prescription | null>) => {
      state.selectedPrescription = action.payload;
      state.validationResult = null; // Clear validation when selecting new prescription
    },

    /**
     * Update queue filters
     */
    setFilters: (state, action: PayloadAction<Partial<QueueFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset to first page when filters change
    },

    /**
     * Reset filters to default
     */
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.page = 1;
    },

    /**
     * Set current page
     */
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },

    /**
     * Clear error
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Clear validation result
     */
    clearValidationResult: (state) => {
      state.validationResult = null;
    },

    /**
     * Update selected prescription (for real-time updates)
     */
    updateSelectedPrescription: (state, action: PayloadAction<Partial<Prescription>>) => {
      if (state.selectedPrescription) {
        state.selectedPrescription = { ...state.selectedPrescription, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // ========================================================================
    // Fetch Prescription Queue
    // ========================================================================
    builder.addCase(fetchPrescriptionQueue.pending, (state) => {
      state.loading.queue = true;
      state.error = null;
    });
    builder.addCase(fetchPrescriptionQueue.fulfilled, (state, action) => {
      state.loading.queue = false;
      state.prescriptions = action.payload.prescriptions;
      state.pagination = action.payload.pagination;
      state.lastRefresh = Date.now();
    });
    builder.addCase(fetchPrescriptionQueue.rejected, (state, action) => {
      state.loading.queue = false;
      state.error = action.payload as string;
    });

    // ========================================================================
    // Fetch Prescription Details
    // ========================================================================
    builder.addCase(fetchPrescriptionDetails.pending, (state) => {
      state.loading.queue = true;
      state.error = null;
    });
    builder.addCase(fetchPrescriptionDetails.fulfilled, (state, action) => {
      state.loading.queue = false;
      state.selectedPrescription = action.payload;
    });
    builder.addCase(fetchPrescriptionDetails.rejected, (state, action) => {
      state.loading.queue = false;
      state.error = action.payload as string;
    });

    // ========================================================================
    // Validate Prescription
    // ========================================================================
    builder.addCase(validatePrescription.pending, (state) => {
      state.loading.validation = true;
      state.error = null;
    });
    builder.addCase(validatePrescription.fulfilled, (state, action) => {
      state.loading.validation = false;
      state.validationResult = action.payload;
      // Update selected prescription with validation results
      if (state.selectedPrescription) {
        state.selectedPrescription = action.payload.prescription;
      }
    });
    builder.addCase(validatePrescription.rejected, (state, action) => {
      state.loading.validation = false;
      state.error = action.payload as string;
    });

    // ========================================================================
    // Approve Prescription
    // ========================================================================
    builder.addCase(approvePrescription.pending, (state) => {
      state.loading.approval = true;
      state.error = null;
    });
    builder.addCase(approvePrescription.fulfilled, (state, action) => {
      state.loading.approval = false;
      // Update prescription in queue
      state.prescriptions = state.prescriptions.filter(
        (p) => p.id !== action.payload.prescription.id
      );
      // Clear selected prescription
      state.selectedPrescription = null;
      state.validationResult = null;
    });
    builder.addCase(approvePrescription.rejected, (state, action) => {
      state.loading.approval = false;
      state.error = action.payload as string;
    });

    // ========================================================================
    // Reject Prescription
    // ========================================================================
    builder.addCase(rejectPrescription.pending, (state) => {
      state.loading.rejection = true;
      state.error = null;
    });
    builder.addCase(rejectPrescription.fulfilled, (state, action) => {
      state.loading.rejection = false;
      // Update prescription in queue
      state.prescriptions = state.prescriptions.filter(
        (p) => p.id !== action.payload.prescription.id
      );
      // Clear selected prescription
      state.selectedPrescription = null;
      state.validationResult = null;
    });
    builder.addCase(rejectPrescription.rejected, (state, action) => {
      state.loading.rejection = false;
      state.error = action.payload as string;
    });

    // ========================================================================
    // Update Prescription Items
    // ========================================================================
    builder.addCase(updatePrescriptionItems.fulfilled, (state, action) => {
      // Update selected prescription with new items
      if (state.selectedPrescription) {
        state.selectedPrescription = action.payload;
      }
      // Update prescription in queue
      const index = state.prescriptions.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.prescriptions[index] = action.payload;
      }
    });
  },
});

// ============================================================================
// Exports
// ============================================================================

export const {
  setSelectedPrescription,
  setFilters,
  resetFilters,
  setPage,
  clearError,
  clearValidationResult,
  updateSelectedPrescription,
} = queueSlice.actions;

export default queueSlice.reducer;
