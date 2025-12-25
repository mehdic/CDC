/**
 * useDigitalTwin Hook
 * React hook for fetching and managing digital twin profile state
 */

import { useState, useEffect, useCallback } from 'react';
import type { DigitalTwinProfile } from '../types/digitalTwin.types';
import {
  fetchDigitalTwinProfile,
  refreshDigitalTwinProfile,
} from '../services/digitalTwinApi';

interface UseDigitalTwinReturn {
  profile: DigitalTwinProfile | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage digital twin profile
 * @param patientId - Patient UUID
 * @returns Profile data, loading state, error, and refresh function
 */
export function useDigitalTwin(patientId: string): UseDigitalTwinReturn {
  const [profile, setProfile] = useState<DigitalTwinProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!patientId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchDigitalTwinProfile(patientId);
      setProfile(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch profile');
      setError(error);
      console.error('[useDigitalTwin] Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const refresh = useCallback(async () => {
    if (!patientId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await refreshDigitalTwinProfile(patientId);
      setProfile(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to refresh profile');
      setError(error);
      console.error('[useDigitalTwin] Error refreshing profile:', err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refresh,
  };
}
