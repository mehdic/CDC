/**
 * Teleconsultation API Hooks
 * React Query hooks for teleconsultation management API calls
 * Task: T174 - Create teleconsultation hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// ============================================================================
// Types (matching backend Teleconsultation model)
// ============================================================================

export enum TeleconsultationStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export interface PharmacistAvailability {
  pharmacist_id: string;
  pharmacist_name: string;
  available_slots: AvailabilitySlot[];
}

export interface AvailabilitySlot {
  start_time: string; // ISO 8601 datetime
  end_time: string;
  is_available: boolean;
  is_vip_only?: boolean;
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone: string;
  email: string;
  allergies?: string[];
  chronic_conditions?: string[];
}

export interface Pharmacist {
  id: string;
  first_name: string;
  last_name: string;
  license_number: string;
}

export interface Prescription {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
}

export interface ConsultationNote {
  id: string;
  consultation_id: string;
  note_type: 'ai_transcript' | 'manual' | 'summary';
  content: string;
  created_by_pharmacist_id: string;
  created_at: string;
  updated_at: string;
  edit_history?: Array<{
    edited_at: string;
    edited_by: string;
    previous_content: string;
  }>;
}

export interface Teleconsultation {
  id: string;
  pharmacy_id: string;
  patient_id: string;
  pharmacist_id: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  status: TeleconsultationStatus;
  recording_consent: boolean;
  recording_url: string | null;
  twilio_room_sid: string | null;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  pharmacist?: Pharmacist;
  notes?: ConsultationNote[];
  prescriptions_created?: Prescription[];
}

export interface AvailabilityFilters {
  pharmacist_id?: string;
  start_date: string; // ISO date (YYYY-MM-DD)
  end_date: string;
  pharmacy_id?: string;
}

export interface TeleconsultationFilters {
  status?: TeleconsultationStatus | TeleconsultationStatus[];
  pharmacist_id?: string;
  patient_id?: string;
  pharmacy_id?: string;
  scheduled_after?: string;
  scheduled_before?: string;
  limit?: number;
  offset?: number;
}

export interface TeleconsultationListResponse {
  teleconsultations: Teleconsultation[];
  total: number;
  limit: number;
  offset: number;
}

export interface BookConsultationRequest {
  patient_id: string;
  pharmacist_id: string;
  scheduled_start: string;
  scheduled_end: string;
  recording_consent: boolean;
  notes?: string;
}

export interface JoinConsultationResponse {
  consultation: Teleconsultation;
  twilio_token: string;
  twilio_room_name: string;
}

export interface SaveNotesRequest {
  consultation_id: string;
  note_type: 'ai_transcript' | 'manual' | 'summary';
  content: string;
}

export interface UpdateConsultationStatusRequest {
  consultation_id: string;
  status: TeleconsultationStatus;
}

// ============================================================================
// API Client Configuration
// ============================================================================

const API_BASE_URL = process.env.REACT_APP_API_GATEWAY_URL || 'http://localhost:4000';
const TELECONSULTATION_SERVICE_URL = `${API_BASE_URL}/teleconsultations`;

// Configure axios with auth token from localStorage
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================================================
// Query Keys
// ============================================================================

export const teleconsultationKeys = {
  all: ['teleconsultations'] as const,
  lists: () => [...teleconsultationKeys.all, 'list'] as const,
  list: (filters: TeleconsultationFilters) => [...teleconsultationKeys.lists(), filters] as const,
  details: () => [...teleconsultationKeys.all, 'detail'] as const,
  detail: (id: string) => [...teleconsultationKeys.details(), id] as const,
  availability: (filters: AvailabilityFilters) => [...teleconsultationKeys.all, 'availability', filters] as const,
};

// ============================================================================
// API Functions
// ============================================================================

export const teleconsultationApi = {
  /**
   * Fetch pharmacist availability for booking
   */
  async getAvailability(filters: AvailabilityFilters): Promise<PharmacistAvailability[]> {
    const params = new URLSearchParams();
    params.append('start_date', filters.start_date);
    params.append('end_date', filters.end_date);
    if (filters.pharmacist_id) params.append('pharmacist_id', filters.pharmacist_id);
    if (filters.pharmacy_id) params.append('pharmacy_id', filters.pharmacy_id);

    const response = await apiClient.get(`${TELECONSULTATION_SERVICE_URL}/availability?${params.toString()}`);
    return response.data;
  },

  /**
   * Fetch teleconsultations with optional filters
   */
  async list(filters: TeleconsultationFilters = {}): Promise<TeleconsultationListResponse> {
    const params = new URLSearchParams();

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        filters.status.forEach((s) => params.append('status', s));
      } else {
        params.append('status', filters.status);
      }
    }

    if (filters.pharmacist_id) params.append('pharmacist_id', filters.pharmacist_id);
    if (filters.patient_id) params.append('patient_id', filters.patient_id);
    if (filters.pharmacy_id) params.append('pharmacy_id', filters.pharmacy_id);
    if (filters.scheduled_after) params.append('scheduled_after', filters.scheduled_after);
    if (filters.scheduled_before) params.append('scheduled_before', filters.scheduled_before);
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.offset) params.append('offset', String(filters.offset));

    const response = await apiClient.get(`${TELECONSULTATION_SERVICE_URL}?${params.toString()}`);
    return response.data;
  },

  /**
   * Fetch single teleconsultation by ID
   */
  async get(id: string): Promise<Teleconsultation> {
    const response = await apiClient.get(`${TELECONSULTATION_SERVICE_URL}/${id}`);
    return response.data;
  },

  /**
   * Book a new teleconsultation
   */
  async book(request: BookConsultationRequest): Promise<Teleconsultation> {
    const response = await apiClient.post(`${TELECONSULTATION_SERVICE_URL}`, request);
    return response.data;
  },

  /**
   * Join a teleconsultation (get Twilio access token)
   */
  async join(consultationId: string): Promise<JoinConsultationResponse> {
    const response = await apiClient.get(`${TELECONSULTATION_SERVICE_URL}/${consultationId}/join`);
    return response.data;
  },

  /**
   * Save consultation notes
   */
  async saveNotes(request: SaveNotesRequest): Promise<ConsultationNote> {
    const response = await apiClient.post(
      `${TELECONSULTATION_SERVICE_URL}/${request.consultation_id}/notes`,
      {
        note_type: request.note_type,
        content: request.content,
      }
    );
    return response.data;
  },

  /**
   * Update consultation status
   */
  async updateStatus(request: UpdateConsultationStatusRequest): Promise<Teleconsultation> {
    const response = await apiClient.patch(
      `${TELECONSULTATION_SERVICE_URL}/${request.consultation_id}/status`,
      {
        status: request.status,
      }
    );
    return response.data;
  },

  /**
   * Cancel a teleconsultation
   */
  async cancel(consultationId: string, reason?: string): Promise<Teleconsultation> {
    const response = await apiClient.delete(`${TELECONSULTATION_SERVICE_URL}/${consultationId}`, {
      data: { reason },
    });
    return response.data;
  },
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook to fetch pharmacist availability for calendar view
 */
export function useAvailability(filters: AvailabilityFilters) {
  return useQuery({
    queryKey: teleconsultationKeys.availability(filters),
    queryFn: () => teleconsultationApi.getAvailability(filters),
    staleTime: 60000, // 1 minute
    enabled: !!filters.start_date && !!filters.end_date,
  });
}

/**
 * Hook to fetch teleconsultations with filters
 */
export function useTeleconsultations(filters: TeleconsultationFilters = {}) {
  return useQuery({
    queryKey: teleconsultationKeys.list(filters),
    queryFn: () => teleconsultationApi.list(filters),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every 60 seconds for real-time updates
  });
}

/**
 * Hook to fetch single teleconsultation
 */
export function useTeleconsultation(id: string) {
  return useQuery({
    queryKey: teleconsultationKeys.detail(id),
    queryFn: () => teleconsultationApi.get(id),
    enabled: !!id,
    staleTime: 30000,
  });
}

/**
 * Hook to book a teleconsultation
 */
export function useBookConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BookConsultationRequest) => teleconsultationApi.book(request),
    onSuccess: (data) => {
      // Invalidate teleconsultation lists and availability
      queryClient.invalidateQueries({ queryKey: teleconsultationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teleconsultationKeys.all });
      queryClient.setQueryData(teleconsultationKeys.detail(data.id), data);
    },
  });
}

/**
 * Hook to join a teleconsultation (get Twilio token)
 */
export function useJoinConsultation() {
  return useMutation({
    mutationFn: (consultationId: string) => teleconsultationApi.join(consultationId),
  });
}

/**
 * Hook to save consultation notes
 */
export function useSaveConsultationNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SaveNotesRequest) => teleconsultationApi.saveNotes(request),
    onSuccess: (_, variables) => {
      // Invalidate consultation detail to refresh notes
      queryClient.invalidateQueries({ queryKey: teleconsultationKeys.detail(variables.consultation_id) });
    },
  });
}

/**
 * Hook to update consultation status
 */
export function useUpdateConsultationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateConsultationStatusRequest) => teleconsultationApi.updateStatus(request),
    onSuccess: (data) => {
      // Invalidate consultation lists and detail
      queryClient.invalidateQueries({ queryKey: teleconsultationKeys.lists() });
      queryClient.setQueryData(teleconsultationKeys.detail(data.id), data);
    },
  });
}

/**
 * Hook to cancel a teleconsultation
 */
export function useCancelConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ consultationId, reason }: { consultationId: string; reason?: string }) =>
      teleconsultationApi.cancel(consultationId, reason),
    onSuccess: (data) => {
      // Invalidate consultation lists and detail
      queryClient.invalidateQueries({ queryKey: teleconsultationKeys.lists() });
      queryClient.setQueryData(teleconsultationKeys.detail(data.id), data);
    },
  });
}
