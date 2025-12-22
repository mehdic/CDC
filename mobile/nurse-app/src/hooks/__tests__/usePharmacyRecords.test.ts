/**
 * usePharmacyRecords Hook Unit Tests
 * Tests for custom hook functionality and state management
 */

import { renderHook, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { usePharmacyRecords } from '../usePharmacyRecords';
import pharmacyRecordsReducer from '../../store/slices/pharmacyRecordsSlice';
import authReducer from '../../store/slices/authSlice';
import type { PharmacyPatientRecord } from '../../types/nurse';
import type { ReactNode } from 'react';

describe('usePharmacyRecords Hook', () => {
  const mockRecord: PharmacyPatientRecord = {
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
    allergies: ['Penicillin'],
    interactions: ['Lisinopril + NSAIDs: Use with caution'],
    lastUpdated: '2024-12-15T10:30:00Z',
  };

  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        pharmacyRecords: pharmacyRecordsReducer,
        auth: authReducer,
      },
      preloadedState: {
        pharmacyRecords: {
          records: { P001: [mockRecord] },
          selectedRecord: mockRecord,
          loading: false,
          error: null,
          lastAccessedPatientId: 'P001',
          auditLog: [],
        },
        auth: {
          isAuthenticated: true,
          nurse: {
            id: 'N001',
            email: 'nurse@test.com',
            firstName: 'Jane',
            lastName: 'Smith',
            licenseNumber: 'LN123',
            specialization: ['ICU'],
            facility: 'Hospital',
            hinEIDVerified: true,
            phoneNumber: '+41123456789',
            shift: 'day',
            certifications: ['BLS'],
          },
          token: 'test-token',
          hinEIDVerified: true,
        },
      },
    });
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  describe('initial state', () => {
    it('should return current records for patient', () => {
      const { result } = renderHook(() => usePharmacyRecords('P001'), { wrapper });
      expect(result.current.records).toHaveLength(1);
      expect(result.current.records[0].id).toBe('PR001');
    });

    it('should return selected record', () => {
      const { result } = renderHook(() => usePharmacyRecords('P001'), { wrapper });
      expect(result.current.selectedRecord).toEqual(mockRecord);
    });

    it('should return empty records for unknown patient', () => {
      const { result } = renderHook(() => usePharmacyRecords('P999'), { wrapper });
      expect(result.current.records).toEqual([]);
    });

    it('should return loading state', () => {
      const { result } = renderHook(() => usePharmacyRecords('P001'), { wrapper });
      expect(result.current.loading).toBe(false);
    });

    it('should return no error initially', () => {
      const { result } = renderHook(() => usePharmacyRecords('P001'), { wrapper });
      expect(result.current.error).toBeNull();
    });
  });

  describe('selectRecord action', () => {
    it('should allow selecting a record', () => {
      const { result } = renderHook(() => usePharmacyRecords('P001'), { wrapper });

      act(() => {
        result.current.selectRecord(mockRecord);
      });

      expect(result.current.selectedRecord).toEqual(mockRecord);
    });

    it('should allow clearing selection', () => {
      const { result } = renderHook(() => usePharmacyRecords('P001'), { wrapper });

      act(() => {
        result.current.selectRecord(null);
      });

      expect(result.current.selectedRecord).toBeNull();
    });
  });

  describe('clearSelected action', () => {
    it('should clear selected record', () => {
      const { result } = renderHook(() => usePharmacyRecords('P001'), { wrapper });

      act(() => {
        result.current.clearSelected();
      });

      expect(result.current.selectedRecord).toBeNull();
    });
  });

  describe('clearErrorMessage action', () => {
    it('should clear error message', () => {
      const errorStore = configureStore({
        reducer: {
          pharmacyRecords: pharmacyRecordsReducer,
          auth: authReducer,
        },
        preloadedState: {
          pharmacyRecords: {
            records: {},
            selectedRecord: null,
            loading: false,
            error: 'Test error',
            lastAccessedPatientId: null,
            auditLog: [],
          },
          auth: {
            isAuthenticated: true,
            nurse: null,
            token: null,
            hinEIDVerified: false,
          },
        },
      });

      const errorWrapper = ({ children }: { children: ReactNode }) => (
        <Provider store={errorStore}>{children}</Provider>
      );

      const { result } = renderHook(() => usePharmacyRecords('P001'), { wrapper: errorWrapper });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearErrorMessage();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('getMedicationHistory', () => {
    it('should return medication history from selected record', () => {
      const { result } = renderHook(() => usePharmacyRecords('P001'), { wrapper });

      const history = result.current.getMedicationHistory();
      expect(history).toHaveLength(2);
      expect(history[0].name).toBe('Lisinopril');
      expect(history[1].name).toBe('Metformin');
    });

    it('should return empty array if no selected record', () => {
      const { result } = renderHook(() => usePharmacyRecords('P001'), { wrapper });

      act(() => {
        result.current.clearSelected();
      });

      const history = result.current.getMedicationHistory();
      expect(history).toEqual([]);
    });
  });

  describe('getAllergies', () => {
    it('should return allergies from selected record', () => {
      const { result } = renderHook(() => usePharmacyRecords('P001'), { wrapper });

      const allergies = result.current.getAllergies();
      expect(allergies).toEqual(['Penicillin']);
    });

    it('should return empty array if no selected record', () => {
      const { result } = renderHook(() => usePharmacyRecords('P001'), { wrapper });

      act(() => {
        result.current.clearSelected();
      });

      const allergies = result.current.getAllergies();
      expect(allergies).toEqual([]);
    });
  });

  describe('getInteractions', () => {
    it('should return interactions from selected record', () => {
      const { result } = renderHook(() => usePharmacyRecords('P001'), { wrapper });

      const interactions = result.current.getInteractions();
      expect(interactions).toEqual(['Lisinopril + NSAIDs: Use with caution']);
    });

    it('should return empty array if no selected record', () => {
      const { result } = renderHook(() => usePharmacyRecords('P001'), { wrapper });

      act(() => {
        result.current.clearSelected();
      });

      const interactions = result.current.getInteractions();
      expect(interactions).toEqual([]);
    });
  });

  describe('getPharmacyName', () => {
    it('should return pharmacy name from selected record', () => {
      const { result } = renderHook(() => usePharmacyRecords('P001'), { wrapper });

      const name = result.current.getPharmacyName();
      expect(name).toBe('Main Pharmacy');
    });

    it('should return default text if no selected record', () => {
      const { result } = renderHook(() => usePharmacyRecords('P001'), { wrapper });

      act(() => {
        result.current.clearSelected();
      });

      const name = result.current.getPharmacyName();
      expect(name).toBe('Unknown Pharmacy');
    });
  });

  describe('getLastUpdated', () => {
    it('should return last updated date from selected record', () => {
      const { result } = renderHook(() => usePharmacyRecords('P001'), { wrapper });

      const lastUpdated = result.current.getLastUpdated();
      expect(lastUpdated).toBe('2024-12-15T10:30:00Z');
    });

    it('should return null if no selected record', () => {
      const { result } = renderHook(() => usePharmacyRecords('P001'), { wrapper });

      act(() => {
        result.current.clearSelected();
      });

      const lastUpdated = result.current.getLastUpdated();
      expect(lastUpdated).toBeNull();
    });
  });

  describe('loadRecords action', () => {
    it('should be callable (mock implementation)', () => {
      const { result } = renderHook(() => usePharmacyRecords('P001'), { wrapper });
      expect(typeof result.current.loadRecords).toBe('function');
    });
  });
});
