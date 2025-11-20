/**
 * FieldCorrection Entity
 * Audit trail for low-confidence field corrections during prescription approval
 * Tracks what fields were manually verified/corrected by pharmacists
 * Phase 3: Low-Confidence Field Verification (GROUP_API_3)
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
import { Prescription } from './Prescription';
import { PrescriptionItem } from './PrescriptionItem';
import { User } from './User';

@Entity('field_corrections')
export class FieldCorrection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Prescription Reference
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_field_corrections_prescription')
  prescription_id: string;

  @ManyToOne(() => Prescription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prescription_id' })
  prescription: Prescription;

  // ============================================================================
  // Item Reference (nullable if correction is at prescription level)
  // ============================================================================

  @Column({ type: 'uuid', nullable: true })
  @Index('idx_field_corrections_item')
  prescription_item_id: string | null;

  @ManyToOne(() => PrescriptionItem, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'prescription_item_id' })
  prescription_item: PrescriptionItem | null;

  // ============================================================================
  // Pharmacist Who Made Correction
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_field_corrections_pharmacist')
  pharmacist_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pharmacist_id' })
  pharmacist: User;

  // ============================================================================
  // Field Details
  // ============================================================================

  @Column({ type: 'varchar', length: 100 })
  field_name: string; // e.g., 'medication_name', 'dosage', 'frequency'

  @Column({ type: 'text', nullable: true })
  original_value: string | null; // AI-extracted value

  @Column({ type: 'text' })
  corrected_value: string; // Pharmacist-verified/corrected value

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  original_confidence: number | null; // AI confidence score (0-100)

  // ============================================================================
  // Verification Details
  // ============================================================================

  @Column({ type: 'boolean', default: false })
  was_corrected: boolean; // true if value changed, false if just verified

  @Column({ type: 'text', nullable: true })
  correction_notes: string | null; // Optional pharmacist notes

  @Column({ type: 'varchar', length: 50 })
  correction_type: string; // 'verification', 'correction', 'clarification_needed'

  // ============================================================================
  // Metadata
  // ============================================================================

  @CreateDateColumn({ type: 'timestamp' })
  @Index('idx_field_corrections_created')
  created_at: Date;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if this was a correction (value changed) vs just verification
   */
  isCorrection(): boolean {
    return this.was_corrected === true;
  }

  /**
   * Check if this was just a verification (value confirmed as correct)
   */
  isVerification(): boolean {
    return this.was_corrected === false;
  }

  /**
   * Check if original confidence was low (< 80%)
   */
  hadLowConfidence(): boolean {
    return this.original_confidence !== null && this.original_confidence < 80;
  }

  /**
   * Get confidence status
   */
  getConfidenceStatus(): 'low' | 'medium' | 'high' | 'unknown' {
    if (this.original_confidence === null) {
      return 'unknown';
    }
    if (this.original_confidence < 70) {
      return 'low';
    }
    if (this.original_confidence < 85) {
      return 'medium';
    }
    return 'high';
  }
}
