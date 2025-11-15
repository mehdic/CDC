/**
 * Authentication Service
 * Handles login, logout, and token management
 */

import axios from 'axios';

/**
 * API Gateway base URL
 */
const API_GATEWAY_URL = 'http://localhost:4000';

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
  pharmacyId?: string;
}

/**
 * Login response from API
 */
export interface LoginResponse {
  success: boolean;
  requiresMFA?: boolean;
  tempToken?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    pharmacyId: string | null;
  };
}

/**
 * Auth error response
 */
export interface AuthError {
  success: false;
  error: string;
  requiresMFASetup?: boolean;
}

/**
 * Login user with email and password
 */
export const login = async (
  credentials: LoginRequest
): Promise<LoginResponse> => {
  try {
    const response = await axios.post<LoginResponse>(
      `${API_GATEWAY_URL}/auth/login`,
      credentials,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // If login successful and tokens provided, store them
    if (response.data.success && response.data.accessToken) {
      storeTokens(
        response.data.accessToken,
        response.data.refreshToken || '',
        response.data.user
      );
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Return the error response from the API
      throw error.response.data as AuthError;
    }
    // Generic error
    throw {
      success: false,
      error: 'Une erreur est survenue lors de la connexion',
    } as AuthError;
  }
};

/**
 * Logout user and clear tokens
 */
export const logout = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_data');
};

/**
 * Store authentication tokens and user data
 */
const storeTokens = (
  accessToken: string,
  refreshToken: string,
  user?: LoginResponse['user']
): void => {
  localStorage.setItem('auth_token', accessToken);
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  }
  if (user) {
    localStorage.setItem('user_data', JSON.stringify(user));
  }
};

/**
 * Get stored access token
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

/**
 * Get stored refresh token
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

/**
 * Get stored user data
 */
export const getUserData = (): LoginResponse['user'] | null => {
  const userData = localStorage.getItem('user_data');
  if (!userData) return null;

  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return getAccessToken() !== null;
};

/**
 * Refresh access token using refresh token
 * Note: This requires a refresh endpoint in the auth service
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await axios.post<{
      success: boolean;
      accessToken?: string;
    }>(`${API_GATEWAY_URL}/auth/refresh`, {
      refreshToken,
    });

    if (response.data.success && response.data.accessToken) {
      localStorage.setItem('auth_token', response.data.accessToken);
      return response.data.accessToken;
    }

    return null;
  } catch {
    // If refresh fails, clear tokens
    logout();
    return null;
  }
};

export default {
  login,
  logout,
  getAccessToken,
  getRefreshToken,
  getUserData,
  isAuthenticated,
  refreshAccessToken,
};
