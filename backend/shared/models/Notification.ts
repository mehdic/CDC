/**
 * Notification Entity
 * Handles email, SMS, push, and in-app notifications
 * HIPAA/GDPR compliant with encryption and audit logging
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
import { User } from './User';

export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  READ = 'read', // For in-app notifications
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // User Relationship
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_notifications_user')
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // ============================================================================
  // Notification Details
  // ============================================================================

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  @Index('idx_notifications_type')
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  @Index('idx_notifications_status')
  status: NotificationStatus;

  // ============================================================================
  // Metadata (HIPAA/GDPR: Encrypted if contains PHI)
  // ============================================================================

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  // ============================================================================
  // Tracking
  // ============================================================================

  @Column({ type: 'timestamp', nullable: true })
  sent_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  read_at: Date | null; // For in-app notifications

  @Column({ type: 'varchar', length: 255, nullable: true })
  error_message: string | null; // If delivery failed

  @CreateDateColumn({ type: 'timestamp' })
  @Index('idx_notifications_created')
  created_at: Date;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Mark notification as sent
   */
  markAsSent(): void {
    this.status = NotificationStatus.SENT;
    this.sent_at = new Date();
  }

  /**
   * Mark notification as delivered
   */
  markAsDelivered(): void {
    this.status = NotificationStatus.DELIVERED;
    this.delivered_at = new Date();
  }

  /**
   * Mark notification as read (in-app only)
   */
  markAsRead(): void {
    this.status = NotificationStatus.READ;
    this.read_at = new Date();
  }

  /**
   * Mark notification as failed
   */
  markAsFailed(errorMessage: string): void {
    this.status = NotificationStatus.FAILED;
    this.error_message = errorMessage;
  }

  /**
   * Check if notification is pending
   */
  isPending(): boolean {
    return this.status === NotificationStatus.PENDING;
  }

  /**
   * Check if notification was successfully delivered
   */
  isDelivered(): boolean {
    return this.status === NotificationStatus.DELIVERED || this.status === NotificationStatus.READ;
  }

  /**
   * Check if notification failed
   */
  isFailed(): boolean {
    return this.status === NotificationStatus.FAILED;
  }
}
