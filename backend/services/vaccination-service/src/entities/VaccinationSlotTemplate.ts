/**
 * VaccinationSlotTemplate Entity
 * Represents recurring slot configurations for vaccination appointments
 * HIPAA/GDPR Compliant
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { VaccineType } from '../types/vaccination.types';
import { VaccinationSlot } from './VaccinationSlot';

@Entity('vaccination_slot_templates')
@Index('idx_vac_template_pharmacy', ['pharmacy_id'])
@Index('idx_vac_template_active', ['is_active'])
@Index('idx_vac_template_day', ['day_of_week'])
export class VaccinationSlotTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Pharmacy & Vaccine
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_vac_template_pharmacy_id')
  pharmacy_id: string;

  @Column({
    type: 'enum',
    enum: VaccineType,
  })
  vaccine_type: VaccineType;

  // ============================================================================
  // Slot Configuration
  // ============================================================================

  @Column({ type: 'integer', default: 15 })
  duration_minutes: number; // Duration of each appointment

  @Column({ type: 'integer', default: 1 })
  capacity: number; // Number of concurrent appointments

  @Column({ type: 'integer', nullable: true })
  day_of_week: number; // 0-6 for recurring weekly slots (null = one-time)

  @Column({ type: 'time' })
  start_time: string; // HH:mm format

  @Column({ type: 'time' })
  end_time: string; // HH:mm format

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  // ============================================================================
  // Relationships
  // ============================================================================

  @OneToMany(() => VaccinationSlot, (slot) => slot.template)
  slots: VaccinationSlot[];

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
   * Check if template is deleted
   */
  isDeleted(): boolean {
    return this.deleted_at !== null;
  }

  /**
   * Soft delete template
   */
  softDelete(): void {
    this.deleted_at = new Date();
    this.is_active = false;
  }

  /**
   * Calculate number of slots that can be generated per day
   */
  getSlotsPerDay(): number {
    const [startHour, startMinute] = this.start_time.split(':').map(Number);
    const [endHour, endMinute] = this.end_time.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const totalMinutes = endMinutes - startMinutes;

    return Math.floor(totalMinutes / this.duration_minutes);
  }

  /**
   * Validate time range
   */
  isValidTimeRange(): boolean {
    const [startHour, startMinute] = this.start_time.split(':').map(Number);
    const [endHour, endMinute] = this.end_time.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    return endMinutes > startMinutes;
  }
}
