/**
 * Pharmacy Records Slice Unit Tests
 * Tests for pharmacy records state management and async operations
 */

import pharmacyRecordsReducer, {
  selectPharmacyRecord,
  clearSelectedRecord,
  clearError,
  clearAllRecords,
  clearAuditLog,
  loadPharmacyRecords,
  logRecordAccess,
  PharmacyRecordsState,
} from '../slices/pharmacyRecordsSlice';
import type { PharmacyPatientRecord } from '../../types/nurse';

describe('pharmacyRecordsSlice', () => {
  const mockRecord1: PharmacyPatientRecord = {
    id: 'PR001',
    patientId: 'P001',
    pharmacyId: 'PH001',
    pharmacyName: 'Main Pharmacy',
    medicationHistory: [
      {
        medicationId: 'M1',
        name: 'Lisinopril',
        dispensedDate: '2024-12-15',
        quantity: 30,
      },
      {
        medicationId: 'M2',
        name: 'Metformin',
        dispensedDate: '2024-12-10',
        quantity: 60,
      },
    ],
    allergies: ['Penicillin', 'Sulfonamides'],
    interactions: ['Lisinopril + NSAIDs: Use with caution'],
    lastUpdated: '2024-12-15T10:30:00Z',
  };

  const mockRecord2: PharmacyPatientRecord = {
    id: 'PR002',
    patientId: 'P001',
    pharmacyId: 'PH002',
    pharmacyName: 'Secondary Pharmacy',
    medicationHistory: [
      {
        medicationId: 'M3',
        name: 'Atorvastatin',
        dispensedDate: '2024-12-12',
        quantity: 30,
      },
    ],
    allergies: ['Penicillin'],
    interactions: [],
    lastUpdated: '2024-12-12T14:15:00Z',
  };

  const initialState: PharmacyRecordsState = {
    records: {},
    selectedRecord: null,
    loading: false,
    error: null,
    lastAccessedPatientId: null,
    auditLog: [],
  };

  describe('initial state', () => {
    it('should return initial state', () => {
      expect(pharmacyRecordsReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('selectPharmacyRecord', () => {
    it('should select a pharmacy record', () => {
      const action = selectPharmacyRecord(mockRecord1);
      const state = pharmacyRecordsReducer(initialState, action);
      expect(state.selectedRecord).toEqual(mockRecord1);
    });

    it('should replace previously selected record', () => {
      const stateWithRecord = {
        ...initialState,
        selectedRecord: mockRecord1,
      };
      const action = selectPharmacyRecord(mockRecord2);
      const state = pharmacyRecordsReducer(stateWithRecord, action);
      expect(state.selectedRecord).toEqual(mockRecord2);
    });

    it('should handle null selection', () => {
      const stateWithRecord = {
        ...initialState,
        selectedRecord: mockRecord1,
      };
      const action = selectPharmacyRecord(null);
      const state = pharmacyRecordsReducer(stateWithRecord, action);
      expect(state.selectedRecord).toBeNull();
    });
  });

  describe('clearSelectedRecord', () => {
    it('should clear selected record', () => {
      const stateWithRecord = {
        ...initialState,
        selectedRecord: mockRecord1,
      };
      const action = clearSelectedRecord();
      const state = pharmacyRecordsReducer(stateWithRecord, action);
      expect(state.selectedRecord).toBeNull();
    });

    it('should not affect records when clearing selection', () => {
      const stateWithData = {
        ...initialState,
        selectedRecord: mockRecord1,
        records: { P001: [mockRecord1] },
      };
      const action = clearSelectedRecord();
      const state = pharmacyRecordsReducer(stateWithData, action);
      expect(state.records).toEqual({ P001: [mockRecord1] });
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      const stateWithError = {
        ...initialState,
        error: 'Failed to load records',
      };
      const action = clearError();
      const state = pharmacyRecordsReducer(stateWithError, action);
      expect(state.error).toBeNull();
    });

    it('should handle clearing error when no error exists', () => {
      const action = clearError();
      const state = pharmacyRecordsReducer(initialState, action);
      expect(state.error).toBeNull();
    });
  });

  describe('clearAllRecords', () => {
    it('should clear all data including records, selections, and audit log', () => {
      const stateWithData = {
        records: {
          P001: [mockRecord1, mockRecord2],
          P002: [mockRecord1],
        },
        selectedRecord: mockRecord1,
        loading: false,
        error: null,
        lastAccessedPatientId: 'P001',
        auditLog: [
          {
            id: 'A001',
            patientId: 'P001',
            accessedBy: 'N001',
            accessedAt: '2024-12-15T10:00:00Z',
            purpose: 'View records',
          },
        ],
      };
      const action = clearAllRecords();
      const state = pharmacyRecordsReducer(stateWithData, action);
      expect(state.records).toEqual({});
      expect(state.selectedRecord).toBeNull();
      expect(state.lastAccessedPatientId).toBeNull();
      expect(state.auditLog).toEqual([]);
    });
  });

  describe('clearAuditLog', () => {
    it('should clear only the audit log', () => {
      const stateWithAuditLog = {
        ...initialState,
        auditLog: [
          {
            id: 'A001',
            patientId: 'P001',
            accessedBy: 'N001',
            accessedAt: '2024-12-15T10:00:00Z',
            purpose: 'View records',
          },
        ],
        selectedRecord: mockRecord1,
      };
      const action = clearAuditLog();
      const state = pharmacyRecordsReducer(stateWithAuditLog, action);
      expect(state.auditLog).toEqual([]);
      expect(state.selectedRecord).toEqual(mockRecord1);
    });
  });

  describe('loadPharmacyRecords async thunk', () => {
    it('should handle pending state', () => {
      const action = { type: loadPharmacyRecords.pending };
      const state = pharmacyRecordsReducer(initialState, action);
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fulfilled state with records', () => {
      const action = {
        type: loadPharmacyRecords.fulfilled,
        payload: {
          patientId: 'P001',
          records: [mockRecord1, mockRecord2],
        },
      };
      const state = pharmacyRecordsReducer(initialState, action);
      expect(state.loading).toBe(false);
      expect(state.records['P001']).toEqual([mockRecord1, mockRecord2]);
      expect(state.lastAccessedPatientId).toBe('P001');
      expect(state.selectedRecord).toEqual(mockRecord1);
    });

    it('should select first record when records are loaded', () => {
      const action = {
        type: loadPharmacyRecords.fulfilled,
        payload: {
          patientId: 'P001',
          records: [mockRecord2, mockRecord1],
        },
      };
      const state = pharmacyRecordsReducer(initialState, action);
      expect(state.selectedRecord).toEqual(mockRecord2);
    });

    it('should handle empty records', () => {
      const action = {
        type: loadPharmacyRecords.fulfilled,
        payload: {
          patientId: 'P001',
          records: [],
        },
      };
      const state = pharmacyRecordsReducer(initialState, action);
      expect(state.records['P001']).toEqual([]);
      expect(state.selectedRecord).toBeNull();
    });

    it('should handle rejected state', () => {
      const error = 'Patient not found';
      const action = {
        type: loadPharmacyRecords.rejected,
        payload: error,
      };
      const state = pharmacyRecordsReducer(initialState, action);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(error);
    });
  });

  describe('logRecordAccess async thunk', () => {
    it('should add access log entry on success', () => {
      const auditEntry = {
        id: 'audit_123',
        patientId: 'P001',
        accessedBy: 'N001',
        accessedAt: '2024-12-15T10:00:00Z',
        purpose: 'View patient records',
      };
      const action = {
        type: logRecordAccess.fulfilled,
        payload: auditEntry,
      };
      const state = pharmacyRecordsReducer(initialState, action);
      expect(state.auditLog).toHaveLength(1);
      expect(state.auditLog[0]).toEqual(auditEntry);
    });

    it('should append multiple access logs', () => {
      const auditEntry1 = {
        id: 'audit_1',
        patientId: 'P001',
        accessedBy: 'N001',
        accessedAt: '2024-12-15T10:00:00Z',
        purpose: 'View records',
      };
      const auditEntry2 = {
        id: 'audit_2',
        patientId: 'P001',
        accessedBy: 'N002',
        accessedAt: '2024-12-15T11:00:00Z',
        purpose: 'Verify allergies',
      };

      let state = initialState;
      state = pharmacyRecordsReducer(state, {
        type: logRecordAccess.fulfilled,
        payload: auditEntry1,
      });
      state = pharmacyRecordsReducer(state, {
        type: logRecordAccess.fulfilled,
        payload: auditEntry2,
      });

      expect(state.auditLog).toHaveLength(2);
      expect(state.auditLog[0]).toEqual(auditEntry1);
      expect(state.auditLog[1]).toEqual(auditEntry2);
    });

    it('should handle access log failure gracefully', () => {
      const action = {
        type: logRecordAccess.rejected,
        payload: 'Failed to log access',
      };
      const state = pharmacyRecordsReducer(initialState, action);
      // Should not crash, audit log should remain empty
      expect(state.auditLog).toEqual([]);
    });
  });

  describe('complex scenarios', () => {
    it('should maintain separate records for different patients', () => {
      let state = initialState;

      // Load records for patient P001
      state = pharmacyRecordsReducer(state, {
        type: loadPharmacyRecords.fulfilled,
        payload: {
          patientId: 'P001',
          records: [mockRecord1],
        },
      });

      // Load records for patient P002
      state = pharmacyRecordsReducer(state, {
        type: loadPharmacyRecords.fulfilled,
        payload: {
          patientId: 'P002',
          records: [mockRecord2],
        },
      });

      expect(state.records['P001']).toEqual([mockRecord1]);
      expect(state.records['P002']).toEqual([mockRecord2]);
      expect(state.lastAccessedPatientId).toBe('P002');
    });

    it('should update records for patient while keeping others intact', () => {
      const stateWithData = {
        records: {
          P001: [mockRecord1],
          P002: [mockRecord2],
        },
        selectedRecord: mockRecord1,
        loading: false,
        error: null,
        lastAccessedPatientId: 'P001',
        auditLog: [],
      };

      const newRecord = { ...mockRecord2, id: 'PR003' };
      const action = {
        type: loadPharmacyRecords.fulfilled,
        payload: {
          patientId: 'P001',
          records: [newRecord],
        },
      };

      const state = pharmacyRecordsReducer(stateWithData, action);
      expect(state.records['P001']).toEqual([newRecord]);
      expect(state.records['P002']).toEqual([mockRecord2]);
    });

    it('should maintain audit log while clearing records', () => {
      const stateWithData = {
        records: {
          P001: [mockRecord1],
        },
        selectedRecord: mockRecord1,
        loading: false,
        error: null,
        lastAccessedPatientId: 'P001',
        auditLog: [
          {
            id: 'A001',
            patientId: 'P001',
            accessedBy: 'N001',
            accessedAt: '2024-12-15T10:00:00Z',
            purpose: 'View records',
          },
        ],
      };

      const action = clearSelectedRecord();
      const state = pharmacyRecordsReducer(stateWithData, action);
      expect(state.selectedRecord).toBeNull();
      expect(state.records['P001']).toEqual([mockRecord1]);
      expect(state.auditLog).toHaveLength(1);
    });
  });
});
