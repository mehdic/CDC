/**
 * Tests for VideoCallScreen
 * Task: T8-003
 */

import React from 'react';
import { Alert } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { request, RESULTS } from 'react-native-permissions';

import VideoCallScreen from '../VideoCallScreen';
import { teleconsultationService } from '../../services/teleconsultationService';

// Mock dependencies
jest.mock('../../services/teleconsultationService');
jest.mock('react-native-permissions');
jest.mock('../../../shared/components/TwilioVideo', () => 'TwilioVideoComponent');
jest.mock('../../../shared/components/VideoControls', () => 'VideoControls');

// Mock navigation
const mockGoBack = jest.fn();
const mockRoute = {
  params: {
    teleconsultationId: 'test_123',
  },
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
  useRoute: () => mockRoute,
}));

const mockedRequest = request as jest.MockedFunction<typeof request>;
const mockedTeleconsultationService = teleconsultationService as jest.Mocked<
  typeof teleconsultationService
>;

describe('VideoCallScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Alert.alert = jest.fn();
  });

  describe('Permission Handling', () => {
    it('should request camera and microphone permissions on mount', async () => {
      mockedRequest.mockResolvedValue(RESULTS.GRANTED);
      mockedTeleconsultationService.join.mockResolvedValue({
        access_token: 'token_123',
        room_sid: 'RM123',
        room_name: 'room_123',
        participant_identity: 'patient_456',
        participant_role: 'patient',
        recording_consent: true,
        consultation: {
          id: 'test_123',
          scheduled_at: '2025-12-09T10:00:00Z',
          duration_minutes: 30,
          status: 'scheduled',
        },
      });

      render(<VideoCallScreen />);

      await waitFor(() => {
        expect(mockedRequest).toHaveBeenCalledTimes(2); // Camera + Microphone
      });
    });

    it('should show audio-only alert if camera permission denied', async () => {
      mockedRequest
        .mockResolvedValueOnce(RESULTS.DENIED) // Camera denied
        .mockResolvedValueOnce(RESULTS.GRANTED); // Microphone granted

      render(<VideoCallScreen />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Camera Permission Denied',
          'You can continue with audio-only mode.',
          expect.any(Array)
        );
      });
    });

    it('should show error and go back if all permissions denied', async () => {
      mockedRequest.mockResolvedValue(RESULTS.DENIED);

      render(<VideoCallScreen />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Permissions Required',
          'Camera and microphone access are required for video calls.',
          expect.any(Array)
        );
      });
    });
  });

  describe('Joining Call', () => {
    beforeEach(() => {
      mockedRequest.mockResolvedValue(RESULTS.GRANTED);
    });

    it('should join call successfully with valid token', async () => {
      const mockJoinResponse = {
        access_token: 'token_123',
        room_sid: 'RM123',
        room_name: 'room_123',
        participant_identity: 'patient_456',
        participant_role: 'patient' as const,
        recording_consent: true,
        consultation: {
          id: 'test_123',
          scheduled_at: '2025-12-09T10:00:00Z',
          duration_minutes: 30,
          status: 'scheduled',
        },
      };

      mockedTeleconsultationService.join.mockResolvedValue(mockJoinResponse);

      const { getByTestId } = render(<VideoCallScreen />);

      await waitFor(() => {
        expect(mockedTeleconsultationService.join).toHaveBeenCalledWith('test_123');
      });
    });

    it('should show error and go back if join fails', async () => {
      mockedTeleconsultationService.join.mockRejectedValue(
        new Error('Network error')
      );

      render(<VideoCallScreen />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to join video call');
        expect(mockGoBack).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    beforeEach(() => {
      mockedRequest.mockResolvedValue(RESULTS.GRANTED);
    });

    it('should show loading indicator while requesting permissions', () => {
      const { getByText } = render(<VideoCallScreen />);
      expect(getByText('Requesting permissions...')).toBeTruthy();
    });

    it('should show joining indicator after permissions granted', async () => {
      mockedTeleconsultationService.join.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  access_token: 'token',
                  room_sid: 'RM123',
                  room_name: 'room',
                  participant_identity: 'patient',
                  participant_role: 'patient',
                  recording_consent: true,
                  consultation: {
                    id: '123',
                    scheduled_at: '2025-12-09T10:00:00Z',
                    duration_minutes: 30,
                    status: 'scheduled',
                  },
                }),
              100
            )
          )
      );

      const { getByText } = render(<VideoCallScreen />);

      await waitFor(() => {
        expect(getByText('Joining call...')).toBeTruthy();
      });
    });
  });
});
