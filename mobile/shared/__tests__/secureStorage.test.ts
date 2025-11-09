/**
 * Secure Storage Tests
 */

import * as Keychain from 'react-native-keychain';
import {
  setSecureItem,
  getSecureItem,
  removeSecureItem,
  setAuthToken,
  getAuthToken,
  setRefreshToken,
  getRefreshToken,
  clearAuthTokens,
  isBiometricSupported,
  STORAGE_KEYS,
} from '../utils/secureStorage';

// Mock react-native-keychain
jest.mock('react-native-keychain');

describe('Secure Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setSecureItem', () => {
    it('should store item successfully', async () => {
      (Keychain.setGenericPassword as jest.Mock).mockResolvedValue(true);

      const result = await setSecureItem('testKey', 'testValue');

      expect(result).toBe(true);
      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        'testKey',
        'testValue',
        expect.objectContaining({
          service: 'com.metapharm.mobile',
        })
      );
    });

    it('should return false on error', async () => {
      (Keychain.setGenericPassword as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const result = await setSecureItem('testKey', 'testValue');

      expect(result).toBe(false);
    });
  });

  describe('getSecureItem', () => {
    it('should retrieve item successfully', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
        username: 'testKey',
        password: 'testValue',
      });

      const result = await getSecureItem('testKey');

      expect(result).toBe('testValue');
      expect(Keychain.getGenericPassword).toHaveBeenCalledWith({
        service: 'com.metapharm.mobile',
      });
    });

    it('should return null when item not found', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false);

      const result = await getSecureItem('testKey');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockRejectedValue(
        new Error('Retrieval error')
      );

      const result = await getSecureItem('testKey');

      expect(result).toBeNull();
    });
  });

  describe('removeSecureItem', () => {
    it('should delete item successfully', async () => {
      (Keychain.resetGenericPassword as jest.Mock).mockResolvedValue(true);

      const result = await removeSecureItem('testKey');

      expect(result).toBe(true);
      expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({
        service: 'com.metapharm.mobile',
      });
    });

    it('should return false on error', async () => {
      (Keychain.resetGenericPassword as jest.Mock).mockRejectedValue(
        new Error('Deletion error')
      );

      const result = await removeSecureItem('testKey');

      expect(result).toBe(false);
    });
  });

  describe('Auth token helpers', () => {
    it('should store auth token', async () => {
      (Keychain.setGenericPassword as jest.Mock).mockResolvedValue(true);

      const result = await setAuthToken('myAuthToken');

      expect(result).toBe(true);
      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        STORAGE_KEYS.AUTH_TOKEN,
        'myAuthToken',
        expect.any(Object)
      );
    });

    it('should retrieve auth token', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
        username: STORAGE_KEYS.AUTH_TOKEN,
        password: 'myAuthToken',
      });

      const result = await getAuthToken();

      expect(result).toBe('myAuthToken');
    });

    it('should store refresh token', async () => {
      (Keychain.setGenericPassword as jest.Mock).mockResolvedValue(true);

      const result = await setRefreshToken('myRefreshToken');

      expect(result).toBe(true);
    });

    it('should retrieve refresh token', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
        username: STORAGE_KEYS.REFRESH_TOKEN,
        password: 'myRefreshToken',
      });

      const result = await getRefreshToken();

      expect(result).toBe('myRefreshToken');
    });

    it('should clear all auth tokens', async () => {
      (Keychain.resetGenericPassword as jest.Mock).mockResolvedValue(true);

      const result = await clearAuthTokens();

      expect(result).toBe(true);
      expect(Keychain.resetGenericPassword).toHaveBeenCalledTimes(2);
    });
  });

  describe('Biometric support', () => {
    it('should check biometric support', async () => {
      (Keychain.getSupportedBiometryType as jest.Mock).mockResolvedValue(
        Keychain.BIOMETRY_TYPE.FACE_ID
      );

      const result = await isBiometricSupported();

      expect(result).toBe(true);
    });

    it('should return false when biometric not supported', async () => {
      (Keychain.getSupportedBiometryType as jest.Mock).mockResolvedValue(null);

      const result = await isBiometricSupported();

      expect(result).toBe(false);
    });
  });
});
