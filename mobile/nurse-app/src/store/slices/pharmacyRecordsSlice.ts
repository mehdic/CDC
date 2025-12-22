/**
 * Pharmacy Records Slice - Patient Pharmacy Records State Management
 * Manages pharmacy patient records, medication history, allergies, and access audit logging
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { PharmacyPatientRecord } from '../../types/nurse';
import { nurseApi } from '../../services/nurseApi';

/**
 * Pharmacy Records State
 */
export interface PharmacyRecordsState {
  records: Record<string, PharmacyPatientRecord[]>; // patientId -> records
  selectedRecord: PharmacyPatientRecord | null;
  loading: boolean;
  error: string | null;
  lastAccessedPatientId: string | null;
  auditLog: AccessAuditLog[];
}

/**
 * Access Audit Log Entry
 */
export interface AccessAuditLog {
  id: string;
  patientId: string;
  accessedBy: string;
  accessedAt: string;
  purpose: string;
  ipAddress?: string;
}

const initialState: PharmacyRecordsState = {
  records: {},
  selectedRecord: null,
  loading: false,
  error: null,
  lastAccessedPatientId: null,
  auditLog: [],
};

/**
 * Async Thunk: Load pharmacy records for a patient
 */
export const loadPharmacyRecords = createAsyncThunk(
  'pharmacyRecords/load',
  async (patientId: string, { rejectWithValue }) => {
    try {
      const response = await nurseApi.getPharmacyRecords(patientId);
      if (!response.success || !response.data) {
        return rejectWithValue(response.error || 'Failed to load pharmacy records');
      }
      return {
        patientId,
        records: response.data,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to load pharmacy records'
      );
    }
  }
);

/**
 * Async Thunk: Log access to pharmacy records (audit trail)
 */
export const logRecordAccess = createAsyncThunk(
  'pharmacyRecords/logAccess',
  async (
    payload: {
      patientId: string;
      nurseId: string;
      purpose: string;
    },
    { rejectWithValue }
  ) => {
    try {
      // In production, this would call an audit logging endpoint
      // For now, we track it locally
      return {
        id: `audit_${Date.now()}`,
        patientId: payload.patientId,
        accessedBy: payload.nurseId,
        accessedAt: new Date().toISOString(),
        purpose: payload.purpose,
      } as AccessAuditLog;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to log access');
    }
  }
);

/**
 * Pharmacy Records Slice
 */
const pharmacyRecordsSlice = createSlice({
  name: 'pharmacyRecords',
  initialState,
  reducers: {
    /**
     * Select a pharmacy record from current patient's records
     */
    selectPharmacyRecord: (state, action: PayloadAction<PharmacyPatientRecord | null>) => {
      state.selectedRecord = action.payload;
    },

    /**
     * Clear selected record
     */
    clearSelectedRecord: (state) => {
      state.selectedRecord = null;
    },

    /**
     * Clear error message
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Clear all records (logout/reset)
     */
    clearAllRecords: (state) => {
      state.records = {};
      state.selectedRecord = null;
      state.lastAccessedPatientId = null;
      state.auditLog = [];
    },

    /**
     * Clear audit log
     */
    clearAuditLog: (state) => {
      state.auditLog = [];
    },
  },
  extraReducers: (builder) => {
    // Load pharmacy records
    builder.addCase(loadPharmacyRecords.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loadPharmacyRecords.fulfilled, (state, action) => {
      state.loading = false;
      const { patientId, records } = action.payload;
      state.records[patientId] = records;
      state.lastAccessedPatientId = patientId;
      // Select first record if available
      if (records.length > 0) {
        state.selectedRecord = records[0];
      }
    });
    builder.addCase(loadPharmacyRecords.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Log access
    builder.addCase(logRecordAccess.fulfilled, (state, action) => {
      state.auditLog.push(action.payload);
    });
    builder.addCase(logRecordAccess.rejected, (state, action) => {
      // Log access failure is non-critical, just log it
      console.warn('Failed to log access:', action.payload);
    });
  },
});

export const {
  selectPharmacyRecord,
  clearSelectedRecord,
  clearError,
  clearAllRecords,
  clearAuditLog,
} = pharmacyRecordsSlice.actions;

export default pharmacyRecordsSlice.reducer;
