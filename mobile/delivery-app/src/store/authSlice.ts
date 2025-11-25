/**
 * Auth Redux Slice
 * Manages authentication state for delivery personnel
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, DeliveryPersonnelProfile } from '../types/delivery';
import deliveryApi from '../services/deliveryApi';

/**
 * Initial State
 */
const initialState: AuthState = {
  isAuthenticated: false,
  personnel: null,
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
      const response = await deliveryApi.login(email, password);
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
  await deliveryApi.logout();
});

export const loadProfileAsync = createAsyncThunk('auth/loadProfile', async (_, { rejectWithValue }) => {
  try {
    const response = await deliveryApi.getProfile();
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
    updatePersonnel: (state, action: PayloadAction<Partial<DeliveryPersonnelProfile>>) => {
      if (state.personnel) {
        state.personnel = { ...state.personnel, ...action.payload };
      }
    },
    clearAuth: (state) => {
      state.isAuthenticated = false;
      state.personnel = null;
      state.token = null;
      state.hinEIDVerified = false;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginAsync.fulfilled, (state, action) => {
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.personnel = action.payload.personnel;
    });
    builder.addCase(loginAsync.rejected, (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.personnel = null;
    });

    // Logout
    builder.addCase(logoutAsync.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.personnel = null;
      state.hinEIDVerified = false;
    });

    // Load Profile
    builder.addCase(loadProfileAsync.fulfilled, (state, action) => {
      state.personnel = action.payload;
    });
  },
});

export const { setHinEIDVerified, updatePersonnel, clearAuth } = authSlice.actions;
export default authSlice.reducer;
