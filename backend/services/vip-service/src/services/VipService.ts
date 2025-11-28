/**
 * VIP Service
 * Manages VIP program membership, tier upgrades, and benefits
 * T3-095: Design VIP program architecture
 * T3-097: Implement tier benefits
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { VipMembership, VipTier, TierBenefits } from '../../../../shared/models/VipMembership';
import { User } from '../../../../shared/models/User';

export class VipService {
  private vipRepo: Repository<VipMembership>;
  private userRepo: Repository<User>;

  constructor() {
    this.vipRepo = AppDataSource.getRepository(VipMembership);
    this.userRepo = AppDataSource.getRepository(User);
  }

  /**
   * T3-095: Get or create VIP membership
   */
  async getOrCreateMembership(userId: string): Promise<VipMembership> {
    let membership = await this.vipRepo.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });

    if (!membership) {
      const user = await this.userRepo.findOne({ where: { id: userId } });

      if (!user) {
        throw new Error('User not found');
      }

      membership = this.vipRepo.create({
        user_id: userId,
        user: user,
        tier: VipTier.BRONZE,
        current_points: 0,
        lifetime_points: 0,
        is_active: true,
        enrolled_at: new Date(),
      });

      await this.vipRepo.save(membership);
    }

    return membership;
  }

  /**
   * T3-097: Get VIP membership with benefits
   */
  async getMembershipWithBenefits(userId: string): Promise<{
    membership: VipMembership;
    benefits: TierBenefits;
    pointsUntilNextTier: number;
  }> {
    const membership = await this.getOrCreateMembership(userId);
    const benefits = membership.getTierBenefits();
    const pointsUntilNextTier = this.getPointsUntilNextTier(membership);

    return {
      membership,
      benefits,
      pointsUntilNextTier,
    };
  }

  /**
   * T3-097: Get current tier and benefits
   */
  getTierBenefits(tier: VipTier): TierBenefits {
    const benefits: Record<VipTier, TierBenefits> = {
      [VipTier.BRONZE]: {
        discountPercentage: 0,
        exclusiveOffers: false,
        prioritySupport: false,
        freeDeliveryThreshold: 0,
      },
      [VipTier.SILVER]: {
        discountPercentage: 5,
        exclusiveOffers: false,
        prioritySupport: false,
        freeDeliveryThreshold: 100,
      },
      [VipTier.GOLD]: {
        discountPercentage: 10,
        exclusiveOffers: true,
        prioritySupport: true,
        freeDeliveryThreshold: 50,
      },
      [VipTier.PLATINUM]: {
        discountPercentage: 15,
        exclusiveOffers: true,
        prioritySupport: true,
        freeDeliveryThreshold: 0, // Free delivery on all orders
      },
    };

    return benefits[tier];
  }

  /**
   * Get all tier thresholds
   */
  getTierThresholds(): Record<VipTier, number> {
    return {
      [VipTier.BRONZE]: 0,
      [VipTier.SILVER]: 1000,
      [VipTier.GOLD]: 5000,
      [VipTier.PLATINUM]: 20000,
    };
  }

  /**
   * Calculate points needed to reach next tier
   */
  private getPointsUntilNextTier(membership: VipMembership): number {
    const thresholds = this.getTierThresholds();

    const tiers = [VipTier.BRONZE, VipTier.SILVER, VipTier.GOLD, VipTier.PLATINUM];
    const currentTierIndex = tiers.indexOf(membership.tier);

    if (currentTierIndex === tiers.length - 1) {
      return 0; // Already at platinum
    }

    const nextTier = tiers[currentTierIndex + 1];
    const nextThreshold = thresholds[nextTier];

    return Math.max(0, nextThreshold - membership.current_points);
  }

  /**
   * T3-097: Check if order qualifies for free delivery
   */
  async checkFreeDeliveryEligibility(userId: string, orderAmount: number): Promise<boolean> {
    const membership = await this.getOrCreateMembership(userId);
    const benefits = membership.getTierBenefits();

    if (benefits.freeDeliveryThreshold === 0) {
      return true; // Platinum gets free delivery on all orders
    }

    return orderAmount >= benefits.freeDeliveryThreshold;
  }

  /**
   * T3-097: Get discount percentage for tier
   */
  async getApplicableDiscount(userId: string): Promise<number> {
    const membership = await this.getOrCreateMembership(userId);
    return membership.getTierBenefits().discountPercentage;
  }

  /**
   * Calculate tier upgrade
   */
  async updateTierIfEligible(userId: string): Promise<VipTier | null> {
    const membership = await this.getOrCreateMembership(userId);
    const newTier = membership.calculateTier();

    if (newTier !== membership.tier) {
      membership.tier = newTier;
      membership.tier_achieved_at = new Date();
      await this.vipRepo.save(membership);
      return newTier;
    }

    return null;
  }

  /**
   * Get membership summary
   */
  async getMembershipSummary(userId: string): Promise<{
    tier: VipTier;
    currentPoints: number;
    lifetimePoints: number;
    redeemedPoints: number;
    isActive: boolean;
    enrolledAt: Date | null;
    benefits: TierBenefits;
  }> {
    const membership = await this.getOrCreateMembership(userId);

    return {
      tier: membership.tier,
      currentPoints: membership.current_points,
      lifetimePoints: membership.lifetime_points,
      redeemedPoints: membership.redeemed_points,
      isActive: membership.is_active,
      enrolledAt: membership.enrolled_at,
      benefits: membership.getTierBenefits(),
    };
  }

  /**
   * Suspend membership
   */
  async suspendMembership(userId: string, reason: string): Promise<VipMembership> {
    const membership = await this.getOrCreateMembership(userId);

    membership.is_active = false;
    membership.suspended_at = new Date();
    membership.suspension_reason = reason;

    await this.vipRepo.save(membership);

    return membership;
  }

  /**
   * Reactivate membership
   */
  async reactivateMembership(userId: string): Promise<VipMembership> {
    const membership = await this.getOrCreateMembership(userId);

    membership.is_active = true;
    membership.suspended_at = null;
    membership.suspension_reason = null;
    membership.last_activity_at = new Date();

    await this.vipRepo.save(membership);

    return membership;
  }

  /**
   * Get all active VIP members at specific tier
   */
  async getMembersAtTier(tier: VipTier): Promise<VipMembership[]> {
    return await this.vipRepo.find({
      where: {
        tier,
        is_active: true,
      },
      relations: ['user'],
    });
  }

  /**
   * Get membership stats
   */
  async getMembershipStats(): Promise<{
    totalMembers: number;
    membersByTier: Record<VipTier, number>;
    averagePoints: number;
  }> {
    const allMembers = await this.vipRepo.find();

    const membersByTier: Record<VipTier, number> = {
      [VipTier.BRONZE]: 0,
      [VipTier.SILVER]: 0,
      [VipTier.GOLD]: 0,
      [VipTier.PLATINUM]: 0,
    };

    let totalPoints = 0;

    allMembers.forEach((member) => {
      membersByTier[member.tier]++;
      totalPoints += member.current_points;
    });

    return {
      totalMembers: allMembers.length,
      membersByTier,
      averagePoints: allMembers.length > 0 ? totalPoints / allMembers.length : 0,
    };
  }
}
