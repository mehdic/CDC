/**
 * Referral Reward Entity
 * Tracks rewards distributed for referrals
 * T6-024: Implement referral program for patient acquisition
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Referral } from './Referral';
import { User } from './User';

export enum RewardType {
  POINTS = 'points',
  DISCOUNT = 'discount',
  CREDIT = 'credit',
}

@Entity('referral_rewards')
export class ReferralReward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Relationships
  // ============================================================================

  @ManyToOne(() => Referral, (referral) => referral.rewards, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'referral_id' })
  referral: Referral;

  @Column({ type: 'uuid' })
  @Index('idx_reward_referral_id')
  referral_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;

  @Column({ type: 'uuid' })
  @Index('idx_reward_recipient_id')
  recipient_id: string;

  // ============================================================================
  // Reward Details
  // ============================================================================

  @Column({
    type: 'varchar',
    length: 20,
  })
  reward_type: RewardType; // 'points', 'discount', 'credit'

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  reward_value: number; // Amount in CHF or points

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null; // Human-readable description

  // ============================================================================
  // Application Status
  // ============================================================================

  @Column({ type: 'boolean', default: false })
  is_applied: boolean; // Whether reward has been credited to user account

  @Column({ type: 'timestamp', nullable: true })
  applied_at: Date | null; // When reward was applied

  // ============================================================================
  // Expiry & Usage
  // ============================================================================

  @Column({ type: 'timestamp', nullable: true })
  @Index('idx_reward_expires_at')
  expires_at: Date | null; // When reward expires (typically 12 months)

  @Column({ type: 'timestamp', nullable: true })
  redeemed_at: Date | null; // When reward was redeemed/used

  // ============================================================================
  // Context
  // ============================================================================

  @Column({ type: 'uuid', nullable: true })
  @Index('idx_reward_transaction_id')
  transaction_id: string | null; // Link to points transaction or payment

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any> | null; // Additional context

  // ============================================================================
  // Timestamps
  // ============================================================================

  @CreateDateColumn()
  created_at: Date;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if reward has expired
   */
  isExpired(): boolean {
    if (!this.expires_at) {
      return false;
    }
    return new Date() > this.expires_at && !this.redeemed_at;
  }

  /**
   * Check if reward can be applied
   */
  canApply(): boolean {
    return !this.is_applied && !this.isExpired();
  }
}
