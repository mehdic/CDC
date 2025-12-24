/**
 * Adherence API Service Tests
 * T8-043: Patient Adherence Tracking
 */

import * as adherenceApi from '../services/adherenceApi';
import type {
  AdherenceDashboardData,
  MedicationAdherence,
  MedicationReminder,
  DailyAdherenceEntry,
  AdherenceStats,
} from '../types/adherence.types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = jest.fn();

describe('Adherence API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'test-token-123');
  });

  const mockAdherenceStats: AdherenceStats = {
    totalMedicationsActive: 3,
    overallAdherenceRate: 85,
    medicationsWithHighAdherence: 2,
    medicationsWithLowAdherence: 0,
    totalScheduledDoses: 100,
    totalTakenDoses: 85,
    totalMissedDoses: 15,
    consistencyScore: 80,
    trendDirection: 'improving',
    lastUpdated: new Date().toISOString(),
  };

  const mockMedicationAdherence: MedicationAdherence = {
    id: 'med-1',
    medicationId: 'med-123',
    medicationName: 'Paracétamol',
    dosage: '500mg',
    prescribedDate: '2025-01-01',
    startDate: '2025-01-01',
    frequency: 'daily',
    timesPerDay: 2,
    adherenceRate: 90,
    totalScheduled: 50,
    totalTaken: 45,
    totalMissed: 5,
    lastTakenAt: new Date().toISOString(),
    nextScheduledAt: new Date(Date.now() + 3600000).toISOString(),
  };

  const mockMedicationReminder: MedicationReminder = {
    id: 'reminder-1',
    medicationId: 'med-123',
    medicationName: 'Paracétamol',
    dosage: '500mg',
    frequency: 'daily',
    timesPerDay: 2,
    reminderTimes: ['08:00', '20:00'],
    notificationEnabled: true,
    startDate: '2025-01-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockDailyAdherenceEntry: DailyAdherenceEntry = {
    id: 'entry-1',
    medicationId: 'med-123',
    medicationName: 'Paracétamol',
    date: new Date().toISOString().split('T')[0],
    status: 'taken',
    scheduledTime: '08:00',
    actualTime: '08:15',
    acknowledgedAt: new Date().toISOString(),
  };

  const mockDashboard: AdherenceDashboardData = {
    patientId: 'patient-1',
    stats: mockAdherenceStats,
    medications: [mockMedicationAdherence],
    upcomingReminders: [mockMedicationReminder],
    recentHistory: [mockDailyAdherenceEntry],
  };

  describe('getAdherenceDashboard', () => {
    it('should fetch adherence dashboard successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockDashboard }),
      });

      const result = await adherenceApi.getAdherenceDashboard('patient-1');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/adherence/dashboard/patient-1',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
        })
      );

      expect(result).toEqual(mockDashboard);
    });

    it('should throw error when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      await expect(adherenceApi.getAdherenceDashboard('patient-1')).rejects.toThrow(
        'Failed to fetch adherence dashboard'
      );
    });

    it('should throw error when no data returned', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: null }),
      });

      await expect(adherenceApi.getAdherenceDashboard('patient-1')).rejects.toThrow();
    });
  });

  describe('getMedicationAdherence', () => {
    it('should fetch medication adherence successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockMedicationAdherence }),
      });

      const result = await adherenceApi.getMedicationAdherence('med-123');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/adherence/medications/med-123',
        expect.any(Object)
      );

      expect(result).toEqual(mockMedicationAdherence);
    });

    it('should throw error on fetch failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      await expect(adherenceApi.getMedicationAdherence('med-123')).rejects.toThrow();
    });
  });

  describe('getReminders', () => {
    it('should fetch reminders successfully', async () => {
      const reminders = [mockMedicationReminder];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: reminders }),
      });

      const result = await adherenceApi.getReminders('patient-1');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/adherence/reminders/patient-1',
        expect.any(Object)
      );

      expect(result).toEqual(reminders);
    });

    it('should return empty array when no reminders found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: null }),
      });

      const result = await adherenceApi.getReminders('patient-1');

      expect(result).toEqual([]);
    });
  });

  describe('getAdherenceHistory', () => {
    it('should fetch adherence history with date range', async () => {
      const history = [mockDailyAdherenceEntry];
      const startDate = '2025-01-01';
      const endDate = '2025-01-31';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: history }),
      });

      const result = await adherenceApi.getAdherenceHistory('patient-1', startDate, endDate);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/adherence/history/patient-1'),
        expect.any(Object)
      );

      expect(result).toEqual(history);
    });

    it('should fetch without date filters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await adherenceApi.getAdherenceHistory('patient-1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/adherence/history/patient-1'),
        expect.any(Object)
      );
    });
  });

  describe('getAdherenceStats', () => {
    it('should fetch adherence statistics successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockAdherenceStats }),
      });

      const result = await adherenceApi.getAdherenceStats('patient-1');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/adherence/stats/patient-1',
        expect.any(Object)
      );

      expect(result).toEqual(mockAdherenceStats);
    });

    it('should throw error on fetch failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      await expect(adherenceApi.getAdherenceStats('patient-1')).rejects.toThrow();
    });
  });

  describe('logAdherence', () => {
    it('should log adherence successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockDailyAdherenceEntry }),
      });

      const result = await adherenceApi.logAdherence('patient-1', {
        medicationId: 'med-123',
        date: '2025-12-24',
        status: 'taken',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/adherence/log/patient-1',
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Object),
          body: expect.stringContaining('med-123'),
        })
      );

      expect(result).toEqual(mockDailyAdherenceEntry);
    });

    it('should throw error on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid medication' }),
      });

      await expect(
        adherenceApi.logAdherence('patient-1', {
          medicationId: 'invalid',
          date: '2025-12-24',
          status: 'taken',
        })
      ).rejects.toThrow();
    });
  });

  describe('updateReminderSettings', () => {
    it('should update reminder settings successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockMedicationReminder }),
      });

      const result = await adherenceApi.updateReminderSettings('reminder-1', {
        medicationId: 'med-123',
        notificationEnabled: true,
        reminderTimes: ['09:00', '21:00'],
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/adherence/reminders/reminder-1',
        expect.objectContaining({
          method: 'PATCH',
        })
      );

      expect(result).toEqual(mockMedicationReminder);
    });
  });

  describe('acknowledgeReminder', () => {
    it('should acknowledge reminder successfully', async () => {
      const acknowledgedEntry = {
        ...mockDailyAdherenceEntry,
        acknowledgedAt: new Date().toISOString(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: acknowledgedEntry }),
      });

      const result = await adherenceApi.acknowledgeReminder('entry-1');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/adherence/entries/entry-1/acknowledge',
        expect.objectContaining({
          method: 'PATCH',
        })
      );

      expect(result).toEqual(acknowledgedEntry);
    });
  });

  describe('Authentication headers', () => {
    it('should include Bearer token in headers', async () => {
      localStorage.setItem('token', 'my-custom-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockDashboard }),
      });

      await adherenceApi.getAdherenceDashboard('patient-1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-custom-token',
          }),
        })
      );
    });

    it('should handle missing token', async () => {
      localStorage.clear();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockDashboard }),
      });

      await adherenceApi.getAdherenceDashboard('patient-1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer ',
          }),
        })
      );
    });
  });
});
