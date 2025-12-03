/**
 * SubscriptionItem Entity
 * Items included in a subscription (medications, supplements)
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

@Entity('subscription_items')
export class SubscriptionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Subscription Relationship
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_subscription_items_subscription')
  subscription_id: string;

  @ManyToOne(() => Subscription, (subscription) => subscription.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  // ============================================================================
  // Product Details
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_subscription_items_product')
  product_id: string;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_price: number;

  // ============================================================================
  // Prescription (if required)
  // ============================================================================

  @Column({ type: 'uuid', nullable: true })
  @Index('idx_subscription_items_prescription')
  prescription_id: string | null; // Reference to Prescription

  @Column({ type: 'boolean', default: true })
  is_active: boolean; // Can be disabled without deleting

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
   * Calculate total price for this item
   */
  getTotalPrice(): number {
    return this.quantity * Number(this.unit_price);
  }

  /**
   * Check if item is active
   */
  isItemActive(): boolean {
    return this.is_active;
  }

  /**
   * Deactivate item
   */
  deactivate(): void {
    this.is_active = false;
  }

  /**
   * Activate item
   */
  activate(): void {
    this.is_active = true;
  }

  /**
   * Check if prescription is required
   */
  requiresPrescription(): boolean {
    return this.prescription_id !== null;
  }
}
