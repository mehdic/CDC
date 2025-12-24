/**
 * useAdherence Hook
 * Custom hook for managing adherence data and operations
 * T8-043: Patient Adherence Tracking
 */

import { useState, useEffect, useCallback } from 'react';
import * as adherenceApi from '../services/adherenceApi';
import type {
  AdherenceDashboardData,
  MedicationAdherence,
  MedicationReminder,
  DailyAdherenceEntry,
  AdherenceStats,
} from '../types/adherence.types';

interface UseAdherenceOptions {
  patientId: string;
  autoRefetch?: boolean;
  refetchInterval?: number; // milliseconds
}

interface UseAdherenceReturn {
  // Data
  dashboard: AdherenceDashboardData | null;
  stats: AdherenceStats | null;
  medications: MedicationAdherence[];
  reminders: MedicationReminder[];
  history: DailyAdherenceEntry[];

  // Loading and error states
  isLoading: boolean;
  error: string | null;

  // Actions
  refetch: () => Promise<void>;
  logAdherence: (medicationId: string, status: 'taken' | 'missed', notes?: string) => Promise<void>;
  updateReminderSettings: (reminderId: string, enabled: boolean, times?: string[]) => Promise<void>;
  acknowledgeReminder: (entryId: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing adherence data
 */
export const useAdherence = ({
  patientId,
  autoRefetch = false,
  refetchInterval = 5 * 60 * 1000, // 5 minutes default
}: UseAdherenceOptions): UseAdherenceReturn => {
  const [dashboard, setDashboard] = useState<AdherenceDashboardData | null>(null);
  const [stats, setStats] = useState<AdherenceStats | null>(null);
  const [medications, setMedications] = useState<MedicationAdherence[]>([]);
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const [history, setHistory] = useState<DailyAdherenceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all adherence data
  const fetchAdherenceData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [dashboardData, statsData, remindersData, historyData] = await Promise.all([
        adherenceApi.getAdherenceDashboard(patientId),
        adherenceApi.getAdherenceStats(patientId),
        adherenceApi.getReminders(patientId),
        adherenceApi.getAdherenceHistory(patientId),
      ]);

      setDashboard(dashboardData);
      setStats(statsData);
      setMedications(dashboardData.medications || []);
      setReminders(remindersData);
      setHistory(historyData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch adherence data';
      setError(errorMessage);
      console.error('Error fetching adherence data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  // Refetch on mount
  useEffect(() => {
    fetchAdherenceData();
  }, [fetchAdherenceData]);

  // Auto-refetch if enabled
  useEffect(() => {
    if (!autoRefetch) return;

    const interval = setInterval(() => {
      fetchAdherenceData();
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [autoRefetch, refetchInterval, fetchAdherenceData]);

  // Log adherence
  const handleLogAdherence = useCallback(
    async (medicationId: string, status: 'taken' | 'missed', notes?: string) => {
      try {
        setError(null);
        await adherenceApi.logAdherence(patientId, {
          medicationId,
          date: new Date().toISOString().split('T')[0],
          status,
          notes,
        });

        // Refetch data after logging
        await fetchAdherenceData();
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to log adherence';
        setError(errorMessage);
        throw err;
      }
    },
    [patientId, fetchAdherenceData]
  );

  // Update reminder settings
  const handleUpdateReminderSettings = useCallback(
    async (reminderId: string, enabled: boolean, times?: string[]) => {
      try {
        setError(null);
        await adherenceApi.updateReminderSettings(reminderId, {
          medicationId: '', // Backend will derive from reminderId
          notificationEnabled: enabled,
          reminderTimes: times,
        });

        // Refetch reminders after update
        const updatedReminders = await adherenceApi.getReminders(patientId);
        setReminders(updatedReminders);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update reminder settings';
        setError(errorMessage);
        throw err;
      }
    },
    [patientId]
  );

  // Acknowledge reminder
  const handleAcknowledgeReminder = useCallback(async (entryId: string) => {
    try {
      setError(null);
      await adherenceApi.acknowledgeReminder(entryId);

      // Update local history
      setHistory((prev) =>
        prev.map((entry) =>
          entry.id === entryId
            ? { ...entry, acknowledgedAt: new Date().toISOString() }
            : entry
        )
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to acknowledge reminder';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    dashboard,
    stats,
    medications,
    reminders,
    history,
    isLoading,
    error,
    refetch: fetchAdherenceData,
    logAdherence: handleLogAdherence,
    updateReminderSettings: handleUpdateReminderSettings,
    acknowledgeReminder: handleAcknowledgeReminder,
    clearError,
  };
};

export default useAdherence;
