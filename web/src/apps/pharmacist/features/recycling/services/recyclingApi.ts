/**
 * Recycling API Service (Pharmacist App)
 * Handles all API calls for medication recycling management
 * T5-052: Medication Return/Recycling Feature
 */

import type { RecyclingRequest } from '../types/recycling.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Get authentication headers
 */
const getAuthHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
});

/**
 * Get all recycling requests for a pharmacy
 */
export const getPharmacyRecyclingRequests = async (pharmacyId: string): Promise<RecyclingRequest[]> => {
  const response = await fetch(`${API_BASE_URL}/api/recycling/pharmacy/${pharmacyId}`, {
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
 * Assign a driver to a recycling request
 */
export const assignDriver = async (requestId: string, driverId: string): Promise<RecyclingRequest> => {
  const response = await fetch(`${API_BASE_URL}/api/recycling/${requestId}/assign-driver`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ driverId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to assign driver');
  }

  const result = await response.json();
  return result.data;
};

/**
 * Record medication collection by driver
 */
export const recordCollection = async (requestId: string, driverId: string): Promise<RecyclingRequest> => {
  const response = await fetch(`${API_BASE_URL}/api/recycling/${requestId}/collect`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ driverId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to record collection');
  }

  const result = await response.json();
  return result.data;
};

/**
 * Process collected medications
 */
export const processCollection = async (requestId: string): Promise<RecyclingRequest> => {
  const response = await fetch(`${API_BASE_URL}/api/recycling/${requestId}/process`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to process collection');
  }

  const result = await response.json();
  return result.data;
};

/**
 * Cancel a recycling request
 */
export const cancelRequest = async (requestId: string): Promise<RecyclingRequest> => {
  const response = await fetch(`${API_BASE_URL}/api/recycling/${requestId}/cancel`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to cancel request');
  }

  const result = await response.json();
  return result.data;
};

export default {
  getPharmacyRecyclingRequests,
  getRecyclingRequest,
  assignDriver,
  recordCollection,
  processCollection,
  cancelRequest,
};
