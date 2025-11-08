/**
 * Prescription API Client Service - Pharmacist App
 * Handles all prescription-related API calls for pharmacist review workflows
 * T113 - User Story 1: Prescription Processing & Validation
 */

import axios, { AxiosInstance } from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
const API_TIMEOUT = 30000; // 30 seconds

// ============================================================================
// Types
// ============================================================================

export enum PrescriptionStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  CLARIFICATION_NEEDED = 'clarification_needed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum PrescriptionSource {
  PATIENT_UPLOAD = 'patient_upload',
  DOCTOR_DIRECT = 'doctor_direct',
  TELECONSULTATION = 'teleconsultation',
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'critical' | 'major' | 'moderate' | 'minor';
  description: string;
}

export interface AllergyWarning {
  allergen: string;
  reaction_type: string;
  severity: 'critical' | 'major' | 'moderate' | 'minor';
}

export interface Contraindication {
  condition: string;
  reason: string;
  severity: 'critical' | 'major' | 'moderate' | 'minor';
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medication_name: string;
  medication_rxnorm_code: string | null;
  dosage: string;
  frequency: string;
  duration: string | null;
  quantity: number | null;
  medication_confidence: number | null;
  dosage_confidence: number | null;
  frequency_confidence: number | null;
  pharmacist_corrected: boolean;
  original_ai_value: any;
  created_at: string;
  updated_at: string;
}

export interface Prescription {
  id: string;
  pharmacy_id: string;
  patient_id: string;
  prescribing_doctor_id: string | null;
  pharmacist_id: string | null;
  source: PrescriptionSource;
  image_url: string | null;
  ai_transcription_data: any;
  ai_confidence_score: number | null;
  status: PrescriptionStatus;
  rejection_reason: string | null;
  drug_interactions: DrugInteraction[] | null;
  allergy_warnings: AllergyWarning[] | null;
  contraindications: Contraindication[] | null;
  prescribed_date: string | null;
  expiry_date: string | null;
  treatment_plan_id: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by_pharmacist_id: string | null;
  items: PrescriptionItem[];
  patient?: any; // Patient details
  prescribing_doctor?: any; // Doctor details
}

export interface ListPrescriptionsParams {
  status?: string; // Single or comma-separated list
  patient_id?: string;
  pharmacy_id?: string;
  pharmacist_id?: string;
  prescribing_doctor_id?: string;
  has_safety_warnings?: boolean;
  has_low_confidence?: boolean;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at' | 'approved_at';
  sort_order?: 'asc' | 'desc';
}

export interface ListPrescriptionsResponse {
  prescriptions: Prescription[];
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
  filters_applied: any;
}

export interface ValidatePrescriptionResponse {
  prescription: Prescription;
  safety_checks: {
    drug_interactions: DrugInteraction[];
    allergy_warnings: AllergyWarning[];
    contraindications: Contraindication[];
    has_critical_issues: boolean;
  };
}

export interface ApprovePrescriptionRequest {
  pharmacist_id: string;
  notes?: string;
}

export interface ApprovePrescriptionResponse {
  prescription: Prescription;
  treatment_plan_id: string;
}

export interface RejectPrescriptionRequest {
  pharmacist_id: string;
  rejection_reason: string; // Mandatory per FR-029
  notify_doctor?: boolean;
  notify_patient?: boolean;
}

export interface RejectPrescriptionResponse {
  prescription: Prescription;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// ============================================================================
// Service Implementation
// ============================================================================

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
      return 'mock-jwt-token-pharmacist';
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
   * Get prescription queue for pharmacist review
   * Defaults to pending prescriptions for current pharmacist
   * @param params - Filter and pagination parameters
   */
  async getPrescriptionQueue(
    params?: ListPrescriptionsParams
  ): Promise<ListPrescriptionsResponse> {
    try {
      const response = await this.client.get<ApiResponse<ListPrescriptionsResponse>>(
        '/prescriptions',
        {
          params: {
            status: 'pending,in_review',
            sort_by: 'created_at',
            sort_order: 'asc',
            limit: 50,
            ...params,
          },
        }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to fetch prescription queue');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching prescription queue:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get a single prescription by ID with full details
   * @param prescriptionId - ID of the prescription
   */
  async getPrescription(prescriptionId: string): Promise<Prescription> {
    try {
      const response = await this.client.get<ApiResponse<{ prescription: Prescription }>>(
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
   * Validate prescription - Perform safety checks (drug interactions, allergies, contraindications)
   * Must be called before approval per FR-011, FR-012
   * @param prescriptionId - ID of the prescription to validate
   */
  async validatePrescription(prescriptionId: string): Promise<ValidatePrescriptionResponse> {
    try {
      const response = await this.client.post<ApiResponse<ValidatePrescriptionResponse>>(
        `/prescriptions/${prescriptionId}/validate`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to validate prescription');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error validating prescription:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Approve prescription after pharmacist review
   * Generates treatment plan automatically (FR-017)
   * @param prescriptionId - ID of the prescription to approve
   * @param data - Approval data including pharmacist ID and optional notes
   */
  async approvePrescription(
    prescriptionId: string,
    data: ApprovePrescriptionRequest
  ): Promise<ApprovePrescriptionResponse> {
    try {
      const response = await this.client.put<ApiResponse<ApprovePrescriptionResponse>>(
        `/prescriptions/${prescriptionId}/approve`,
        data
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to approve prescription');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error approving prescription:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Reject prescription with mandatory reason (FR-029)
   * @param prescriptionId - ID of the prescription to reject
   * @param data - Rejection data including mandatory reason
   */
  async rejectPrescription(
    prescriptionId: string,
    data: RejectPrescriptionRequest
  ): Promise<RejectPrescriptionResponse> {
    try {
      // Validate rejection reason is provided (FR-029 mandatory)
      if (!data.rejection_reason || data.rejection_reason.trim().length === 0) {
        throw new Error('Rejection reason is mandatory');
      }

      const response = await this.client.put<ApiResponse<RejectPrescriptionResponse>>(
        `/prescriptions/${prescriptionId}/reject`,
        data
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to reject prescription');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error rejecting prescription:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update prescription items (for pharmacist corrections to AI transcription)
   * @param prescriptionId - ID of the prescription
   * @param items - Updated prescription items
   */
  async updatePrescriptionItems(
    prescriptionId: string,
    items: Partial<PrescriptionItem>[]
  ): Promise<Prescription> {
    try {
      const response = await this.client.put<ApiResponse<{ prescription: Prescription }>>(
        `/prescriptions/${prescriptionId}/items`,
        { items }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Failed to update prescription items');
      }

      return response.data.data.prescription;
    } catch (error) {
      console.error('Error updating prescription items:', error);
      throw this.handleError(error);
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
