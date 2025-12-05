/**
 * Points Service
 * Manages points earning, redemption, and expiration
 * T3-096: Implement points system
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { VipMembership, VipTier } from '../../../../shared/models/VipMembership';
import { PointsTransaction, TransactionType, TransactionSource } from '../../../../shared/models/PointsTransaction';
import { User } from '../../../../shared/models/User';

export class PointsService {
  private vipRepo: Repository<VipMembership>;
  private transactionRepo: Repository<PointsTransaction>;
  private userRepo: Repository<User>;

  constructor() {
    this.vipRepo = AppDataSource.getRepository(VipMembership);
    this.transactionRepo = AppDataSource.getRepository(PointsTransaction);
    this.userRepo = AppDataSource.getRepository(User);
  }

  /**
   * T3-096: Earn points on purchase
   * 1 point per 1 CHF spent
   */
  async earnPointsFromPurchase(
    userId: string,
    amount: number,
    orderId: string,
  ): Promise<PointsTransaction> {
    let membership = await this.vipRepo.findOne({ where: { user_id: userId } });

    // Auto-enroll patient if not in VIP program
    if (!membership) {
      membership = await this.ensureVipMembership(userId);
    }

    const pointsEarned = Math.floor(amount); // 1 point per 1 CHF
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Expire in 12 months

    const transaction = this.transactionRepo.create({
      vip_membership_id: membership.id,
      type: TransactionType.EARNED,
      source: TransactionSource.PURCHASE,
      amount: pointsEarned,
      description: `Purchase points earned`,
      reference_id: orderId,
      related_amount: amount,
      order_id: orderId,
      expires_at: expiryDate,
      redeemed: false,
    });

    await this.transactionRepo.save(transaction);

    // Update membership points
    membership.current_points += pointsEarned;
    membership.lifetime_points += pointsEarned;
    membership.last_activity_at = new Date();

    // Update tier if needed
    const newTier = membership.calculateTier();
    if (newTier !== membership.tier) {
      membership.tier = newTier;
      membership.tier_achieved_at = new Date();
    }

    await this.vipRepo.save(membership);

    return transaction;
  }

  /**
   * T3-096: Double points on prescriptions
   */
  async earnPointsFromPrescription(
    userId: string,
    amount: number,
    prescriptionId: string,
  ): Promise<PointsTransaction> {
    let membership = await this.vipRepo.findOne({ where: { user_id: userId } });

    if (!membership) {
      membership = await this.ensureVipMembership(userId);
    }

    const pointsEarned = Math.floor(amount) * 2; // Double points for prescriptions
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const transaction = this.transactionRepo.create({
      vip_membership_id: membership.id,
      type: TransactionType.EARNED,
      source: TransactionSource.PRESCRIPTION,
      amount: pointsEarned,
      description: `Prescription points earned (double)`,
      reference_id: prescriptionId,
      related_amount: amount,
      prescription_id: prescriptionId,
      expires_at: expiryDate,
      redeemed: false,
    });

    await this.transactionRepo.save(transaction);

    membership.current_points += pointsEarned;
    membership.lifetime_points += pointsEarned;
    membership.last_activity_at = new Date();

    const newTier = membership.calculateTier();
    if (newTier !== membership.tier) {
      membership.tier = newTier;
      membership.tier_achieved_at = new Date();
    }

    await this.vipRepo.save(membership);

    return transaction;
  }

  /**
   * T3-096: Birthday bonus - 100 points once per year
   */
  async awardBirthdayBonus(userId: string): Promise<PointsTransaction | null> {
    const membership = await this.vipRepo.findOne({ where: { user_id: userId } });

    if (!membership) {
      return null;
    }

    // Check if already awarded this year
    const today = new Date();
    const thisYearStart = new Date(today.getFullYear(), 0, 1);

    if (membership.last_birthday_bonus_date) {
      const lastBonusYear = membership.last_birthday_bonus_date.getFullYear();
      if (lastBonusYear === today.getFullYear()) {
        return null; // Already awarded this year
      }
    }

    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const transaction = this.transactionRepo.create({
      vip_membership_id: membership.id,
      type: TransactionType.EARNED,
      source: TransactionSource.BIRTHDAY,
      amount: 100,
      description: `Birthday bonus`,
      expires_at: expiryDate,
      redeemed: false,
    });

    await this.transactionRepo.save(transaction);

    membership.current_points += 100;
    membership.lifetime_points += 100;
    membership.last_birthday_bonus_date = new Date();
    membership.last_activity_at = new Date();

    const newTier = membership.calculateTier();
    if (newTier !== membership.tier) {
      membership.tier = newTier;
      membership.tier_achieved_at = new Date();
    }

    await this.vipRepo.save(membership);

    return transaction;
  }

  /**
   * T3-096: Process point expiry
   * Remove expired points that haven't been redeemed
   */
  async expirePoints(): Promise<number> {
    const now = new Date();
    const expiringTransactions = await this.transactionRepo
      .createQueryBuilder('transaction')
      .where('transaction.expires_at <= :now', { now })
      .andWhere('transaction.redeemed = :redeemed', { redeemed: false })
      .andWhere('transaction.type = :type', { type: TransactionType.EARNED })
      .getMany();

    let totalExpired = 0;

    for (const transaction of expiringTransactions) {
      // Record expiration
      const expireTransaction = this.transactionRepo.create({
        vip_membership_id: transaction.vip_membership_id,
        type: TransactionType.EXPIRED,
        source: TransactionSource.BONUS,
        amount: -transaction.amount,
        description: `Expired points from transaction ${transaction.id}`,
        reference_id: transaction.id,
        expires_at: null,
        redeemed: false,
      });

      await this.transactionRepo.save(expireTransaction);
      totalExpired += transaction.amount;

      // Update membership
      const membership = await this.vipRepo.findOne({
        where: { id: transaction.vip_membership_id },
      });

      if (membership) {
        membership.current_points -= transaction.amount;
        if (membership.current_points < 0) {
          membership.current_points = 0;
        }

        const newTier = membership.calculateTier();
        if (newTier !== membership.tier) {
          membership.tier = newTier;
        }

        await this.vipRepo.save(membership);
      }
    }

    return totalExpired;
  }

  /**
   * Redeem points for discount
   */
  async redeemPoints(
    userId: string,
    pointsToRedeem: number,
    orderId: string,
  ): Promise<PointsTransaction> {
    const membership = await this.vipRepo.findOne({
      where: { user_id: userId },
    });

    if (!membership) {
      throw new Error('VIP membership not found');
    }

    if (membership.current_points < pointsToRedeem) {
      throw new Error('Insufficient points');
    }

    const transaction = this.transactionRepo.create({
      vip_membership_id: membership.id,
      type: TransactionType.REDEEMED,
      source: TransactionSource.DISCOUNT_REDEMPTION,
      amount: -pointsToRedeem,
      description: `Redeemed ${pointsToRedeem} points for discount`,
      reference_id: orderId,
      order_id: orderId,
      redeemed: true,
      redeemed_at: new Date(),
    });

    await this.transactionRepo.save(transaction);

    membership.current_points -= pointsToRedeem;
    membership.redeemed_points += pointsToRedeem;
    membership.last_activity_at = new Date();

    const newTier = membership.calculateTier();
    if (newTier !== membership.tier) {
      membership.tier = newTier;
    }

    await this.vipRepo.save(membership);

    return transaction;
  }

  /**
   * Get points history for user
   */
  async getPointsHistory(userId: string, limit: number = 50): Promise<PointsTransaction[]> {
    const membership = await this.vipRepo.findOne({ where: { user_id: userId } });

    if (!membership) {
      return [];
    }

    return await this.transactionRepo.find({
      where: { vip_membership_id: membership.id },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  /**
   * Helper: Ensure VIP membership exists
   */
  private async ensureVipMembership(userId: string): Promise<VipMembership> {
    let membership = await this.vipRepo.findOne({ where: { user_id: userId } });

    if (!membership) {
      membership = this.vipRepo.create({
        user_id: userId,
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
}
