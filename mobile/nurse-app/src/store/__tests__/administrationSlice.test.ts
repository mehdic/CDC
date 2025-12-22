/**
 * Administration Slice Tests
 */

import administrationReducer, {
  setCurrentAdministration,
  addAdministration,
  setPatientFilter,
  setMedicationFilter,
  setSortBy,
  clearFilters,
  resetAdministration,
  clearError,
} from '../administrationSlice';
import { MedicationAdministration } from '../../types';

describe('administrationSlice', () => {
  const mockAdministration: MedicationAdministration = {
    id: 'admin-1',
    patientId: 'patient-1',
    medicationId: 'med-1',
    scheduledTime: '2025-12-22T08:00:00Z',
    administeredAt: '2025-12-22T08:05:00Z',
    administeredBy: 'nurse-1',
    dosage: '500mg',
    route: 'oral',
    notes: 'Test note',
    barcodeVerified: true,
    sideEffects: ['nausea'],
    witnessed: true,
    witnessedBy: 'nurse-2',
  };

  it('should have correct initial state', () => {
    const state = administrationReducer(undefined, { type: '' });
    expect(state.administrations).toEqual([]);
    expect(state.filteredAdministrations).toEqual([]);
    expect(state.currentAdministration).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  describe('reducers', () => {
    it('should clear error', () => {
      const previousState = administrationReducer(undefined, { type: '' });
      const state = administrationReducer(
        { ...previousState, error: 'Some error' },
        clearError()
      );
      expect(state.error).toBeNull();
    });

    it('should set current administration', () => {
      const state = administrationReducer(
        administrationReducer(undefined, { type: '' }),
        setCurrentAdministration(mockAdministration)
      );
      expect(state.currentAdministration).toEqual(mockAdministration);
    });

    it('should add administration', () => {
      let state = administrationReducer(undefined, { type: '' });
      state = administrationReducer(state, addAdministration(mockAdministration));
      expect(state.administrations).toContainEqual(mockAdministration);
      expect(state.filteredAdministrations).toContainEqual(mockAdministration);
    });

    it('should set patient filter', () => {
      let state = administrationReducer(undefined, { type: '' });
      state = administrationReducer(state, addAdministration(mockAdministration));
      state = administrationReducer(
        state,
        setPatientFilter('patient-1')
      );
      expect(state.filterPatientId).toBe('patient-1');
    });

    it('should set medication filter', () => {
      let state = administrationReducer(undefined, { type: '' });
      state = administrationReducer(state, addAdministration(mockAdministration));
      state = administrationReducer(
        state,
        setMedicationFilter('med-1')
      );
      expect(state.filterMedicationId).toBe('med-1');
    });

    it('should set sort by', () => {
      let state = administrationReducer(undefined, { type: '' });
      state = administrationReducer(state, setSortBy('medication'));
      expect(state.sortBy).toBe('medication');
    });

    it('should clear filters', () => {
      let state = administrationReducer(undefined, { type: '' });
      state = administrationReducer(state, addAdministration(mockAdministration));
      state = administrationReducer(
        state,
        setPatientFilter('patient-1')
      );
      state = administrationReducer(state, clearFilters());
      expect(state.filterPatientId).toBeNull();
      expect(state.filterMedicationId).toBeNull();
    });

    it('should reset administration', () => {
      let state = administrationReducer(undefined, { type: '' });
      state = administrationReducer(state, addAdministration(mockAdministration));
      state = administrationReducer(state, resetAdministration());
      expect(state).toEqual(
        administrationReducer(undefined, { type: '' })
      );
    });
  });

  describe('filtering', () => {
    it('should filter administrations by patient', () => {
      const admin2 = { ...mockAdministration, patientId: 'patient-2', id: 'admin-2' };
      let state = administrationReducer(undefined, { type: '' });
      state = administrationReducer(state, addAdministration(mockAdministration));
      state = administrationReducer(state, addAdministration(admin2));

      state = administrationReducer(
        state,
        setPatientFilter('patient-1')
      );

      expect(state.filteredAdministrations).toHaveLength(1);
      expect(state.filteredAdministrations[0].patientId).toBe('patient-1');
    });

    it('should filter administrations by medication', () => {
      const admin2 = { ...mockAdministration, medicationId: 'med-2', id: 'admin-2' };
      let state = administrationReducer(undefined, { type: '' });
      state = administrationReducer(state, addAdministration(mockAdministration));
      state = administrationReducer(state, addAdministration(admin2));

      state = administrationReducer(
        state,
        setMedicationFilter('med-1')
      );

      expect(state.filteredAdministrations).toHaveLength(1);
      expect(state.filteredAdministrations[0].medicationId).toBe('med-1');
    });
  });

  describe('sorting', () => {
    it('should sort by date', () => {
      const admin1 = mockAdministration;
      const admin2 = {
        ...mockAdministration,
        id: 'admin-2',
        administeredAt: '2025-12-21T08:05:00Z',
      };

      let state = administrationReducer(undefined, { type: '' });
      state = administrationReducer(state, addAdministration(admin1));
      state = administrationReducer(state, addAdministration(admin2));
      state = administrationReducer(state, setSortBy('date'));

      expect(state.filteredAdministrations[0].administeredAt).toBeGreaterThan(
        state.filteredAdministrations[1].administeredAt
      );
    });
  });
});
