/**
 * Prescription API Hooks
 * React Query hooks for prescription management API calls
 * Task: T120 - Create prescription API hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// ============================================================================
// Types (matching backend Prescription model)
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
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
}

export interface AllergyWarning {
  allergen: string;
  reaction_type: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
}

export interface Contraindication {
  condition: string;
  reason: string;
}

export interface PrescriptionItem {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  confidence_score?: number;
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
  drug_interactions: DrugInteraction[];
  allergy_warnings: AllergyWarning[];
  contraindications: Contraindication[];
  prescribed_date: string | null;
  expiry_date: string | null;
  treatment_plan_id: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by_pharmacist_id: string | null;
  items: PrescriptionItem[];
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  prescribing_doctor?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface PrescriptionFilters {
  status?: PrescriptionStatus | PrescriptionStatus[];
  source?: PrescriptionSource;
  patient_id?: string;
  prescribing_doctor_id?: string;
  pharmacist_id?: string;
  created_after?: string;
  created_before?: string;
  has_safety_warnings?: boolean;
  low_confidence?: boolean;
  limit?: number;
  offset?: number;
}

export interface PrescriptionListResponse {
  prescriptions: Prescription[];
  total: number;
  limit: number;
  offset: number;
}

export interface ValidateRequest {
  prescriptionId: string;
}

export interface ApproveRequest {
  prescriptionId: string;
  pharmacistId: string;
}

export interface RejectRequest {
  prescriptionId: string;
  reason: string;
}

// ============================================================================
// API Client Configuration
// ============================================================================

const API_BASE_URL = process.env.REACT_APP_API_GATEWAY_URL || 'http://localhost:4000';
const PRESCRIPTION_SERVICE_URL = `${API_BASE_URL}/prescriptions`;

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

export const prescriptionKeys = {
  all: ['prescriptions'] as const,
  lists: () => [...prescriptionKeys.all, 'list'] as const,
  list: (filters: PrescriptionFilters) => [...prescriptionKeys.lists(), filters] as const,
  details: () => [...prescriptionKeys.all, 'detail'] as const,
  detail: (id: string) => [...prescriptionKeys.details(), id] as const,
};

// ============================================================================
// API Functions
// ============================================================================

export const prescriptionApi = {
  /**
   * Fetch prescriptions with optional filters
   */
  async list(filters: PrescriptionFilters = {}): Promise<PrescriptionListResponse> {
    const params = new URLSearchParams();

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        filters.status.forEach((s) => params.append('status', s));
      } else {
        params.append('status', filters.status);
      }
    }

    if (filters.source) params.append('source', filters.source);
    if (filters.patient_id) params.append('patient_id', filters.patient_id);
    if (filters.prescribing_doctor_id) params.append('prescribing_doctor_id', filters.prescribing_doctor_id);
    if (filters.pharmacist_id) params.append('pharmacist_id', filters.pharmacist_id);
    if (filters.created_after) params.append('created_after', filters.created_after);
    if (filters.created_before) params.append('created_before', filters.created_before);
    if (filters.has_safety_warnings !== undefined) params.append('has_safety_warnings', String(filters.has_safety_warnings));
    if (filters.low_confidence !== undefined) params.append('low_confidence', String(filters.low_confidence));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.offset) params.append('offset', String(filters.offset));

    const response = await apiClient.get(`${PRESCRIPTION_SERVICE_URL}?${params.toString()}`);
    return response.data;
  },

  /**
   * Fetch single prescription by ID
   */
  async get(id: string): Promise<Prescription> {
    const response = await apiClient.get(`${PRESCRIPTION_SERVICE_URL}/${id}`);
    return response.data;
  },

  /**
   * Validate prescription (run safety checks)
   */
  async validate(prescriptionId: string): Promise<Prescription> {
    const response = await apiClient.post(`${PRESCRIPTION_SERVICE_URL}/${prescriptionId}/validate`);
    return response.data;
  },

  /**
   * Approve prescription
   */
  async approve(prescriptionId: string, pharmacistId: string): Promise<Prescription> {
    const response = await apiClient.put(`${PRESCRIPTION_SERVICE_URL}/${prescriptionId}/approve`, {
      pharmacistId,
    });
    return response.data;
  },

  /**
   * Reject prescription
   */
  async reject(prescriptionId: string, reason: string): Promise<Prescription> {
    const response = await apiClient.put(`${PRESCRIPTION_SERVICE_URL}/${prescriptionId}/reject`, {
      reason,
    });
    return response.data;
  },
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook to fetch prescriptions with filters
 */
export function usePrescriptions(filters: PrescriptionFilters = {}) {
  return useQuery({
    queryKey: prescriptionKeys.list(filters),
    queryFn: () => prescriptionApi.list(filters),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every 60 seconds for real-time updates
  });
}

/**
 * Hook to fetch single prescription
 */
export function usePrescription(id: string) {
  return useQuery({
    queryKey: prescriptionKeys.detail(id),
    queryFn: () => prescriptionApi.get(id),
    enabled: !!id,
    staleTime: 30000,
  });
}

/**
 * Hook to validate prescription
 */
export function useValidatePrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prescriptionId: string) => prescriptionApi.validate(prescriptionId),
    onSuccess: (data) => {
      // Invalidate prescription list and detail queries
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.lists() });
      queryClient.setQueryData(prescriptionKeys.detail(data.id), data);
    },
  });
}

/**
 * Hook to approve prescription
 */
export function useApprovePrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ prescriptionId, pharmacistId }: ApproveRequest) =>
      prescriptionApi.approve(prescriptionId, pharmacistId),
    onSuccess: (data) => {
      // Invalidate prescription list and detail queries
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.lists() });
      queryClient.setQueryData(prescriptionKeys.detail(data.id), data);
    },
  });
}

/**
 * Hook to reject prescription
 */
export function useRejectPrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ prescriptionId, reason }: RejectRequest) =>
      prescriptionApi.reject(prescriptionId, reason),
    onSuccess: (data) => {
      // Invalidate prescription list and detail queries
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.lists() });
      queryClient.setQueryData(prescriptionKeys.detail(data.id), data);
    },
  });
}
