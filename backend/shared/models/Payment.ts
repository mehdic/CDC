/**
 * Payment Entity
 * PCI-DSS compliant payment processing with tokenization
 * HIPAA/GDPR compliant with audit logging
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

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  INSURANCE = 'insurance',
  CASH = 'cash',
}

export enum Currency {
  CHF = 'CHF', // Swiss Franc
  EUR = 'EUR',
  USD = 'USD',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // User Relationship
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_payments_user')
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // ============================================================================
  // Order Relationship (nullable for standalone payments)
  // ============================================================================

  @Column({ type: 'uuid', nullable: true })
  @Index('idx_payments_order')
  order_id: string | null;

  // TODO: Add ManyToOne relationship when Order model is created
  // @ManyToOne(() => Order, { onDelete: 'RESTRICT' })
  // @JoinColumn({ name: 'order_id' })
  // order: Order | null;

  // ============================================================================
  // Payment Details
  // ============================================================================

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.CHF,
  })
  currency: Currency;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  @Index('idx_payments_status')
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  @Index('idx_payments_method')
  payment_method: PaymentMethod;

  // ============================================================================
  // PCI-DSS Compliance: NEVER store raw card data
  // Store tokenized references only
  // ============================================================================

  /**
   * PCI-DSS: Payment token from payment gateway (Stripe, Adyen, etc.)
   * This is NOT the raw card number
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  payment_token: string | null;

  /**
   * PCI-DSS: Last 4 digits of card (safe to store per PCI-DSS SAQ A)
   * For display purposes only
   */
  @Column({ type: 'varchar', length: 4, nullable: true })
  card_last_four: string | null;

  /**
   * Card brand (Visa, Mastercard, etc.)
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  card_brand: string | null;

  /**
   * Gateway transaction ID (from Stripe, Adyen, etc.)
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  gateway_transaction_id: string | null;

  // ============================================================================
  // Insurance (Swiss-specific)
  // ============================================================================

  @Column({ type: 'varchar', length: 100, nullable: true })
  insurance_provider: string | null; // e.g., "Swica", "Helsana"

  @Column({ type: 'varchar', length: 100, nullable: true })
  insurance_policy_number: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  insurance_coverage_amount: number | null; // Amount covered by insurance

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  patient_copay_amount: number | null; // Amount patient must pay

  // ============================================================================
  // Refund Tracking
  // ============================================================================

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refunded_amount: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  refund_reason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  refunded_at: Date | null;

  // ============================================================================
  // Metadata (encrypted if contains PHI)
  // ============================================================================

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  // ============================================================================
  // Tracking
  // ============================================================================

  @Column({ type: 'timestamp', nullable: true })
  processed_at: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  error_message: string | null; // If payment failed

  @CreateDateColumn({ type: 'timestamp' })
  @Index('idx_payments_created')
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Mark payment as processing
   */
  markAsProcessing(): void {
    this.status = PaymentStatus.PROCESSING;
  }

  /**
   * Mark payment as completed
   */
  markAsCompleted(): void {
    this.status = PaymentStatus.COMPLETED;
    this.processed_at = new Date();
  }

  /**
   * Mark payment as failed
   */
  markAsFailed(errorMessage: string): void {
    this.status = PaymentStatus.FAILED;
    this.error_message = errorMessage;
  }

  /**
   * Process refund (full or partial)
   */
  processRefund(amount: number, reason: string): void {
    if (amount > this.amount - this.refunded_amount) {
      throw new Error('Refund amount exceeds remaining payment amount');
    }

    this.refunded_amount += amount;
    this.refund_reason = reason;
    this.refunded_at = new Date();

    if (this.refunded_amount >= this.amount) {
      this.status = PaymentStatus.REFUNDED;
    } else {
      this.status = PaymentStatus.PARTIALLY_REFUNDED;
    }
  }

  /**
   * Check if payment is completed
   */
  isCompleted(): boolean {
    return this.status === PaymentStatus.COMPLETED;
  }

  /**
   * Check if payment is pending
   */
  isPending(): boolean {
    return this.status === PaymentStatus.PENDING;
  }

  /**
   * Check if payment failed
   */
  isFailed(): boolean {
    return this.status === PaymentStatus.FAILED;
  }

  /**
   * Check if payment is refunded (fully or partially)
   */
  isRefunded(): boolean {
    return this.status === PaymentStatus.REFUNDED || this.status === PaymentStatus.PARTIALLY_REFUNDED;
  }

  /**
   * Get remaining refundable amount
   */
  getRemainingRefundableAmount(): number {
    return this.amount - this.refunded_amount;
  }

  /**
   * PCI-DSS: Get masked card number for display
   */
  getMaskedCardNumber(): string | null {
    if (!this.card_last_four) {
      return null;
    }
    return `**** **** **** ${this.card_last_four}`;
  }
}
