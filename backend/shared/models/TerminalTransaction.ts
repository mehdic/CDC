/**
 * Terminal Transaction Entity
 * Card payment transactions collected via mobile terminal
 * Tracks card present and contactless payments
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
  Relation,
} from 'typeorm';
import { TerminalDevice } from './TerminalDevice';
import { CODTransaction } from './CODTransaction';
import { User } from './User';

export enum TerminalTransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  APPROVED = 'approved',
  DECLINED = 'declined',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum TerminalPaymentType {
  CARD_PRESENT = 'card_present', // Chip & PIN
  CONTACTLESS = 'contactless', // NFC/Tap
  MOBILE_WALLET = 'mobile_wallet', // Apple/Google Pay
}

export enum TerminalCardScheme {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  AMEX = 'amex',
  DINERS = 'diners',
  UNKNOWN = 'unknown',
}

@Entity('terminal_transactions')
export class TerminalTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ============================================================================
  // Terminal & Device
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_terminal_trans_device')
  terminal_id!: string;

  @ManyToOne(() => TerminalDevice, (device) => device.transactions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'terminal_id' })
  terminal!: Relation<TerminalDevice>;

  // ============================================================================
  // COD Transaction Link
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_terminal_trans_cod')
  cod_transaction_id!: string;

  @ManyToOne(() => CODTransaction, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cod_transaction_id' })
  cod_transaction!: Relation<CODTransaction>;

  // ============================================================================
  // Driver & Location
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_terminal_trans_driver')
  driver_id!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'driver_id' })
  driver!: Relation<User>;

  @Column({ type: 'uuid' })
  @Index('idx_terminal_trans_delivery')
  delivery_id!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location_address!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  location_latitude!: number | null;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  location_longitude!: number | null;

  // ============================================================================
  // Payment Details
  // ============================================================================

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number; // Amount in CHF

  @Column({
    type: 'enum',
    enum: TerminalPaymentType,
  })
  payment_type!: TerminalPaymentType;

  @Column({
    type: 'enum',
    enum: TerminalCardScheme,
    nullable: true,
  })
  card_scheme!: TerminalCardScheme | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  card_last4!: string | null; // Last 4 digits of card

  @Column({ type: 'varchar', length: 50, nullable: true })
  card_holder_name!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cardholder_country!: string | null;

  // ============================================================================
  // Transaction Status
  // ============================================================================

  @Column({
    type: 'enum',
    enum: TerminalTransactionStatus,
    default: TerminalTransactionStatus.PENDING,
  })
  @Index('idx_terminal_trans_status')
  status!: TerminalTransactionStatus;

  @Column({ type: 'text', nullable: true })
  status_message!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  response_code!: string | null; // e.g., '00' for approved

  // ============================================================================
  // SumUp Integration
  // ============================================================================

  @Column({ type: 'varchar', length: 100, nullable: true })
  sumup_transaction_id!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sumup_receipt_id!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  sumup_processed_at!: Date | null;

  // ============================================================================
  // Authorization Details
  // ============================================================================

  @Column({ type: 'varchar', length: 20, nullable: true })
  auth_code!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  rrn!: string | null; // Retrieval Reference Number

  @Column({ type: 'boolean', default: false })
  requires_signature!: boolean;

  @Column({ type: 'text', nullable: true })
  signature_data!: string | null; // Base64 encoded signature

  @Column({ type: 'boolean', default: false })
  signature_verified!: boolean;

  // ============================================================================
  // Offline & Sync
  // ============================================================================

  @Column({ type: 'boolean', default: false })
  was_offline_transaction!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  offline_captured_at!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  synced_at!: Date | null;

  @Column({ type: 'boolean', default: false })
  is_synced!: boolean;

  // ============================================================================
  // Receipt & Documentation
  // ============================================================================

  @Column({ type: 'text', nullable: true })
  receipt_text!: string | null; // Plain text receipt

  @Column({ type: 'varchar', length: 500, nullable: true })
  receipt_url!: string | null; // Stored receipt PDF/image URL

  @Column({ type: 'boolean', default: false })
  receipt_emailed!: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  receipt_email!: string | null;

  @Column({ type: 'boolean', default: false })
  receipt_printed!: boolean;

  // ============================================================================
  // Refund Information
  // ============================================================================

  @Column({ type: 'uuid', nullable: true })
  refund_transaction_id!: string | null; // Link to refund transaction if refunded

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  refunded_amount!: number | null;

  @Column({ type: 'timestamp', nullable: true })
  refunded_at!: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  refund_reason!: string | null;

  // ============================================================================
  // Metadata
  // ============================================================================

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  @Index('idx_terminal_trans_created')
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  // ============================================================================
  // Business Logic Methods
  // ============================================================================

  /**
   * Mark transaction as processing
   */
  markAsProcessing(): void {
    this.status = TerminalTransactionStatus.PROCESSING;
  }

  /**
   * Mark transaction as approved
   */
  markAsApproved(
    sumupTransactionId: string,
    authCode: string,
    rrn?: string,
    metadata?: Record<string, any>
  ): void {
    this.status = TerminalTransactionStatus.APPROVED;
    this.sumup_transaction_id = sumupTransactionId;
    this.auth_code = authCode;
    if (rrn) {
      this.rrn = rrn;
    }
    this.sumup_processed_at = new Date();
    if (metadata) {
      this.metadata = { ...this.metadata, ...metadata };
    }
  }

  /**
   * Mark transaction as declined
   */
  markAsDeclined(responseCode: string, message: string): void {
    this.status = TerminalTransactionStatus.DECLINED;
    this.response_code = responseCode;
    this.status_message = message;
  }

  /**
   * Mark transaction as failed
   */
  markAsFailed(message: string, errorCode?: string): void {
    this.status = TerminalTransactionStatus.FAILED;
    this.status_message = message;
    if (errorCode) {
      this.response_code = errorCode;
    }
  }

  /**
   * Mark transaction as cancelled
   */
  markAsCancelled(reason: string): void {
    this.status = TerminalTransactionStatus.CANCELLED;
    this.status_message = reason;
  }

  /**
   * Mark as successfully synced from offline
   */
  markAssynced(): void {
    this.is_synced = true;
    this.synced_at = new Date();
  }

  /**
   * Generate digital receipt
   */
  generateReceipt(merchantName: string, merchantAddress: string): string {
    const timestamp = this.created_at.toLocaleString('en-CH', {
      timeZone: 'Europe/Zurich',
    });

    const receipt = `
=====================================
${merchantName}
${merchantAddress}
=====================================
Date: ${timestamp}
Card Terminal Payment
-------------------------------------
Payment Type: ${this.payment_type.toUpperCase()}
Amount: CHF ${this.amount.toFixed(2)}
Card: ${this.card_scheme} ${this.card_last4}
Cardholder: ${this.card_holder_name || 'N/A'}
Auth Code: ${this.auth_code || 'N/A'}
RRN: ${this.rrn || 'N/A'}
=====================================
Status: ${this.status.toUpperCase()}
Receipt ID: ${this.sumup_receipt_id || this.id}
=====================================
Driver: ${this.driver_id}
Delivery: ${this.delivery_id}
=====================================
Thank you!
    `.trim();

    this.receipt_text = receipt;
    return receipt;
  }

  /**
   * Check if transaction is approved
   */
  isApproved(): boolean {
    return this.status === TerminalTransactionStatus.APPROVED;
  }

  /**
   * Check if transaction failed/declined
   */
  isFailed(): boolean {
    return (
      this.status === TerminalTransactionStatus.DECLINED ||
      this.status === TerminalTransactionStatus.FAILED ||
      this.status === TerminalTransactionStatus.CANCELLED
    );
  }

  /**
   * Check if can be refunded
   */
  canBeRefunded(): boolean {
    return this.status === TerminalTransactionStatus.APPROVED && !this.refund_transaction_id;
  }

  /**
   * Mark as refunded
   */
  markAsRefunded(refundAmount: number, reason: string): void {
    this.status = TerminalTransactionStatus.REFUNDED;
    this.refunded_amount = refundAmount;
    this.refunded_at = new Date();
    this.refund_reason = reason;
  }

  /**
   * Get display status
   */
  getStatusDisplay(): string {
    const displays: Record<TerminalTransactionStatus, string> = {
      [TerminalTransactionStatus.PENDING]: 'Pending',
      [TerminalTransactionStatus.PROCESSING]: 'Processing...',
      [TerminalTransactionStatus.APPROVED]: 'Approved',
      [TerminalTransactionStatus.DECLINED]: 'Declined',
      [TerminalTransactionStatus.FAILED]: 'Failed',
      [TerminalTransactionStatus.CANCELLED]: 'Cancelled',
      [TerminalTransactionStatus.REFUNDED]: 'Refunded',
    };
    return displays[this.status];
  }
}
