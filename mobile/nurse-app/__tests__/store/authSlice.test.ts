/**
 * Auth Slice Tests
 */

import authReducer, {
  login,
  verifyMfa,
  logout,
  setNurse,
  clearError,
  resetAuth,
} from '../../src/store/slices/authSlice';
import { Nurse } from '../../src/types';

describe('authSlice', () => {
  const initialState = {
    nurse: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    mfaRequired: false,
    loading: false,
    error: null,
  };

  const mockNurse: Nurse = {
    id: '1',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@hospital.com',
    phone: '+41791234567',
    hinId: 'HIN123456',
    licenseNumber: 'RN-12345',
    facility: 'General Hospital',
    department: 'ICU',
    verified: true,
    mfaEnabled: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  it('should return initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setNurse', () => {
    const actual = authReducer(initialState, setNurse(mockNurse));
    expect(actual.nurse).toEqual(mockNurse);
  });

  it('should handle clearError', () => {
    const stateWithError = { ...initialState, error: 'Some error' };
    const actual = authReducer(stateWithError, clearError());
    expect(actual.error).toBeNull();
  });

  it('should handle resetAuth', () => {
    const authenticatedState = {
      ...initialState,
      nurse: mockNurse,
      isAuthenticated: true,
      token: 'token123',
    };
    const actual = authReducer(authenticatedState, resetAuth());
    expect(actual).toEqual(initialState);
  });

  it('should handle login.pending', () => {
    const action = { type: login.pending.type };
    const state = authReducer(initialState, action);
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should handle login.fulfilled with MFA required', () => {
    const action = {
      type: login.fulfilled.type,
      payload: { mfaRequired: true },
    };
    const state = authReducer(initialState, action);
    expect(state.loading).toBe(false);
    expect(state.mfaRequired).toBe(true);
    expect(state.isAuthenticated).toBe(false);
  });

  it('should handle login.fulfilled without MFA', () => {
    const action = {
      type: login.fulfilled.type,
      payload: {
        mfaRequired: false,
        nurse: mockNurse,
        token: 'token123',
      },
    };
    const state = authReducer(initialState, action);
    expect(state.loading).toBe(false);
    expect(state.isAuthenticated).toBe(true);
    expect(state.nurse).toEqual(mockNurse);
    expect(state.token).toBe('token123');
  });

  it('should handle login.rejected', () => {
    const action = {
      type: login.rejected.type,
      payload: 'Invalid credentials',
    };
    const state = authReducer(initialState, action);
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Invalid credentials');
  });

  it('should handle verifyMfa.fulfilled', () => {
    const stateWithMfa = { ...initialState, mfaRequired: true };
    const action = {
      type: verifyMfa.fulfilled.type,
      payload: {
        nurse: mockNurse,
        token: 'token123',
      },
    };
    const state = authReducer(stateWithMfa, action);
    expect(state.loading).toBe(false);
    expect(state.mfaRequired).toBe(false);
    expect(state.isAuthenticated).toBe(true);
    expect(state.nurse).toEqual(mockNurse);
  });

  it('should handle logout.fulfilled', () => {
    const authenticatedState = {
      ...initialState,
      nurse: mockNurse,
      isAuthenticated: true,
      token: 'token123',
    };
    const action = { type: logout.fulfilled.type };
    const state = authReducer(authenticatedState, action);
    expect(state).toEqual(initialState);
  });
});
