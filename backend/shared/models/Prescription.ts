/**
 * Prescription Entity
 * Medication orders from patients (upload) or doctors (direct send) with AI-powered validation
 * Based on: /specs/002-metapharm-platform/data-model.md
 * User Story 1 (P1): Prescription Processing & Validation (FR-008 to FR-020)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './User';
import { Pharmacy } from './Pharmacy';
import { PrescriptionItem } from './PrescriptionItem';
import { TreatmentPlan } from './TreatmentPlan';

export enum PrescriptionSource {
  PATIENT_UPLOAD = 'patient_upload',
  DOCTOR_DIRECT = 'doctor_direct',
  TELECONSULTATION = 'teleconsultation',
}

export enum PrescriptionStatus {
  PENDING = 'pending',                   // Awaiting pharmacist review
  IN_REVIEW = 'in_review',               // Pharmacist reviewing
  CLARIFICATION_NEEDED = 'clarification_needed',  // Waiting for doctor response
  APPROVED = 'approved',                 // Validated and approved
  REJECTED = 'rejected',                 // Rejected with reason
  EXPIRED = 'expired',                   // Prescription validity expired
}

@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Multi-Tenant Isolation
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_prescriptions_pharmacy')
  pharmacy_id: string;

  @ManyToOne(() => Pharmacy, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pharmacy_id' })
  pharmacy: Pharmacy;

  // ============================================================================
  // Parties
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_prescriptions_patient')
  patient_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'patient_id' })
  patient: User;

  @Column({ type: 'uuid', nullable: true })
  prescribing_doctor_id: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'prescribing_doctor_id' })
  prescribing_doctor: User | null;

  @Column({ type: 'uuid', nullable: true })
  pharmacist_id: string | null; // Assigned for validation

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'pharmacist_id' })
  pharmacist: User | null;

  // ============================================================================
  // Source
  // ============================================================================

  @Column({
    type: 'enum',
    enum: PrescriptionSource,
  })
  source: PrescriptionSource;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url: string | null; // S3 URL if patient uploaded

  // ============================================================================
  // AI Transcription
  // ============================================================================

  @Column({ type: 'jsonb', nullable: true })
  ai_transcription_data: any; // Raw OCR results from AWS Textract

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  ai_confidence_score: number | null; // Overall confidence 0-100

  // ============================================================================
  // Validation Status
  // ============================================================================

  @Column({
    type: 'enum',
    enum: PrescriptionStatus,
    default: PrescriptionStatus.PENDING,
  })
  @Index('idx_prescriptions_status')
  status: PrescriptionStatus;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string | null; // Mandatory if status = rejected

  // ============================================================================
  // Safety Checks
  // ============================================================================

  @Column({ type: 'jsonb', nullable: true })
  drug_interactions: any; // Array of {drug1, drug2, severity, description}

  @Column({ type: 'jsonb', nullable: true })
  allergy_warnings: any; // Array of {allergen, reaction_type, severity}

  @Column({ type: 'jsonb', nullable: true })
  contraindications: any; // Array of {condition, reason}

  // ============================================================================
  // Validity
  // ============================================================================

  @Column({ type: 'date', nullable: true })
  prescribed_date: Date | null;

  @Column({ type: 'date', nullable: true })
  expiry_date: Date | null; // Swiss prescriptions valid 3 months typically

  // ============================================================================
  // Treatment Plan
  // ============================================================================

  @Column({ type: 'uuid', nullable: true })
  treatment_plan_id: string | null;

  @OneToOne(() => TreatmentPlan, (treatmentPlan) => treatmentPlan.prescription, {
    nullable: true,
  })
  @JoinColumn({ name: 'treatment_plan_id' })
  treatment_plan: TreatmentPlan | null;

  // ============================================================================
  // Relationships
  // ============================================================================

  @OneToMany(() => PrescriptionItem, (item) => item.prescription, {
    cascade: true,
    eager: false,
  })
  items: PrescriptionItem[];

  // ============================================================================
  // Metadata
  // ============================================================================

  @CreateDateColumn({ type: 'timestamp' })
  @Index('idx_prescriptions_created')
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  approved_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  approved_by_pharmacist_id: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approved_by_pharmacist_id' })
  approved_by_pharmacist: User | null;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if prescription is pending
   */
  isPending(): boolean {
    return this.status === PrescriptionStatus.PENDING;
  }

  /**
   * Check if prescription is in review
   */
  isInReview(): boolean {
    return this.status === PrescriptionStatus.IN_REVIEW;
  }

  /**
   * Check if prescription is approved
   */
  isApproved(): boolean {
    return this.status === PrescriptionStatus.APPROVED;
  }

  /**
   * Check if prescription is rejected
   */
  isRejected(): boolean {
    return this.status === PrescriptionStatus.REJECTED;
  }

  /**
   * Check if prescription is expired
   */
  isExpired(): boolean {
    return this.status === PrescriptionStatus.EXPIRED;
  }

  /**
   * Check if prescription can be edited (not in immutable state)
   * Immutable states: approved, rejected, expired
   */
  canBeEdited(): boolean {
    return (
      this.status === PrescriptionStatus.PENDING ||
      this.status === PrescriptionStatus.IN_REVIEW ||
      this.status === PrescriptionStatus.CLARIFICATION_NEEDED
    );
  }

  /**
   * Check if AI confidence is low (< 80%) requiring manual verification
   * FR-013a: Low-confidence fields must be highlighted with visual warnings
   */
  hasLowConfidence(): boolean {
    return this.ai_confidence_score !== null && this.ai_confidence_score < 80;
  }

  /**
   * Check if prescription has safety warnings
   */
  hasSafetyWarnings(): boolean {
    return (
      (this.drug_interactions && Array.isArray(this.drug_interactions) && this.drug_interactions.length > 0) ||
      (this.allergy_warnings && Array.isArray(this.allergy_warnings) && this.allergy_warnings.length > 0) ||
      (this.contraindications && Array.isArray(this.contraindications) && this.contraindications.length > 0)
    );
  }

  /**
   * Check if prescription requires clarification from doctor
   */
  needsClarification(): boolean {
    return this.status === PrescriptionStatus.CLARIFICATION_NEEDED;
  }

  /**
   * Check if prescription is from doctor (not patient upload)
   */
  isFromDoctor(): boolean {
    return (
      this.source === PrescriptionSource.DOCTOR_DIRECT ||
      this.source === PrescriptionSource.TELECONSULTATION
    );
  }

  /**
   * Check if prescription is from patient upload
   */
  isFromPatientUpload(): boolean {
    return this.source === PrescriptionSource.PATIENT_UPLOAD;
  }

  /**
   * Check if prescription validity has expired (based on expiry_date)
   */
  isPastExpiryDate(): boolean {
    if (!this.expiry_date) {
      return false;
    }
    return new Date(this.expiry_date) < new Date();
  }

  /**
   * Mark prescription as approved
   */
  approve(pharmacistId: string): void {
    this.status = PrescriptionStatus.APPROVED;
    this.approved_at = new Date();
    this.approved_by_pharmacist_id = pharmacistId;
  }

  /**
   * Mark prescription as rejected
   */
  reject(reason: string): void {
    this.status = PrescriptionStatus.REJECTED;
    this.rejection_reason = reason;
  }

  /**
   * Mark prescription as needing clarification
   */
  requestClarification(reason: string): void {
    this.status = PrescriptionStatus.CLARIFICATION_NEEDED;
    this.rejection_reason = reason; // Use rejection_reason field for clarification notes
  }
}
