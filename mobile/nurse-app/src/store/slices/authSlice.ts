/**
 * Auth Slice - Nurse Authentication State Management
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, Nurse } from '../../types';
import nurseApiClient from '../../services/nurseApiClient';

const initialState: AuthState = {
  nurse: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  mfaRequired: false,
  loading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ hinId, password }: { hinId: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await nurseApiClient.login(hinId, password);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const verifyMfa = createAsyncThunk(
  'auth/verifyMfa',
  async (code: string, { rejectWithValue }) => {
    try {
      const response = await nurseApiClient.verifyMfa(code);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'MFA verification failed');
    }
  }
);

export const loadProfile = createAsyncThunk(
  'auth/loadProfile',
  async (_, { rejectWithValue }) => {
    try {
      const nurse = await nurseApiClient.getNurseProfile();
      return nurse;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load profile');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await nurseApiClient.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setNurse: (state, action: PayloadAction<Nurse>) => {
      state.nurse = action.payload;
      state.isAuthenticated = true;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetAuth: () => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload.mfaRequired) {
        state.mfaRequired = true;
      } else {
        state.isAuthenticated = true;
        state.nurse = action.payload.nurse;
        state.token = action.payload.token;
      }
    });
    builder.addCase(login.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // MFA Verification
    builder.addCase(verifyMfa.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(verifyMfa.fulfilled, (state, action) => {
      state.loading = false;
      state.mfaRequired = false;
      state.isAuthenticated = true;
      state.nurse = action.payload.nurse;
      state.token = action.payload.token;
    });
    builder.addCase(verifyMfa.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Load Profile
    builder.addCase(loadProfile.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(loadProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.nurse = action.payload;
      state.isAuthenticated = true;
    });
    builder.addCase(loadProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      state.isAuthenticated = false;
    });

    // Logout
    builder.addCase(logout.fulfilled, () => {
      return initialState;
    });
  },
});

export const { setNurse, clearError, resetAuth } = authSlice.actions;
export default authSlice.reducer;
