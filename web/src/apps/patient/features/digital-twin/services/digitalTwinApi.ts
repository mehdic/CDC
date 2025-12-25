/**
 * Digital Twin API Service
 * Handles HTTP requests to digital-twin-service backend
 */

import axios from 'axios';
import type { DigitalTwinProfile } from '../types/digitalTwin.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3009';

/**
 * Get digital twin profile for a patient
 * @param patientId - Patient UUID
 * @returns Digital twin profile
 */
export async function fetchDigitalTwinProfile(
  patientId: string
): Promise<DigitalTwinProfile> {
  const response = await axios.get<DigitalTwinProfile>(
    `${API_BASE_URL}/api/digital-twin/patients/${patientId}/profile`
  );
  return response.data;
}

/**
 * Force refresh digital twin profile
 * @param patientId - Patient UUID
 * @returns Refreshed digital twin profile
 */
export async function refreshDigitalTwinProfile(
  patientId: string
): Promise<DigitalTwinProfile> {
  const response = await axios.post<DigitalTwinProfile>(
    `${API_BASE_URL}/api/digital-twin/patients/${patientId}/refresh`
  );
  return response.data;
}

/**
 * Get health trends for visualization
 * @param patientId - Patient UUID
 * @returns Historical trend data
 */
export async function fetchHealthTrends(patientId: string): Promise<unknown> {
  const response = await axios.get(
    `${API_BASE_URL}/api/digital-twin/patients/${patientId}/trends`
  );
  return response.data;
}
