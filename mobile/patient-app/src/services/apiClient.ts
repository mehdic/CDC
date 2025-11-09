/**
 * Shared API Client for Patient App
 * Provides a configured axios instance with authentication and error handling
 * Used by teleconsultationService and other API services
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
const API_TIMEOUT = 30000; // 30 seconds

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
 * Get authentication token from secure storage
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Handle unauthorized access (token expired)
 */
async function handleUnauthorized(): Promise<void> {
  try {
    // Clear stored auth token
    await AsyncStorage.removeItem('authToken');
    // TODO: Navigate to login screen or trigger re-authentication flow
    console.log('Token expired - user needs to re-authenticate');
  } catch (error) {
    console.error('Error handling unauthorized access:', error);
  }
}

/**
 * Request interceptor - Add authentication token to all requests
 */
apiClient.interceptors.request.use(
  async (config) => {
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
      await handleUnauthorized();
    }

    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out');
    } else if (error.code === 'ERR_NETWORK') {
      console.error('Network error - please check your connection');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
