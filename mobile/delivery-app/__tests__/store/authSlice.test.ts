/**
 * Auth Slice Tests
 */

import authReducer, {
  loginAsync,
  logoutAsync,
  setHinEIDVerified,
  updatePersonnel,
  clearAuth,
} from '../../src/store/authSlice';
import { AuthState } from '../../src/types/delivery';

describe('authSlice', () => {
  const initialState: AuthState = {
    isAuthenticated: false,
    personnel: null,
    token: null,
    hinEIDVerified: false,
  };

  it('should handle initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setHinEIDVerified', () => {
    const actual = authReducer(initialState, setHinEIDVerified(true));
    expect(actual.hinEIDVerified).toBe(true);
  });

  it('should handle updatePersonnel', () => {
    const stateWithPersonnel: AuthState = {
      ...initialState,
      personnel: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+41791234567',
        vehicleType: 'car',
        badgeNumber: 'D123',
        isActive: true,
        rating: 4.5,
        totalDeliveries: 100,
      },
    };

    const actual = authReducer(stateWithPersonnel, updatePersonnel({ name: 'Jane Doe' }));
    expect(actual.personnel?.name).toBe('Jane Doe');
  });

  it('should handle clearAuth', () => {
    const authenticatedState: AuthState = {
      isAuthenticated: true,
      personnel: { id: '1' } as any,
      token: 'test-token',
      hinEIDVerified: true,
    };

    const actual = authReducer(authenticatedState, clearAuth());
    expect(actual).toEqual(initialState);
  });

  it('should handle loginAsync.fulfilled', () => {
    const payload = {
      token: 'test-token',
      personnel: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+41791234567',
        vehicleType: 'car' as const,
        badgeNumber: 'D123',
        isActive: true,
        rating: 4.5,
        totalDeliveries: 100,
      },
    };

    const actual = authReducer(
      initialState,
      loginAsync.fulfilled(payload, '', { email: 'john@example.com', password: 'password' })
    );

    expect(actual.isAuthenticated).toBe(true);
    expect(actual.token).toBe('test-token');
    expect(actual.personnel).toEqual(payload.personnel);
  });

  it('should handle loginAsync.rejected', () => {
    const actual = authReducer(
      initialState,
      loginAsync.rejected(new Error('Login failed'), '', {
        email: 'john@example.com',
        password: 'password',
      })
    );

    expect(actual.isAuthenticated).toBe(false);
    expect(actual.token).toBeNull();
  });

  it('should handle logoutAsync.fulfilled', () => {
    const authenticatedState: AuthState = {
      isAuthenticated: true,
      personnel: { id: '1' } as any,
      token: 'test-token',
      hinEIDVerified: true,
    };

    const actual = authReducer(authenticatedState, logoutAsync.fulfilled(undefined, '', undefined));
    expect(actual).toEqual(initialState);
  });
});
