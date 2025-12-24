/**
 * Medication Reminders Component Tests
 * T8-043: Patient Adherence Tracking
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MedicationReminders } from '../components/MedicationReminders';

// Mock the hook
jest.mock('../hooks/useAdherence');

import { useAdherence } from '../hooks/useAdherence';

const mockUseAdherence = useAdherence as jest.MockedFunction<typeof useAdherence>;

describe('MedicationReminders', () => {
  const mockHookReturn = {
    dashboard: null,
    stats: null,
    medications: [],
    reminders: [],
    history: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
    logAdherence: jest.fn(),
    updateReminderSettings: jest.fn(),
    acknowledgeReminder: jest.fn(),
    clearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAdherence.mockReturnValue(mockHookReturn);
  });

  it('should render loading state', () => {
    mockUseAdherence.mockReturnValueOnce({
      ...mockHookReturn,
      isLoading: true,
    });

    render(<MedicationReminders patientId="patient-1" />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display reminders title', () => {
    render(<MedicationReminders patientId="patient-1" />);

    expect(screen.getByText(/Rappels de médicaments/i)).toBeInTheDocument();
  });

  it('should display empty state when no reminders', () => {
    mockUseAdherence.mockReturnValueOnce({
      ...mockHookReturn,
      reminders: [],
    });

    render(<MedicationReminders patientId="patient-1" />);

    expect(screen.getByText(/Aucun rappel configuré/i)).toBeInTheDocument();
  });

  it('should display error message on error', () => {
    const errorMessage = 'Failed to fetch reminders';
    mockUseAdherence.mockReturnValueOnce({
      ...mockHookReturn,
      error: errorMessage,
    });

    render(<MedicationReminders patientId="patient-1" />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should pass patientId to useAdherence hook', () => {
    render(<MedicationReminders patientId="patient-999" />);

    expect(mockUseAdherence).toHaveBeenCalledWith({
      patientId: 'patient-999',
    });
  });

  it('should render MedicationReminders component without crashing', () => {
    const { container } = render(<MedicationReminders patientId="patient-1" />);

    expect(container).toBeInTheDocument();
  });
});
