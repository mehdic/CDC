/**
 * Doctor API Service
 * API client for doctor-specific endpoints
 */

import { apiClient } from '@shared/api/client';
import {
  DoctorPatient,
  PatientListResponse,
  PatientListFilters,
  Prescription,
  Treatment,
  TreatmentViewResponse,
  MessageThread,
  MessageThreadListResponse,
  Message,
  ObservanceStatsResponse,
  DoctorDashboardResponse,
  ConsultationResponse,
} from '../types/doctor';

// ============================================================================
// Patient API
// ============================================================================

/**
 * Fetch doctor's patient list with filters
 */
export async function getDoctorPatients(filters?: PatientListFilters): Promise<PatientListResponse> {
  const params = new URLSearchParams();

  if (filters?.search) params.append('search', filters.search);
  if (filters?.chronicOnly) params.append('chronicOnly', 'true');
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

  const response = await apiClient.get(`/doctor/patients?${params.toString()}`);
  return response.data;
}

/**
 * Fetch single patient details
 */
export async function getPatient(patientId: string): Promise<{ success: boolean; data: DoctorPatient }> {
  const response = await apiClient.get(`/doctor/patients/${patientId}`);
  return response.data;
}

// ============================================================================
// Prescription API
// ============================================================================

/**
 * Create new prescription
 */
export async function createPrescription(data: Partial<Prescription>): Promise<{ success: boolean; data: Prescription }> {
  const response = await apiClient.post('/doctor/prescriptions', data);
  return response.data;
}

/**
 * Update prescription
 */
export async function updatePrescription(
  prescriptionId: string,
  data: Partial<Prescription>
): Promise<{ success: boolean; data: Prescription }> {
  const response = await apiClient.put(`/doctor/prescriptions/${prescriptionId}`, data);
  return response.data;
}

/**
 * Renew prescription
 */
export async function renewPrescription(prescriptionId: string): Promise<{ success: boolean; data: Prescription }> {
  const response = await apiClient.post(`/doctor/prescriptions/${prescriptionId}/renew`, {});
  return response.data;
}

/**
 * Get patient's prescriptions
 */
export async function getPatientPrescriptions(patientId: string): Promise<{ success: boolean; data: Prescription[] }> {
  const response = await apiClient.get(`/doctor/patients/${patientId}/prescriptions`);
  return response.data;
}

// ============================================================================
// Treatment API
// ============================================================================

/**
 * Get patient's current and past treatments
 */
export async function getPatientTreatments(patientId: string): Promise<TreatmentViewResponse> {
  const response = await apiClient.get(`/doctor/patients/${patientId}/treatments`);
  return response.data;
}

/**
 * Create treatment plan
 */
export async function createTreatment(data: Partial<Treatment>): Promise<{ success: boolean; data: Treatment }> {
  const response = await apiClient.post('/doctor/treatments', data);
  return response.data;
}

/**
 * Update treatment plan
 */
export async function updateTreatment(
  treatmentId: string,
  data: Partial<Treatment>
): Promise<{ success: boolean; data: Treatment }> {
  const response = await apiClient.put(`/doctor/treatments/${treatmentId}`, data);
  return response.data;
}

// ============================================================================
// Messaging API
// ============================================================================

/**
 * Get message threads
 */
export async function getMessageThreads(page?: number): Promise<MessageThreadListResponse> {
  const params = page ? `?page=${page}` : '';
  const response = await apiClient.get(`/doctor/messages/threads${params}`);
  return response.data;
}

/**
 * Get specific message thread
 */
export async function getMessageThread(threadId: string): Promise<{ success: boolean; data: MessageThread }> {
  const response = await apiClient.get(`/doctor/messages/threads/${threadId}`);
  return response.data;
}

/**
 * Send message
 */
export async function sendMessage(data: {
  conversationId: string;
  content: string;
  attachments?: string[];
}): Promise<{ success: boolean; data: Message }> {
  const response = await apiClient.post('/doctor/messages', data);
  return response.data;
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(threadId: string): Promise<{ success: boolean }> {
  const response = await apiClient.put(`/doctor/messages/threads/${threadId}/read`, {});
  return response.data;
}

// ============================================================================
// Observance/Compliance API
// ============================================================================

/**
 * Get observance statistics for patients
 */
export async function getObservanceStats(): Promise<ObservanceStatsResponse> {
  const response = await apiClient.get('/doctor/observance-stats');
  return response.data;
}

/**
 * Get specific patient compliance chart
 */
export async function getPatientComplianceChart(patientId: string): Promise<{
  success: boolean;
  data: Array<{ date: string; compliance: number }>;
}> {
  const response = await apiClient.get(`/doctor/patients/${patientId}/compliance-chart`);
  return response.data;
}

// ============================================================================
// Dashboard API
// ============================================================================

/**
 * Get doctor dashboard analytics
 */
export async function getDoctorDashboard(): Promise<DoctorDashboardResponse> {
  const response = await apiClient.get('/doctor/dashboard');
  return response.data;
}

/**
 * Get recent consultations
 */
export async function getRecentConsultations(limit?: number): Promise<ConsultationResponse> {
  const params = limit ? `?limit=${limit}` : '';
  const response = await apiClient.get(`/doctor/consultations/recent${params}`);
  return response.data;
}
