/**
 * Secure Storage Utility
 * Uses react-native-keychain for secure storage of sensitive data (tokens, credentials)
 * Provides encryption for stored data on iOS Keychain and Android Keystore
 */

import * as Keychain from 'react-native-keychain';

/**
 * Storage keys for different types of data
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_CREDENTIALS: 'userCredentials',
  BIOMETRIC_ENABLED: 'biometricEnabled',
} as const;

/**
 * Options for secure storage
 */
export interface SecureStorageOptions {
  service?: string;
  accessControl?: Keychain.ACCESS_CONTROL;
  accessible?: Keychain.ACCESSIBLE;
}

/**
 * Store sensitive data securely using Keychain
 * @param key - Storage key
 * @param value - Value to store
 * @param options - Storage options
 */
export async function setSecureItem(
  key: string,
  value: string,
  options?: SecureStorageOptions
): Promise<boolean> {
  try {
    const result = await Keychain.setGenericPassword(key, value, {
      service: options?.service || 'com.metapharm.mobile',
      accessControl: options?.accessControl,
      accessible: options?.accessible || Keychain.ACCESSIBLE.WHEN_UNLOCKED,
    });

    return result !== false;
  } catch (error) {
    console.error(`Error storing secure item for key ${key}:`, error);
    return false;
  }
}

/**
 * Retrieve sensitive data from secure storage
 * @param key - Storage key
 * @param service - Service identifier
 */
export async function getSecureItem(
  key: string,
  service?: string
): Promise<string | null> {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: service || 'com.metapharm.mobile',
    });

    if (credentials && credentials.username === key) {
      return credentials.password;
    }

    return null;
  } catch (error) {
    console.error(`Error retrieving secure item for key ${key}:`, error);
    return null;
  }
}

/**
 * Delete sensitive data from secure storage
 * @param key - Storage key
 * @param service - Service identifier
 */
export async function removeSecureItem(
  key: string,
  service?: string
): Promise<boolean> {
  try {
    const result = await Keychain.resetGenericPassword({
      service: service || 'com.metapharm.mobile',
    });

    return result;
  } catch (error) {
    console.error(`Error removing secure item for key ${key}:`, error);
    return false;
  }
}

/**
 * Store authentication token securely
 * @param token - JWT token
 */
export async function setAuthToken(token: string): Promise<boolean> {
  return setSecureItem(STORAGE_KEYS.AUTH_TOKEN, token);
}

/**
 * Retrieve authentication token
 */
export async function getAuthToken(): Promise<string | null> {
  return getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
}

/**
 * Store refresh token securely
 * @param token - Refresh token
 */
export async function setRefreshToken(token: string): Promise<boolean> {
  return setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, token);
}

/**
 * Retrieve refresh token
 */
export async function getRefreshToken(): Promise<string | null> {
  return getSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
}

/**
 * Clear all authentication tokens
 */
export async function clearAuthTokens(): Promise<boolean> {
  try {
    await removeSecureItem(STORAGE_KEYS.AUTH_TOKEN);
    await removeSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
    return true;
  } catch (error) {
    console.error('Error clearing auth tokens:', error);
    return false;
  }
}

/**
 * Check if biometric authentication is supported on device
 */
export async function isBiometricSupported(): Promise<boolean> {
  try {
    const biometryType = await Keychain.getSupportedBiometryType();
    return biometryType !== null;
  } catch (error) {
    console.error('Error checking biometric support:', error);
    return false;
  }
}

/**
 * Get biometry type supported by device
 */
export async function getBiometryType(): Promise<Keychain.BIOMETRY_TYPE | null> {
  try {
    return await Keychain.getSupportedBiometryType();
  } catch (error) {
    console.error('Error getting biometry type:', error);
    return null;
  }
}

/**
 * Store data with biometric authentication required
 * @param key - Storage key
 * @param value - Value to store
 */
export async function setSecureItemWithBiometric(
  key: string,
  value: string
): Promise<boolean> {
  return setSecureItem(key, value, {
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

/**
 * Export all utilities
 */
export default {
  setSecureItem,
  getSecureItem,
  removeSecureItem,
  setAuthToken,
  getAuthToken,
  setRefreshToken,
  getRefreshToken,
  clearAuthTokens,
  isBiometricSupported,
  getBiometryType,
  setSecureItemWithBiometric,
  STORAGE_KEYS,
};
