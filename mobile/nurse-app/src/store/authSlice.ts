/**
 * Auth Redux Slice
 * Manages authentication state for nurses
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import nurseApi from '../services/nurseApi';
import { AuthState, NurseProfile } from '../types/nurse';

/**
 * Initial State
 */
const initialState: AuthState = {
  isAuthenticated: false,
  nurse: null,
  token: null,
  hinEIDVerified: false,
};

/**
 * Async Thunks
 */
export const loginAsync = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await nurseApi.login(email, password);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue(response.error || 'Login failed');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Network error');
    }
  }
);

export const logoutAsync = createAsyncThunk('auth/logout', async () => {
  await nurseApi.logout();
});

export const loadProfileAsync = createAsyncThunk('auth/loadProfile', async (_, { rejectWithValue }) => {
  try {
    const response = await nurseApi.getProfile();
    if (response.success && response.data) {
      return response.data;
    }
    return rejectWithValue(response.error || 'Failed to load profile');
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Network error');
  }
});

/**
 * Auth Slice
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setHinEIDVerified: (state, action: PayloadAction<boolean>) => {
      state.hinEIDVerified = action.payload;
    },
    updateNurse: (state, action: PayloadAction<Partial<NurseProfile>>) => {
      if (state.nurse) {
        state.nurse = { ...state.nurse, ...action.payload };
      }
    },
    clearAuth: (state) => {
      state.isAuthenticated = false;
      state.nurse = null;
      state.token = null;
      state.hinEIDVerified = false;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginAsync.fulfilled, (state, action) => {
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.nurse = action.payload.nurse;
    });
    builder.addCase(loginAsync.rejected, (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.nurse = null;
    });

    // Logout
    builder.addCase(logoutAsync.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.nurse = null;
      state.hinEIDVerified = false;
    });

    // Load Profile
    builder.addCase(loadProfileAsync.fulfilled, (state, action) => {
      state.nurse = action.payload;
    });
  },
});

export const { setHinEIDVerified, updateNurse, clearAuth } = authSlice.actions;
export default authSlice.reducer;
