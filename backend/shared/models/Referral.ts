/**
 * Referral Entity
 * Tracks patient referrals for the VIP referral program
 * T6-024: Implement referral program for patient acquisition
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
import { ReferralReward } from './ReferralReward';

export enum ReferralStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Referrer & Referee
  // ============================================================================

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'referrer_id' })
  referrer: User;

  @Column({ type: 'uuid' })
  @Index('idx_referral_referrer_id')
  referrer_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'referee_id' })
  referee: User | null;

  @Column({ type: 'uuid', nullable: true })
  @Index('idx_referral_referee_id')
  referee_id: string | null;

  // ============================================================================
  // Referral Code & Status
  // ============================================================================

  @Column({ type: 'varchar', length: 20, unique: true })
  @Index('idx_referral_code')
  referral_code: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: ReferralStatus.PENDING,
  })
  @Index('idx_referral_status')
  status: ReferralStatus;

  // ============================================================================
  // Rewards
  // ============================================================================

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  referrer_reward: number | null; // CHF amount for referrer

  @Column({ type: 'varchar', length: 50, default: 'points' })
  referrer_reward_type: string; // 'points', 'discount', 'credit'

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  referee_reward: number | null; // CHF amount for referee

  @Column({ type: 'varchar', length: 50, default: 'points' })
  referee_reward_type: string; // 'points', 'discount', 'credit'

  @Column({ type: 'boolean', default: false })
  rewards_applied: boolean; // Whether rewards have been applied

  // ============================================================================
  // Completion Tracking
  // ============================================================================

  @Column({ type: 'timestamp', nullable: true })
  @Index('idx_referral_completed_at')
  completed_at: Date | null; // When referee completed their first purchase

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date | null; // Referral code expires if not used within 90 days

  @Column({ type: 'uuid', nullable: true })
  @Index('idx_referral_order_id')
  completing_order_id: string | null; // The order that completed the referral

  // ============================================================================
  // Additional Info
  // ============================================================================

  @Column({ type: 'varchar', length: 255, nullable: true })
  referee_email: string | null; // Email used to send referral invitation

  @Column({ type: 'varchar', length: 255, nullable: true })
  referee_phone: string | null; // Phone used to send referral invitation

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any> | null; // Additional context (utm_source, etc.)

  // ============================================================================
  // Relationships
  // ============================================================================

  @OneToMany(() => ReferralReward, (reward) => reward.referral, {
    cascade: true,
  })
  rewards: ReferralReward[];

  // ============================================================================
  // Timestamps
  // ============================================================================

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cancellation_reason: string | null;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if referral code has expired
   */
  isExpired(): boolean {
    if (!this.expires_at) {
      return false;
    }
    return new Date() > this.expires_at && this.status !== ReferralStatus.COMPLETED;
  }

  /**
   * Check if referral is still active for use
   */
  isActive(): boolean {
    return this.status === ReferralStatus.PENDING && !this.isExpired();
  }

  /**
   * Check if referral was successfully completed
   */
  isCompleted(): boolean {
    return this.status === ReferralStatus.COMPLETED;
  }

  /**
   * Get display string for referral (e.g., for sharing)
   */
  getShareText(appUrl: string): string {
    return `Join me on MetaPharm Connect! Use my referral code ${this.referral_code} and get rewards. ${appUrl}?ref=${this.referral_code}`;
  }
}
