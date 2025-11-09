/**
 * Teleconsultation API Service - Pharmacist App
 * Client for teleconsultation endpoints
 * Tasks: T162-T168 - User Story 2: Secure Teleconsultation
 */

import axios, { AxiosInstance } from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
const API_TIMEOUT = 30000; // 30 seconds

// ============================================================================
// Types
// ============================================================================

export enum TeleconsultationStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export interface Teleconsultation {
  id: string;
  pharmacy_id: string;
  patient_id: string;
  pharmacist_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: TeleconsultationStatus;
  recording_consent: boolean;
  twilio_room_sid: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

export interface ConsultationNote {
  id: string;
  teleconsultation_id: string;
  ai_transcript: string | null;
  ai_summary: string | null;
  ai_highlighted_terms: string[] | null;
  pharmacist_notes: string | null;
  edited: boolean;
  edit_history: EditHistoryEntry[] | null;
  created_at: string;
  updated_at: string;
}

export interface EditHistoryEntry {
  timestamp: string;
  user_id: string;
  changes: {
    field: string;
    old_value: string;
    new_value: string;
  }[];
  original_ai_version?: string;
}

export interface JoinResponse {
  access_token: string;
  room_sid: string;
  room_name: string;
  participant_identity: string;
  participant_role: 'patient' | 'pharmacist';
  recording_consent: boolean;
  consultation: {
    id: string;
    scheduled_at: string;
    duration_minutes: number;
    status: string;
  };
}

export interface PatientMedicalRecord {
  patient_id: string;
  allergies: string[];
  chronic_conditions: string[];
  current_medications: {
    name: string;
    dosage: string;
    frequency: string;
  }[];
  prescription_history: {
    id: string;
    medication_name: string;
    prescribed_date: string;
    prescribing_doctor: string;
  }[];
}

export interface ListTeleconsultationsParams {
  status?: string;
  pharmacist_id?: string;
  patient_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  success?: boolean;
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

class TeleconsultationService {
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
    console.log('Token expired - need to re-authenticate');
  }

  /**
   * Get list of teleconsultations for pharmacist
   * FR-021: View available time slots and scheduled consultations
   */
  async getTeleconsultations(
    params?: ListTeleconsultationsParams
  ): Promise<Teleconsultation[]> {
    try {
      const response = await this.client.get('/teleconsultations', {
        params,
      });

      return response.data.teleconsultations || response.data || [];
    } catch (error) {
      console.error('Error fetching teleconsultations:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get upcoming teleconsultations (scheduled status)
   */
  async getUpcoming(): Promise<Teleconsultation[]> {
    return this.getTeleconsultations({
      status: 'scheduled',
      limit: 50,
    });
  }

  /**
   * Get active teleconsultations (in_progress status)
   */
  async getActive(): Promise<Teleconsultation[]> {
    return this.getTeleconsultations({
      status: 'in_progress',
      limit: 10,
    });
  }

  /**
   * Get single teleconsultation by ID
   */
  async getTeleconsultation(id: string): Promise<Teleconsultation> {
    try {
      const response = await this.client.get(`/teleconsultations/${id}`);
      return response.data.teleconsultation || response.data;
    } catch (error) {
      console.error('Error fetching teleconsultation:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Join video call
   * FR-023: Get Twilio access token for joining video room
   */
  async join(teleconsultationId: string): Promise<JoinResponse> {
    try {
      const response = await this.client.get(
        `/teleconsultations/${teleconsultationId}/join`
      );
      return response.data;
    } catch (error) {
      console.error('Error joining teleconsultation:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get patient medical record for sidebar during consultation
   * FR-024: Access patient medical records during video calls
   */
  async getPatientRecord(patientId: string): Promise<PatientMedicalRecord> {
    try {
      const response = await this.client.get(`/patients/${patientId}/medical-record`);
      return response.data.medical_record || response.data;
    } catch (error) {
      console.error('Error fetching patient medical record:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get consultation notes with AI transcript
   * FR-025: AI transcription with patient consent
   */
  async getNotes(teleconsultationId: string): Promise<ConsultationNote> {
    try {
      const response = await this.client.get(
        `/teleconsultations/${teleconsultationId}/notes`
      );
      return response.data.note || response.data;
    } catch (error) {
      console.error('Error fetching consultation notes:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Create consultation notes
   * FR-025: AI transcribes conversation with patient consent
   */
  async createNotes(teleconsultationId: string): Promise<ConsultationNote> {
    try {
      const response = await this.client.post(
        `/teleconsultations/${teleconsultationId}/notes`,
        {}
      );
      return response.data.note || response.data;
    } catch (error) {
      console.error('Error creating consultation notes:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update consultation notes (pharmacist edits)
   * FR-025a: Editable with audit trail
   */
  async updateNotes(
    teleconsultationId: string,
    pharmacistNotes: string
  ): Promise<ConsultationNote> {
    try {
      const response = await this.client.put(
        `/teleconsultations/${teleconsultationId}/notes`,
        { pharmacist_notes: pharmacistNotes }
      );
      return response.data.note || response.data;
    } catch (error) {
      console.error('Error updating consultation notes:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Complete teleconsultation
   */
  async completeTeleconsultation(teleconsultationId: string): Promise<void> {
    try {
      await this.client.post(`/teleconsultations/${teleconsultationId}/complete`);
    } catch (error) {
      console.error('Error completing teleconsultation:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Cancel teleconsultation
   * FR-030: Support rescheduling and cancellation
   */
  async cancelTeleconsultation(
    teleconsultationId: string,
    reason: string
  ): Promise<void> {
    try {
      await this.client.post(`/teleconsultations/${teleconsultationId}/cancel`, {
        reason,
      });
    } catch (error) {
      console.error('Error cancelling teleconsultation:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors and convert to user-friendly messages
   */
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.error) {
        return new Error(error.response.data.error);
      }
      if (error.response?.data?.message) {
        return new Error(error.response.data.message);
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
export const teleconsultationService = new TeleconsultationService();
export default teleconsultationService;
