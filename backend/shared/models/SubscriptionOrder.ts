/**
 * SubscriptionOrder Entity
 * Links subscriptions to generated orders (scheduled delivery tracking)
 * Task T6-016 - Subscription Service Implementation
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
import { Subscription } from './Subscription';

export enum SubscriptionOrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

@Entity('subscription_orders')
export class SubscriptionOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Subscription Relationship
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_subscription_orders_subscription')
  subscription_id: string;

  @ManyToOne(() => Subscription, (subscription) => subscription.orders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  // ============================================================================
  // Order Relationship
  // ============================================================================

  @Column({ type: 'uuid', nullable: true })
  @Index('idx_subscription_orders_order')
  order_id: string | null; // Reference to Order entity (null if not yet created)

  // ============================================================================
  // Scheduling
  // ============================================================================

  @Column({ type: 'date' })
  @Index('idx_subscription_orders_scheduled')
  scheduled_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  processed_at: Date | null;

  @Column({
    type: 'enum',
    enum: SubscriptionOrderStatus,
    default: SubscriptionOrderStatus.PENDING,
  })
  @Index('idx_subscription_orders_status')
  status: SubscriptionOrderStatus;

  // ============================================================================
  // Processing Details
  // ============================================================================

  @Column({ type: 'text', nullable: true })
  error_message: string | null; // If failed

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // ============================================================================
  // Metadata
  // ============================================================================

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Mark as processing
   */
  markAsProcessing(): void {
    this.status = SubscriptionOrderStatus.PROCESSING;
  }

  /**
   * Mark as completed
   */
  markAsCompleted(orderId: string): void {
    this.status = SubscriptionOrderStatus.COMPLETED;
    this.order_id = orderId;
    this.processed_at = new Date();
  }

  /**
   * Mark as failed
   */
  markAsFailed(error: string): void {
    this.status = SubscriptionOrderStatus.FAILED;
    this.error_message = error;
    this.processed_at = new Date();
  }

  /**
   * Mark as skipped
   */
  markAsSkipped(reason?: string): void {
    this.status = SubscriptionOrderStatus.SKIPPED;
    this.notes = reason || 'Skipped by user';
    this.processed_at = new Date();
  }

  /**
   * Check if pending
   */
  isPending(): boolean {
    return this.status === SubscriptionOrderStatus.PENDING;
  }

  /**
   * Check if completed
   */
  isCompleted(): boolean {
    return this.status === SubscriptionOrderStatus.COMPLETED;
  }

  /**
   * Check if failed
   */
  isFailed(): boolean {
    return this.status === SubscriptionOrderStatus.FAILED;
  }
}
