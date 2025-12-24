/**
 * Adherence History Component Tests
 * T8-043: Patient Adherence Tracking
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { AdherenceHistory } from '../components/AdherenceHistory';

// Mock the hook
jest.mock('../hooks/useAdherence');

import { useAdherence } from '../hooks/useAdherence';

const mockUseAdherence = useAdherence as jest.MockedFunction<typeof useAdherence>;

describe('AdherenceHistory', () => {
  const mockMedications = [
    {
      id: 'med-1',
      medicationId: 'med-123',
      medicationName: 'Paracétamol',
      dosage: '500mg',
      prescribedDate: '2025-01-01',
      startDate: '2025-01-01',
      frequency: 'daily' as const,
      timesPerDay: 2,
      adherenceRate: 90,
      totalScheduled: 50,
      totalTaken: 45,
      totalMissed: 5,
    },
  ];

  const mockHookReturn = {
    dashboard: null,
    stats: null,
    medications: mockMedications,
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

    render(<AdherenceHistory patientId="patient-1" />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display log adherence button', () => {
    render(<AdherenceHistory patientId="patient-1" />);

    expect(screen.getByRole('button', { name: /Enregistrer une prise/i })).toBeInTheDocument();
  });

  it('should display table headers', () => {
    render(<AdherenceHistory patientId="patient-1" />);

    expect(screen.getByRole('columnheader', { name: /Médicament/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Date/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Statut/i })).toBeInTheDocument();
  });

  it('should display empty state when no history', () => {
    mockUseAdherence.mockReturnValueOnce({
      ...mockHookReturn,
      history: [],
    });

    render(<AdherenceHistory patientId="patient-1" />);

    expect(
      screen.getByText(/Aucun enregistrement d'adhésion trouvé/i)
    ).toBeInTheDocument();
  });

  it('should display error message on error', () => {
    const errorMessage = 'Failed to fetch history';
    mockUseAdherence.mockReturnValueOnce({
      ...mockHookReturn,
      error: errorMessage,
    });

    render(<AdherenceHistory patientId="patient-1" />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should pass patientId to useAdherence hook', () => {
    render(<AdherenceHistory patientId="patient-999" />);

    expect(mockUseAdherence).toHaveBeenCalledWith({
      patientId: 'patient-999',
    });
  });

  it('should render AdherenceHistory component without crashing', () => {
    const { container } = render(<AdherenceHistory patientId="patient-1" />);

    expect(container).toBeInTheDocument();
  });
});
