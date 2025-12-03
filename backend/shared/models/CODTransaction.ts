/**
 * COD Transaction Entity
 * Cash on Delivery payment transactions
 * Tracks payment collection and driver settlement
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './User';

export enum CODStatus {
  PENDING = 'pending',
  COLLECTED = 'collected',
  SETTLED = 'settled',
  CANCELLED = 'cancelled',
}

export enum CODPaymentMethod {
  CASH = 'cash',
  CARD = 'card', // Card terminal at door
}

@Entity('cod_transactions')
export class CODTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ============================================================================
  // Order & Delivery Relationship
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_cod_transactions_order')
  order_id!: string;

  @Column({ type: 'uuid' })
  @Index('idx_cod_transactions_delivery')
  delivery_id!: string;

  // ============================================================================
  // Driver Relationship
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_cod_transactions_driver')
  driver_id!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'driver_id' })
  driver!: User;

  // ============================================================================
  // Payment Details
  // ============================================================================

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number; // Total COD amount (order + delivery fee)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  collected_amount!: number | null; // Actual amount collected (may differ if change issues)

  @Column({
    type: 'enum',
    enum: CODStatus,
    default: CODStatus.PENDING,
  })
  @Index('idx_cod_transactions_status')
  status!: CODStatus;

  @Column({
    type: 'enum',
    enum: CODPaymentMethod,
    nullable: true,
  })
  payment_method!: CODPaymentMethod | null; // Set when collected

  // ============================================================================
  // Collection Details
  // ============================================================================

  @Column({ type: 'timestamp', nullable: true })
  collected_at!: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  change_given!: number; // Change returned to customer

  @Column({ type: 'text', nullable: true })
  collection_notes!: string | null; // Any notes from driver

  // ============================================================================
  // Settlement Details
  // ============================================================================

  @Column({ type: 'uuid', nullable: true })
  @Index('idx_cod_transactions_settlement')
  settlement_id!: string | null; // Reference to driver settlement

  @Column({ type: 'timestamp', nullable: true })
  settled_at!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  settled_by!: string | null; // User who processed settlement

  // ============================================================================
  // Metadata
  // ============================================================================

  @Column({ type: 'text', nullable: true })
  cancellation_reason!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamp' })
  @Index('idx_cod_transactions_created')
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  // ============================================================================
  // Business Logic Methods
  // ============================================================================

  /**
   * Mark as collected
   */
  markAsCollected(
    collectedAmount: number,
    paymentMethod: CODPaymentMethod,
    changeGiven: number = 0,
    notes?: string
  ): void {
    this.status = CODStatus.COLLECTED;
    this.collected_amount = collectedAmount;
    this.payment_method = paymentMethod;
    this.change_given = changeGiven;
    this.collected_at = new Date();
    if (notes) {
      this.collection_notes = notes;
    }
  }

  /**
   * Mark as settled
   */
  markAsSettled(settlementId: string, settledBy: string): void {
    this.status = CODStatus.SETTLED;
    this.settlement_id = settlementId;
    this.settled_at = new Date();
    this.settled_by = settledBy;
  }

  /**
   * Cancel transaction
   */
  cancel(reason: string): void {
    this.status = CODStatus.CANCELLED;
    this.cancellation_reason = reason;
  }

  /**
   * Check if collected
   */
  isCollected(): boolean {
    return this.status === CODStatus.COLLECTED || this.status === CODStatus.SETTLED;
  }

  /**
   * Check if settled
   */
  isSettled(): boolean {
    return this.status === CODStatus.SETTLED;
  }

  /**
   * Check if pending
   */
  isPending(): boolean {
    return this.status === CODStatus.PENDING;
  }

  /**
   * Get variance (difference between expected and collected)
   */
  getVariance(): number {
    if (this.collected_amount === null) {
      return 0;
    }
    return this.collected_amount - this.amount;
  }

  /**
   * Validate COD amount limits (business rule: max CHF 500)
   */
  validateAmount(): { valid: boolean; error?: string } {
    const MAX_COD_AMOUNT = 500;

    if (this.amount <= 0) {
      return { valid: false, error: 'COD amount must be greater than 0' };
    }

    if (this.amount > MAX_COD_AMOUNT) {
      return {
        valid: false,
        error: `COD amount exceeds maximum limit of CHF ${MAX_COD_AMOUNT}`,
      };
    }

    return { valid: true };
  }
}
