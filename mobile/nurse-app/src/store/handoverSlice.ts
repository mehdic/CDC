/**
 * Handover Redux Slice
 * State management for shift handover notes
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ShiftHandoverNote } from '../types/nurse';
import nurseApi from '../services/nurseApi';

/**
 * Async Thunks
 */
export const createHandover = createAsyncThunk(
  'handover/createHandover',
  async (note: Omit<ShiftHandoverNote, 'id' | 'createdAt'>) => {
    const response = await nurseApi.createHandoverNote(note);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create handover note');
    }
    return response.data;
  }
);

export const fetchHandoverNotes = createAsyncThunk(
  'handover/fetchHandoverNotes',
  async (date: string) => {
    const response = await nurseApi.getHandoverNotes(date);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch handover notes');
    }
    return response.data;
  }
);

export const fetchMyHandoverNotes = createAsyncThunk(
  'handover/fetchMyHandoverNotes',
  async () => {
    const response = await nurseApi.getMyHandoverNotes();
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch my handover notes');
    }
    return response.data;
  }
);

/**
 * State Type
 */
interface HandoverState {
  notes: ShiftHandoverNote[];
  currentNote: ShiftHandoverNote | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  acknowledgedNotes: string[]; // IDs of acknowledged notes
}

/**
 * Initial State
 */
const initialState: HandoverState = {
  notes: [],
  currentNote: null,
  loading: false,
  error: null,
  success: false,
  acknowledgedNotes: [],
};

/**
 * Handover Slice
 */
const handoverSlice = createSlice({
  name: 'handover',
  initialState,
  reducers: {
    /**
     * Clear error
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Clear success
     */
    clearSuccess: (state) => {
      state.success = false;
    },

    /**
     * Set current note
     */
    setCurrentNote: (state, action: PayloadAction<ShiftHandoverNote | null>) => {
      state.currentNote = action.payload;
    },

    /**
     * Acknowledge handover note
     */
    acknowledgeHandover: (state, action: PayloadAction<string>) => {
      if (!state.acknowledgedNotes.includes(action.payload)) {
        state.acknowledgedNotes.push(action.payload);
      }
    },

    /**
     * Reset state
     */
    resetState: (state) => {
      state.notes = [];
      state.currentNote = null;
      state.loading = false;
      state.error = null;
      state.success = false;
      state.acknowledgedNotes = [];
    },
  },

  extraReducers: (builder) => {
    // Create Handover
    builder
      .addCase(createHandover.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createHandover.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.notes.unshift(action.payload);
        state.currentNote = action.payload;
      })
      .addCase(createHandover.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create handover note';
        state.success = false;
      });

    // Fetch Handover Notes
    builder
      .addCase(fetchHandoverNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHandoverNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = action.payload;
      })
      .addCase(fetchHandoverNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch handover notes';
      });

    // Fetch My Handover Notes
    builder
      .addCase(fetchMyHandoverNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyHandoverNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = action.payload;
      })
      .addCase(fetchMyHandoverNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch my handover notes';
      });
  },
});

/**
 * Export actions
 */
export const {
  clearError,
  clearSuccess,
  setCurrentNote,
  acknowledgeHandover,
  resetState,
} = handoverSlice.actions;

/**
 * Export reducer
 */
export default handoverSlice.reducer;
