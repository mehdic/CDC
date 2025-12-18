/**
 * Patient Redux Slice
 * Manages patient data and search state
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Patient } from '../types/nurse';

export interface SearchFilters {
  unit?: string;
  medicationStatus?: 'active' | 'inactive' | 'all';
  sortBy?: 'name' | 'room' | 'recent';
}

interface PatientState {
  searchResults: Patient[];
  selectedPatient: Patient | null;
  isSearching: boolean;
  searchQuery: string;
  recentPatients: Patient[];
  searchFilters: SearchFilters;
  allPatients: Patient[];
  error: string | null;
}

const initialState: PatientState = {
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

const patientSlice = createSlice({
  name: 'patient',
  initialState,
  reducers: {
    setSearchResults: (state, action: PayloadAction<Patient[]>) => {
      state.searchResults = action.payload;
      state.isSearching = false;
    },
    setSelectedPatient: (state, action: PayloadAction<Patient | null>) => {
      const patient = action.payload;
      state.selectedPatient = patient;
      // Add to recent patients if not already there
      if (patient) {
        const filtered = state.recentPatients.filter((p) => p.id !== patient.id);
        state.recentPatients = [patient, ...filtered].slice(0, 5);
      }
    },
    setSearching: (state, action: PayloadAction<boolean>) => {
      state.isSearching = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSearchFilters: (state, action: PayloadAction<SearchFilters>) => {
      state.searchFilters = { ...state.searchFilters, ...action.payload };
    },
    setAllPatients: (state, action: PayloadAction<Patient[]>) => {
      state.allPatients = action.payload;
    },
    clearSearch: (state) => {
      state.searchResults = [];
      state.searchQuery = '';
      state.isSearching = false;
      state.searchFilters = {
        unit: undefined,
        medicationStatus: 'all',
        sortBy: 'name',
      };
      state.error = null;
    },
    clearSelectedPatient: (state) => {
      state.selectedPatient = null;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearRecentPatients: (state) => {
      state.recentPatients = [];
    },
  },
});

export const {
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
} = patientSlice.actions;

export default patientSlice.reducer;
