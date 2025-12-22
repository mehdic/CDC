/**
 * usePharmacyRecords Hook
 * Custom hook for managing pharmacy patient records
 */

import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect } from 'react';
import type { RootState, AppDispatch } from '../store';
import {
  loadPharmacyRecords,
  logRecordAccess,
  selectPharmacyRecord,
  clearSelectedRecord,
  clearError,
} from '../store/slices/pharmacyRecordsSlice';
import type { PharmacyPatientRecord } from '../types/nurse';

/**
 * Hook return type
 */
export interface UsePharmacyRecordsReturn {
  // State
  records: PharmacyPatientRecord[];
  selectedRecord: PharmacyPatientRecord | null;
  loading: boolean;
  error: string | null;
  lastAccessedPatientId: string | null;

  // Actions
  loadRecords: (patientId: string, purpose: string, nurseId: string) => Promise<void>;
  selectRecord: (record: PharmacyPatientRecord | null) => void;
  clearSelected: () => void;
  clearErrorMessage: () => void;
  getMedicationHistory: () => Array<{
    medicationId: string;
    name: string;
    dispensedDate: string;
    quantity: number;
  }>;
  getAllergies: () => string[];
  getInteractions: () => string[];
  getPharmacyName: () => string;
  getLastUpdated: () => string | null;
}

/**
 * usePharmacyRecords Hook
 */
export function usePharmacyRecords(patientId: string): UsePharmacyRecordsReturn {
  const dispatch = useDispatch<AppDispatch>();

  const {
    records,
    selectedRecord,
    loading,
    error,
    lastAccessedPatientId,
  } = useSelector((state: RootState) => state.pharmacyRecords);

  const currentRecords = records[patientId] || [];

  /**
   * Load records and log access
   */
  const loadRecords = useCallback(
    async (patientId: string, purpose: string, nurseId: string) => {
      try {
        // Load the records
        await dispatch(loadPharmacyRecords(patientId)).unwrap();

        // Log the access for audit trail
        await dispatch(
          logRecordAccess({
            patientId,
            nurseId,
            purpose,
          })
        ).unwrap();
      } catch (err) {
        console.error('Failed to load pharmacy records:', err);
        throw err;
      }
    },
    [dispatch]
  );

  /**
   * Select a record
   */
  const selectRecord = useCallback(
    (record: PharmacyPatientRecord | null) => {
      dispatch(selectPharmacyRecord(record));
    },
    [dispatch]
  );

  /**
   * Clear selected record
   */
  const clearSelected = useCallback(() => {
    dispatch(clearSelectedRecord());
  }, [dispatch]);

  /**
   * Clear error
   */
  const clearErrorMessage = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  /**
   * Get medication history from selected record
   */
  const getMedicationHistory = useCallback(() => {
    return selectedRecord?.medicationHistory || [];
  }, [selectedRecord]);

  /**
   * Get allergies from selected record
   */
  const getAllergies = useCallback(() => {
    return selectedRecord?.allergies || [];
  }, [selectedRecord]);

  /**
   * Get interactions from selected record
   */
  const getInteractions = useCallback(() => {
    return selectedRecord?.interactions || [];
  }, [selectedRecord]);

  /**
   * Get pharmacy name from selected record
   */
  const getPharmacyName = useCallback(() => {
    return selectedRecord?.pharmacyName || 'Unknown Pharmacy';
  }, [selectedRecord]);

  /**
   * Get last updated date from selected record
   */
  const getLastUpdated = useCallback(() => {
    return selectedRecord?.lastUpdated || null;
  }, [selectedRecord]);

  return {
    records: currentRecords,
    selectedRecord,
    loading,
    error,
    lastAccessedPatientId,
    loadRecords,
    selectRecord,
    clearSelected,
    clearErrorMessage,
    getMedicationHistory,
    getAllergies,
    getInteractions,
    getPharmacyName,
    getLastUpdated,
  };
}
