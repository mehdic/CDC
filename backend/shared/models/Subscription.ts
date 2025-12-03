/**
 * Subscription Entity
 * Recurring medication orders for chronic disease prescriptions, supplements
 * Task T6-016 - Subscription Service Implementation
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
import { Pharmacy } from './Pharmacy';
import { SubscriptionItem } from './SubscriptionItem';
import { SubscriptionOrder } from './SubscriptionOrder';

export enum SubscriptionFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Multi-Tenant Isolation
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_subscriptions_pharmacy')
  pharmacy_id: string;

  @ManyToOne(() => Pharmacy, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pharmacy_id' })
  pharmacy: Pharmacy;

  // ============================================================================
  // Patient/Customer
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_subscriptions_patient')
  patient_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'patient_id' })
  patient: User;

  // ============================================================================
  // Subscription Details
  // ============================================================================

  @Column({ type: 'varchar', length: 255 })
  name: string; // e.g., "Monthly Blood Pressure Medication"

  @Column({
    type: 'enum',
    enum: SubscriptionFrequency,
    default: SubscriptionFrequency.MONTHLY,
  })
  @Index('idx_subscriptions_frequency')
  frequency: SubscriptionFrequency;

  @Column({ type: 'integer', nullable: true })
  custom_interval_days: number | null; // For CUSTOM frequency

  @Column({ type: 'date' })
  @Index('idx_subscriptions_next_delivery')
  next_delivery_date: Date;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  @Index('idx_subscriptions_status')
  status: SubscriptionStatus;

  // ============================================================================
  // Payment & Delivery
  // ============================================================================

  @Column({ type: 'uuid', nullable: true })
  payment_method_id: string | null; // Reference to stored payment method

  @Column({ type: 'uuid', nullable: true })
  delivery_address_id: string | null; // Reference to stored address

  // ============================================================================
  // Statistics & Savings
  // ============================================================================

  @Column({ type: 'integer', default: 0 })
  total_orders: number; // Total orders generated

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_savings: number; // Total savings from subscription discount

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount_percentage: number; // Subscription discount (5% biweekly, 10% monthly)

  // ============================================================================
  // Relationships
  // ============================================================================

  @OneToMany(() => SubscriptionItem, (item) => item.subscription)
  items: SubscriptionItem[];

  @OneToMany(() => SubscriptionOrder, (order) => order.subscription)
  orders: SubscriptionOrder[];

  // ============================================================================
  // Metadata
  // ============================================================================

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'date', nullable: true })
  paused_at: Date | null;

  @Column({ type: 'date', nullable: true })
  cancelled_at: Date | null;

  @Column({ type: 'text', nullable: true })
  cancellation_reason: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  @Index('idx_subscriptions_created')
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if subscription is active
   */
  isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE;
  }

  /**
   * Check if subscription is paused
   */
  isPaused(): boolean {
    return this.status === SubscriptionStatus.PAUSED;
  }

  /**
   * Check if subscription is cancelled
   */
  isCancelled(): boolean {
    return this.status === SubscriptionStatus.CANCELLED;
  }

  /**
   * Pause subscription
   */
  pause(): void {
    this.status = SubscriptionStatus.PAUSED;
    this.paused_at = new Date();
  }

  /**
   * Resume subscription
   */
  resume(): void {
    this.status = SubscriptionStatus.ACTIVE;
    this.paused_at = null;
  }

  /**
   * Cancel subscription
   */
  cancel(reason?: string): void {
    this.status = SubscriptionStatus.CANCELLED;
    this.cancelled_at = new Date();
    if (reason) {
      this.cancellation_reason = reason;
    }
  }

  /**
   * Skip next delivery (push forward by interval)
   */
  skipNextDelivery(): void {
    const days = this.getIntervalDays();
    const nextDate = new Date(this.next_delivery_date);
    nextDate.setDate(nextDate.getDate() + days);
    this.next_delivery_date = nextDate;
  }

  /**
   * Get interval in days based on frequency
   */
  getIntervalDays(): number {
    switch (this.frequency) {
      case SubscriptionFrequency.WEEKLY:
        return 7;
      case SubscriptionFrequency.BIWEEKLY:
        return 14;
      case SubscriptionFrequency.MONTHLY:
        return 30;
      case SubscriptionFrequency.CUSTOM:
        return this.custom_interval_days || 30;
      default:
        return 30;
    }
  }

  /**
   * Calculate discount percentage based on frequency
   */
  calculateDiscountPercentage(): number {
    switch (this.frequency) {
      case SubscriptionFrequency.WEEKLY:
        return 0;
      case SubscriptionFrequency.BIWEEKLY:
        return 5;
      case SubscriptionFrequency.MONTHLY:
        return 10;
      case SubscriptionFrequency.CUSTOM:
        return this.custom_interval_days && this.custom_interval_days >= 28 ? 10 : 5;
      default:
        return 0;
    }
  }

  /**
   * Set next delivery date based on frequency
   */
  setNextDeliveryDate(baseDate?: Date): void {
    const base = baseDate || new Date();
    const days = this.getIntervalDays();
    const nextDate = new Date(base);
    nextDate.setDate(nextDate.getDate() + days);
    this.next_delivery_date = nextDate;
  }

  /**
   * Check if subscription is due for order generation
   */
  isDueForOrder(): boolean {
    const now = new Date();
    const nextDelivery = new Date(this.next_delivery_date);
    return this.isActive() && nextDelivery <= now;
  }

  /**
   * Increment order count and update stats
   */
  incrementOrderCount(orderTotal: number): void {
    this.total_orders += 1;
    const discount = (orderTotal * this.discount_percentage) / 100;
    this.total_savings += discount;
  }
}
