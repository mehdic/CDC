/**
 * useAdherence Hook Tests
 * T8-043: Patient Adherence Tracking
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdherence } from '../hooks/useAdherence';
import * as adherenceApi from '../services/adherenceApi';

// Mock the API module
jest.mock('../services/adherenceApi');

const mockAdherenceApi = adherenceApi as jest.Mocked<typeof adherenceApi>;

describe('useAdherence Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
    ],
    upcomingReminders: [],
    recentHistory: [],
  };

  const mockStats = mockDashboardData.stats;
  const mockReminders = [
    {
      id: 'reminder-1',
      medicationId: 'med-123',
      medicationName: 'Paracétamol',
      dosage: '500mg',
      frequency: 'daily' as const,
      timesPerDay: 2,
      reminderTimes: ['08:00', '20:00'],
      notificationEnabled: true,
      startDate: '2025-01-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockHistory = [
    {
      id: 'entry-1',
      medicationId: 'med-123',
      medicationName: 'Paracétamol',
      date: new Date().toISOString().split('T')[0],
      status: 'taken' as const,
      scheduledTime: '08:00',
      actualTime: '08:15',
    },
  ];

  it('should initialize with loading state', () => {
    mockAdherenceApi.getAdherenceDashboard.mockImplementationOnce(
      () => new Promise(() => {})
    );
    mockAdherenceApi.getAdherenceStats.mockImplementationOnce(
      () => new Promise(() => {})
    );

    const { result } = renderHook(() => useAdherence({ patientId: 'patient-1' }));

    expect(result.current.isLoading).toBe(true);
  });

  it('should fetch adherence data on mount', async () => {
    mockAdherenceApi.getAdherenceDashboard.mockResolvedValueOnce(mockDashboardData);
    mockAdherenceApi.getAdherenceStats.mockResolvedValueOnce(mockStats);
    mockAdherenceApi.getReminders.mockResolvedValueOnce(mockReminders);
    mockAdherenceApi.getAdherenceHistory.mockResolvedValueOnce(mockHistory);

    const { result } = renderHook(() => useAdherence({ patientId: 'patient-1' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dashboard).toEqual(mockDashboardData);
    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.medications).toEqual(mockDashboardData.medications);
    expect(result.current.reminders).toEqual(mockReminders);
    expect(result.current.history).toEqual(mockHistory);
  });

  it('should handle fetch error', async () => {
    const errorMessage = 'Failed to fetch adherence data';
    mockAdherenceApi.getAdherenceDashboard.mockRejectedValueOnce(new Error(errorMessage));
    mockAdherenceApi.getAdherenceStats.mockRejectedValueOnce(new Error(errorMessage));
    mockAdherenceApi.getReminders.mockRejectedValueOnce(new Error(errorMessage));
    mockAdherenceApi.getAdherenceHistory.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useAdherence({ patientId: 'patient-1' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toContain(errorMessage);
  });

  it('should clear error when clearError is called', async () => {
    mockAdherenceApi.getAdherenceDashboard.mockRejectedValueOnce(new Error('Test error'));
    mockAdherenceApi.getAdherenceStats.mockRejectedValueOnce(new Error('Test error'));
    mockAdherenceApi.getReminders.mockRejectedValueOnce(new Error('Test error'));
    mockAdherenceApi.getAdherenceHistory.mockRejectedValueOnce(new Error('Test error'));

    const { result } = renderHook(() => useAdherence({ patientId: 'patient-1' }));

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should log adherence successfully', async () => {
    mockAdherenceApi.getAdherenceDashboard.mockResolvedValueOnce(mockDashboardData);
    mockAdherenceApi.getAdherenceStats.mockResolvedValueOnce(mockStats);
    mockAdherenceApi.getReminders.mockResolvedValueOnce(mockReminders);
    mockAdherenceApi.getAdherenceHistory.mockResolvedValueOnce(mockHistory);

    const mockLogResponse = {
      id: 'entry-2',
      medicationId: 'med-123',
      medicationName: 'Paracétamol',
      date: '2025-12-24',
      status: 'taken' as const,
      scheduledTime: '20:00',
      actualTime: '20:05',
    };

    mockAdherenceApi.logAdherence.mockResolvedValueOnce(mockLogResponse);

    const { result } = renderHook(() => useAdherence({ patientId: 'patient-1' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.logAdherence('med-123', 'taken', 'Test note');
    });

    expect(mockAdherenceApi.logAdherence).toHaveBeenCalledWith('patient-1', {
      medicationId: 'med-123',
      date: expect.any(String),
      status: 'taken',
      notes: 'Test note',
    });
  });

  it('should handle log adherence error', async () => {
    mockAdherenceApi.getAdherenceDashboard.mockResolvedValueOnce(mockDashboardData);
    mockAdherenceApi.getAdherenceStats.mockResolvedValueOnce(mockStats);
    mockAdherenceApi.getReminders.mockResolvedValueOnce(mockReminders);
    mockAdherenceApi.getAdherenceHistory.mockResolvedValueOnce(mockHistory);

    mockAdherenceApi.logAdherence.mockRejectedValueOnce(new Error('Failed to log'));

    const { result } = renderHook(() => useAdherence({ patientId: 'patient-1' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.logAdherence('med-123', 'taken');
      } catch (err) {
        // Expected error
      }
    });

    expect(result.current.error).toContain('Failed to log');
  });

  it('should update reminder settings successfully', async () => {
    mockAdherenceApi.getAdherenceDashboard.mockResolvedValueOnce(mockDashboardData);
    mockAdherenceApi.getAdherenceStats.mockResolvedValueOnce(mockStats);
    mockAdherenceApi.getReminders.mockResolvedValueOnce(mockReminders);
    mockAdherenceApi.getAdherenceHistory.mockResolvedValueOnce(mockHistory);

    const updatedReminders = [
      {
        ...mockReminders[0],
        reminderTimes: ['09:00', '21:00'],
      },
    ];

    mockAdherenceApi.updateReminderSettings.mockResolvedValueOnce(updatedReminders[0]);
    mockAdherenceApi.getReminders.mockResolvedValueOnce(updatedReminders);

    const { result } = renderHook(() => useAdherence({ patientId: 'patient-1' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateReminderSettings('reminder-1', true, ['09:00', '21:00']);
    });

    expect(mockAdherenceApi.updateReminderSettings).toHaveBeenCalled();
  });

  it('should acknowledge reminder successfully', async () => {
    mockAdherenceApi.getAdherenceDashboard.mockResolvedValueOnce(mockDashboardData);
    mockAdherenceApi.getAdherenceStats.mockResolvedValueOnce(mockStats);
    mockAdherenceApi.getReminders.mockResolvedValueOnce(mockReminders);
    mockAdherenceApi.getAdherenceHistory.mockResolvedValueOnce(mockHistory);

    mockAdherenceApi.acknowledgeReminder.mockResolvedValueOnce({
      ...mockHistory[0],
      acknowledgedAt: new Date().toISOString(),
    });

    const { result } = renderHook(() => useAdherence({ patientId: 'patient-1' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialHistoryLength = result.current.history.length;

    await act(async () => {
      await result.current.acknowledgeReminder('entry-1');
    });

    expect(mockAdherenceApi.acknowledgeReminder).toHaveBeenCalledWith('entry-1');
  });

  it('should refetch data when refetch is called', async () => {
    mockAdherenceApi.getAdherenceDashboard.mockResolvedValueOnce(mockDashboardData);
    mockAdherenceApi.getAdherenceStats.mockResolvedValueOnce(mockStats);
    mockAdherenceApi.getReminders.mockResolvedValueOnce(mockReminders);
    mockAdherenceApi.getAdherenceHistory.mockResolvedValueOnce(mockHistory);

    const { result } = renderHook(() => useAdherence({ patientId: 'patient-1' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCallCount = mockAdherenceApi.getAdherenceDashboard.mock.calls.length;

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockAdherenceApi.getAdherenceDashboard.mock.calls.length).toBeGreaterThan(
      initialCallCount
    );
  });

  it('should use correct patient ID in API calls', async () => {
    mockAdherenceApi.getAdherenceDashboard.mockResolvedValueOnce(mockDashboardData);
    mockAdherenceApi.getAdherenceStats.mockResolvedValueOnce(mockStats);
    mockAdherenceApi.getReminders.mockResolvedValueOnce(mockReminders);
    mockAdherenceApi.getAdherenceHistory.mockResolvedValueOnce(mockHistory);

    const patientId = 'patient-999';
    renderHook(() => useAdherence({ patientId }));

    await waitFor(() => {
      expect(mockAdherenceApi.getAdherenceDashboard).toHaveBeenCalledWith(patientId);
      expect(mockAdherenceApi.getAdherenceStats).toHaveBeenCalledWith(patientId);
      expect(mockAdherenceApi.getReminders).toHaveBeenCalledWith(patientId);
      expect(mockAdherenceApi.getAdherenceHistory).toHaveBeenCalledWith(patientId);
    });
  });
});
