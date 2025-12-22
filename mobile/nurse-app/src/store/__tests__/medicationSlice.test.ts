/**
 * Medication Slice Tests
 * Unit tests for medication state management and order form
 */

import medicationReducer, {
  setActiveOrders,
  addOrder,
  updateOrder,
  setAdministrationHistory,
  addAdministrationLog,
  setLoadingOrders,
  initializeOrderForm,
  updateOrderFormMedications,
  updateOrderFormUrgency,
  updateOrderFormNotes,
  setOrderFormErrors,
  setSubmittingOrder,
  clearOrderForm,
} from '../medicationSlice';
import { MedicationOrder, AdministrationLog } from '../../types/nurse';

describe('medicationSlice', () => {
  const initialState = {
    activeOrders: [],
    administrationHistory: [],
    isLoadingOrders: false,
    currentOrderForm: null,
    orderFormErrors: {},
    isSubmittingOrder: false,
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

  describe('order form management', () => {
    it('should initialize order form with patient ID', () => {
      const actual = medicationReducer(initialState, initializeOrderForm('patient-001'));

      expect(actual.currentOrderForm).not.toBeNull();
      expect(actual.currentOrderForm?.patientId).toBe('patient-001');
      expect(actual.currentOrderForm?.medications).toEqual([]);
      expect(actual.currentOrderForm?.urgency).toBe('routine');
      expect(actual.currentOrderForm?.notes).toBe('');
      expect(actual.orderFormErrors).toEqual({});
    });

    it('should update medications in order form', () => {
      let state = medicationReducer(initialState, initializeOrderForm('patient-001'));

      const medications = [
        { medicationId: 'med-001', name: 'Aspirin', quantity: 2, dosage: '500mg' },
        { medicationId: 'med-002', name: 'Ibuprofen', quantity: 3, dosage: '400mg' },
      ];

      state = medicationReducer(state, updateOrderFormMedications(medications));

      expect(state.currentOrderForm?.medications).toEqual(medications);
      expect(state.currentOrderForm?.medications.length).toBe(2);
    });

    it('should update urgency level', () => {
      let state = medicationReducer(initialState, initializeOrderForm('patient-001'));
      state = medicationReducer(state, updateOrderFormUrgency('urgent'));

      expect(state.currentOrderForm?.urgency).toBe('urgent');
    });

    it('should update notes', () => {
      let state = medicationReducer(initialState, initializeOrderForm('patient-001'));
      state = medicationReducer(state, updateOrderFormNotes('Test notes'));

      expect(state.currentOrderForm?.notes).toBe('Test notes');
    });

    it('should set form errors', () => {
      const errors = {
        medications: 'At least one medication is required',
      };

      const actual = medicationReducer(initialState, setOrderFormErrors(errors));

      expect(actual.orderFormErrors).toEqual(errors);
    });

    it('should set submitting state', () => {
      const actual = medicationReducer(initialState, setSubmittingOrder(true));

      expect(actual.isSubmittingOrder).toBe(true);
    });

    it('should clear order form', () => {
      let state = medicationReducer(initialState, initializeOrderForm('patient-001'));
      state = medicationReducer(
        state,
        updateOrderFormMedications([
          { medicationId: 'med-001', name: 'Aspirin', quantity: 2, dosage: '500mg' },
        ])
      );
      state = medicationReducer(state, setOrderFormErrors({ medications: 'Error' }));
      state = medicationReducer(state, setSubmittingOrder(true));

      state = medicationReducer(state, clearOrderForm());

      expect(state.currentOrderForm).toBeNull();
      expect(state.orderFormErrors).toEqual({});
      expect(state.isSubmittingOrder).toBe(false);
    });

    it('should handle complete order form workflow', () => {
      let state = medicationReducer(initialState, initializeOrderForm('patient-001'));

      state = medicationReducer(
        state,
        updateOrderFormMedications([
          { medicationId: 'med-001', name: 'Aspirin', quantity: 2, dosage: '500mg' },
        ])
      );

      state = medicationReducer(state, updateOrderFormUrgency('urgent'));
      state = medicationReducer(state, updateOrderFormNotes('Rush delivery'));

      expect(state.currentOrderForm).toMatchObject({
        patientId: 'patient-001',
        medications: [
          { medicationId: 'med-001', name: 'Aspirin', quantity: 2, dosage: '500mg' },
        ],
        urgency: 'urgent',
        notes: 'Rush delivery',
      });

      state = medicationReducer(state, clearOrderForm());

      expect(state.currentOrderForm).toBeNull();
    });
  });
});
