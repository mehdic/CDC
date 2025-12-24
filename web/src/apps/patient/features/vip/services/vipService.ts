/**
 * VIP Service
 * API calls for VIP membership, points, rewards, and offers
 * Task: T8-044 - Patient VIP Program Portal
 */

import { apiClient } from '@/shared/api/client';
import {
  VIPDashboardResponse,
  VIPMembership,
  VIPReward,
  VIPOffer,
  PointsHistory,
  RedeemRewardRequest,
  RedeemRewardResponse,
  UpgradeDowngradeRequest,
  UpgradeDowngradeResponse,
  PointsHistoryResponse,
  VIPOffersResponse,
  VIPSignupResponse,
} from '../types/vip.types';

const VIP_ENDPOINT = '/vip';
const MEMBERSHIP_ENDPOINT = `${VIP_ENDPOINT}/membership`;
const REWARDS_ENDPOINT = `${VIP_ENDPOINT}/rewards`;
const OFFERS_ENDPOINT = `${VIP_ENDPOINT}/offers`;
const POINTS_ENDPOINT = `${VIP_ENDPOINT}/points`;

/**
 * Sign up for VIP membership
 */
export async function signup(): Promise<VIPSignupResponse> {
  try {
    const response = await apiClient.post<VIPSignupResponse>(
      `${VIP_ENDPOINT}/signup`
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to sign up for VIP'
    );
  }
}

/**
 * Get VIP dashboard data including membership, rewards, offers, and points history
 */
export async function getVIPDashboard(): Promise<VIPDashboardResponse> {
  try {
    const response = await apiClient.get<VIPDashboardResponse>(
      `${VIP_ENDPOINT}/dashboard`
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch VIP dashboard'
    );
  }
}

/**
 * Get current membership information
 */
export async function getMembership(): Promise<VIPMembership> {
  try {
    const response = await apiClient.get<VIPMembership>(MEMBERSHIP_ENDPOINT);
    return response.data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch membership'
    );
  }
}

/**
 * Get available rewards for current member
 */
export async function getRewards(): Promise<VIPReward[]> {
  try {
    const response = await apiClient.get<{ data: VIPReward[] }>(
      REWARDS_ENDPOINT
    );
    return response.data.data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch rewards'
    );
  }
}

/**
 * Redeem a reward
 */
export async function redeemReward(
  request: RedeemRewardRequest
): Promise<RedeemRewardResponse> {
  try {
    const response = await apiClient.post<RedeemRewardResponse>(
      `${REWARDS_ENDPOINT}/redeem`,
      request
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to redeem reward'
    );
  }
}

/**
 * Get available offers for current membership tier
 */
export async function getOffers(
  page: number = 1,
  limit: number = 10
): Promise<VIPOffersResponse> {
  try {
    const response = await apiClient.get<VIPOffersResponse>(OFFERS_ENDPOINT, {
      params: {
        page,
        limit,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch offers'
    );
  }
}

/**
 * Get points history with pagination
 */
export async function getPointsHistory(
  page: number = 1,
  limit: number = 10
): Promise<PointsHistoryResponse> {
  try {
    const response = await apiClient.get<PointsHistoryResponse>(
      `${POINTS_ENDPOINT}/history`,
      {
        params: {
          page,
          limit,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch points history'
    );
  }
}

/**
 * Request membership tier upgrade or downgrade
 */
export async function requestTierChange(
  request: UpgradeDowngradeRequest
): Promise<UpgradeDowngradeResponse> {
  try {
    const response = await apiClient.post<UpgradeDowngradeResponse>(
      `${MEMBERSHIP_ENDPOINT}/tier-change`,
      request
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to update tier'
    );
  }
}

/**
 * Get detailed information about a specific offer
 */
export async function getOfferDetails(offerId: string): Promise<VIPOffer> {
  try {
    const response = await apiClient.get<VIPOffer>(
      `${OFFERS_ENDPOINT}/${offerId}`
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch offer details'
    );
  }
}

/**
 * Validate if a reward can be redeemed
 */
export async function validateReward(rewardId: string): Promise<{
  valid: boolean;
  message: string;
}> {
  try {
    const response = await apiClient.get<{
      valid: boolean;
      message: string;
    }>(`${REWARDS_ENDPOINT}/${rewardId}/validate`);
    return response.data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to validate reward'
    );
  }
}
