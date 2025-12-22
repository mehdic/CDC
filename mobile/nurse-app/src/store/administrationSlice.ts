/**
 * Administration Slice - Medication Administration State Management
 * Manages administration recordings, history, and related state
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MedicationAdministration } from '../../types';
import nurseApiClient from '../../services/nurseApiClient';

/**
 * Administration State Type
 */
export interface AdministrationState {
  readonly administrations: readonly MedicationAdministration[];
  readonly currentAdministration: MedicationAdministration | null;
  readonly filteredAdministrations: readonly MedicationAdministration[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly filterPatientId: string | null;
  readonly filterMedicationId: string | null;
  readonly sortBy: 'date' | 'medication' | 'patient';
}

const initialState: AdministrationState = {
  administrations: [],
  currentAdministration: null,
  filteredAdministrations: [],
  loading: false,
  error: null,
  filterPatientId: null,
  filterMedicationId: null,
  sortBy: 'date',
};

/**
 * Async thunk to load patient administration history
 */
export const loadAdministrationHistory = createAsyncThunk(
  'administration/loadHistory',
  async (patientId: string, { rejectWithValue }) => {
    try {
      const history = await nurseApiClient.getAdministrationHistory(patientId);
      return history;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error && 'response' in err ? (err as any).response?.data?.message : undefined;
      return rejectWithValue(
        errorMsg || 'Failed to load administration history'
      );
    }
  }
);

/**
 * Async thunk to record new medication administration
 */
export const recordMedicationAdministration = createAsyncThunk(
  'administration/record',
  async (
    data: Omit<MedicationAdministration, 'id'>,
    { rejectWithValue }
  ) => {
    try {
      const administration = await nurseApiClient.recordAdministration(data);
      return administration;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error && 'response' in err ? (err as any).response?.data?.message : undefined;
      return rejectWithValue(
        errorMsg || 'Failed to record administration'
      );
    }
  }
);

/**
 * Async thunk to verify medication barcode
 */
export const verifyMedicationBarcode = createAsyncThunk(
  'administration/verifyBarcode',
  async (
    { barcode, patientId }: { barcode: string; patientId: string },
    { rejectWithValue }
  ) => {
    try {
      const result = await nurseApiClient.verifyMedicationBarcode(
        barcode,
        patientId
      );
      return result;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error && 'response' in err ? (err as any).response?.data?.message : undefined;
      return rejectWithValue(
        errorMsg || 'Barcode verification failed'
      );
    }
  }
);

/**
 * Async thunk to validate dosage
 */
export const validateDosage = createAsyncThunk(
  'administration/validateDosage',
  async (
    {
      medicationId,
      dosage,
      patientId,
    }: { medicationId: string; dosage: string; patientId: string },
    { rejectWithValue }
  ) => {
    try {
      const result = await nurseApiClient.validateDosage(
        medicationId,
        dosage,
        patientId
      );
      return result;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error && 'response' in err ? (err as any).response?.data?.message : undefined;
      return rejectWithValue(
        errorMsg || 'Dosage validation failed'
      );
    }
  }
);

const administrationSlice = createSlice({
  name: 'administration',
  initialState,
  reducers: {
    /**
     * Clear error state
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Set current administration being recorded
     */
    setCurrentAdministration: (
      state,
      action: PayloadAction<MedicationAdministration | null>
    ) => {
      state.currentAdministration = action.payload;
    },

    /**
     * Add administration to list
     */
    addAdministration: (
      state,
      action: PayloadAction<MedicationAdministration>
    ) => {
      state.administrations = [action.payload, ...state.administrations];
      state.filteredAdministrations = [
        action.payload,
        ...state.filteredAdministrations,
      ];
    },

    /**
     * Filter administrations by patient ID
     */
    setPatientFilter: (state, action: PayloadAction<string | null>) => {
      state.filterPatientId = action.payload;
      state.filteredAdministrations = filterAndSortAdministrations(
        state.administrations,
        state.filterPatientId,
        state.filterMedicationId,
        state.sortBy
      );
    },

    /**
     * Filter administrations by medication ID
     */
    setMedicationFilter: (state, action: PayloadAction<string | null>) => {
      state.filterMedicationId = action.payload;
      state.filteredAdministrations = filterAndSortAdministrations(
        state.administrations,
        state.filterPatientId,
        state.filterMedicationId,
        state.sortBy
      );
    },

    /**
     * Sort administrations
     */
    setSortBy: (
      state,
      action: PayloadAction<'date' | 'medication' | 'patient'>
    ) => {
      state.sortBy = action.payload;
      state.filteredAdministrations = filterAndSortAdministrations(
        state.administrations,
        state.filterPatientId,
        state.filterMedicationId,
        action.payload
      );
    },

    /**
     * Clear all filters
     */
    clearFilters: (state) => {
      state.filterPatientId = null;
      state.filterMedicationId = null;
      state.filteredAdministrations = [...state.administrations];
    },

    /**
     * Reset administration state
     */
    resetAdministration: () => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // Load administration history
    builder.addCase(loadAdministrationHistory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loadAdministrationHistory.fulfilled, (state, action) => {
      state.loading = false;
      state.administrations = action.payload;
      state.filteredAdministrations = action.payload;
    });
    builder.addCase(loadAdministrationHistory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Record administration
    builder.addCase(recordMedicationAdministration.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      recordMedicationAdministration.fulfilled,
      (state, action) => {
        state.loading = false;
        state.administrations = [action.payload, ...state.administrations];
        state.filteredAdministrations = [
          action.payload,
          ...state.filteredAdministrations,
        ];
        state.currentAdministration = action.payload;
      }
    );
    builder.addCase(recordMedicationAdministration.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Verify barcode
    builder.addCase(verifyMedicationBarcode.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(verifyMedicationBarcode.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(verifyMedicationBarcode.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Validate dosage
    builder.addCase(validateDosage.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(validateDosage.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(validateDosage.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

/**
 * Helper function to filter and sort administrations
 */
function filterAndSortAdministrations(
  administrations: readonly MedicationAdministration[],
  patientFilter: string | null,
  medicationFilter: string | null,
  sortBy: 'date' | 'medication' | 'patient'
): readonly MedicationAdministration[] {
  let filtered = [...administrations];

  if (patientFilter) {
    filtered = filtered.filter((a) => a.patientId === patientFilter);
  }

  if (medicationFilter) {
    filtered = filtered.filter((a) => a.medicationId === medicationFilter);
  }

  // Sort
  switch (sortBy) {
    case 'medication':
      filtered.sort((a, b) => a.id.localeCompare(b.id));
      break;
    case 'patient':
      filtered.sort((a, b) => a.patientId.localeCompare(b.patientId));
      break;
    case 'date':
    default:
      filtered.sort(
        (a, b) =>
          new Date(b.administeredAt).getTime() -
          new Date(a.administeredAt).getTime()
      );
      break;
  }

  return filtered;
}

export const {
  clearError,
  setCurrentAdministration,
  addAdministration,
  setPatientFilter,
  setMedicationFilter,
  setSortBy,
  clearFilters,
  resetAdministration,
} = administrationSlice.actions;

export default administrationSlice.reducer;
