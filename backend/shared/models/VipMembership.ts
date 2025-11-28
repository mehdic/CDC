/**
 * VIP Membership Entity
 * Represents patient VIP program membership with tier levels and benefits
 * T3-095: Design VIP program architecture
 * T3-097: Implement tier benefits
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './User';
import { PointsTransaction } from './PointsTransaction';

export enum VipTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

export interface TierBenefits {
  discountPercentage: number;
  exclusiveOffers: boolean;
  prioritySupport: boolean;
  freeDeliveryThreshold: number; // CHF amount
}

@Entity('vip_memberships')
export class VipMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  @Index('idx_vip_user_id')
  user_id: string;

  // ============================================================================
  // Points System
  // ============================================================================

  @Column({ type: 'integer', default: 0 })
  current_points: number; // Total active points

  @Column({ type: 'integer', default: 0 })
  lifetime_points: number; // Cumulative points earned

  // ============================================================================
  // Tier Management
  // ============================================================================

  @Column({
    type: 'varchar',
    length: 20,
    default: VipTier.BRONZE,
  })
  @Index('idx_vip_tier')
  tier: VipTier;

  @Column({ type: 'timestamp', nullable: true })
  tier_achieved_at: Date | null; // When current tier was reached

  @Column({ type: 'timestamp', nullable: true })
  next_tier_expiry: Date | null; // When tier expires if no activity

  // ============================================================================
  // Status & Enrollment
  // ============================================================================

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  enrolled_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  suspended_at: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  suspension_reason: string | null;

  // ============================================================================
  // Benefits & Redemptions
  // ============================================================================

  @Column({ type: 'integer', default: 0 })
  redeemed_points: number; // Points used for discounts

  @Column({ type: 'timestamp', nullable: true })
  last_birthday_bonus_date: Date | null; // Track birthday bonus per year

  // ============================================================================
  // Timestamps
  // ============================================================================

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_activity_at: Date | null; // Last points transaction

  // ============================================================================
  // Relations
  // ============================================================================

  @OneToMany(() => PointsTransaction, (transaction) => transaction.vip_membership, {
    cascade: true,
  })
  transactions: PointsTransaction[];

  // ============================================================================
  // Methods
  // ============================================================================

  /**
   * Calculate tier based on current points
   */
  calculateTier(): VipTier {
    if (this.current_points >= 20000) {
      return VipTier.PLATINUM;
    } else if (this.current_points >= 5000) {
      return VipTier.GOLD;
    } else if (this.current_points >= 1000) {
      return VipTier.SILVER;
    }
    return VipTier.BRONZE;
  }

  /**
   * Get tier benefits for current tier
   */
  getTierBenefits(): TierBenefits {
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
    return benefits[this.tier];
  }

  /**
   * Points expire 12 months after transaction
   */
  getExpiringPoints(beforeDate: Date): number {
    if (!this.transactions) return 0;
    return this.transactions
      .filter(
        (tx) =>
          tx.type === 'earned' &&
          tx.expires_at &&
          tx.expires_at <= beforeDate &&
          !tx.redeemed,
      )
      .reduce((sum, tx) => sum + tx.amount, 0);
  }
}
