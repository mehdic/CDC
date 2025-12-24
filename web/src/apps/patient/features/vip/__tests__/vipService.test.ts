/**
 * VIP Service Unit Tests
 * Tests for VIP service API calls
 * Task: T8-044 - Patient VIP Program Portal
 */

import { apiClient } from '@/shared/api/client';
import * as vipService from '../services/vipService';

// Test Data Builders
const buildVIPMembership = () => ({
  id: 'member-123',
  userId: 'user-123',
  currentTier: 'gold' as const,
  totalPoints: 850,
  pointsToNextTier: 150,
  currentTierPoints: 350,
  joinedAt: new Date('2024-01-15'),
  lastActivityAt: new Date(),
  isActive: true,
  membershipStatus: 'active' as const,
});

const buildVIPReward = () => ({
  id: 'reward-123',
  memberId: 'member-123',
  title: 'Bon de réduction 50 CHF',
  description: 'Utilisable sur votre prochain achat',
  pointsValue: 200,
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  status: 'available' as const,
  code: 'REWARD123ABC',
});

const buildVIPOffer = () => ({
  id: 'offer-123',
  title: '20% de réduction',
  description: 'Sur vitamines et compléments',
  type: 'discount' as const,
  discountPercentage: 20,
  validFrom: new Date(),
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  applicableTiers: ['gold', 'platinum'],
  usageLimit: 100,
  usageCount: 42,
  termsAndConditions: 'Valide sur produits sélectionnés',
  featured: true,
});

const buildPointsHistory = () => ({
  id: 'hist-123',
  memberId: 'member-123',
  points: 50,
  type: 'earned' as const,
  description: 'Points gagnés lors achat',
  transactionId: 'txn-123',
  createdAt: new Date(),
});

jest.mock('@/shared/api/client');

describe('VIP Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVIPDashboard', () => {
    it('should fetch VIP dashboard data', async () => {
      const mockData = {
        message: 'Dashboard fetched',
        data: {
          membership: buildVIPMembership(),
          tierInfo: {
            tier: 'gold',
            name: 'Gold',
            benefits: [],
            minPoints: 0,
            discountPercentage: 10,
            pointsMultiplier: 1.5,
            color: '#FFD700',
            description: 'Gold tier',
          },
          rewards: [buildVIPReward()],
          offers: [buildVIPOffer()],
          pointsHistory: [buildPointsHistory()],
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockData });

      const result = await vipService.getVIPDashboard();

      expect(result.data).toBeDefined();
      expect(result.data.membership).toBeDefined();
      expect(result.data.rewards).toHaveLength(1);
      expect(result.data.offers).toHaveLength(1);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      (apiClient.get as jest.Mock).mockRejectedValue(error);

      await expect(vipService.getVIPDashboard()).rejects.toThrow('API Error');
    });
  });

  describe('getMembership', () => {
    it('should fetch membership data', async () => {
      const mockMembership = buildVIPMembership();
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockMembership });

      const result = await vipService.getMembership();

      expect(result).toEqual(mockMembership);
      expect(result.currentTier).toBe('gold');
      expect(result.totalPoints).toBeGreaterThan(0);
    });

    it('should handle membership fetch errors', async () => {
      const error = new Error('Network error');
      (apiClient.get as jest.Mock).mockRejectedValue(error);

      await expect(vipService.getMembership()).rejects.toThrow('Network error');
    });
  });

  describe('getRewards', () => {
    it('should fetch available rewards', async () => {
      const rewards = [buildVIPReward(), buildVIPReward({ id: 'reward-456' })];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: rewards } });

      const result = await vipService.getRewards();

      expect(result).toHaveLength(2);
      expect(result[0].pointsValue).toBeGreaterThan(0);
    });

    it('should return empty array if no rewards', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [] } });

      const result = await vipService.getRewards();

      expect(result).toEqual([]);
    });
  });

  describe('redeemReward', () => {
    it('should redeem a reward', async () => {
      const mockResponse = {
        message: 'Reward redeemed',
        reward: buildVIPReward({ status: 'redeemed' as any }),
        remainingPoints: 650,
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await vipService.redeemReward({
        rewardId: 'reward-123',
        orderId: 'order-456',
      });

      expect(result.message).toBe('Reward redeemed');
      expect(result.remainingPoints).toBe(650);
    });

    it('should validate redeem request parameters', async () => {
      const mockResponse = {
        message: 'Reward redeemed',
        reward: buildVIPReward(),
        remainingPoints: 700,
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      await vipService.redeemReward({ rewardId: 'reward-123' });

      expect(apiClient.post).toHaveBeenCalledWith(
        expect.stringContaining('/redeem'),
        expect.objectContaining({ rewardId: 'reward-123' })
      );
    });
  });

  describe('getOffers', () => {
    it('should fetch paginated offers', async () => {
      const mockResponse = {
        message: 'Offers fetched',
        data: [buildVIPOffer()],
        pagination: {
          page: 1,
          limit: 10,
          total: 15,
          total_pages: 2,
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await vipService.getOffers(1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total_pages).toBe(2);
    });

    it('should support pagination parameters', async () => {
      const mockResponse = {
        message: 'Offers fetched',
        data: [],
        pagination: {
          page: 2,
          limit: 5,
          total: 15,
          total_pages: 3,
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      await vipService.getOffers(2, 5);

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: { page: 2, limit: 5 },
        })
      );
    });
  });

  describe('getPointsHistory', () => {
    it('should fetch points history with pagination', async () => {
      const history1 = buildPointsHistory();
      history1.type = 'earned';
      history1.points = 50;

      const history2 = buildPointsHistory();
      history2.type = 'redeemed';
      history2.points = -100;

      const mockResponse = {
        message: 'Points history fetched',
        data: [history1, history2],
        pagination: {
          page: 1,
          limit: 10,
          total: 20,
          total_pages: 2,
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await vipService.getPointsHistory(1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].type).toBe('earned');
      expect(result.data[1].type).toBe('redeemed');
    });

    it('should handle pagination in points history', async () => {
      const mockResponse = {
        message: 'Points history fetched',
        data: [],
        pagination: {
          page: 3,
          limit: 20,
          total: 50,
          total_pages: 3,
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await vipService.getPointsHistory(3, 20);

      expect(result.pagination.page).toBe(3);
      expect(result.pagination.total_pages).toBe(3);
    });
  });

  describe('requestTierChange', () => {
    it('should request tier upgrade', async () => {
      const membership = buildVIPMembership();
      membership.currentTier = 'platinum' as const;

      const mockResponse = {
        message: 'Tier changed successfully',
        previousTier: 'gold',
        newTier: 'platinum',
        membership,
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await vipService.requestTierChange({ newTier: 'platinum' });

      expect(result.newTier).toBe('platinum');
      expect(result.membership.currentTier).toBe('platinum');
    });

    it('should include reason in upgrade request', async () => {
      const membership = buildVIPMembership();
      membership.currentTier = 'silver' as const;

      const mockResponse = {
        message: 'Tier change requested',
        previousTier: 'gold',
        newTier: 'silver',
        membership,
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockResponse });

      await vipService.requestTierChange({
        newTier: 'silver',
        reason: 'Downgrading due to reduced activity',
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ newTier: 'silver' })
      );
    });
  });

  describe('validateReward', () => {
    it('should validate if reward can be redeemed', async () => {
      const mockResponse = {
        valid: true,
        message: 'Reward is valid and can be redeemed',
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await vipService.validateReward('reward-123');

      expect(result.valid).toBe(true);
    });

    it('should return invalid status for expired reward', async () => {
      const mockResponse = {
        valid: false,
        message: 'Reward has expired',
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockResponse });

      const result = await vipService.validateReward('reward-456');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('expired');
    });
  });
});
