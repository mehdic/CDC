/**
 * Referral Service Unit Tests
 * T6-024: Implement referral program for patient acquisition
 */

import { Repository } from 'typeorm';
import { ReferralService } from '../services/ReferralService';
import { Referral, ReferralStatus } from '../../../../shared/models/Referral';
import { ReferralReward, RewardType } from '../../../../shared/models/ReferralReward';
import { User } from '../../../../shared/models/User';
import { VipMembership } from '../../../../shared/models/VipMembership';

// Mock repositories
jest.mock('../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('ReferralService', () => {
  let referralService: ReferralService;
  let mockReferralRepo: jest.Mocked<Repository<Referral>>;
  let mockRewardRepo: jest.Mocked<Repository<ReferralReward>>;
  let mockUserRepo: jest.Mocked<Repository<User>>;
  let mockPointsTransactionRepo: jest.Mocked<any>;
  let mockVipMembershipRepo: jest.Mocked<Repository<VipMembership>>;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    password_hash: 'hash',
    role: 'patient' as any,
    status: 'active' as any,
    first_name_encrypted: Buffer.from('John'),
    last_name_encrypted: Buffer.from('Doe'),
    phone_encrypted: null,
    mfa_enabled: false,
    mfa_secret: null,
    mfa_secret_encrypted: null,
    primary_pharmacy_id: null,
    primary_pharmacy: null,
    master_account_id: null,
    master_account: null,
    permissions_override: null,
    sub_accounts: [],
    audit_trail_entries: [],
    carts: [],
    hin_id: null,
    email_verified: true,
    created_at: new Date(),
    updated_at: new Date(),
    last_login_at: null,
    deleted_at: null,
    isDeleted: jest.fn().mockReturnValue(false),
    isActive: jest.fn().mockReturnValue(true),
    hasMFA: jest.fn().mockReturnValue(false),
    isHealthcareProfessional: jest.fn().mockReturnValue(false),
    hasHINAuth: jest.fn().mockReturnValue(false),
    softDelete: jest.fn(),
    updateLastLogin: jest.fn(),
  };

  const mockReferrer: User = { ...mockUser, id: 'referrer-123', email: 'referrer@example.com' };
  const mockReferee: User = { ...mockUser, id: 'referee-123', email: 'referee@example.com' };

  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();

    // Setup mock repositories
    mockReferralRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    } as any;

    mockRewardRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    } as any;

    mockUserRepo = {
      findOne: jest.fn(),
    } as any;

    mockPointsTransactionRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    mockVipMembershipRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as any;

    // Mock AppDataSource.getRepository
    const { AppDataSource } = require('../config/database');
    AppDataSource.getRepository = jest.fn((entity) => {
      if (entity.name === 'Referral') return mockReferralRepo;
      if (entity.name === 'ReferralReward') return mockRewardRepo;
      if (entity.name === 'User') return mockUserRepo;
      if (entity.name === 'PointsTransaction') return mockPointsTransactionRepo;
      if (entity.name === 'VipMembership') return mockVipMembershipRepo;
      return null;
    });

    referralService = new ReferralService();
  });

  describe('createReferral', () => {
    it('should create a new referral code for a user', async () => {
      const referralData = {
        id: 'referral-123',
        referrer_id: 'referrer-123',
        referrer: mockReferrer,
        referral_code: 'REF-ABC123',
        status: ReferralStatus.PENDING,
        referrer_reward: 50,
        referrer_reward_type: 'points',
        referee_reward: 20,
        referee_reward_type: 'points',
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        rewards: [],
      };

      mockUserRepo.findOne.mockResolvedValue(mockReferrer);
      mockReferralRepo.create.mockReturnValue(referralData as any);
      mockReferralRepo.save.mockResolvedValue(referralData as any);
      mockReferralRepo.findOne.mockResolvedValue(null); // No duplicate

      const result = await referralService.createReferral('referrer-123', undefined, undefined, 50, 20);

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: 'referrer-123' } });
      expect(mockReferralRepo.create).toHaveBeenCalled();
      expect(mockReferralRepo.save).toHaveBeenCalled();
      expect(result.referral_code).toMatch(/^REF-/);
      expect(result.status).toBe(ReferralStatus.PENDING);
    });

    it('should throw error if referrer user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(referralService.createReferral('invalid-id')).rejects.toThrow('Referrer user not found');
    });

    it('should set expiry to 90 days from now', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockReferrer);
      mockReferralRepo.create.mockReturnValue({
        referrer_id: 'referrer-123',
        referrer: mockReferrer,
        referral_code: 'REF-ABC123',
        status: ReferralStatus.PENDING,
        rewards: [],
      } as any);
      mockReferralRepo.save.mockResolvedValue({} as any);
      mockReferralRepo.findOne.mockResolvedValue(null);

      await referralService.createReferral('referrer-123');

      const createCall = mockReferralRepo.create.mock.calls[0][0];
      const expiryDate = createCall.expires_at;
      const now = new Date();
      const expectedDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      expect(expiryDate.getTime()).toBeCloseTo(expectedDate.getTime(), -4);
    });
  });

  describe('getReferralByCode', () => {
    it('should return referral by code', async () => {
      const referralData = {
        id: 'referral-123',
        referral_code: 'REF-ABC123',
        status: ReferralStatus.PENDING,
        rewards: [],
      };

      mockReferralRepo.findOne.mockResolvedValue(referralData as any);

      const result = await referralService.getReferralByCode('REF-ABC123');

      expect(mockReferralRepo.findOne).toHaveBeenCalledWith({
        where: { referral_code: 'REF-ABC123' },
        relations: ['referrer', 'referee', 'rewards'],
      });
      expect(result).toEqual(referralData);
    });

    it('should return null if referral not found', async () => {
      mockReferralRepo.findOne.mockResolvedValue(null);

      const result = await referralService.getReferralByCode('INVALID');

      expect(result).toBeNull();
    });
  });

  describe('completeReferral', () => {
    it('should complete referral and create rewards', async () => {
      const referralData = {
        id: 'referral-123',
        referral_code: 'REF-ABC123',
        status: ReferralStatus.PENDING,
        referrer_id: 'referrer-123',
        referrer: mockReferrer,
        referee_id: null,
        referee: null,
        referrer_reward: 50,
        referrer_reward_type: 'points',
        referee_reward: 20,
        referee_reward_type: 'points',
        expires_at: new Date(Date.now() + 1000 * 60 * 1000), // Not expired
        rewards: [],
        completed_at: null,
        completing_order_id: null,
        isExpired: jest.fn().mockReturnValue(false),
      };

      const referralReward = {
        id: 'reward-123',
        referral_id: 'referral-123',
        recipient_id: 'referrer-123',
        reward_type: 'points',
        reward_value: 50,
        is_applied: false,
        expires_at: new Date(),
      };

      mockReferralRepo.findOne.mockResolvedValue(referralData as any);
      mockUserRepo.findOne.mockResolvedValue(mockReferee);
      mockRewardRepo.create.mockReturnValue(referralReward as any);
      mockRewardRepo.save.mockResolvedValue(referralReward as any);
      mockReferralRepo.save.mockResolvedValue({ ...referralData, status: ReferralStatus.COMPLETED } as any);

      const result = await referralService.completeReferral('REF-ABC123', 'referee-123', 'order-123');

      expect(mockReferralRepo.findOne).toHaveBeenCalled();
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: 'referee-123' } });
      expect(mockRewardRepo.create).toHaveBeenCalled();
      expect(result.referral.status).toBe(ReferralStatus.COMPLETED);
      expect(result.rewards.length).toBeGreaterThan(0);
    });

    it('should throw error if referral code invalid', async () => {
      mockReferralRepo.findOne.mockResolvedValue(null);

      await expect(
        referralService.completeReferral('INVALID', 'referee-123', 'order-123'),
      ).rejects.toThrow('Referral not found');
    });

    it('should throw error if referral expired', async () => {
      const referralData = {
        id: 'referral-123',
        referral_code: 'REF-ABC123',
        status: ReferralStatus.PENDING,
        expires_at: new Date(Date.now() - 1000),
        isExpired: jest.fn().mockReturnValue(true),
      };

      mockReferralRepo.findOne.mockResolvedValue(referralData as any);
      mockReferralRepo.save.mockResolvedValue({} as any);

      await expect(
        referralService.completeReferral('REF-ABC123', 'referee-123', 'order-123'),
      ).rejects.toThrow('Referral code has expired');
    });
  });

  describe('applyReward', () => {
    it('should apply reward and add points to VIP membership', async () => {
      const rewardData = {
        id: 'reward-123',
        referral_id: 'referral-123',
        recipient_id: 'user-123',
        recipient: mockUser,
        reward_type: RewardType.POINTS,
        reward_value: 50,
        is_applied: false,
        expires_at: new Date(Date.now() + 1000 * 60 * 1000),
        isExpired: jest.fn().mockReturnValue(false),
        canApply: jest.fn().mockReturnValue(true),
      };

      const membershipData = {
        id: 'membership-123',
        user_id: 'user-123',
        current_points: 100,
        lifetime_points: 100,
      };

      mockRewardRepo.findOne.mockResolvedValue(rewardData as any);
      mockVipMembershipRepo.findOne.mockResolvedValue(membershipData as any);
      mockPointsTransactionRepo.create.mockReturnValue({
        id: 'transaction-123',
        amount: 500, // 50 CHF * 10 = 500 points
      });
      mockPointsTransactionRepo.save.mockResolvedValue({});
      mockVipMembershipRepo.save.mockResolvedValue({});
      mockRewardRepo.save.mockResolvedValue({
        ...rewardData,
        is_applied: true,
        applied_at: new Date(),
        transaction_id: 'transaction-123',
      } as any);

      const result = await referralService.applyReward('reward-123');

      expect(mockRewardRepo.findOne).toHaveBeenCalled();
      expect(mockVipMembershipRepo.findOne).toHaveBeenCalled();
      expect(mockPointsTransactionRepo.create).toHaveBeenCalled();
      expect(mockVipMembershipRepo.save).toHaveBeenCalled();
      expect(result.is_applied).toBe(true);
    });

    it('should throw error if reward already applied', async () => {
      const rewardData = {
        id: 'reward-123',
        is_applied: true,
      };

      mockRewardRepo.findOne.mockResolvedValue(rewardData as any);

      await expect(referralService.applyReward('reward-123')).rejects.toThrow('Reward already applied');
    });
  });

  describe('getReferralStats', () => {
    it('should return correct referral statistics', async () => {
      const referrals = [
        {
          id: 'ref-1',
          referrer_id: 'user-123',
          status: ReferralStatus.COMPLETED,
          rewards: [
            {
              id: 'reward-1',
              recipient_id: 'user-123',
              reward_value: 50,
              is_applied: true,
            },
          ],
        },
        {
          id: 'ref-2',
          referrer_id: 'user-123',
          status: ReferralStatus.PENDING,
          rewards: [
            {
              id: 'reward-2',
              recipient_id: 'user-123',
              reward_value: 50,
              is_applied: false,
            },
          ],
        },
      ];

      mockReferralRepo.find.mockResolvedValue(referrals as any);

      const stats = await referralService.getReferralStats('user-123');

      expect(stats.totalReferrals).toBe(2);
      expect(stats.completedReferrals).toBe(1);
      expect(stats.pendingReferrals).toBe(1);
      expect(stats.totalRewardsEarned).toBe(100);
      expect(stats.appliedRewardsValue).toBe(50);
      expect(stats.pendingRewardsValue).toBe(50);
    });
  });

  describe('getLeaderboard', () => {
    it('should return top referrers sorted by rewards earned', async () => {
      const referrals = [
        {
          referrer_id: 'user-1',
          referrer: { ...mockReferrer, id: 'user-1', email: 'user1@example.com' },
          status: ReferralStatus.COMPLETED,
          rewards: [
            {
              recipient_id: 'user-1',
              reward_value: 100,
            },
          ],
        },
        {
          referrer_id: 'user-2',
          referrer: { ...mockReferrer, id: 'user-2', email: 'user2@example.com' },
          status: ReferralStatus.COMPLETED,
          rewards: [
            {
              recipient_id: 'user-2',
              reward_value: 200,
            },
          ],
        },
      ];

      mockReferralRepo.find.mockResolvedValue(referrals as any);

      const leaderboard = await referralService.getLeaderboard(10);

      expect(leaderboard.length).toBeGreaterThan(0);
      expect(leaderboard[0].totalRewardsEarned).toBeGreaterThanOrEqual(leaderboard[1]?.totalRewardsEarned || 0);
    });
  });

  describe('cancelReferral', () => {
    it('should cancel an active referral', async () => {
      const referralData = {
        id: 'referral-123',
        status: ReferralStatus.PENDING,
        cancelled_at: null,
        cancellation_reason: null,
      };

      mockReferralRepo.findOne.mockResolvedValue(referralData as any);
      mockReferralRepo.save.mockResolvedValue({
        ...referralData,
        status: ReferralStatus.CANCELLED,
        cancelled_at: new Date(),
        cancellation_reason: 'User requested',
      } as any);

      const result = await referralService.cancelReferral('referral-123', 'User requested');

      expect(mockReferralRepo.findOne).toHaveBeenCalledWith({ where: { id: 'referral-123' } });
      expect(result.status).toBe(ReferralStatus.CANCELLED);
    });

    it('should throw error if trying to cancel completed referral', async () => {
      const referralData = {
        id: 'referral-123',
        status: ReferralStatus.COMPLETED,
      };

      mockReferralRepo.findOne.mockResolvedValue(referralData as any);

      await expect(referralService.cancelReferral('referral-123')).rejects.toThrow(
        'Cannot cancel completed referral',
      );
    });
  });

  describe('expireOldReferrals', () => {
    it('should expire old pending referrals', async () => {
      const oldReferrals = [
        {
          id: 'ref-1',
          status: ReferralStatus.PENDING,
          expires_at: new Date(Date.now() - 1000),
        },
        {
          id: 'ref-2',
          status: ReferralStatus.PENDING,
          expires_at: new Date(Date.now() - 2000),
        },
      ];

      mockReferralRepo.find.mockResolvedValue(oldReferrals as any);
      mockReferralRepo.save.mockResolvedValue({} as any);

      const count = await referralService.expireOldReferrals();

      expect(count).toBe(2);
      expect(mockReferralRepo.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('getUnclaimedRewards', () => {
    it('should return unclaimed rewards for user', async () => {
      const rewards = [
        {
          id: 'reward-1',
          recipient_id: 'user-123',
          is_applied: false,
          referral: { referral_code: 'REF-ABC' },
        },
      ];

      mockRewardRepo.find.mockResolvedValue(rewards as any);

      const result = await referralService.getUnclaimedRewards('user-123');

      expect(mockRewardRepo.find).toHaveBeenCalledWith({
        where: {
          recipient_id: 'user-123',
          is_applied: false,
        },
        relations: ['referral'],
        order: { created_at: 'DESC' },
      });
      expect(result.length).toBe(1);
    });
  });
});
