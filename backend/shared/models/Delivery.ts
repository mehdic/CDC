/**
 * Delivery Entity
 * Tracks delivery of orders to patients
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

export enum DeliveryStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('deliveries')
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Relationships
  // ============================================================================

  @Column({ type: 'varchar', length: 36 })
  @Index('idx_deliveries_user')
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 36, nullable: true })
  @Index('idx_deliveries_order')
  order_id: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  @Index('idx_deliveries_delivery_personnel')
  delivery_personnel_id: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'delivery_personnel_id' })
  delivery_personnel: User | null;

  // ============================================================================
  // Status
  // ============================================================================

  @Column({
    type: 'varchar',
    length: 50,
    default: DeliveryStatus.PENDING,
  })
  @Index('idx_deliveries_status')
  status: DeliveryStatus;

  // ============================================================================
  // Delivery Information (HIPAA Compliant)
  // ============================================================================

  @Column({ type: 'blob' })
  delivery_address_encrypted: Buffer; // AWS KMS encrypted PHI

  @Column({ type: 'blob', nullable: true })
  delivery_notes_encrypted: Buffer | null; // AWS KMS encrypted PHI

  @Column({ type: 'simple-json', nullable: true })
  tracking_info: Record<string, any> | null; // GPS coordinates, timestamps, etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  tracking_number: string | null; // Public tracking number (non-PHI)

  // ============================================================================
  // Timing
  // ============================================================================

  @Column({ type: 'datetime', nullable: true })
  scheduled_at: Date | null;

  @Column({ type: 'datetime', nullable: true })
  picked_up_at: Date | null;

  @Column({ type: 'datetime', nullable: true })
  delivered_at: Date | null;

  @Column({ type: 'datetime', nullable: true })
  failed_at: Date | null;

  @Column({ type: 'text', nullable: true })
  failure_reason: string | null;

  // ============================================================================
  // Metadata
  // ============================================================================

  @CreateDateColumn({ type: 'datetime' })
  @Index('idx_deliveries_created')
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at: Date;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if delivery is pending
   */
  isPending(): boolean {
    return this.status === DeliveryStatus.PENDING;
  }

  /**
   * Check if delivery is assigned
   */
  isAssigned(): boolean {
    return this.status === DeliveryStatus.ASSIGNED;
  }

  /**
   * Check if delivery is in transit
   */
  isInTransit(): boolean {
    return this.status === DeliveryStatus.IN_TRANSIT;
  }

  /**
   * Check if delivery is completed
   */
  isDelivered(): boolean {
    return this.status === DeliveryStatus.DELIVERED;
  }

  /**
   * Check if delivery failed
   */
  isFailed(): boolean {
    return this.status === DeliveryStatus.FAILED;
  }

  /**
   * Check if delivery was cancelled
   */
  isCancelled(): boolean {
    return this.status === DeliveryStatus.CANCELLED;
  }

  /**
   * Mark delivery as assigned
   */
  assign(deliveryPersonnelId: string): void {
    this.status = DeliveryStatus.ASSIGNED;
    this.delivery_personnel_id = deliveryPersonnelId;
  }

  /**
   * Mark delivery as picked up
   */
  pickUp(): void {
    this.status = DeliveryStatus.IN_TRANSIT;
    this.picked_up_at = new Date();
  }

  /**
   * Mark delivery as delivered
   */
  deliver(): void {
    this.status = DeliveryStatus.DELIVERED;
    this.delivered_at = new Date();
  }

  /**
   * Mark delivery as failed
   */
  fail(reason: string): void {
    this.status = DeliveryStatus.FAILED;
    this.failed_at = new Date();
    this.failure_reason = reason;
  }

  /**
   * Cancel delivery
   */
  cancel(): void {
    this.status = DeliveryStatus.CANCELLED;
  }
}
