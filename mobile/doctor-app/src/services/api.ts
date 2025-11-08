/**
 * API Service for Doctor App
 * Handles all HTTP requests to backend services
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  Patient,
  Pharmacy,
  Prescription,
  CreatePrescriptionRequest,
  CreatePrescriptionResponse,
  ApiResponse,
  PaginatedResponse,
  DrugSuggestion,
} from '../types';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
const API_TIMEOUT = 30000; // 30 seconds

// ============================================================================
// Axios Instance
// ============================================================================

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (token expired, etc.)
      localStorage.removeItem('auth_token');
      // Navigate to login (handled by navigation service)
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// Patient API
// ============================================================================

export const patientApi = {
  /**
   * Search patients by name or email
   */
  search: async (query: string): Promise<Patient[]> => {
    const response = await apiClient.get<ApiResponse<Patient[]>>('/patients', {
      params: { q: query, limit: 20 },
    });
    return response.data.data || [];
  },

  /**
   * Get patient by ID
   */
  getById: async (id: string): Promise<Patient> => {
    const response = await apiClient.get<ApiResponse<Patient>>(`/patients/${id}`);
    if (!response.data.data) {
      throw new Error('Patient not found');
    }
    return response.data.data;
  },

  /**
   * Get recent patients (for quick selection)
   */
  getRecent: async (): Promise<Patient[]> => {
    const response = await apiClient.get<ApiResponse<Patient[]>>('/patients/recent', {
      params: { limit: 10 },
    });
    return response.data.data || [];
  },
};

// ============================================================================
// Pharmacy API
// ============================================================================

export const pharmacyApi = {
  /**
   * Search pharmacies by name or location
   */
  search: async (query: string): Promise<Pharmacy[]> => {
    const response = await apiClient.get<ApiResponse<Pharmacy[]>>('/pharmacies', {
      params: { q: query, limit: 20 },
    });
    return response.data.data || [];
  },

  /**
   * Get nearby pharmacies (based on GPS or canton)
   */
  getNearby: async (latitude?: number, longitude?: number, canton?: string): Promise<Pharmacy[]> => {
    const params: any = { limit: 20 };
    if (latitude && longitude) {
      params.lat = latitude;
      params.lon = longitude;
    }
    if (canton) {
      params.canton = canton;
    }
    const response = await apiClient.get<ApiResponse<Pharmacy[]>>('/pharmacies/nearby', { params });
    return response.data.data || [];
  },

  /**
   * Get pharmacy by ID
   */
  getById: async (id: string): Promise<Pharmacy> => {
    const response = await apiClient.get<ApiResponse<Pharmacy>>(`/pharmacies/${id}`);
    if (!response.data.data) {
      throw new Error('Pharmacy not found');
    }
    return response.data.data;
  },
};

// ============================================================================
// Drug/Medication API
// ============================================================================

export const drugApi = {
  /**
   * Search drugs with AI-powered suggestions
   */
  search: async (query: string): Promise<DrugSuggestion[]> => {
    const response = await apiClient.get<ApiResponse<DrugSuggestion[]>>('/drugs/search', {
      params: { q: query, limit: 10 },
    });
    return response.data.data || [];
  },

  /**
   * Get drug details by RxNorm code
   */
  getByRxNormCode: async (code: string) => {
    const response = await apiClient.get(`/drugs/rxnorm/${code}`);
    return response.data.data;
  },

  /**
   * Check drug interactions for multiple medications
   */
  checkInteractions: async (medicationNames: string[]) => {
    const response = await apiClient.post('/drugs/interactions', {
      medications: medicationNames,
    });
    return response.data.data;
  },
};

// ============================================================================
// Prescription API
// ============================================================================

export const prescriptionApi = {
  /**
   * Create new prescription
   */
  create: async (data: CreatePrescriptionRequest): Promise<CreatePrescriptionResponse> => {
    const response = await apiClient.post<CreatePrescriptionResponse>('/prescriptions', {
      ...data,
      source: 'doctor_direct',
      uploaded_by_type: 'doctor',
    });
    return response.data;
  },

  /**
   * Get prescription by ID
   */
  getById: async (id: string): Promise<Prescription> => {
    const response = await apiClient.get<ApiResponse<Prescription>>(`/prescriptions/${id}`);
    if (!response.data.data) {
      throw new Error('Prescription not found');
    }
    return response.data.data;
  },

  /**
   * Get doctor's prescriptions
   */
  getMyPrescriptions: async (page = 1, limit = 20): Promise<PaginatedResponse<Prescription>> => {
    const response = await apiClient.get<PaginatedResponse<Prescription>>('/prescriptions/my', {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Get prescriptions for a specific patient
   */
  getByPatient: async (patientId: string): Promise<Prescription[]> => {
    const response = await apiClient.get<ApiResponse<Prescription[]>>('/prescriptions', {
      params: { patient_id: patientId },
    });
    return response.data.data || [];
  },
};

// ============================================================================
// Export API Client
// ============================================================================

export default apiClient;
