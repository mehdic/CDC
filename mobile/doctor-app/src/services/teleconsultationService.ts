/**
 * Teleconsultation API Service - Doctor App
 * Client for teleconsultation endpoints
 * Task: T8-005
 */

import apiClient from './api';

export interface JoinResponse {
  access_token: string;
  room_sid: string;
  room_name: string;
  participant_identity: string;
  participant_role: 'patient' | 'pharmacist' | 'doctor';
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
