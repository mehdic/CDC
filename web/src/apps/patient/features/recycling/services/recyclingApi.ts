/**
 * Recycling API Service
 * Handles all API calls for medication recycling feature (patient app)
 * T5-052: Medication Return/Recycling Feature
 */

import type { RecyclingRequest, Medication, RecyclingRequestStatus } from '../types/recycling.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Get authentication headers
 */
const getAuthHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
});

/**
 * Create a new medication recycling request
 */
export const createRecyclingRequest = async (data: {
  patientId: string;
  pharmacyId: string;
  medications: Medication[];
  notes?: string;
}): Promise<RecyclingRequest> => {
  const response = await fetch(`${API_BASE_URL}/api/recycling/request`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create recycling request');
  }

  const result = await response.json();
  return result.data;
};

/**
 * Get all recycling requests for current patient
 */
export const getPatientRecyclingRequests = async (patientId: string): Promise<RecyclingRequest[]> => {
  const response = await fetch(`${API_BASE_URL}/api/recycling/patient/${patientId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch recycling requests');
  }

  const result = await response.json();
  return result.data || [];
};

/**
 * Get specific recycling request details
 */
export const getRecyclingRequest = async (requestId: string): Promise<RecyclingRequest> => {
  const response = await fetch(`${API_BASE_URL}/api/recycling/${requestId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch recycling request');
  }

  const result = await response.json();
  return result.data;
};

/**
 * Cancel a recycling request
 */
export const cancelRecyclingRequest = async (requestId: string): Promise<RecyclingRequest> => {
  const response = await fetch(`${API_BASE_URL}/api/recycling/${requestId}/cancel`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to cancel recycling request');
  }

  const result = await response.json();
  return result.data;
};

export default {
  createRecyclingRequest,
  getPatientRecyclingRequests,
  getRecyclingRequest,
  cancelRecyclingRequest,
};
