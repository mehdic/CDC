/**
 * Patient Slice Tests
 */

import patientReducer, {
  searchPatients,
  loadAssignedPatients,
  selectPatient,
  clearSelectedPatient,
  clearError,
} from '../../src/store/slices/patientSlice';
import { Patient } from '../../src/types';

describe('patientSlice', () => {
  const initialState = {
    patients: [],
    selectedPatient: null,
    loading: false,
    error: null,
  };

  const mockPatient: Patient = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1980-01-01',
    mrn: 'MRN-12345',
    roomNumber: '101',
    allergies: ['Penicillin'],
    chronicConditions: ['Diabetes'],
    currentMedications: [],
    status: 'active',
  };

  it('should return initial state', () => {
    expect(patientReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle selectPatient', () => {
    const actual = patientReducer(initialState, selectPatient(mockPatient));
    expect(actual.selectedPatient).toEqual(mockPatient);
  });

  it('should handle clearSelectedPatient', () => {
    const stateWithPatient = { ...initialState, selectedPatient: mockPatient };
    const actual = patientReducer(stateWithPatient, clearSelectedPatient());
    expect(actual.selectedPatient).toBeNull();
  });

  it('should handle clearError', () => {
    const stateWithError = { ...initialState, error: 'Some error' };
    const actual = patientReducer(stateWithError, clearError());
    expect(actual.error).toBeNull();
  });

  it('should handle searchPatients.pending', () => {
    const action = { type: searchPatients.pending.type };
    const state = patientReducer(initialState, action);
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should handle searchPatients.fulfilled', () => {
    const action = {
      type: searchPatients.fulfilled.type,
      payload: [mockPatient],
    };
    const state = patientReducer(initialState, action);
    expect(state.loading).toBe(false);
    expect(state.patients).toEqual([mockPatient]);
  });

  it('should handle searchPatients.rejected', () => {
    const action = {
      type: searchPatients.rejected.type,
      payload: 'Search failed',
    };
    const state = patientReducer(initialState, action);
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Search failed');
  });

  it('should handle loadAssignedPatients.fulfilled', () => {
    const action = {
      type: loadAssignedPatients.fulfilled.type,
      payload: [mockPatient, { ...mockPatient, id: '2' }],
    };
    const state = patientReducer(initialState, action);
    expect(state.loading).toBe(false);
    expect(state.patients).toHaveLength(2);
  });
});
