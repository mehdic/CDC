/**
 * Referral Service
 * Manages referral program, code generation, completion, and reward distribution
 * T6-024: Implement referral program for patient acquisition
 */

import { Repository, Between } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Referral, ReferralStatus } from '../../../../shared/models/Referral';
import { ReferralReward, RewardType } from '../../../../shared/models/ReferralReward';
import { User } from '../../../../shared/models/User';
import { PointsTransaction, TransactionSource, TransactionType } from '../../../../shared/models/PointsTransaction';
import { VipMembership } from '../../../../shared/models/VipMembership';

export class ReferralService {
  private referralRepo: Repository<Referral>;
  private rewardRepo: Repository<ReferralReward>;
  private userRepo: Repository<User>;
  private pointsTransactionRepo: Repository<PointsTransaction>;
  private vipMembershipRepo: Repository<VipMembership>;

  constructor() {
    this.referralRepo = AppDataSource.getRepository(Referral);
    this.rewardRepo = AppDataSource.getRepository(ReferralReward);
    this.userRepo = AppDataSource.getRepository(User);
    this.pointsTransactionRepo = AppDataSource.getRepository(PointsTransaction);
    this.vipMembershipRepo = AppDataSource.getRepository(VipMembership);
  }

  /**
   * Generate unique referral code
   * Format: REF-XXXXXX (6 random alphanumeric)
   */
  private generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'REF-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Get or generate a unique code
   */
  private async getUniqueReferralCode(): Promise<string> {
    let code = this.generateReferralCode();
    let exists = await this.referralRepo.findOne({ where: { referral_code: code } });

    // Ensure uniqueness
    while (exists) {
      code = this.generateReferralCode();
      exists = await this.referralRepo.findOne({ where: { referral_code: code } });
    }

    return code;
  }

  /**
   * T6-024: Create a new referral code for a patient
   */
  async createReferral(
    referrerId: string,
    refereeEmail?: string,
    refereePhone?: string,
    referrerReward: number = 50, // CHF
    refereeReward: number = 20, // CHF
  ): Promise<Referral> {
    const referrer = await this.userRepo.findOne({ where: { id: referrerId } });
    if (!referrer) {
      throw new Error('Referrer user not found');
    }

    const code = await this.getUniqueReferralCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // Expire in 90 days

    const referral = this.referralRepo.create({
      referrer_id: referrerId,
      referrer: referrer,
      referral_code: code,
      status: ReferralStatus.PENDING,
      referrer_reward: referrerReward,
      referrer_reward_type: RewardType.POINTS,
      referee_reward: refereeReward,
      referee_reward_type: RewardType.POINTS,
      expires_at: expiresAt,
      referee_email: refereeEmail || null,
      referee_phone: refereePhone || null,
      rewards: [],
    });

    await this.referralRepo.save(referral);

    return referral;
  }

  /**
   * T6-024: Get referral by code and mark referee if provided
   */
  async getReferralByCode(code: string): Promise<Referral | null> {
    return await this.referralRepo.findOne({
      where: { referral_code: code },
      relations: ['referrer', 'referee', 'rewards'],
    });
  }

  /**
   * T6-024: Complete referral when referee makes first purchase
   * Marks status as COMPLETED and creates reward records
   */
  async completeReferral(
    referralCode: string,
    refereeId: string,
    completingOrderId: string,
  ): Promise<{ referral: Referral; rewards: ReferralReward[] }> {
    const referral = await this.referralRepo.findOne({
      where: { referral_code: referralCode },
      relations: ['referrer', 'referee'],
    });

    if (!referral) {
      throw new Error('Referral not found');
    }

    if (referral.status !== ReferralStatus.PENDING) {
      throw new Error(`Cannot complete referral with status: ${referral.status}`);
    }

    if (referral.isExpired()) {
      referral.status = ReferralStatus.EXPIRED;
      await this.referralRepo.save(referral);
      throw new Error('Referral code has expired');
    }

    const referee = await this.userRepo.findOne({ where: { id: refereeId } });
    if (!referee) {
      throw new Error('Referee user not found');
    }

    // Mark as completed
    referral.referee_id = refereeId;
    referral.referee = referee;
    referral.status = ReferralStatus.COMPLETED;
    referral.completed_at = new Date();
    referral.completing_order_id = completingOrderId;

    await this.referralRepo.save(referral);

    // Create reward records
    const rewards = await this.createRewards(referral);

    return { referral, rewards };
  }

  /**
   * Create reward records for referrer and referee
   */
  private async createRewards(referral: Referral): Promise<ReferralReward[]> {
    const rewards: ReferralReward[] = [];

    // Reward for referrer
    if (referral.referrer_reward && referral.referrer_reward > 0) {
      const referrerReward = this.rewardRepo.create({
        referral_id: referral.id,
        referral: referral,
        recipient_id: referral.referrer_id,
        recipient: referral.referrer,
        reward_type: referral.referrer_reward_type as RewardType,
        reward_value: referral.referrer_reward,
        description: `Referral reward for inviting ${referral.referee?.email || 'user'}`,
        is_applied: false,
        expires_at: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year
      });
      await this.rewardRepo.save(referrerReward);
      rewards.push(referrerReward);
    }

    // Reward for referee
    if (referral.referee_reward && referral.referee_reward > 0 && referral.referee_id) {
      const refereeReward = this.rewardRepo.create({
        referral_id: referral.id,
        referral: referral,
        recipient_id: referral.referee_id,
        recipient: referral.referee,
        reward_type: referral.referee_reward_type as RewardType,
        reward_value: referral.referee_reward,
        description: `Welcome reward from referral code ${referral.referral_code}`,
        is_applied: false,
        expires_at: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year
      });
      await this.rewardRepo.save(refereeReward);
      rewards.push(refereeReward);
    }

    return rewards;
  }

  /**
   * T6-024: Apply reward to user account
   */
  async applyReward(rewardId: string): Promise<ReferralReward> {
    const reward = await this.rewardRepo.findOne({
      where: { id: rewardId },
      relations: ['referral', 'recipient'],
    });

    if (!reward) {
      throw new Error('Reward not found');
    }

    if (reward.is_applied) {
      throw new Error('Reward already applied');
    }

    if (reward.isExpired()) {
      throw new Error('Reward has expired');
    }

    reward.is_applied = true;
    reward.applied_at = new Date();

    // If reward is points, add to VIP membership
    if (reward.reward_type === RewardType.POINTS) {
      const membership = await this.vipMembershipRepo.findOne({
        where: { user_id: reward.recipient_id },
      });

      if (membership) {
        // Add points transaction
        const pointsValue = Math.floor(reward.reward_value * 10); // 1 CHF = 10 points
        const transaction = this.pointsTransactionRepo.create({
          vip_membership_id: membership.id,
          vip_membership: membership,
          type: TransactionType.EARNED,
          source: TransactionSource.BONUS,
          amount: pointsValue,
          description: `Referral bonus: ${reward.description}`,
          reference_id: reward.id,
          expires_at: reward.expires_at,
        });

        await this.pointsTransactionRepo.save(transaction);
        reward.transaction_id = transaction.id;

        // Update membership points
        membership.current_points += pointsValue;
        membership.lifetime_points += pointsValue;
        membership.last_activity_at = new Date();
        await this.vipMembershipRepo.save(membership);
      }
    }

    await this.rewardRepo.save(reward);

    return reward;
  }

  /**
   * T6-024: Get referral stats for a patient
   */
  async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    pendingReferrals: number;
    completedReferrals: number;
    totalRewardsEarned: number;
    appliedRewardsValue: number;
    pendingRewardsValue: number;
  }> {
    const referrals = await this.referralRepo.find({
      where: { referrer_id: userId },
      relations: ['rewards'],
    });

    const totalReferrals = referrals.length;
    const pendingReferrals = referrals.filter((r) => r.status === ReferralStatus.PENDING).length;
    const completedReferrals = referrals.filter((r) => r.status === ReferralStatus.COMPLETED).length;

    let totalRewardsEarned = 0;
    let appliedRewardsValue = 0;
    let pendingRewardsValue = 0;

    referrals.forEach((referral) => {
      referral.rewards.forEach((reward) => {
        if (reward.recipient_id === userId) {
          totalRewardsEarned += reward.reward_value;

          if (reward.is_applied) {
            appliedRewardsValue += reward.reward_value;
          } else {
            pendingRewardsValue += reward.reward_value;
          }
        }
      });
    });

    return {
      totalReferrals,
      pendingReferrals,
      completedReferrals,
      totalRewardsEarned,
      appliedRewardsValue,
      pendingRewardsValue,
    };
  }

  /**
   * T6-024: Get leaderboard of top referrers
   */
  async getLeaderboard(limit: number = 10): Promise<
    Array<{
      userId: string;
      userName: string;
      email: string;
      totalReferrals: number;
      completedReferrals: number;
      totalRewardsEarned: number;
    }>
  > {
    const referrals = await this.referralRepo.find({
      relations: ['referrer', 'rewards'],
    });

    const statsMap = new Map<
      string,
      {
        userId: string;
        userName: string;
        email: string;
        totalReferrals: number;
        completedReferrals: number;
        totalRewardsEarned: number;
      }
    >();

    referrals.forEach((referral) => {
      if (!statsMap.has(referral.referrer_id)) {
        statsMap.set(referral.referrer_id, {
          userId: referral.referrer_id,
          userName: `${referral.referrer.first_name_encrypted}`, // Placeholder - needs decryption
          email: referral.referrer.email,
          totalReferrals: 0,
          completedReferrals: 0,
          totalRewardsEarned: 0,
        });
      }

      const stats = statsMap.get(referral.referrer_id)!;
      stats.totalReferrals++;

      if (referral.status === ReferralStatus.COMPLETED) {
        stats.completedReferrals++;
      }

      referral.rewards
        .filter((r) => r.recipient_id === referral.referrer_id)
        .forEach((reward) => {
          stats.totalRewardsEarned += reward.reward_value;
        });
    });

    return Array.from(statsMap.values())
      .sort((a, b) => b.totalRewardsEarned - a.totalRewardsEarned)
      .slice(0, limit);
  }

  /**
   * T6-024: Get user's referral history
   */
  async getUserReferrals(userId: string): Promise<
    Array<{
      id: string;
      code: string;
      status: ReferralStatus;
      refereeName: string | null;
      refereeEmail: string | null;
      createdAt: Date;
      completedAt: Date | null;
      rewardsEarned: number;
    }>
  > {
    const referrals = await this.referralRepo.find({
      where: { referrer_id: userId },
      relations: ['referee', 'rewards'],
      order: { created_at: 'DESC' },
    });

    return referrals.map((referral) => {
      const rewardsEarned = referral.rewards
        .filter((r) => r.recipient_id === userId && r.is_applied)
        .reduce((sum, r) => sum + r.reward_value, 0);

      return {
        id: referral.id,
        code: referral.referral_code,
        status: referral.status,
        refereeName: referral.referee
          ? `${referral.referee.first_name_encrypted}`
          : referral.referee_email || 'Pending', // Placeholder
        refereeEmail: referral.referee_email || referral.referee?.email || null,
        createdAt: referral.created_at,
        completedAt: referral.completed_at,
        rewardsEarned,
      };
    });
  }

  /**
   * T6-024: Cancel referral and optionally update reason
   */
  async cancelReferral(referralId: string, reason: string = ''): Promise<Referral> {
    const referral = await this.referralRepo.findOne({ where: { id: referralId } });

    if (!referral) {
      throw new Error('Referral not found');
    }

    if (referral.status === ReferralStatus.COMPLETED) {
      throw new Error('Cannot cancel completed referral');
    }

    referral.status = ReferralStatus.CANCELLED;
    referral.cancelled_at = new Date();
    referral.cancellation_reason = reason;

    await this.referralRepo.save(referral);

    return referral;
  }

  /**
   * T6-024: Expire old referral codes (batch job)
   */
  async expireOldReferrals(): Promise<number> {
    const now = new Date();
    const expiredReferrals = await this.referralRepo.find({
      where: {
        status: ReferralStatus.PENDING,
        expires_at: Between(new Date(0), now),
      },
    });

    for (const referral of expiredReferrals) {
      referral.status = ReferralStatus.EXPIRED;
      await this.referralRepo.save(referral);
    }

    return expiredReferrals.length;
  }

  /**
   * T6-024: Get unclaimed rewards for user
   */
  async getUnclaimedRewards(userId: string): Promise<ReferralReward[]> {
    return await this.rewardRepo.find({
      where: {
        recipient_id: userId,
        is_applied: false,
      },
      relations: ['referral'],
      order: { created_at: 'DESC' },
    });
  }
}
