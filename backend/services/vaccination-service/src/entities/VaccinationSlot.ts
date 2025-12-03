/**
 * VaccinationSlot Entity
 * Represents specific time slots generated from templates for vaccination appointments
 * HIPAA/GDPR Compliant
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { VaccinationSlotTemplate } from './VaccinationSlotTemplate';
import { VaccinationBooking } from './VaccinationBooking';
import { VaccinationSlotStatus } from '../types/vaccination.types';

@Entity('vaccination_slots')
@Index('idx_vac_slot_pharmacy', ['pharmacy_id'])
@Index('idx_vac_slot_date', ['slot_date'])
@Index('idx_vac_slot_status', ['status'])
@Index('idx_vac_slot_pharmacy_date', ['pharmacy_id', 'slot_date'])
export class VaccinationSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Template & Pharmacy
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_vac_slot_template_id')
  template_id: string;

  @ManyToOne(() => VaccinationSlotTemplate, (template) => template.slots, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'template_id' })
  template: VaccinationSlotTemplate;

  @Column({ type: 'uuid' })
  @Index('idx_vac_slot_pharmacy_id')
  pharmacy_id: string;

  // ============================================================================
  // Slot Details
  // ============================================================================

  @Column({ type: 'date' })
  slot_date: Date; // Date of the slot

  @Column({ type: 'timestamp with time zone' })
  start_time: Date; // Full timestamp

  @Column({ type: 'timestamp with time zone' })
  end_time: Date; // Full timestamp

  @Column({ type: 'integer' })
  capacity: number; // Max bookings for this slot

  @Column({ type: 'integer', default: 0 })
  booked_count: number; // Current number of bookings

  @Column({
    type: 'enum',
    enum: VaccinationSlotStatus,
    default: VaccinationSlotStatus.AVAILABLE,
  })
  status: VaccinationSlotStatus;

  // ============================================================================
  // Relationships
  // ============================================================================

  @OneToMany(() => VaccinationBooking, (booking) => booking.slot)
  bookings: VaccinationBooking[];

  // ============================================================================
  // Metadata
  // ============================================================================

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  deleted_at: Date | null;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if slot is deleted
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
   * Check if slot has available capacity
   */
  hasAvailableCapacity(): boolean {
    return this.booked_count < this.capacity;
  }

  /**
   * Get remaining capacity
   */
  getRemainingCapacity(): number {
    return Math.max(0, this.capacity - this.booked_count);
  }

  /**
   * Check if slot is in the past
   */
  isPast(): boolean {
    return new Date() > this.end_time;
  }

  /**
   * Check if slot is in the future
   */
  isFuture(): boolean {
    return new Date() < this.start_time;
  }

  /**
   * Check if slot is currently happening
   */
  isNow(): boolean {
    const now = new Date();
    return now >= this.start_time && now <= this.end_time;
  }

  /**
   * Update slot status based on bookings and time
   */
  updateStatus(): void {
    if (this.isPast()) {
      this.status = VaccinationSlotStatus.PAST;
    } else if (this.booked_count >= this.capacity) {
      this.status = VaccinationSlotStatus.FULLY_BOOKED;
    } else {
      this.status = VaccinationSlotStatus.AVAILABLE;
    }
  }

  /**
   * Increment booking count
   */
  incrementBooking(): void {
    this.booked_count += 1;
    this.updateStatus();
  }

  /**
   * Decrement booking count (when cancelling)
   */
  decrementBooking(): void {
    this.booked_count = Math.max(0, this.booked_count - 1);
    this.updateStatus();
  }
}
