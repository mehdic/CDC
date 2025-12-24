/**
 * useRewards Hook
 * React hook for managing VIP rewards state and redemption
 * Task: T8-044 - Patient VIP Program Portal
 */

import { useState, useEffect } from 'react';
import { VIPReward, RedeemRewardRequest } from '../types/vip.types';
import { getRewards, redeemReward as redeemRewardService } from '../services/vipService';

interface UseRewardsResult {
  rewards: VIPReward[];
  loading: boolean;
  error: Error | null;
  redeeming: boolean;
  redeemError: Error | null;
  refetch: () => Promise<void>;
  redeemReward: (request: RedeemRewardRequest) => Promise<void>;
}

export function useRewards(): UseRewardsResult {
  const [rewards, setRewards] = useState<VIPReward[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [redeeming, setRedeeming] = useState<boolean>(false);
  const [redeemError, setRedeemError] = useState<Error | null>(null);

  const fetchRewards = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRewards();
      setRewards(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch rewards'));
      setRewards([]);
    } finally {
      setLoading(false);
    }
  };

  const redeemReward = async (request: RedeemRewardRequest): Promise<void> => {
    try {
      setRedeeming(true);
      setRedeemError(null);
      await redeemRewardService(request);
      await fetchRewards();
    } catch (err) {
      setRedeemError(err instanceof Error ? err : new Error('Failed to redeem reward'));
    } finally {
      setRedeeming(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  return {
    rewards,
    loading,
    error,
    redeeming,
    redeemError,
    refetch: fetchRewards,
    redeemReward,
  };
}
