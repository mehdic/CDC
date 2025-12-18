/**
 * Medication Redux Slice
 * Manages medication orders and administration logs
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { MedicationOrder, AdministrationLog } from '../types/nurse';

interface MedicationState {
  activeOrders: MedicationOrder[];
  administrationHistory: AdministrationLog[];
  isLoadingOrders: boolean;
}

const initialState: MedicationState = {
  activeOrders: [],
  administrationHistory: [],
  isLoadingOrders: false,
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
  },
});

export const {
  setActiveOrders,
  addOrder,
  updateOrder,
  setAdministrationHistory,
  addAdministrationLog,
  setLoadingOrders,
} = medicationSlice.actions;
export default medicationSlice.reducer;
