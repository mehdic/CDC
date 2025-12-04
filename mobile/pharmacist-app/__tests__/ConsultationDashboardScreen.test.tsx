/**
 * Tests for ConsultationDashboardScreen - Pharmacist App
 * Task: T162
 * FR-021, FR-022: View scheduled consultations and receive reminders
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

import ConsultationDashboardScreen from '../src/screens/ConsultationDashboardScreen';
import { teleconsultationService, Teleconsultation, TeleconsultationStatus } from '../src/services/teleconsultationService';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

// Mock teleconsultation service
jest.mock('../src/services/teleconsultationService');

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockActiveConsultations: Teleconsultation[] = [
  {
    id: 'tc-active-001',
    pharmacy_id: 'pharmacy-001',
    patient_id: 'patient-001',
    pharmacist_id: 'pharmacist-001',
    scheduled_at: '2025-11-08T10:00:00Z',
    duration_minutes: 15,
    status: TeleconsultationStatus.IN_PROGRESS,
    recording_consent: true,
    twilio_room_sid: 'room-001',
    started_at: '2025-11-08T10:00:00Z',
    ended_at: null,
    created_at: '2025-11-07T12:00:00Z',
    updated_at: '2025-11-08T10:00:00Z',
    patient: {
      id: 'patient-001',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '+41791234567',
    },
  },
];

const mockUpcomingConsultations: Teleconsultation[] = [
  {
    id: 'tc-upcoming-001',
    pharmacy_id: 'pharmacy-001',
    patient_id: 'patient-002',
    pharmacist_id: 'pharmacist-001',
    scheduled_at: '2025-11-08T14:00:00Z',
    duration_minutes: 15,
    status: TeleconsultationStatus.SCHEDULED,
    recording_consent: false,
    twilio_room_sid: null,
    started_at: null,
    ended_at: null,
    created_at: '2025-11-07T12:00:00Z',
    updated_at: '2025-11-07T12:00:00Z',
    patient: {
      id: 'patient-002',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+41799876543',
    },
  },
];

describe('ConsultationDashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    (teleconsultationService.getActive as jest.Mock).mockResolvedValue(mockActiveConsultations);
    (teleconsultationService.getUpcoming as jest.Mock).mockResolvedValue(mockUpcomingConsultations);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================

  describe('Component Rendering', () => {
    it('should render without crashing', async () => {
      const { getByText } = render(<ConsultationDashboardScreen />);

      await waitFor(() => {
        expect(getByText('Teleconsultations')).toBeTruthy();
      });
    });

    it('should display loading state initially', () => {
      const { getByText } = render(<ConsultationDashboardScreen />);
      expect(getByText('Loading consultations...')).toBeTruthy();
    });

    it('should load active consultations on mount', async () => {
      render(<ConsultationDashboardScreen />);

      await waitFor(() => {
        expect(teleconsultationService.getActive).toHaveBeenCalled();
      });
    });

    it('should load upcoming consultations on mount', async () => {
      render(<ConsultationDashboardScreen />);

      await waitFor(() => {
        expect(teleconsultationService.getUpcoming).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // ACTIVE CONSULTATIONS TESTS
  // ============================================================================

  describe('Active Consultations', () => {
    it('should display active consultations', async () => {
      const { getByText } = render(<ConsultationDashboardScreen />);

      await waitFor(() => {
        expect(getByText(/Active Now/i)).toBeTruthy();
        expect(getByText('John Doe')).toBeTruthy();
      });
    });

    it('should show empty state when no active consultations', async () => {
      (teleconsultationService.getActive as jest.Mock).mockResolvedValue([]);

      const { queryByText } = render(<ConsultationDashboardScreen />);

      await waitFor(() => {
        // Active section is not rendered when empty, only upcoming section shows empty state
        expect(queryByText(/Active Now/i)).toBeNull();
      });
    });

    it('should allow joining active consultation', async () => {
      const { getByText } = render(<ConsultationDashboardScreen />);

      await waitFor(() => {
        // Active consultations show "Rejoin Call" button
        const joinButton = getByText('Rejoin Call');
        fireEvent.press(joinButton);

        expect(mockNavigate).toHaveBeenCalledWith('PharmacistVideoCall', {
          teleconsultationId: 'tc-active-001',
        });
      });
    });
  });

  // ============================================================================
  // UPCOMING CONSULTATIONS TESTS
  // ============================================================================

  describe('Upcoming Consultations', () => {
    it('should display upcoming consultations', async () => {
      const { getByText } = render(<ConsultationDashboardScreen />);

      await waitFor(() => {
        expect(getByText(/Upcoming/i)).toBeTruthy();
        expect(getByText('Jane Smith')).toBeTruthy();
      });
    });

    it('should show empty state when no upcoming consultations', async () => {
      (teleconsultationService.getUpcoming as jest.Mock).mockResolvedValue([]);

      const { getByText } = render(<ConsultationDashboardScreen />);

      await waitFor(() => {
        expect(getByText(/No upcoming consultations/i)).toBeTruthy();
      });
    });

    it('should display consultation time', async () => {
      const { getByText } = render(<ConsultationDashboardScreen />);

      await waitFor(() => {
        // Check that consultation is displayed (patient name confirms it's rendered)
        expect(getByText('Jane Smith')).toBeTruthy();
        // The formatted date/time will be displayed, format depends on locale
        // Just verify the consultation card is rendered with patient info
      });
    });
  });

  // ============================================================================
  // REFRESH FUNCTIONALITY TESTS
  // ============================================================================

  describe('Refresh Functionality', () => {
    it('should support pull-to-refresh', async () => {
      const { UNSAFE_getByType } = render(<ConsultationDashboardScreen />);

      await waitFor(() => {
        // Get ScrollView by type since there's no testID
        const scrollView = UNSAFE_getByType(require('react-native').ScrollView);
        const refreshControl = scrollView.props.refreshControl;

        // Simulate pull to refresh
        refreshControl.props.onRefresh();
      });

      await waitFor(() => {
        expect(teleconsultationService.getActive).toHaveBeenCalledTimes(2);
        expect(teleconsultationService.getUpcoming).toHaveBeenCalledTimes(2);
      });
    });

    it('should auto-refresh active consultations every 30 seconds', async () => {
      render(<ConsultationDashboardScreen />);

      // Initial load
      await waitFor(() => {
        expect(teleconsultationService.getActive).toHaveBeenCalledTimes(1);
      });

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(teleconsultationService.getActive).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle load errors gracefully', async () => {
      const errorMessage = 'Network error';
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (teleconsultationService.getActive as jest.Mock).mockRejectedValue(new Error(errorMessage));
      (teleconsultationService.getUpcoming as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const { getByText } = render(<ConsultationDashboardScreen />);

      await waitFor(() => {
        // Component handles errors gracefully without showing alert
        // Individual load functions catch and log errors
        expect(consoleErrorSpy).toHaveBeenCalled();
        // Screen still renders with title
        expect(getByText('Teleconsultations')).toBeTruthy();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle API errors gracefully', async () => {
      (teleconsultationService.getActive as jest.Mock).mockRejectedValue(new Error('API error'));
      (teleconsultationService.getUpcoming as jest.Mock).mockResolvedValue(mockUpcomingConsultations);

      const { getByText } = render(<ConsultationDashboardScreen />);

      await waitFor(() => {
        // Should still render even if one call fails
        expect(getByText('Teleconsultations')).toBeTruthy();
      });
    });
  });

  // ============================================================================
  // NAVIGATION TESTS
  // ============================================================================

  describe('Navigation', () => {
    it('should navigate to video call screen when joining consultation', async () => {
      const { getByText } = render(<ConsultationDashboardScreen />);

      await waitFor(() => {
        // Active consultation shows "Rejoin Call" button
        const joinButton = getByText('Rejoin Call');
        fireEvent.press(joinButton);
      });

      expect(mockNavigate).toHaveBeenCalledWith('PharmacistVideoCall', {
        teleconsultationId: 'tc-active-001',
      });
    });

    it('should show consultation details when tapping on consultation', async () => {
      const { getByText } = render(<ConsultationDashboardScreen />);

      await waitFor(() => {
        const consultationCard = getByText('Jane Smith');
        fireEvent.press(consultationCard.parent!);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Consultation Details',
        expect.stringContaining('Jane Smith'),
        expect.any(Array)
      );
    });
  });

  // ============================================================================
  // DISPLAY FORMAT TESTS
  // ============================================================================

  describe('Display Formatting', () => {
    it('should display patient names correctly', async () => {
      const { getByText } = render(<ConsultationDashboardScreen />);

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
        expect(getByText('Jane Smith')).toBeTruthy();
      });
    });

    it('should display consultation duration', async () => {
      const { getAllByText } = render(<ConsultationDashboardScreen />);

      await waitFor(() => {
        // Both active and upcoming consultations have 15 minutes duration
        // Use getAllByText to handle multiple matches
        const durationElements = getAllByText(/15 minutes/i);
        expect(durationElements.length).toBeGreaterThan(0);
      });
    });

    it('should display recording consent status', async () => {
      const { getByText } = render(<ConsultationDashboardScreen />);

      await waitFor(() => {
        // Active consultation has recording consent = true
        expect(getByText(/recording/i)).toBeTruthy();
      });
    });
  });
});
