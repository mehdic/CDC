/**
 * Redux Slice for Teleconsultation State Management
 * Manages teleconsultation data, booking, and video call state for the Patient App
 * Task: T161
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { teleconsultationService } from '../services/teleconsultationService';

// Types
export interface Teleconsultation {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  pharmacist: {
    id: string;
    name: string;
  };
  recording_consent: boolean;
  room_sid?: string;
  room_name?: string;
}

export interface AvailabilitySlot {
  datetime: string;
  available: boolean;
  duration_minutes?: number;
}

export interface Pharmacist {
  id: string;
  name: string;
  availableSlots: AvailabilitySlot[];
}

export interface VideoCallSession {
  teleconsultationId: string;
  accessToken: string;
  roomSid: string;
  roomName: string;
  participantIdentity: string;
  connected: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
  audioOnly: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'reconnecting';
}

// State interface
export interface TeleconsultationState {
  consultations: Teleconsultation[];
  selectedConsultation: Teleconsultation | null;
  availablePharmacists: Pharmacist[];
  currentSession: VideoCallSession | null;
  loading: boolean;
  booking: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Initial state
const initialState: TeleconsultationState = {
  consultations: [],
  selectedConsultation: null,
  availablePharmacists: [],
  currentSession: null,
  loading: false,
  booking: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  },
};

// Async thunks

/**
 * Fetch available time slots for teleconsultations
 */
export const fetchAvailability = createAsyncThunk(
  'teleconsultation/fetchAvailability',
  async (
    params: { pharmacist_id?: string; start_date?: string; days?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await teleconsultationService.getAvailability(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch availability');
    }
  }
);

/**
 * Book a new teleconsultation
 */
export const bookTeleconsultation = createAsyncThunk(
  'teleconsultation/book',
  async (
    params: {
      pharmacist_id: string;
      scheduled_at: string;
      duration_minutes?: number;
      recording_consent?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const consultation = await teleconsultationService.book(params);
      return consultation;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to book teleconsultation');
    }
  }
);

/**
 * Fetch list of upcoming teleconsultations
 */
export const fetchUpcomingConsultations = createAsyncThunk(
  'teleconsultation/fetchUpcoming',
  async (_, { rejectWithValue }) => {
    try {
      const response = await teleconsultationService.getUpcoming();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch consultations');
    }
  }
);

/**
 * Join a video call (get Twilio access token)
 */
export const joinVideoCall = createAsyncThunk(
  'teleconsultation/join',
  async (teleconsultationId: string, { rejectWithValue }) => {
    try {
      const response = await teleconsultationService.join(teleconsultationId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to join video call');
    }
  }
);

/**
 * Cancel a teleconsultation
 */
export const cancelTeleconsultation = createAsyncThunk(
  'teleconsultation/cancel',
  async (
    { teleconsultationId, reason }: { teleconsultationId: string; reason: string },
    { rejectWithValue }
  ) => {
    try {
      await teleconsultationService.cancel(teleconsultationId, reason);
      return teleconsultationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel teleconsultation');
    }
  }
);

/**
 * Refresh consultations (pull-to-refresh)
 */
export const refreshConsultations = createAsyncThunk(
  'teleconsultation/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const response = await teleconsultationService.getUpcoming();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to refresh consultations');
    }
  }
);

// Slice
const teleconsultationSlice = createSlice({
  name: 'teleconsultation',
  initialState,
  reducers: {
    // Set selected consultation
    setSelectedConsultation: (state, action: PayloadAction<Teleconsultation | null>) => {
      state.selectedConsultation = action.payload;
    },

    // Update video call session
    updateVideoSession: (state, action: PayloadAction<Partial<VideoCallSession>>) => {
      if (state.currentSession) {
        state.currentSession = {
          ...state.currentSession,
          ...action.payload,
        };
      }
    },

    // Toggle audio
    toggleAudio: (state) => {
      if (state.currentSession) {
        state.currentSession.audioEnabled = !state.currentSession.audioEnabled;
      }
    },

    // Toggle video
    toggleVideo: (state) => {
      if (state.currentSession) {
        state.currentSession.videoEnabled = !state.currentSession.videoEnabled;
      }
    },

    // Switch to audio-only mode
    switchToAudioOnly: (state) => {
      if (state.currentSession) {
        state.currentSession.audioOnly = true;
        state.currentSession.videoEnabled = false;
      }
    },

    // Switch to video mode
    switchToVideoMode: (state) => {
      if (state.currentSession) {
        state.currentSession.audioOnly = false;
        state.currentSession.videoEnabled = true;
      }
    },

    // Update connection quality
    setConnectionQuality: (
      state,
      action: PayloadAction<'excellent' | 'good' | 'poor' | 'reconnecting'>
    ) => {
      if (state.currentSession) {
        state.currentSession.connectionQuality = action.payload;
      }
    },

    // End video call
    endVideoCall: (state) => {
      state.currentSession = null;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Clear consultations (logout)
    clearConsultations: (state) => {
      state.consultations = [];
      state.selectedConsultation = null;
      state.availablePharmacists = [];
      state.currentSession = null;
      state.pagination = initialState.pagination;
    },

    // Update consultation in list (real-time updates)
    updateConsultation: (state, action: PayloadAction<Teleconsultation>) => {
      const index = state.consultations.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.consultations[index] = action.payload;
      }
      if (state.selectedConsultation?.id === action.payload.id) {
        state.selectedConsultation = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch availability
    builder
      .addCase(fetchAvailability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailability.fulfilled, (state, action) => {
        state.loading = false;
        state.availablePharmacists = action.payload.pharmacists || [];
      })
      .addCase(fetchAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Book teleconsultation
    builder
      .addCase(bookTeleconsultation.pending, (state) => {
        state.booking = true;
        state.error = null;
      })
      .addCase(bookTeleconsultation.fulfilled, (state, action) => {
        state.booking = false;
        // Add new consultation to the list
        state.consultations.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(bookTeleconsultation.rejected, (state, action) => {
        state.booking = false;
        state.error = action.payload as string;
      });

    // Fetch upcoming consultations
    builder
      .addCase(fetchUpcomingConsultations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUpcomingConsultations.fulfilled, (state, action) => {
        state.loading = false;
        state.consultations = action.payload.consultations || [];
        state.pagination = {
          page: action.payload.page || 1,
          limit: action.payload.limit || 20,
          total: action.payload.total || 0,
          hasMore: action.payload.hasMore || false,
        };
      })
      .addCase(fetchUpcomingConsultations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Join video call
    builder
      .addCase(joinVideoCall.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(joinVideoCall.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSession = {
          teleconsultationId: action.payload.consultation.id,
          accessToken: action.payload.access_token,
          roomSid: action.payload.room_sid,
          roomName: action.payload.room_name,
          participantIdentity: action.payload.participant_identity,
          connected: true,
          audioEnabled: true,
          videoEnabled: true,
          audioOnly: false,
          connectionQuality: 'good',
        };
      })
      .addCase(joinVideoCall.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Cancel teleconsultation
    builder
      .addCase(cancelTeleconsultation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelTeleconsultation.fulfilled, (state, action) => {
        state.loading = false;
        // Remove cancelled consultation from list
        state.consultations = state.consultations.filter(
          (c) => c.id !== action.payload
        );
        if (state.selectedConsultation?.id === action.payload) {
          state.selectedConsultation = null;
        }
        state.pagination.total -= 1;
      })
      .addCase(cancelTeleconsultation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Refresh consultations
    builder
      .addCase(refreshConsultations.pending, (state) => {
        state.error = null;
        // Don't set loading true for pull-to-refresh
      })
      .addCase(refreshConsultations.fulfilled, (state, action) => {
        state.consultations = action.payload.consultations || [];
        state.pagination = {
          page: action.payload.page || 1,
          limit: action.payload.limit || 20,
          total: action.payload.total || 0,
          hasMore: action.payload.hasMore || false,
        };
      })
      .addCase(refreshConsultations.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  setSelectedConsultation,
  updateVideoSession,
  toggleAudio,
  toggleVideo,
  switchToAudioOnly,
  switchToVideoMode,
  setConnectionQuality,
  endVideoCall,
  clearError,
  clearConsultations,
  updateConsultation,
} = teleconsultationSlice.actions;

// Export reducer
export default teleconsultationSlice.reducer;

// Selectors
export const selectConsultations = (state: { teleconsultation: TeleconsultationState }) =>
  state.teleconsultation.consultations;

export const selectSelectedConsultation = (state: {
  teleconsultation: TeleconsultationState;
}) => state.teleconsultation.selectedConsultation;

export const selectAvailablePharmacists = (state: {
  teleconsultation: TeleconsultationState;
}) => state.teleconsultation.availablePharmacists;

export const selectCurrentSession = (state: { teleconsultation: TeleconsultationState }) =>
  state.teleconsultation.currentSession;

export const selectLoading = (state: { teleconsultation: TeleconsultationState }) =>
  state.teleconsultation.loading;

export const selectBooking = (state: { teleconsultation: TeleconsultationState }) =>
  state.teleconsultation.booking;

export const selectError = (state: { teleconsultation: TeleconsultationState }) =>
  state.teleconsultation.error;

export const selectPagination = (state: { teleconsultation: TeleconsultationState }) =>
  state.teleconsultation.pagination;
