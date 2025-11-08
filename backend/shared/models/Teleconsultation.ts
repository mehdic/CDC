/**
 * Teleconsultation Entity
 * Video consultation appointments between pharmacists and patients
 * Based on: /specs/002-metapharm-platform/data-model.md
 * User Story 2 (P2): Secure Teleconsultation (FR-021 to FR-030)
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
import { User } from './User';
import { Pharmacy } from './Pharmacy';
import { Prescription } from './Prescription';
import { ConsultationNote } from './ConsultationNote';

export enum TeleconsultationStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

@Entity('teleconsultations')
export class Teleconsultation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Multi-Tenant Isolation
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_teleconsultations_pharmacy')
  pharmacy_id: string;

  @ManyToOne(() => Pharmacy)
  @JoinColumn({ name: 'pharmacy_id' })
  pharmacy: Pharmacy;

  // ============================================================================
  // Participants
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_teleconsultations_patient')
  patient_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient: User;

  @Column({ type: 'uuid' })
  @Index('idx_teleconsultations_pharmacist')
  pharmacist_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'pharmacist_id' })
  pharmacist: User;

  // ============================================================================
  // Scheduling
  // ============================================================================

  @Column({ type: 'timestamp' })
  @Index('idx_teleconsultations_scheduled')
  scheduled_at: Date;

  @Column({ type: 'integer', default: 15 })
  duration_minutes: number;

  // ============================================================================
  // Session State
  // ============================================================================

  @Column({
    type: 'varchar',
    length: 50,
    default: TeleconsultationStatus.SCHEDULED,
  })
  @Index('idx_teleconsultations_status')
  status: TeleconsultationStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  twilio_room_sid: string | null;  // Twilio Video Room SID

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  ended_at: Date | null;

  @Column({ type: 'integer', nullable: true })
  actual_duration_minutes: number | null;

  // ============================================================================
  // Recording (HIPAA Compliance)
  // ============================================================================

  @Column({ type: 'boolean', default: false })
  recording_consent: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  recording_url: string | null;  // S3 URL if recorded

  // ============================================================================
  // Outcome
  // ============================================================================

  @Column({ type: 'boolean', default: false })
  prescription_created: boolean;

  @Column({ type: 'uuid', nullable: true })
  prescription_id: string | null;

  @ManyToOne(() => Prescription, { nullable: true })
  @JoinColumn({ name: 'prescription_id' })
  prescription: Prescription | null;

  // ============================================================================
  // Relationships
  // ============================================================================

  @OneToOne(() => ConsultationNote, (note) => note.teleconsultation, {
    nullable: true,
  })
  consultation_note: ConsultationNote | null;

  // ============================================================================
  // Metadata
  // ============================================================================

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at: Date | null;

  @Column({ type: 'text', nullable: true })
  cancellation_reason: string | null;
}

// Composite index for pharmacist's scheduled consultations
@Index('idx_teleconsultations_pharmacist_scheduled', [
  'pharmacist_id',
  'scheduled_at',
])
export class TeleconsultationScheduleIndex {}
