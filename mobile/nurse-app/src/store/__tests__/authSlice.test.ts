/**
 * Auth Slice Tests
 * Unit tests for nurse authentication state management
 */

import authReducer, { setHinEIDVerified, updateNurse, clearAuth } from '../authSlice';
import { AuthState } from '../../types/nurse';

describe('authSlice', () => {
  const initialState: AuthState = {
    isAuthenticated: false,
    nurse: null,
    token: null,
    hinEIDVerified: false,
  };

  it('should return initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setHinEIDVerified', () => {
    const actual = authReducer(initialState, setHinEIDVerified(true));
    expect(actual.hinEIDVerified).toBe(true);
  });

  it('should handle updateNurse when nurse exists', () => {
    const stateWithNurse: AuthState = {
      ...initialState,
      nurse: {
        id: '1',
        email: 'nurse@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        licenseNumber: 'RN123456',
        specialization: ['ICU'],
        facility: 'General Hospital',
        hinEIDVerified: false,
        phoneNumber: '555-0100',
        shift: 'day',
        certifications: ['BLS', 'ACLS'],
      },
    };

    const actual = authReducer(
      stateWithNurse,
      updateNurse({ firstName: 'Janet', hinEIDVerified: true })
    );

    expect(actual.nurse?.firstName).toBe('Janet');
    expect(actual.nurse?.hinEIDVerified).toBe(true);
    expect(actual.nurse?.lastName).toBe('Doe'); // Unchanged fields preserved
  });

  it('should not update nurse when nurse is null', () => {
    const actual = authReducer(
      initialState,
      updateNurse({ firstName: 'Janet' })
    );

    expect(actual.nurse).toBeNull();
  });

  it('should handle clearAuth', () => {
    const authenticatedState: AuthState = {
      isAuthenticated: true,
      nurse: {
        id: '1',
        email: 'nurse@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        licenseNumber: 'RN123456',
        specialization: ['ICU'],
        facility: 'General Hospital',
        hinEIDVerified: true,
        phoneNumber: '555-0100',
        shift: 'day',
        certifications: ['BLS'],
      },
      token: 'fake-token',
      hinEIDVerified: true,
    };

    const actual = authReducer(authenticatedState, clearAuth());

    expect(actual).toEqual(initialState);
  });
});
