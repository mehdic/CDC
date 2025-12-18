/**
 * Medication Slice Tests
 * Unit tests for medication state management
 */

import medicationReducer, {
  setActiveOrders,
  addOrder,
  updateOrder,
  setAdministrationHistory,
  addAdministrationLog,
  setLoadingOrders,
} from '../medicationSlice';
import { MedicationOrder, AdministrationLog } from '../../types/nurse';

describe('medicationSlice', () => {
  const initialState = {
    activeOrders: [],
    administrationHistory: [],
    isLoadingOrders: false,
  };

  const mockOrder: MedicationOrder = {
    id: '1',
    patientId: 'p1',
    pharmacyId: 'ph1',
    medications: [
      {
        medicationId: 'm1',
        name: 'Aspirin',
        quantity: 30,
        dosage: '100mg',
      },
    ],
    urgency: 'routine',
    status: 'pending',
    orderedBy: 'nurse1',
    orderedAt: '2025-12-18T10:00:00Z',
  };

  const mockLog: AdministrationLog = {
    id: 'log1',
    patientId: 'p1',
    medicationId: 'm1',
    medicationName: 'Aspirin',
    dosage: '100mg',
    route: 'oral',
    administeredBy: 'nurse1',
    administeredAt: '2025-12-18T10:00:00Z',
  };

  it('should return initial state', () => {
    expect(medicationReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setActiveOrders', () => {
    const actual = medicationReducer(initialState, setActiveOrders([mockOrder]));
    expect(actual.activeOrders).toHaveLength(1);
    expect(actual.activeOrders[0]).toEqual(mockOrder);
    expect(actual.isLoadingOrders).toBe(false);
  });

  it('should handle addOrder', () => {
    const actual = medicationReducer(initialState, addOrder(mockOrder));
    expect(actual.activeOrders).toHaveLength(1);
    expect(actual.activeOrders[0]).toEqual(mockOrder);
  });

  it('should handle updateOrder', () => {
    const stateWithOrder = {
      ...initialState,
      activeOrders: [mockOrder],
    };

    const updatedOrder = { ...mockOrder, status: 'processing' as const };
    const actual = medicationReducer(stateWithOrder, updateOrder(updatedOrder));

    expect(actual.activeOrders[0].status).toBe('processing');
  });

  it('should not update order if ID not found', () => {
    const stateWithOrder = {
      ...initialState,
      activeOrders: [mockOrder],
    };

    const differentOrder = { ...mockOrder, id: 'different-id' };
    const actual = medicationReducer(stateWithOrder, updateOrder(differentOrder));

    expect(actual.activeOrders).toHaveLength(1);
    expect(actual.activeOrders[0]).toEqual(mockOrder); // Unchanged
  });

  it('should handle setAdministrationHistory', () => {
    const actual = medicationReducer(initialState, setAdministrationHistory([mockLog]));
    expect(actual.administrationHistory).toHaveLength(1);
    expect(actual.administrationHistory[0]).toEqual(mockLog);
  });

  it('should handle addAdministrationLog', () => {
    const actual = medicationReducer(initialState, addAdministrationLog(mockLog));
    expect(actual.administrationHistory).toHaveLength(1);
    expect(actual.administrationHistory[0]).toEqual(mockLog);
  });

  it('should prepend new log when adding to existing history', () => {
    const existingLog = { ...mockLog, id: 'log2' };
    const stateWithHistory = {
      ...initialState,
      administrationHistory: [existingLog],
    };

    const actual = medicationReducer(stateWithHistory, addAdministrationLog(mockLog));

    expect(actual.administrationHistory).toHaveLength(2);
    expect(actual.administrationHistory[0]).toEqual(mockLog); // New log first
    expect(actual.administrationHistory[1]).toEqual(existingLog);
  });

  it('should handle setLoadingOrders', () => {
    const actual = medicationReducer(initialState, setLoadingOrders(true));
    expect(actual.isLoadingOrders).toBe(true);
  });
});
