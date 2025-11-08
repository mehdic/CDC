/**
 * Teleconsultation API Service - Patient App
 * Client for teleconsultation endpoints
 * Task: T160
 */

import { apiClient } from './apiClient';

export interface AvailabilityParams {
  pharmacist_id?: string;
  start_date?: string;
  days?: number;
}

export interface BookingParams {
  pharmacist_id: string;
  scheduled_at: string;
  duration_minutes?: number;
  recording_consent?: boolean;
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

class TeleconsultationService {
  /**
   * Get available time slots for teleconsultations
   */
  async getAvailability(params: AvailabilityParams) {
    const response = await apiClient.get('/teleconsultations/availability', {
      params,
    });
    return response.data;
  }

  /**
   * Book a new teleconsultation
   */
  async book(params: BookingParams) {
    const response = await apiClient.post('/teleconsultations', params);
    return response.data;
  }

  /**
   * Join a video call (get Twilio access token)
   */
  async join(teleconsultationId: string): Promise<JoinResponse> {
    const response = await apiClient.get(
      `/teleconsultations/${teleconsultationId}/join`
    );
    return response.data;
  }

  /**
   * Get list of upcoming teleconsultations
   */
  async getUpcoming() {
    const response = await apiClient.get('/teleconsultations', {
      params: { status: 'scheduled' },
    });
    return response.data;
  }

  /**
   * Cancel a teleconsultation
   */
  async cancel(teleconsultationId: string, reason: string) {
    const response = await apiClient.post(
      `/teleconsultations/${teleconsultationId}/cancel`,
      { reason }
    );
    return response.data;
  }
}

export const teleconsultationService = new TeleconsultationService();
