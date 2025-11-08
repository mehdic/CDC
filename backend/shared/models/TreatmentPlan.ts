/**
 * TreatmentPlan Entity
 * Generated medication schedule from approved prescription with adherence tracking
 * Based on: /specs/002-metapharm-platform/data-model.md
 * User Story 1 (P1): Prescription Processing & Validation (FR-017, FR-077)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Prescription } from './Prescription';
import { User } from './User';

export enum TreatmentPlanStatus {
  ACTIVE = 'active',         // Ongoing treatment
  COMPLETED = 'completed',   // Finished as prescribed
  DISCONTINUED = 'discontinued', // Stopped early
}

@Entity('treatment_plans')
export class TreatmentPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Relationships
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_treatment_plans_prescription')
  prescription_id: string;

  @OneToOne(() => Prescription, (prescription) => prescription.treatment_plan, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'prescription_id' })
  prescription: Prescription;

  @Column({ type: 'uuid' })
  @Index('idx_treatment_plans_patient')
  patient_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'patient_id' })
  patient: User;

  // ============================================================================
  // Schedule
  // ============================================================================

  @Column({ type: 'jsonb' })
  medication_schedule: any; // Flexible JSON structure: [{medication, time, days, doses_taken: []}]

  // ============================================================================
  // Adherence Tracking (FR-077)
  // ============================================================================

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date | null;

  @Column({ type: 'integer', nullable: true })
  total_doses: number | null;

  @Column({ type: 'integer', default: 0 })
  doses_taken: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  adherence_rate: number | null; // Calculated: doses_taken / total_doses * 100

  // ============================================================================
  // Refill
  // ============================================================================

  @Column({ type: 'date', nullable: true })
  refill_due_date: Date | null;

  @Column({ type: 'boolean', default: false })
  refill_reminder_sent: boolean;

  // ============================================================================
  // Status
  // ============================================================================

  @Column({
    type: 'enum',
    enum: TreatmentPlanStatus,
    default: TreatmentPlanStatus.ACTIVE,
  })
  @Index('idx_treatment_plans_status')
  status: TreatmentPlanStatus;

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
   * Check if treatment plan is active
   */
  isActive(): boolean {
    return this.status === TreatmentPlanStatus.ACTIVE;
  }

  /**
   * Check if treatment plan is completed
   */
  isCompleted(): boolean {
    return this.status === TreatmentPlanStatus.COMPLETED;
  }

  /**
   * Check if treatment plan was discontinued
   */
  isDiscontinued(): boolean {
    return this.status === TreatmentPlanStatus.DISCONTINUED;
  }

  /**
   * Calculate and update adherence rate
   * FR-077: Track medication adherence (doses taken vs. missed)
   */
  calculateAdherenceRate(): number {
    if (!this.total_doses || this.total_doses === 0) {
      return 0;
    }

    const rate = (this.doses_taken / this.total_doses) * 100;
    this.adherence_rate = Number(rate.toFixed(2));
    return this.adherence_rate;
  }

  /**
   * Record a dose taken
   * Updates doses_taken and recalculates adherence rate
   */
  recordDoseTaken(): void {
    this.doses_taken += 1;
    this.calculateAdherenceRate();
  }

  /**
   * Check if adherence is good (>= 80%)
   * FR-077: Threshold for "good adherence" commonly set at 80% in healthcare
   */
  hasGoodAdherence(): boolean {
    if (this.adherence_rate === null) {
      return false;
    }
    return this.adherence_rate >= 80;
  }

  /**
   * Check if adherence is poor (< 50%)
   */
  hasPoorAdherence(): boolean {
    if (this.adherence_rate === null) {
      return false;
    }
    return this.adherence_rate < 50;
  }

  /**
   * Check if refill is due soon (within 7 days)
   */
  isRefillDueSoon(): boolean {
    if (!this.refill_due_date) {
      return false;
    }

    const today = new Date();
    const dueDate = new Date(this.refill_due_date);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    return dueDate <= sevenDaysFromNow;
  }

  /**
   * Check if refill is overdue
   */
  isRefillOverdue(): boolean {
    if (!this.refill_due_date) {
      return false;
    }

    const today = new Date();
    const dueDate = new Date(this.refill_due_date);

    return dueDate < today;
  }

  /**
   * Check if refill reminder should be sent
   * Send reminder if due within 7 days and not already sent
   */
  shouldSendRefillReminder(): boolean {
    return this.isRefillDueSoon() && !this.refill_reminder_sent && this.isActive();
  }

  /**
   * Mark refill reminder as sent
   */
  markRefillReminderSent(): void {
    this.refill_reminder_sent = true;
  }

  /**
   * Complete treatment plan
   * Set status to completed and end date to today
   */
  complete(): void {
    this.status = TreatmentPlanStatus.COMPLETED;
    this.end_date = new Date();
    this.calculateAdherenceRate();
  }

  /**
   * Discontinue treatment plan
   * Set status to discontinued and end date to today
   */
  discontinue(): void {
    this.status = TreatmentPlanStatus.DISCONTINUED;
    this.end_date = new Date();
    this.calculateAdherenceRate();
  }

  /**
   * Get days remaining in treatment
   * Returns null if no end_date set
   */
  getDaysRemaining(): number | null {
    if (!this.end_date) {
      return null;
    }

    const today = new Date();
    const endDate = new Date(this.end_date);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Get days elapsed in treatment
   */
  getDaysElapsed(): number {
    const today = new Date();
    const startDate = new Date(this.start_date);
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }
}
