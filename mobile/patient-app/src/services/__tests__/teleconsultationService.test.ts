/**
 * Tests for Teleconsultation Service
 * Task: T8-003
 */

import { apiClient } from '../apiClient';
import { teleconsultationService, JoinResponse } from '../teleconsultationService';

// Mock apiClient
jest.mock('../apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('TeleconsultationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('join', () => {
    it('should successfully join a teleconsultation', async () => {
      const mockResponse: JoinResponse = {
        access_token: 'mock_twilio_token',
        room_sid: 'RM123456',
        room_name: 'consultation_123',
        participant_identity: 'patient_456',
        participant_role: 'patient',
        recording_consent: true,
        consultation: {
          id: '123',
          scheduled_at: '2025-12-09T10:00:00Z',
          duration_minutes: 30,
          status: 'scheduled',
        },
      };

      mockedApiClient.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await teleconsultationService.join('123');

      expect(mockedApiClient.get).toHaveBeenCalledWith('/teleconsultations/123/join');
      expect(result).toEqual(mockResponse);
      expect(result.access_token).toBe('mock_twilio_token');
      expect(result.room_name).toBe('consultation_123');
    });

    it('should throw error when join fails', async () => {
      mockedApiClient.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(teleconsultationService.join('123')).rejects.toThrow('Network error');
    });
  });

  describe('getAvailability', () => {
    it('should fetch availability slots', async () => {
      const mockSlots = [
        { start_time: '2025-12-09T10:00:00Z', end_time: '2025-12-09T10:30:00Z' },
        { start_time: '2025-12-09T11:00:00Z', end_time: '2025-12-09T11:30:00Z' },
      ];

      mockedApiClient.get.mockResolvedValueOnce({ data: mockSlots });

      const result = await teleconsultationService.getAvailability({
        pharmacist_id: 'pharm_123',
        start_date: '2025-12-09',
      });

      expect(mockedApiClient.get).toHaveBeenCalledWith('/teleconsultations/availability', {
        params: { pharmacist_id: 'pharm_123', start_date: '2025-12-09' },
      });
      expect(result).toEqual(mockSlots);
    });
  });

  describe('book', () => {
    it('should book a teleconsultation', async () => {
      const bookingParams = {
        pharmacist_id: 'pharm_123',
        scheduled_at: '2025-12-09T10:00:00Z',
        duration_minutes: 30,
        recording_consent: true,
      };

      const mockBooking = {
        id: 'consult_789',
        ...bookingParams,
        status: 'scheduled',
      };

      mockedApiClient.post.mockResolvedValueOnce({ data: mockBooking });

      const result = await teleconsultationService.book(bookingParams);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/teleconsultations', bookingParams);
      expect(result).toEqual(mockBooking);
    });
  });

  describe('cancel', () => {
    it('should cancel a teleconsultation', async () => {
      const mockResponse = {
        success: true,
        message: 'Consultation cancelled',
      };

      mockedApiClient.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await teleconsultationService.cancel('123', 'Patient unavailable');

      expect(mockedApiClient.post).toHaveBeenCalledWith('/teleconsultations/123/cancel', {
        reason: 'Patient unavailable',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getUpcoming', () => {
    it('should fetch upcoming consultations', async () => {
      const mockConsultations = [
        {
          id: '1',
          scheduled_at: '2025-12-09T10:00:00Z',
          pharmacist: { name: 'Dr. Smith' },
          status: 'scheduled',
        },
        {
          id: '2',
          scheduled_at: '2025-12-10T14:00:00Z',
          pharmacist: { name: 'Dr. Johnson' },
          status: 'scheduled',
        },
      ];

      mockedApiClient.get.mockResolvedValueOnce({ data: mockConsultations });

      const result = await teleconsultationService.getUpcoming();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/teleconsultations', {
        params: { status: 'scheduled' },
      });
      expect(result).toEqual(mockConsultations);
      expect(result).toHaveLength(2);
    });
  });
});
