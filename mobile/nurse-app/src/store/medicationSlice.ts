/**
 * Medication Redux Slice
 * Manages medication orders and administration logs
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { MedicationOrder, AdministrationLog } from '../types/nurse';

interface OrderFormData {
  patientId: string;
  medications: {
    medicationId: string;
    name: string;
    quantity: number;
    dosage: string;
  }[];
  urgency: 'routine' | 'urgent' | 'stat';
  notes?: string;
}

interface MedicationState {
  activeOrders: MedicationOrder[];
  administrationHistory: AdministrationLog[];
  isLoadingOrders: boolean;
  currentOrderForm: OrderFormData | null;
  orderFormErrors: Record<string, string>;
  isSubmittingOrder: boolean;
}

const initialState: MedicationState = {
  activeOrders: [],
  administrationHistory: [],
  isLoadingOrders: false,
  currentOrderForm: null,
  orderFormErrors: {},
  isSubmittingOrder: false,
};

const medicationSlice = createSlice({
  name: 'medication',
  initialState,
  reducers: {
    setActiveOrders: (state, action: PayloadAction<MedicationOrder[]>) => {
      state.activeOrders = action.payload;
      state.isLoadingOrders = false;
    },
    addOrder: (state, action: PayloadAction<MedicationOrder>) => {
      state.activeOrders.push(action.payload);
    },
    updateOrder: (state, action: PayloadAction<MedicationOrder>) => {
      const index = state.activeOrders.findIndex((o) => o.id === action.payload.id);
      if (index !== -1) {
        state.activeOrders[index] = action.payload;
      }
    },
    setAdministrationHistory: (state, action: PayloadAction<AdministrationLog[]>) => {
      state.administrationHistory = action.payload;
    },
    addAdministrationLog: (state, action: PayloadAction<AdministrationLog>) => {
      state.administrationHistory.unshift(action.payload);
    },
    setLoadingOrders: (state, action: PayloadAction<boolean>) => {
      state.isLoadingOrders = action.payload;
    },
    initializeOrderForm: (state, action: PayloadAction<string>) => {
      state.currentOrderForm = {
        patientId: action.payload,
        medications: [],
        urgency: 'routine',
        notes: '',
      };
      state.orderFormErrors = {};
    },
    updateOrderFormMedications: (
      state,
      action: PayloadAction<{
        medicationId: string;
        name: string;
        quantity: number;
        dosage: string;
      }[]>
    ) => {
      if (state.currentOrderForm) {
        state.currentOrderForm.medications = action.payload;
      }
    },
    updateOrderFormUrgency: (
      state,
      action: PayloadAction<'routine' | 'urgent' | 'stat'>
    ) => {
      if (state.currentOrderForm) {
        state.currentOrderForm.urgency = action.payload;
      }
    },
    updateOrderFormNotes: (state, action: PayloadAction<string>) => {
      if (state.currentOrderForm) {
        state.currentOrderForm.notes = action.payload;
      }
    },
    setOrderFormErrors: (state, action: PayloadAction<Record<string, string>>) => {
      state.orderFormErrors = action.payload;
    },
    setSubmittingOrder: (state, action: PayloadAction<boolean>) => {
      state.isSubmittingOrder = action.payload;
    },
    clearOrderForm: (state) => {
      state.currentOrderForm = null;
      state.orderFormErrors = {};
      state.isSubmittingOrder = false;
    },
  },
});

export const {
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
} = medicationSlice.actions;
export default medicationSlice.reducer;
