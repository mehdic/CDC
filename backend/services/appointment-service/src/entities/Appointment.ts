/**
 * Appointment Entity
 * Represents scheduled appointments between healthcare professionals and patients
 * Supports: teleconsultations, in-person visits, home visits
 * HIPAA/GDPR Compliant - Healthcare appointment data with audit logging
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
import { User } from '@shared/models/User';
import { AppointmentReminder } from './AppointmentReminder';
import { AppointmentStatus, AppointmentType } from '../types/appointment.types';

@Entity('appointments')
@Index('idx_appointments_provider_patient', ['provider_id', 'patient_id'])
@Index('idx_appointments_status', ['status'])
@Index('idx_appointments_scheduled_start', ['scheduled_start'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Participants
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_appointments_provider_id')
  provider_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'provider_id' })
  provider: User;

  @Column({ type: 'uuid' })
  @Index('idx_appointments_patient_id')
  patient_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'patient_id' })
  patient: User;

  // ============================================================================
  // Appointment Details
  // ============================================================================

  @Column({
    type: 'enum',
    enum: AppointmentType,
    default: AppointmentType.TELECONSULTATION,
  })
  appointment_type: AppointmentType;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column({ type: 'timestamp with time zone' })
  scheduled_start: Date;

  @Column({ type: 'timestamp with time zone' })
  scheduled_end: Date;

  @Column({ type: 'text', nullable: true })
  reason: string | null; // Reason for appointment (e.g., "Regular checkup", "Follow-up")

  @Column({ type: 'text', nullable: true })
  notes: string | null; // Internal notes about appointment

  @Column({ type: 'varchar', length: 500, nullable: true })
  location: string | null; // Physical address for in-person or home visits

  // ============================================================================
  // Timezone & Calendar
  // ============================================================================

  @Column({ type: 'varchar', length: 50, default: 'UTC' })
  timezone: string; // IANA timezone (e.g., "Europe/Zurich")

  @Column({ type: 'boolean', default: false })
  is_recurring: boolean; // Whether this is a recurring appointment

  @Column({ type: 'uuid', nullable: true })
  recurring_appointment_id: string | null; // Link to parent recurring appointment

  // ============================================================================
  // Metadata & Audit
  // ============================================================================

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  confirmed_at: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  started_at: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  cancelled_at: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  cancellation_reason: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  deleted_at: Date | null; // Soft delete

  // ============================================================================
  // Reminders
  // ============================================================================

  @OneToMany(
    () => AppointmentReminder,
    (reminder) => reminder.appointment,
    { cascade: true }
  )
  reminders: AppointmentReminder[];

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if appointment is soft deleted
   */
  isDeleted(): boolean {
    return this.deleted_at !== null;
  }

  /**
   * Soft delete appointment
   */
  softDelete(): void {
    this.deleted_at = new Date();
  }

  /**
   * Check if appointment is in the future
   */
  isFuture(): boolean {
    return new Date() < this.scheduled_start;
  }

  /**
   * Check if appointment has passed
   */
  isPast(): boolean {
    return new Date() > this.scheduled_end;
  }

  /**
   * Check if appointment is currently happening
   */
  isNow(): boolean {
    const now = new Date();
    return now >= this.scheduled_start && now <= this.scheduled_end;
  }

  /**
   * Check if appointment can be cancelled
   */
  canBeCancelled(): boolean {
    return (
      !this.isDeleted() &&
      this.status !== AppointmentStatus.CANCELLED &&
      this.status !== AppointmentStatus.COMPLETED &&
      this.isFuture()
    );
  }

  /**
   * Get duration in minutes
   */
  getDurationMinutes(): number {
    return (
      (this.scheduled_end.getTime() - this.scheduled_start.getTime()) / 60000
    );
  }

  /**
   * Check if appointment is within reminder window (hours before start)
   */
  isWithinReminderWindow(hoursBeforeStart: number): boolean {
    const now = new Date();
    const reminderTime = new Date(
      this.scheduled_start.getTime() - hoursBeforeStart * 3600000
    );
    return now >= reminderTime && now < this.scheduled_start;
  }
}
