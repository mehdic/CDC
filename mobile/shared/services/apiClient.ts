/**
 * Shared API Client
 * Configured axios instance with authentication, error handling, and token refresh
 * Used by all MetaPharm mobile apps
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { getAuthToken, setAuthToken, getRefreshToken, clearAuthTokens } from '../utils/secureStorage';

// API Configuration
// Note: React Native doesn't have process.env like Node.js
// Configure API URL through app config or native modules
const API_BASE_URL = 'http://localhost:4000/api';
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Custom error types
 */
export class NetworkError extends Error {
  constructor(message: string = 'Erreur réseau - veuillez vérifier votre connexion') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'La requête a expiré - veuillez réessayer') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Session expirée - veuillez vous reconnecter') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Track if token refresh is in progress to avoid multiple simultaneous refresh requests
 */
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * Add subscriber to wait for token refresh
 */
function subscribeTokenRefresh(callback: (token: string) => void): void {
  refreshSubscribers.push(callback);
}

/**
 * Notify all subscribers that token has been refreshed
 */
function onTokenRefreshed(token: string): void {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

/**
 * Refresh authentication token using refresh token
 */
async function refreshAuthToken(): Promise<string | null> {
  try {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      throw new UnauthorizedError('Aucun refresh token disponible');
    }

    // Make refresh request (without interceptors to avoid infinite loop)
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { timeout: API_TIMEOUT }
    );

    const { accessToken, refreshToken: newRefreshToken } = response.data;

    // Store new tokens
    await setAuthToken(accessToken);
    if (newRefreshToken) {
      await setAuthToken(newRefreshToken);
    }

    return accessToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
    await clearAuthTokens();
    throw new UnauthorizedError();
  }
}

/**
 * Handle unauthorized access (401) with token refresh
 */
async function handleUnauthorized(error: AxiosError): Promise<any> {
  const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

  // If already retried or no config, reject
  if (!originalRequest || originalRequest._retry) {
    await clearAuthTokens();
    throw new UnauthorizedError();
  }

  // If token refresh already in progress, queue this request
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeTokenRefresh((token: string) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        resolve(apiClient(originalRequest));
      });
    });
  }

  // Mark as retrying
  originalRequest._retry = true;
  isRefreshing = true;

  try {
    const newToken = await refreshAuthToken();

    if (!newToken) {
      throw new UnauthorizedError();
    }

    // Update authorization header
    originalRequest.headers.Authorization = `Bearer ${newToken}`;

    // Notify queued requests
    onTokenRefreshed(newToken);

    // Retry original request
    return apiClient(originalRequest);
  } catch (refreshError) {
    await clearAuthTokens();
    throw new UnauthorizedError();
  } finally {
    isRefreshing = false;
  }
}

/**
 * Check network connectivity
 */
async function isNetworkAvailable(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
}

/**
 * Shared axios instance with authentication and error handling
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add authentication token to all requests
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Check network connectivity before request
    const hasNetwork = await isNetworkAvailable();
    if (!hasNetwork) {
      throw new NetworkError();
    }

    // Add authentication token if available
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle common error scenarios
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401) {
      return handleUnauthorized(error);
    }

    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      throw new TimeoutError();
    } else if (error.code === 'ERR_NETWORK' || !error.response) {
      const hasNetwork = await isNetworkAvailable();
      if (!hasNetwork) {
        throw new NetworkError();
      }
    }

    // Handle other HTTP errors
    if (error.response) {
      const { status, data } = error.response;

      // Extract error message from response
      const message =
        (data as any)?.message ||
        (data as any)?.error ||
        `Erreur serveur (${status})`;

      throw new Error(message);
    }

    // Re-throw original error if not handled
    return Promise.reject(error);
  }
);

/**
 * Helper function to make GET requests with retry logic
 */
export async function get<T = any>(
  url: string,
  config?: AxiosRequestConfig,
  retryCount = 0
): Promise<T> {
  try {
    const response = await apiClient.get<T>(url, config);
    return response.data;
  } catch (error) {
    if (retryCount < MAX_RETRY_ATTEMPTS && error instanceof NetworkError) {
      // Retry on network error
      await new Promise<void>(resolve => setTimeout(() => resolve(), 1000 * (retryCount + 1)));
      return get<T>(url, config, retryCount + 1);
    }
    throw error;
  }
}

/**
 * Helper function to make POST requests
 */
export async function post<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
}

/**
 * Helper function to make PUT requests
 */
export async function put<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
}

/**
 * Helper function to make DELETE requests
 */
export async function del<T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
}

/**
 * Helper function to make PATCH requests
 */
export async function patch<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.patch<T>(url, data, config);
  return response.data;
}

/**
 * Export API client and helper functions
 */
export default {
  client: apiClient,
  get,
  post,
  put,
  delete: del,
  patch,
};
