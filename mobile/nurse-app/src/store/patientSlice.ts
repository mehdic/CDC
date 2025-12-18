/**
 * Patient Redux Slice
 * Manages patient data and search state
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Patient } from '../types/nurse';

interface PatientState {
  searchResults: Patient[];
  selectedPatient: Patient | null;
  isSearching: boolean;
  searchQuery: string;
}

const initialState: PatientState = {
  searchResults: [],
  selectedPatient: null,
  isSearching: false,
  searchQuery: '',
};

const patientSlice = createSlice({
  name: 'patient',
  initialState,
  reducers: {
    setSearchResults: (state, action: PayloadAction<Patient[]>) => {
      state.searchResults = action.payload;
      state.isSearching = false;
    },
    setSelectedPatient: (state, action: PayloadAction<Patient | null>) => {
      state.selectedPatient = action.payload;
    },
    setSearching: (state, action: PayloadAction<boolean>) => {
      state.isSearching = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    clearSearch: (state) => {
      state.searchResults = [];
      state.searchQuery = '';
      state.isSearching = false;
    },
  },
});

export const { setSearchResults, setSelectedPatient, setSearching, setSearchQuery, clearSearch } =
  patientSlice.actions;
export default patientSlice.reducer;
