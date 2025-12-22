/**
 * ADR (Adverse Reaction) Redux Slice
 * Manages adverse reaction form state and submission
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AdverseReaction } from '../types';

export interface ADRFormData {
  patientId: string;
  patientName: string;
  medicationId: string;
  medicationName: string;
  reactionType: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  symptoms: string[];
  onsetTime: string;
  actionTaken: string;
  notes?: string;
  photoAttachments: {
    id: string;
    uri: string;
    fileName: string;
  }[];
}

export interface ADRState {
  currentReport: Partial<ADRFormData> | null;
  submittedReports: AdverseReaction[];
  isSubmitting: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: ADRState = {
  currentReport: null,
  submittedReports: [],
  isSubmitting: false,
  error: null,
  successMessage: null,
};

const adrSlice = createSlice({
  name: 'adr',
  initialState,
  reducers: {
    // Initialize form with patient and medication info
    initializeForm: (
      state,
      action: PayloadAction<{
        patientId: string;
        patientName: string;
        medicationId?: string;
        medicationName?: string;
      }>
    ) => {
      state.currentReport = {
        patientId: action.payload.patientId,
        patientName: action.payload.patientName,
        medicationId: action.payload.medicationId || '',
        medicationName: action.payload.medicationName || '',
        reactionType: '',
        severity: 'mild',
        symptoms: [],
        onsetTime: new Date().toISOString(),
        actionTaken: '',
        notes: undefined,
        photoAttachments: [],
      };
      state.error = null;
      state.successMessage = null;
    },

    // Update form field
    updateFormField: (
      state,
      action: PayloadAction<{
        field: keyof ADRFormData;
        value: any;
      }>
    ) => {
      if (state.currentReport) {
        state.currentReport[action.payload.field] = action.payload.value;
      }
    },

    // Add symptom
    addSymptom: (state, action: PayloadAction<string>) => {
      if (state.currentReport && Array.isArray(state.currentReport.symptoms)) {
        if (!state.currentReport.symptoms.includes(action.payload)) {
          state.currentReport.symptoms.push(action.payload);
        }
      }
    },

    // Remove symptom
    removeSymptom: (state, action: PayloadAction<string>) => {
      if (state.currentReport && Array.isArray(state.currentReport.symptoms)) {
        state.currentReport.symptoms = state.currentReport.symptoms.filter(
          (s) => s !== action.payload
        );
      }
    },

    // Add photo attachment
    addPhotoAttachment: (
      state,
      action: PayloadAction<{
        id: string;
        uri: string;
        fileName: string;
      }>
    ) => {
      if (state.currentReport) {
        state.currentReport.photoAttachments = [
          ...(state.currentReport.photoAttachments || []),
          action.payload,
        ];
      }
    },

    // Remove photo attachment
    removePhotoAttachment: (state, action: PayloadAction<string>) => {
      if (state.currentReport && state.currentReport.photoAttachments) {
        state.currentReport.photoAttachments = state.currentReport.photoAttachments.filter(
          (photo) => photo.id !== action.payload
        );
      }
    },

    // Set submitting state
    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },

    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Set success message
    setSuccessMessage: (state, action: PayloadAction<string | null>) => {
      state.successMessage = action.payload;
    },

    // Add submitted report
    addSubmittedReport: (state, action: PayloadAction<AdverseReaction>) => {
      state.submittedReports.push(action.payload);
      state.currentReport = null;
    },

    // Set submitted reports
    setSubmittedReports: (state, action: PayloadAction<AdverseReaction[]>) => {
      state.submittedReports = action.payload;
    },

    // Clear current form
    clearCurrentForm: (state) => {
      state.currentReport = null;
      state.error = null;
      state.successMessage = null;
    },

    // Reset ADR state
    resetADRState: (state) => {
      state.currentReport = null;
      state.submittedReports = [];
      state.isSubmitting = false;
      state.error = null;
      state.successMessage = null;
    },
  },
});

export const {
  initializeForm,
  updateFormField,
  addSymptom,
  removeSymptom,
  addPhotoAttachment,
  removePhotoAttachment,
  setSubmitting,
  setError,
  setSuccessMessage,
  addSubmittedReport,
  setSubmittedReports,
  clearCurrentForm,
  resetADRState,
} = adrSlice.actions;

export default adrSlice.reducer;
