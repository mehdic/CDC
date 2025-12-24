/**
 * useVIPMembership Hook
 * React hook for managing VIP membership state
 * Task: T8-044 - Patient VIP Program Portal
 */

import { useState, useEffect } from 'react';
import { VIPMembership, VIPTierInfo } from '../types/vip.types';
import { getMembership } from '../services/vipService';

interface UseVIPMembershipResult {
  membership: VIPMembership | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useVIPMembership(): UseVIPMembershipResult {
  const [membership, setMembership] = useState<VIPMembership | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMembership = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMembership();
      setMembership(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch membership'));
      setMembership(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembership();
  }, []);

  return {
    membership,
    loading,
    error,
    refetch: fetchMembership,
  };
}
