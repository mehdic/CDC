/**
 * Order Entity
 * E-commerce orders for pharmacy products (OTC, parapharmacy)
 * Based on: /specs/002-metapharm-platform/data-model.md
 * Batch 3 Phase 4 - Delivery & Order Services
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
import { Pharmacy } from './Pharmacy';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Multi-Tenant Isolation
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_orders_pharmacy')
  pharmacy_id: string;

  @ManyToOne(() => Pharmacy, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pharmacy_id' })
  pharmacy: Pharmacy;

  // ============================================================================
  // Customer
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_orders_user')
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // ============================================================================
  // Order Status
  // ============================================================================

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  @Index('idx_orders_status')
  status: OrderStatus;

  // ============================================================================
  // Order Items (HIPAA Compliant - Encrypted)
  // ============================================================================

  @Column({ type: 'jsonb' })
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;

  // ============================================================================
  // Pricing
  // ============================================================================

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shipping_cost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  // ============================================================================
  // Payment
  // ============================================================================

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  @Index('idx_orders_payment_status')
  payment_status: PaymentStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  payment_method: string | null; // 'credit_card', 'paypal', 'insurance', etc.

  @Column({ type: 'varchar', length: 255, nullable: true })
  payment_transaction_id: string | null;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date | null;

  // ============================================================================
  // Delivery (HIPAA Compliant - Encrypted)
  // ============================================================================

  @Column({ type: 'bytea', nullable: true })
  shipping_address_encrypted: Buffer | null; // AWS KMS encrypted PHI

  @Column({ type: 'bytea', nullable: true })
  shipping_notes_encrypted: Buffer | null; // AWS KMS encrypted PHI

  @Column({ type: 'varchar', length: 100, nullable: true })
  delivery_method: string | null; // 'home_delivery', 'pickup', etc.

  @Column({ type: 'uuid', nullable: true })
  @Index('idx_orders_delivery')
  delivery_id: string | null; // Reference to delivery tracking

  // ============================================================================
  // Notes
  // ============================================================================

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'text', nullable: true })
  cancellation_reason: string | null;

  // ============================================================================
  // Metadata
  // ============================================================================

  @CreateDateColumn({ type: 'timestamp' })
  @Index('idx_orders_created')
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  confirmed_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at: Date | null;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if order is pending
   */
  isPending(): boolean {
    return this.status === OrderStatus.PENDING;
  }

  /**
   * Check if order is confirmed
   */
  isConfirmed(): boolean {
    return this.status === OrderStatus.CONFIRMED;
  }

  /**
   * Check if order is processing
   */
  isProcessing(): boolean {
    return this.status === OrderStatus.PROCESSING;
  }

  /**
   * Check if order is completed
   */
  isCompleted(): boolean {
    return this.status === OrderStatus.COMPLETED;
  }

  /**
   * Check if order is cancelled
   */
  isCancelled(): boolean {
    return this.status === OrderStatus.CANCELLED;
  }

  /**
   * Check if payment is completed
   */
  isPaid(): boolean {
    return this.payment_status === PaymentStatus.PAID;
  }

  /**
   * Check if order can be cancelled
   */
  canBeCancelled(): boolean {
    return (
      this.status === OrderStatus.PENDING ||
      this.status === OrderStatus.CONFIRMED
    );
  }

  /**
   * Calculate total items count
   */
  getTotalItemsCount(): number {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Confirm order
   */
  confirm(): void {
    this.status = OrderStatus.CONFIRMED;
    this.confirmed_at = new Date();
  }

  /**
   * Mark as processing
   */
  process(): void {
    this.status = OrderStatus.PROCESSING;
  }

  /**
   * Complete order
   */
  complete(): void {
    this.status = OrderStatus.COMPLETED;
    this.completed_at = new Date();
  }

  /**
   * Cancel order
   */
  cancel(reason?: string): void {
    this.status = OrderStatus.CANCELLED;
    this.cancelled_at = new Date();
    if (reason) {
      this.cancellation_reason = reason;
    }
  }

  /**
   * Mark payment as completed
   */
  markAsPaid(transactionId: string): void {
    this.payment_status = PaymentStatus.PAID;
    this.payment_transaction_id = transactionId;
    this.paid_at = new Date();
  }
}
