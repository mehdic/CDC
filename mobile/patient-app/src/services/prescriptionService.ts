/**
 * Prescription API Client Service
 * Handles all prescription-related API calls for the Patient App
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  Prescription,
  PrescriptionStatus,
  CreatePrescriptionRequest,
  CreatePrescriptionResponse,
  TranscribePrescriptionResponse,
  ListPrescriptionsRequest,
  ListPrescriptionsResponse,
  GetPrescriptionResponse,
  ApiResponse,
} from '@metapharm/api-types';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
const API_TIMEOUT = 30000; // 30 seconds

class PrescriptionService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      async (config) => {
        // Get token from secure storage (will be implemented by auth service)
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired - trigger re-authentication
          await this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get authentication token from secure storage
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      // For now, return mock token (will be replaced with actual auth integration)
      // TODO: Integrate with auth service
      return 'mock-jwt-token';
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Handle unauthorized access (token expired)
   */
  private async handleUnauthorized(): Promise<void> {
    // TODO: Trigger re-authentication flow
    console.log('Token expired - need to re-authenticate');
  }

  /**
   * Upload a prescription image
   * @param imageUri - Local file URI of the prescription image
   * @param patientId - ID of the patient
   */
  async uploadPrescription(
    imageUri: string,
    patientId: string
  ): Promise<Prescription> {
    try {
      // Convert image to base64
      const imageBase64 = await this.imageUriToBase64(imageUri);

      const request: CreatePrescriptionRequest = {
        patientId,
        imageBase64,
        imageMimeType: 'image/jpeg',
      };

      const response = await this.client.post<ApiResponse<CreatePrescriptionResponse>>(
        '/prescriptions',
        request
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to upload prescription');
      }

      return response.data.data.prescription;
    } catch (error) {
      console.error('Error uploading prescription:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Trigger AI transcription for a prescription
   * @param prescriptionId - ID of the prescription to transcribe
   */
  async transcribePrescription(prescriptionId: string): Promise<Prescription> {
    try {
      const response = await this.client.post<ApiResponse<TranscribePrescriptionResponse>>(
        `/prescriptions/${prescriptionId}/transcribe`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to transcribe prescription');
      }

      return response.data.data.prescription;
    } catch (error) {
      console.error('Error transcribing prescription:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get list of prescriptions for current patient
   * @param params - Filter and pagination parameters
   */
  async listPrescriptions(
    params?: ListPrescriptionsRequest
  ): Promise<ListPrescriptionsResponse> {
    try {
      const response = await this.client.get<ApiResponse<ListPrescriptionsResponse>>(
        '/prescriptions',
        { params }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to fetch prescriptions');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get a single prescription by ID
   * @param prescriptionId - ID of the prescription
   */
  async getPrescription(prescriptionId: string): Promise<Prescription> {
    try {
      const response = await this.client.get<ApiResponse<GetPrescriptionResponse>>(
        `/prescriptions/${prescriptionId}`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to fetch prescription');
      }

      return response.data.data.prescription;
    } catch (error) {
      console.error('Error fetching prescription:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Convert image URI to base64 string
   * @param uri - Local file URI
   */
  private async imageUriToBase64(uri: string): Promise<string> {
    try {
      // For React Native, use fetch to convert file to base64
      const response = await fetch(uri);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          } else {
            reject(new Error('Failed to convert image to base64'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Handle API errors and convert to user-friendly messages
   */
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.error) {
        return new Error(error.response.data.error.message);
      }
      if (error.code === 'ECONNABORTED') {
        return new Error('Request timed out. Please try again.');
      }
      if (error.code === 'ERR_NETWORK') {
        return new Error('Network error. Please check your connection.');
      }
      return new Error(error.message || 'An unexpected error occurred');
    }
    return error instanceof Error ? error : new Error('An unexpected error occurred');
  }
}

// Export singleton instance
export const prescriptionService = new PrescriptionService();
export default prescriptionService;
