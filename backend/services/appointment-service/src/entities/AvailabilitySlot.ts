/**
 * AvailabilitySlot Entity
 * Defines when healthcare professionals are available for appointments
 * Supports recurring slots (same time every week) and blocked time periods
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

@Entity('availability_slots')
@Index('idx_availability_slots_provider_id', ['provider_id'])
@Index('idx_availability_slots_day_of_week', ['day_of_week'])
@Index('idx_availability_slots_is_active', ['is_active'])
export class AvailabilitySlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Provider Reference
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_availability_slots_provider_id_active')
  provider_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider: User;

  // ============================================================================
  // Time Configuration
  // ============================================================================

  @Column({ type: 'integer' })
  day_of_week: number; // 0-6 (Sunday = 0, Monday = 1, ..., Saturday = 6)

  @Column({ type: 'time' })
  start_time: string; // HH:mm format (e.g., "09:00")

  @Column({ type: 'time' })
  end_time: string; // HH:mm format (e.g., "17:00")

  @Column({ type: 'integer', default: 1 })
  capacity: number; // Number of appointments that can be scheduled in this slot

  @Column({ type: 'varchar', length: 50, default: 'UTC' })
  timezone: string; // IANA timezone (e.g., "Europe/Zurich")

  // ============================================================================
  // Recurrence
  // ============================================================================

  @Column({ type: 'boolean', default: true })
  is_recurring: boolean; // Whether slot repeats every week

  @Column({ type: 'date', nullable: true })
  end_date: Date | null; // For recurring slots: when to stop repeating

  @Column({ type: 'boolean', default: true })
  is_active: boolean; // Whether this slot is currently active

  // ============================================================================
  // Capacity Tracking
  // ============================================================================

  @Column({ type: 'integer', default: 0 })
  booked_count: number; // Number of appointments already booked in this slot

  @Column({ type: 'timestamp with time zone', nullable: true })
  full_until: Date | null; // If slot is temporarily full, when will it be available again

  // ============================================================================
  // Blocked/Exception Handling
  // ============================================================================

  @Column({ type: 'boolean', default: false })
  is_blocked: boolean; // Whether this slot is blocked (unavailable)

  @Column({ type: 'text', nullable: true })
  blocked_reason: string | null; // Reason for blocking (e.g., "Away", "Emergency", "Maintenance")

  // ============================================================================
  // Audit
  // ============================================================================

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  deleted_at: Date | null; // Soft delete

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if slot is soft deleted
   */
  isDeleted(): boolean {
    return this.deleted_at !== null;
  }

  /**
   * Soft delete slot
   */
  softDelete(): void {
    this.deleted_at = new Date();
  }

  /**
   * Check if slot is available for booking
   */
  isAvailable(): boolean {
    return (
      !this.isDeleted() &&
      this.is_active &&
      !this.is_blocked &&
      (this.booked_count < this.capacity)
    );
  }

  /**
   * Check if slot capacity is full
   */
  isFull(): boolean {
    return this.booked_count >= this.capacity;
  }

  /**
   * Get available spaces in slot
   */
  getAvailableSpaces(): number {
    return Math.max(0, this.capacity - this.booked_count);
  }

  /**
   * Check if slot should still be available (for recurring slots with end_date)
   */
  isStillRecurring(): boolean {
    if (!this.is_recurring || !this.end_date) {
      return this.is_recurring;
    }
    return new Date() <= this.end_date;
  }

  /**
   * Get day name for this slot
   */
  getDayName(): string {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[this.day_of_week];
  }

  /**
   * Check if slot matches a specific date and day of week
   */
  matchesDate(date: Date): boolean {
    return date.getDay() === this.day_of_week;
  }

  /**
   * Reserve a spot in this slot
   */
  reserve(): void {
    if (!this.isFull()) {
      this.booked_count++;
    }
  }

  /**
   * Cancel a reservation in this slot
   */
  cancelReservation(): void {
    if (this.booked_count > 0) {
      this.booked_count--;
    }
  }

  /**
   * Block this slot with a reason
   */
  block(reason: string): void {
    this.is_blocked = true;
    this.blocked_reason = reason;
  }

  /**
   * Unblock this slot
   */
  unblock(): void {
    this.is_blocked = false;
    this.blocked_reason = null;
  }
}
