/**
 * Adherence Tracking API Service
 * Handles all API calls for adherence tracking feature (patient app)
 * T8-043: Patient Adherence Tracking
 */

import type {
  AdherenceDashboardData,
  MedicationAdherence,
  MedicationReminder,
  DailyAdherenceEntry,
  AdherenceStats,
  LogAdherenceRequest,
  ReminderSettingsRequest,
  ApiResponse,
} from '../types/adherence.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Get authentication headers with Bearer token
 */
const getAuthHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
});

/**
 * Get adherence dashboard data for patient
 */
export const getAdherenceDashboard = async (patientId: string): Promise<AdherenceDashboardData> => {
  const response = await fetch(`${API_BASE_URL}/api/adherence/dashboard/${patientId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch adherence dashboard');
  }

  const result: ApiResponse<AdherenceDashboardData> = await response.json();
  if (!result.data) {
    throw new Error(result.error || 'No adherence data returned');
  }

  return result.data;
};

/**
 * Get medication adherence details
 */
export const getMedicationAdherence = async (medicationId: string): Promise<MedicationAdherence> => {
  const response = await fetch(`${API_BASE_URL}/api/adherence/medications/${medicationId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch medication adherence');
  }

  const result: ApiResponse<MedicationAdherence> = await response.json();
  if (!result.data) {
    throw new Error(result.error || 'No medication adherence data returned');
  }

  return result.data;
};

/**
 * Get all active medication reminders for patient
 */
export const getReminders = async (patientId: string): Promise<MedicationReminder[]> => {
  const response = await fetch(`${API_BASE_URL}/api/adherence/reminders/${patientId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch reminders');
  }

  const result: ApiResponse<MedicationReminder[]> = await response.json();
  return result.data || [];
};

/**
 * Get adherence history entries
 */
export const getAdherenceHistory = async (
  patientId: string,
  startDate?: string,
  endDate?: string
): Promise<DailyAdherenceEntry[]> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const url = `${API_BASE_URL}/api/adherence/history/${patientId}?${params.toString()}`;
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch adherence history');
  }

  const result: ApiResponse<DailyAdherenceEntry[]> = await response.json();
  return result.data || [];
};

/**
 * Get adherence statistics
 */
export const getAdherenceStats = async (patientId: string): Promise<AdherenceStats> => {
  const response = await fetch(`${API_BASE_URL}/api/adherence/stats/${patientId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch adherence statistics');
  }

  const result: ApiResponse<AdherenceStats> = await response.json();
  if (!result.data) {
    throw new Error(result.error || 'No statistics data returned');
  }

  return result.data;
};

/**
 * Log medication adherence (mark as taken/missed)
 */
export const logAdherence = async (
  patientId: string,
  adherenceData: LogAdherenceRequest
): Promise<DailyAdherenceEntry> => {
  const response = await fetch(`${API_BASE_URL}/api/adherence/log/${patientId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(adherenceData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to log adherence');
  }

  const result: ApiResponse<DailyAdherenceEntry> = await response.json();
  if (!result.data) {
    throw new Error(result.error || 'No adherence entry returned');
  }

  return result.data;
};

/**
 * Update reminder settings for a medication
 */
export const updateReminderSettings = async (
  reminderId: string,
  settings: ReminderSettingsRequest
): Promise<MedicationReminder> => {
  const response = await fetch(`${API_BASE_URL}/api/adherence/reminders/${reminderId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update reminder settings');
  }

  const result: ApiResponse<MedicationReminder> = await response.json();
  if (!result.data) {
    throw new Error(result.error || 'No reminder data returned');
  }

  return result.data;
};

/**
 * Acknowledge/dismiss a medication reminder
 */
export const acknowledgeReminder = async (entryId: string): Promise<DailyAdherenceEntry> => {
  const response = await fetch(`${API_BASE_URL}/api/adherence/entries/${entryId}/acknowledge`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to acknowledge reminder');
  }

  const result: ApiResponse<DailyAdherenceEntry> = await response.json();
  if (!result.data) {
    throw new Error(result.error || 'No entry data returned');
  }

  return result.data;
};

export default {
  getAdherenceDashboard,
  getMedicationAdherence,
  getReminders,
  getAdherenceHistory,
  getAdherenceStats,
  logAdherence,
  updateReminderSettings,
  acknowledgeReminder,
};
