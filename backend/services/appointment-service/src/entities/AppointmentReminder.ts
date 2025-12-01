/**
 * AppointmentReminder Entity
 * Tracks reminders sent to patients and providers for upcoming appointments
 * Supports multiple reminder types: email, SMS, in-app, notifications
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
import { User } from '@shared/models/User';
import { Appointment } from './Appointment';
import { ReminderStatus, ReminderType } from '../types/appointment.types';

@Entity('appointment_reminders')
@Index('idx_appointment_reminders_appointment_id', ['appointment_id'])
@Index('idx_appointment_reminders_recipient_id', ['recipient_id'])
@Index('idx_appointment_reminders_status', ['status'])
@Index('idx_appointment_reminders_scheduled_at', ['scheduled_at'])
export class AppointmentReminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // References
  // ============================================================================

  @Column({ type: 'uuid' })
  appointment_id: string;

  @ManyToOne(() => Appointment, (appointment) => appointment.reminders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @Column({ type: 'uuid' })
  recipient_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;

  // ============================================================================
  // Reminder Configuration
  // ============================================================================

  @Column({
    type: 'enum',
    enum: ReminderType,
    default: ReminderType.IN_APP,
  })
  reminder_type: ReminderType;

  @Column({
    type: 'enum',
    enum: ReminderStatus,
    default: ReminderStatus.PENDING,
  })
  status: ReminderStatus;

  @Column({ type: 'integer' })
  hours_before_start: number; // Send reminder X hours before appointment start

  @Column({ type: 'timestamp with time zone' })
  scheduled_at: Date; // When reminder should be sent

  // ============================================================================
  // Send Status
  // ============================================================================

  @Column({ type: 'timestamp with time zone', nullable: true })
  sent_at: Date | null;

  @Column({ type: 'text', nullable: true })
  failed_reason: string | null; // Reason why reminder failed to send

  @Column({ type: 'integer', default: 0 })
  retry_count: number; // Number of times we tried to send

  @Column({ type: 'timestamp with time zone', nullable: true })
  deleted_at: Date | null; // Soft delete

  // ============================================================================
  // Audit
  // ============================================================================

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if reminder is soft deleted
   */
  isDeleted(): boolean {
    return this.deleted_at !== null;
  }

  /**
   * Soft delete reminder
   */
  softDelete(): void {
    this.deleted_at = new Date();
  }

  /**
   * Check if reminder is due to be sent
   */
  isDue(): boolean {
    const now = new Date();
    return (
      this.status === ReminderStatus.PENDING &&
      now >= this.scheduled_at &&
      !this.isDeleted()
    );
  }

  /**
   * Check if reminder has been sent
   */
  hasBeenSent(): boolean {
    return this.status === ReminderStatus.SENT && this.sent_at !== null;
  }

  /**
   * Check if reminder failed to send
   */
  hasFailed(): boolean {
    return this.status === ReminderStatus.FAILED;
  }

  /**
   * Mark reminder as sent
   */
  markAsSent(): void {
    this.status = ReminderStatus.SENT;
    this.sent_at = new Date();
  }

  /**
   * Mark reminder as failed
   */
  markAsFailed(reason: string): void {
    this.status = ReminderStatus.FAILED;
    this.failed_reason = reason;
  }

  /**
   * Reset reminder for retry
   */
  resetForRetry(): void {
    this.status = ReminderStatus.PENDING;
    this.sent_at = null;
    this.failed_reason = null;
    this.retry_count = (this.retry_count || 0) + 1;
  }
}
