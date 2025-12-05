/**
 * Secure Storage Utilities
 * Provides secure token storage using EncryptedStorage
 */

import EncryptedStorage from 'react-native-encrypted-storage';

const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export async function getAuthToken(): Promise<string | null> {
  try {
    return await EncryptedStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

export async function setAuthToken(token: string): Promise<void> {
  try {
    await EncryptedStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error setting auth token:', error);
    throw error;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await EncryptedStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
}

export async function setRefreshToken(token: string): Promise<void> {
  try {
    await EncryptedStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error setting refresh token:', error);
    throw error;
  }
}

export async function clearAuthTokens(): Promise<void> {
  try {
    await EncryptedStorage.removeItem(AUTH_TOKEN_KEY);
    await EncryptedStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing auth tokens:', error);
    throw error;
  }
}

export async function getSecureItem(key: string): Promise<string | null> {
  try {
    return await EncryptedStorage.getItem(key);
  } catch (error) {
    console.error(`Error getting secure item ${key}:`, error);
    return null;
  }
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    await EncryptedStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error setting secure item ${key}:`, error);
    throw error;
  }
}

export async function removeSecureItem(key: string): Promise<void> {
  try {
    await EncryptedStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing secure item ${key}:`, error);
    throw error;
  }
}
