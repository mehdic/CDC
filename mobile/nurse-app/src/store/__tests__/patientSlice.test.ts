/**
 * Patient Slice Unit Tests
 * Tests for patient state management, search, and filtering
 */

import patientReducer, {
  setSearchResults,
  setSelectedPatient,
  setSearching,
  setSearchQuery,
  setSearchFilters,
  setAllPatients,
  clearSearch,
  clearSelectedPatient,
  setError,
  clearRecentPatients,
  SearchFilters,
} from '../patientSlice';
import { Patient } from '../../types/nurse';

describe('patientSlice', () => {
  const mockPatient: Patient = {
    id: 'P001',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1960-05-15',
    allergies: ['Penicillin'],
    chronicConditions: ['Hypertension'],
    currentMedications: [
      {
        id: 'M1',
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'daily',
        route: 'oral',
        startDate: '2024-01-01',
        prescribedBy: 'Dr. Smith',
      },
    ],
    roomNumber: '101',
    admissionDate: '2024-12-01',
  };

  const mockPatient2: Patient = {
    id: 'P002',
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1970-08-22',
    allergies: [],
    chronicConditions: ['Diabetes'],
    currentMedications: [
      {
        id: 'M2',
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'twice daily',
        route: 'oral',
        startDate: '2024-06-15',
        prescribedBy: 'Dr. Johnson',
      },
    ],
    roomNumber: '102',
  };

  const initialState = {
    searchResults: [],
    selectedPatient: null,
    isSearching: false,
    searchQuery: '',
    recentPatients: [],
    searchFilters: {
      unit: undefined,
      medicationStatus: 'all',
      sortBy: 'name',
    },
    allPatients: [],
    error: null,
  };

  describe('initial state', () => {
    it('should return initial state', () => {
      expect(patientReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('setSearchResults', () => {
    it('should set search results and mark searching as false', () => {
      const action = setSearchResults([mockPatient, mockPatient2]);
      const state = patientReducer(initialState, action);
      expect(state.searchResults).toEqual([mockPatient, mockPatient2]);
      expect(state.isSearching).toBe(false);
    });

    it('should replace existing search results', () => {
      const stateWithResults = {
        ...initialState,
        searchResults: [mockPatient],
      };
      const action = setSearchResults([mockPatient2]);
      const state = patientReducer(stateWithResults, action);
      expect(state.searchResults).toEqual([mockPatient2]);
      expect(state.searchResults).toHaveLength(1);
    });

    it('should handle empty search results', () => {
      const action = setSearchResults([]);
      const state = patientReducer(initialState, action);
      expect(state.searchResults).toEqual([]);
    });
  });

  describe('setSelectedPatient', () => {
    it('should set selected patient', () => {
      const action = setSelectedPatient(mockPatient);
      const state = patientReducer(initialState, action);
      expect(state.selectedPatient).toEqual(mockPatient);
    });

    it('should add patient to recent patients when selected', () => {
      const action = setSelectedPatient(mockPatient);
      const state = patientReducer(initialState, action);
      expect(state.recentPatients).toContain(mockPatient);
      expect(state.recentPatients).toHaveLength(1);
    });

    it('should move selected patient to front of recent patients list', () => {
      let state = patientReducer(initialState, setSelectedPatient(mockPatient));
      expect(state.recentPatients[0]).toEqual(mockPatient);

      state = patientReducer(state, setSelectedPatient(mockPatient2));
      expect(state.recentPatients[0]).toEqual(mockPatient2);
      expect(state.recentPatients[1]).toEqual(mockPatient);
    });

    it('should keep maximum 5 recent patients', () => {
      const patients = Array.from({ length: 7 }, (_, i) => ({
        ...mockPatient,
        id: `P${i}`,
      }));

      let state = initialState;
      patients.forEach((patient) => {
        state = patientReducer(state, setSelectedPatient(patient));
      });

      expect(state.recentPatients).toHaveLength(5);
      expect(state.recentPatients[0].id).toBe('P6');
    });

    it('should not duplicate patient in recent patients', () => {
      let state = patientReducer(initialState, setSelectedPatient(mockPatient));
      expect(state.recentPatients).toHaveLength(1);

      state = patientReducer(state, setSelectedPatient(mockPatient));
      expect(state.recentPatients).toHaveLength(1);
    });

    it('should handle null patient (clearing selection)', () => {
      const stateWithPatient = {
        ...initialState,
        selectedPatient: mockPatient,
      };
      const action = setSelectedPatient(null);
      const state = patientReducer(stateWithPatient, action);
      expect(state.selectedPatient).toBeNull();
    });
  });

  describe('setSearching', () => {
    it('should set isSearching to true', () => {
      const action = setSearching(true);
      const state = patientReducer(initialState, action);
      expect(state.isSearching).toBe(true);
    });

    it('should set isSearching to false', () => {
      const stateSearching = { ...initialState, isSearching: true };
      const action = setSearching(false);
      const state = patientReducer(stateSearching, action);
      expect(state.isSearching).toBe(false);
    });
  });

  describe('setSearchQuery', () => {
    it('should set search query', () => {
      const action = setSearchQuery('John');
      const state = patientReducer(initialState, action);
      expect(state.searchQuery).toBe('John');
    });

    it('should replace existing search query', () => {
      const stateWithQuery = { ...initialState, searchQuery: 'Jane' };
      const action = setSearchQuery('John');
      const state = patientReducer(stateWithQuery, action);
      expect(state.searchQuery).toBe('John');
    });

    it('should handle empty search query', () => {
      const stateWithQuery = { ...initialState, searchQuery: 'John' };
      const action = setSearchQuery('');
      const state = patientReducer(stateWithQuery, action);
      expect(state.searchQuery).toBe('');
    });
  });

  describe('setSearchFilters', () => {
    it('should set search filters', () => {
      const filters: SearchFilters = {
        unit: '1',
        medicationStatus: 'active',
        sortBy: 'name',
      };
      const action = setSearchFilters(filters);
      const state = patientReducer(initialState, action);
      expect(state.searchFilters).toEqual(filters);
    });

    it('should merge filters with existing filters', () => {
      const stateWithFilters = {
        ...initialState,
        searchFilters: {
          unit: '1',
          medicationStatus: 'active',
          sortBy: 'name',
        },
      };
      const newFilters: SearchFilters = { unit: '2' };
      const action = setSearchFilters(newFilters);
      const state = patientReducer(stateWithFilters, action);
      expect(state.searchFilters).toEqual({
        unit: '2',
        medicationStatus: 'active',
        sortBy: 'name',
      });
    });

    it('should handle partial filter updates', () => {
      const filters: SearchFilters = { sortBy: 'room' };
      const action = setSearchFilters(filters);
      const state = patientReducer(initialState, action);
      expect(state.searchFilters.sortBy).toBe('room');
      expect(state.searchFilters.medicationStatus).toBe('all');
    });
  });

  describe('setAllPatients', () => {
    it('should set all patients', () => {
      const patients = [mockPatient, mockPatient2];
      const action = setAllPatients(patients);
      const state = patientReducer(initialState, action);
      expect(state.allPatients).toEqual(patients);
    });

    it('should replace existing patients', () => {
      const stateWithPatients = {
        ...initialState,
        allPatients: [mockPatient],
      };
      const action = setAllPatients([mockPatient2]);
      const state = patientReducer(stateWithPatients, action);
      expect(state.allPatients).toEqual([mockPatient2]);
    });

    it('should handle empty patient list', () => {
      const action = setAllPatients([]);
      const state = patientReducer(initialState, action);
      expect(state.allPatients).toEqual([]);
    });
  });

  describe('clearSearch', () => {
    it('should clear search results, query, filters, and error', () => {
      const stateWithSearch = {
        ...initialState,
        searchResults: [mockPatient],
        searchQuery: 'John',
        searchFilters: {
          unit: '1',
          medicationStatus: 'active',
          sortBy: 'room',
        },
        isSearching: true,
        error: 'Some error',
      };
      const action = clearSearch();
      const state = patientReducer(stateWithSearch, action);
      expect(state.searchResults).toEqual([]);
      expect(state.searchQuery).toBe('');
      expect(state.isSearching).toBe(false);
      expect(state.searchFilters).toEqual({
        unit: undefined,
        medicationStatus: 'all',
        sortBy: 'name',
      });
      expect(state.error).toBeNull();
    });
  });

  describe('clearSelectedPatient', () => {
    it('should clear selected patient', () => {
      const stateWithPatient = {
        ...initialState,
        selectedPatient: mockPatient,
      };
      const action = clearSelectedPatient();
      const state = patientReducer(stateWithPatient, action);
      expect(state.selectedPatient).toBeNull();
    });

    it('should not affect recent patients', () => {
      const stateWithPatient = {
        ...initialState,
        selectedPatient: mockPatient,
        recentPatients: [mockPatient],
      };
      const action = clearSelectedPatient();
      const state = patientReducer(stateWithPatient, action);
      expect(state.selectedPatient).toBeNull();
      expect(state.recentPatients).toEqual([mockPatient]);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const action = setError('Search failed');
      const state = patientReducer(initialState, action);
      expect(state.error).toBe('Search failed');
    });

    it('should clear error with null', () => {
      const stateWithError = { ...initialState, error: 'Some error' };
      const action = setError(null);
      const state = patientReducer(stateWithError, action);
      expect(state.error).toBeNull();
    });
  });

  describe('clearRecentPatients', () => {
    it('should clear recent patients list', () => {
      const stateWithRecent = {
        ...initialState,
        recentPatients: [mockPatient, mockPatient2],
      };
      const action = clearRecentPatients();
      const state = patientReducer(stateWithRecent, action);
      expect(state.recentPatients).toEqual([]);
    });
  });

  describe('complex scenarios', () => {
    it('should handle multiple patients being selected sequentially', () => {
      let state = initialState;
      const patients = [mockPatient, mockPatient2];

      patients.forEach((patient) => {
        state = patientReducer(state, setSelectedPatient(patient));
      });

      expect(state.selectedPatient).toEqual(mockPatient2);
      expect(state.recentPatients).toHaveLength(2);
      expect(state.recentPatients[0]).toEqual(mockPatient2);
      expect(state.recentPatients[1]).toEqual(mockPatient);
    });

    it('should maintain search results while clearing selected patient', () => {
      let state = patientReducer(initialState, setSearchResults([mockPatient]));
      state = patientReducer(state, setSelectedPatient(mockPatient));
      state = patientReducer(state, clearSelectedPatient());

      expect(state.searchResults).toEqual([mockPatient]);
      expect(state.selectedPatient).toBeNull();
    });

    it('should preserve recent patients when clearing search', () => {
      let state = patientReducer(initialState, setSelectedPatient(mockPatient));
      state = patientReducer(state, setSearchResults([mockPatient2]));
      state = patientReducer(state, setSearchQuery('test'));
      state = patientReducer(state, clearSearch());

      expect(state.recentPatients).toEqual([mockPatient]);
      expect(state.searchResults).toEqual([]);
      expect(state.searchQuery).toBe('');
    });
  });
});
