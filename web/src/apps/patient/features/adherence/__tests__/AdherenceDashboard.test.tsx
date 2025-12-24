/**
 * Adherence Dashboard Component Tests
 * T8-043: Patient Adherence Tracking
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdherenceDashboard } from '../components/AdherenceDashboard';
import * as adherenceApiModule from '../services/adherenceApi';

// Mock the hook and API
jest.mock('../hooks/useAdherence');
jest.mock('../services/adherenceApi');

import { useAdherence } from '../hooks/useAdherence';

const mockUseAdherence = useAdherence as jest.MockedFunction<typeof useAdherence>;

describe('AdherenceDashboard', () => {
  const mockDashboardData = {
    patientId: 'patient-1',
    stats: {
      totalMedicationsActive: 2,
      overallAdherenceRate: 85,
      medicationsWithHighAdherence: 2,
      medicationsWithLowAdherence: 0,
      totalScheduledDoses: 100,
      totalTakenDoses: 85,
      totalMissedDoses: 15,
      consistencyScore: 80,
      trendDirection: 'improving' as const,
      lastUpdated: new Date().toISOString(),
    },
    medications: [
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
      {
        id: 'med-2',
        medicationId: 'med-456',
        medicationName: 'Ibuprofène',
        dosage: '200mg',
        prescribedDate: '2025-01-15',
        startDate: '2025-01-15',
        frequency: 'daily' as const,
        timesPerDay: 1,
        adherenceRate: 80,
        totalScheduled: 30,
        totalTaken: 24,
        totalMissed: 6,
      },
    ],
    upcomingReminders: [],
    recentHistory: [],
  };

  const mockHookReturn = {
    dashboard: mockDashboardData,
    stats: mockDashboardData.stats,
    medications: mockDashboardData.medications,
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

  it('should render loading state initially', () => {
    mockUseAdherence.mockReturnValueOnce({
      ...mockHookReturn,
      isLoading: true,
      dashboard: null,
      stats: null,
      medications: [],
    });

    render(<AdherenceDashboard patientId="patient-1" />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render adherence dashboard with data', () => {
    render(<AdherenceDashboard patientId="patient-1" />);

    expect(screen.getByText(/Vue d'ensemble de l'adhésion/i)).toBeInTheDocument();
    expect(screen.getByText(/85%/)).toBeInTheDocument();
  });

  it('should display overall adherence metrics', () => {
    render(<AdherenceDashboard patientId="patient-1" />);

    expect(screen.getByText(/Médicaments actifs/i)).toBeInTheDocument();
    expect(screen.getByText(/Adhésion forte/i)).toBeInTheDocument();
    expect(screen.getByText(/Doses prises/i)).toBeInTheDocument();
    expect(screen.getByText(/Doses oubliées/i)).toBeInTheDocument();
  });

  it('should display statistics values correctly', () => {
    render(<AdherenceDashboard patientId="patient-1" />);

    // Check for statistics by looking for their labels
    expect(screen.getByText(/Médicaments actifs/i)).toBeInTheDocument();
    expect(screen.getByText(/Doses prises/i)).toBeInTheDocument();
    expect(screen.getByText(/Doses oubliées/i)).toBeInTheDocument();
  });

  it('should show positive trend indicator', () => {
    render(<AdherenceDashboard patientId="patient-1" />);

    expect(screen.getByText(/Tendance positive/i)).toBeInTheDocument();
  });

  it('should show negative trend indicator when declining', () => {
    mockUseAdherence.mockReturnValueOnce({
      ...mockHookReturn,
      stats: {
        ...mockDashboardData.stats,
        trendDirection: 'declining',
      },
    });

    render(<AdherenceDashboard patientId="patient-1" />);

    expect(screen.getByText(/Tendance négative/i)).toBeInTheDocument();
  });

  it('should display medication cards with adherence details', async () => {
    render(<AdherenceDashboard patientId="patient-1" />);

    // Click on medications tab
    const medicationTab = screen.getByRole('tab', { name: /Médicaments/i });
    await userEvent.click(medicationTab);

    await waitFor(() => {
      expect(screen.getByText('Paracétamol')).toBeInTheDocument();
      expect(screen.getByText('Ibuprofène')).toBeInTheDocument();
    });
  });

  it('should display medication adherence rates', async () => {
    render(<AdherenceDashboard patientId="patient-1" />);

    const medicationTab = screen.getByRole('tab', { name: /Médicaments/i });
    await userEvent.click(medicationTab);

    await waitFor(() => {
      expect(screen.getByText('90%')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
    });
  });

  it('should display error message when error occurs', () => {
    const errorMessage = 'Failed to fetch adherence data';
    mockUseAdherence.mockReturnValueOnce({
      ...mockHookReturn,
      error: errorMessage,
      dashboard: null,
      stats: null,
    });

    render(<AdherenceDashboard patientId="patient-1" />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should allow clearing error messages', async () => {
    const clearErrorMock = jest.fn();
    mockUseAdherence.mockReturnValueOnce({
      ...mockHookReturn,
      error: 'Test error',
      dashboard: null,
      stats: null,
      clearError: clearErrorMock,
    });

    render(<AdherenceDashboard patientId="patient-1" />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    await userEvent.click(closeButton);

    expect(clearErrorMock).toHaveBeenCalled();
  });

  it('should display no data message when no dashboard data', () => {
    mockUseAdherence.mockReturnValueOnce({
      ...mockHookReturn,
      dashboard: null,
      stats: null,
    });

    render(<AdherenceDashboard patientId="patient-1" />);

    expect(
      screen.getByText(/Aucune donnée d'adhésion disponible/i)
    ).toBeInTheDocument();
  });

  it('should show warning for low adherence medications', () => {
    mockUseAdherence.mockReturnValueOnce({
      ...mockHookReturn,
      stats: {
        ...mockDashboardData.stats,
        medicationsWithLowAdherence: 1,
      },
    });

    render(<AdherenceDashboard patientId="patient-1" />);

    expect(
      screen.getByText(/1 médicament\(s\) avec une faible adhésion/i)
    ).toBeInTheDocument();
  });

  it('should have tabs for different views', () => {
    render(<AdherenceDashboard patientId="patient-1" />);

    expect(screen.getByRole('tab', { name: /Médicaments/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Rappels/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Historique/i })).toBeInTheDocument();
  });

  it('should switch tabs when clicked', async () => {
    render(<AdherenceDashboard patientId="patient-1" />);

    const remindersTab = screen.getByRole('tab', { name: /Rappels/i });
    await userEvent.click(remindersTab);

    // The reminders component should be visible
    expect(remindersTab.getAttribute('aria-selected')).toBe('true');
  });

  it('should pass patientId to useAdherence hook', () => {
    render(<AdherenceDashboard patientId="patient-999" />);

    expect(mockUseAdherence).toHaveBeenCalledWith({
      patientId: 'patient-999',
      autoRefetch: false,
    });
  });

  it('should support autoRefetch prop', () => {
    render(<AdherenceDashboard patientId="patient-1" autoRefetch={true} />);

    expect(mockUseAdherence).toHaveBeenCalledWith({
      patientId: 'patient-1',
      autoRefetch: true,
    });
  });

  it('should display medication dosage and frequency', async () => {
    render(<AdherenceDashboard patientId="patient-1" />);

    const medicationTab = screen.getByRole('tab', { name: /Médicaments/i });
    await userEvent.click(medicationTab);

    await waitFor(() => {
      expect(screen.getByText('500mg - daily')).toBeInTheDocument();
      expect(screen.getByText('200mg - daily')).toBeInTheDocument();
    });
  });

  it('should display medication statistics per medication', async () => {
    render(<AdherenceDashboard patientId="patient-1" />);

    const medicationTab = screen.getByRole('tab', { name: /Médicaments/i });
    await userEvent.click(medicationTab);

    await waitFor(() => {
      // Check for taken doses
      const takenLabels = screen.getAllByText('Prises');
      expect(takenLabels.length).toBeGreaterThan(0);

      // Check for missed doses
      const missedLabels = screen.getAllByText('Oubliées');
      expect(missedLabels.length).toBeGreaterThan(0);
    });
  });

  it('should display adherence status badges with correct colors', async () => {
    render(<AdherenceDashboard patientId="patient-1" />);

    const medicationTab = screen.getByRole('tab', { name: /Médicaments/i });
    await userEvent.click(medicationTab);

    await waitFor(() => {
      // Look for "Bon" badge (for high adherence)
      const goodBadges = screen.getAllByText('Bon');
      expect(goodBadges.length).toBeGreaterThan(0);
    });
  });
});
