/**
 * Points Transaction Entity
 * Tracks all points earned and redeemed by VIP members
 * T3-096: Implement points system
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
import { VipMembership } from './VipMembership';

export enum TransactionType {
  EARNED = 'earned',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
  ADJUSTED = 'adjusted',
}

export enum TransactionSource {
  PURCHASE = 'purchase',
  PRESCRIPTION = 'prescription',
  BIRTHDAY = 'birthday',
  BONUS = 'bonus',
  MANUAL = 'manual',
  DISCOUNT_REDEMPTION = 'discount_redemption',
}

@Entity('points_transactions')
export class PointsTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => VipMembership, (membership) => membership.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vip_membership_id' })
  vip_membership: VipMembership;

  @Column({ type: 'uuid' })
  @Index('idx_transaction_vip_id')
  vip_membership_id: string;

  // ============================================================================
  // Transaction Details
  // ============================================================================

  @Column({
    type: 'varchar',
    length: 20,
  })
  type: TransactionType; // earned, redeemed, expired, adjusted

  @Column({
    type: 'varchar',
    length: 30,
  })
  source: TransactionSource; // purchase, prescription, birthday, bonus, etc.

  @Column({ type: 'integer' })
  amount: number; // Number of points

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null; // Human readable description

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference_id: string | null; // Reference to order, prescription, etc.

  // ============================================================================
  // Expiry Tracking
  // ============================================================================

  @Column({ type: 'timestamp', nullable: true })
  @Index('idx_transaction_expires_at')
  expires_at: Date | null; // Points expire 12 months after earning

  @Column({ type: 'boolean', default: false })
  redeemed: boolean; // Whether these points have been redeemed

  @Column({ type: 'timestamp', nullable: true })
  redeemed_at: Date | null; // When redeemed

  // ============================================================================
  // Context
  // ============================================================================

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  related_amount: number | null; // Amount in CHF if from purchase/prescription

  @Column({ type: 'uuid', nullable: true })
  @Index('idx_transaction_order_id')
  order_id: string | null; // Link to order if applicable

  @Column({ type: 'uuid', nullable: true })
  prescription_id: string | null; // Link to prescription if applicable

  // ============================================================================
  // Audit
  // ============================================================================

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null; // User or system who created this transaction

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes: string | null; // Additional notes (admin comments, etc.)
}
