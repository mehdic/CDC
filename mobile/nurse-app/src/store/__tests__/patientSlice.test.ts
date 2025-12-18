/**
 * Patient Slice Tests
 * Unit tests for patient state management
 */

import patientReducer, {
  setSearchResults,
  setSelectedPatient,
  setSearching,
  setSearchQuery,
  clearSearch,
} from '../patientSlice';
import { Patient } from '../../types/nurse';

describe('patientSlice', () => {
  const initialState = {
    searchResults: [],
    selectedPatient: null,
    isSearching: false,
    searchQuery: '',
  };

  const mockPatient: Patient = {
    id: '1',
    firstName: 'John',
    lastName: 'Smith',
    dateOfBirth: '1980-01-01',
    allergies: ['Penicillin'],
    chronicConditions: [],
    currentMedications: [],
  };

  it('should return initial state', () => {
    expect(patientReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setSearchResults', () => {
    const actual = patientReducer(initialState, setSearchResults([mockPatient]));
    expect(actual.searchResults).toHaveLength(1);
    expect(actual.searchResults[0]).toEqual(mockPatient);
    expect(actual.isSearching).toBe(false);
  });

  it('should handle setSelectedPatient', () => {
    const actual = patientReducer(initialState, setSelectedPatient(mockPatient));
    expect(actual.selectedPatient).toEqual(mockPatient);
  });

  it('should handle setSearching', () => {
    const actual = patientReducer(initialState, setSearching(true));
    expect(actual.isSearching).toBe(true);
  });

  it('should handle setSearchQuery', () => {
    const actual = patientReducer(initialState, setSearchQuery('John'));
    expect(actual.searchQuery).toBe('John');
  });

  it('should handle clearSearch', () => {
    const stateWithSearch = {
      searchResults: [mockPatient],
      selectedPatient: mockPatient,
      isSearching: true,
      searchQuery: 'John',
    };

    const actual = patientReducer(stateWithSearch, clearSearch());

    expect(actual.searchResults).toEqual([]);
    expect(actual.searchQuery).toBe('');
    expect(actual.isSearching).toBe(false);
    expect(actual.selectedPatient).toEqual(mockPatient); // Not cleared
  });
});
