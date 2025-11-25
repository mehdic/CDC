/**
 * Patient Slice - Patient Management State
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { PatientState, Patient } from '../../types';
import nurseApiClient from '../../services/nurseApiClient';

const initialState: PatientState = {
  patients: [],
  selectedPatient: null,
  loading: false,
  error: null,
};

// Async thunks
export const searchPatients = createAsyncThunk(
  'patients/search',
  async (query: string, { rejectWithValue }) => {
    try {
      const patients = await nurseApiClient.searchPatients(query);
      return patients;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Search failed');
    }
  }
);

export const loadAssignedPatients = createAsyncThunk(
  'patients/loadAssigned',
  async (_, { rejectWithValue }) => {
    try {
      const patients = await nurseApiClient.getAssignedPatients();
      return patients;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load patients');
    }
  }
);

export const loadPatientById = createAsyncThunk(
  'patients/loadById',
  async (patientId: string, { rejectWithValue }) => {
    try {
      const patient = await nurseApiClient.getPatientById(patientId);
      return patient;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load patient');
    }
  }
);

const patientSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    selectPatient: (state, action: PayloadAction<Patient>) => {
      state.selectedPatient = action.payload;
    },
    clearSelectedPatient: (state) => {
      state.selectedPatient = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Search patients
    builder.addCase(searchPatients.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(searchPatients.fulfilled, (state, action) => {
      state.loading = false;
      state.patients = action.payload;
    });
    builder.addCase(searchPatients.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Load assigned patients
    builder.addCase(loadAssignedPatients.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loadAssignedPatients.fulfilled, (state, action) => {
      state.loading = false;
      state.patients = action.payload;
    });
    builder.addCase(loadAssignedPatients.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Load patient by ID
    builder.addCase(loadPatientById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loadPatientById.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedPatient = action.payload;
    });
    builder.addCase(loadPatientById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { selectPatient, clearSelectedPatient, clearError } = patientSlice.actions;
export default patientSlice.reducer;
