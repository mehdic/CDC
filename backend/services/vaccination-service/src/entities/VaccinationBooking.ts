/**
 * VaccinationBooking Entity
 * Represents patient bookings for vaccination slots
 * HIPAA/GDPR Compliant - Protected Health Information
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { VaccinationSlot } from './VaccinationSlot';
import { BookingStatus, VaccineType } from '../types/vaccination.types';

@Entity('vaccination_bookings')
@Index('idx_vac_booking_slot', ['slot_id'])
@Index('idx_vac_booking_patient', ['patient_id'])
@Index('idx_vac_booking_status', ['status'])
@Index('idx_vac_booking_slot_patient', ['slot_id', 'patient_id'])
export class VaccinationBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Slot & Patient
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_vac_booking_slot_id')
  slot_id: string;

  @ManyToOne(() => VaccinationSlot, (slot) => slot.bookings, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'slot_id' })
  slot: VaccinationSlot;

  @Column({ type: 'uuid' })
  @Index('idx_vac_booking_patient_id')
  patient_id: string;

  // ============================================================================
  // Booking Details
  // ============================================================================

  @Column({
    type: 'enum',
    enum: VaccineType,
  })
  vaccine_type: VaccineType;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.CONFIRMED,
  })
  status: BookingStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null; // Patient notes or special requirements

  // ============================================================================
  // Status Timestamps
  // ============================================================================

  @CreateDateColumn({ type: 'timestamp with time zone' })
  booked_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  checked_in_at: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  cancelled_at: Date | null;

  @Column({ type: 'text', nullable: true })
  cancellation_reason: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  no_show_at: Date | null;

  // ============================================================================
  // Metadata
  // ============================================================================

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  deleted_at: Date | null;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if booking is deleted
   */
  isDeleted(): boolean {
    return this.deleted_at !== null;
  }

  /**
   * Soft delete booking
   */
  softDelete(): void {
    this.deleted_at = new Date();
  }

  /**
   * Check if booking can be cancelled
   */
  canBeCancelled(): boolean {
    return (
      !this.isDeleted() &&
      this.status === BookingStatus.CONFIRMED &&
      !this.isPast()
    );
  }

  /**
   * Check if booking can be checked in
   */
  canBeCheckedIn(): boolean {
    return (
      !this.isDeleted() &&
      this.status === BookingStatus.CONFIRMED &&
      !this.isPast()
    );
  }

  /**
   * Cancel booking
   */
  cancel(reason: string): void {
    if (!this.canBeCancelled()) {
      throw new Error('Booking cannot be cancelled');
    }
    this.status = BookingStatus.CANCELLED;
    this.cancelled_at = new Date();
    this.cancellation_reason = reason;
  }

  /**
   * Check in booking
   */
  checkIn(): void {
    if (!this.canBeCheckedIn()) {
      throw new Error('Booking cannot be checked in');
    }
    this.status = BookingStatus.CHECKED_IN;
    this.checked_in_at = new Date();
  }

  /**
   * Mark booking as completed
   */
  complete(): void {
    if (this.status !== BookingStatus.CHECKED_IN) {
      throw new Error('Only checked-in bookings can be completed');
    }
    this.status = BookingStatus.COMPLETED;
    this.completed_at = new Date();
  }

  /**
   * Mark booking as no-show
   */
  markNoShow(): void {
    if (
      this.status !== BookingStatus.CONFIRMED &&
      this.status !== BookingStatus.CHECKED_IN
    ) {
      throw new Error('Cannot mark non-confirmed booking as no-show');
    }
    this.status = BookingStatus.NO_SHOW;
    this.no_show_at = new Date();
  }

  /**
   * Check if booking is in the past
   */
  isPast(): boolean {
    // This will be determined by checking the slot's end time
    // In practice, this method would load the slot relationship
    return false; // Placeholder - actual implementation would check slot.end_time
  }
}
