/**
 * useDoctor Hook
 * React Query hooks for doctor-specific data management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDoctorPatients,
  getPatient,
  getPatientPrescriptions,
  getPatientTreatments,
  createPrescription,
  updatePrescription,
  renewPrescription,
  createTreatment,
  updateTreatment,
  getMessageThreads,
  getMessageThread,
  sendMessage,
  markMessagesAsRead,
  getObservanceStats,
  getPatientComplianceChart,
  getDoctorDashboard,
  getRecentConsultations,
} from '../services/doctorApi';
import type {
  PatientListFilters,
  Prescription,
  Treatment,
} from '../types/doctor';

// ============================================================================
// Patient Hooks
// ============================================================================

/**
 * Hook to fetch doctor's patient list
 */
export function useDoctorPatients(filters?: PatientListFilters) {
  return useQuery({
    queryKey: ['doctor', 'patients', filters],
    queryFn: () => getDoctorPatients(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch single patient details
 */
export function usePatient(patientId: string) {
  return useQuery({
    queryKey: ['doctor', 'patient', patientId],
    queryFn: () => getPatient(patientId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!patientId,
  });
}

// ============================================================================
// Prescription Hooks
// ============================================================================

/**
 * Hook to fetch patient's prescriptions
 */
export function usePatientPrescriptions(patientId: string) {
  return useQuery({
    queryKey: ['doctor', 'prescriptions', patientId],
    queryFn: () => getPatientPrescriptions(patientId),
    staleTime: 3 * 60 * 1000, // 3 minutes
    enabled: !!patientId,
  });
}

/**
 * Hook to create prescription
 */
export function useCreatePrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Prescription>) => createPrescription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'prescriptions'] });
    },
  });
}

/**
 * Hook to update prescription
 */
export function useUpdatePrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ prescriptionId, data }: { prescriptionId: string; data: Partial<Prescription> }) =>
      updatePrescription(prescriptionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'prescriptions'] });
    },
  });
}

/**
 * Hook to renew prescription
 */
export function useRenewPrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prescriptionId: string) => renewPrescription(prescriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'prescriptions'] });
    },
  });
}

// ============================================================================
// Treatment Hooks
// ============================================================================

/**
 * Hook to fetch patient's treatments
 */
export function usePatientTreatments(patientId: string) {
  return useQuery({
    queryKey: ['doctor', 'treatments', patientId],
    queryFn: () => getPatientTreatments(patientId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!patientId,
  });
}

/**
 * Hook to create treatment
 */
export function useCreateTreatment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Treatment>) => createTreatment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'treatments'] });
    },
  });
}

/**
 * Hook to update treatment
 */
export function useUpdateTreatment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ treatmentId, data }: { treatmentId: string; data: Partial<Treatment> }) =>
      updateTreatment(treatmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'treatments'] });
    },
  });
}

// ============================================================================
// Messaging Hooks
// ============================================================================

/**
 * Hook to fetch message threads
 */
export function useDoctorMessageThreads(page?: number) {
  return useQuery({
    queryKey: ['doctor', 'messages', 'threads', page],
    queryFn: () => getMessageThreads(page),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch specific message thread
 */
export function useDoctorMessageThread(threadId: string) {
  return useQuery({
    queryKey: ['doctor', 'messages', 'thread', threadId],
    queryFn: () => getMessageThread(threadId),
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!threadId,
  });
}

/**
 * Hook to send message
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { conversationId: string; content: string; attachments?: string[] }) =>
      sendMessage(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['doctor', 'messages', 'thread', variables.conversationId],
      });
    },
  });
}

/**
 * Hook to mark messages as read
 */
export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (threadId: string) => markMessagesAsRead(threadId),
    onSuccess: (_, threadId) => {
      queryClient.invalidateQueries({
        queryKey: ['doctor', 'messages', 'thread', threadId],
      });
    },
  });
}

// ============================================================================
// Observance Hooks
// ============================================================================

/**
 * Hook to fetch observance statistics
 */
export function useDoctorObservanceStats() {
  return useQuery({
    queryKey: ['doctor', 'observance-stats'],
    queryFn: () => getObservanceStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch patient compliance chart
 */
export function usePatientComplianceChart(patientId: string) {
  return useQuery({
    queryKey: ['doctor', 'compliance-chart', patientId],
    queryFn: () => getPatientComplianceChart(patientId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!patientId,
  });
}

// ============================================================================
// Dashboard Hooks
// ============================================================================

/**
 * Hook to fetch doctor dashboard analytics
 */
export function useDoctorDashboard() {
  return useQuery({
    queryKey: ['doctor', 'dashboard'],
    queryFn: () => getDoctorDashboard(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch recent consultations
 */
export function useRecentConsultations(limit?: number) {
  return useQuery({
    queryKey: ['doctor', 'consultations', 'recent', limit],
    queryFn: () => getRecentConsultations(limit),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}
