/**
 * PrescriptionItem Entity
 * Individual medications in a prescription with field-level AI confidence tracking
 * Based on: /specs/002-metapharm-platform/data-model.md
 * User Story 1 (P1): Prescription Processing & Validation
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
import { Prescription } from './Prescription';

@Entity('prescription_items')
export class PrescriptionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Prescription Relationship
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_prescription_items_prescription')
  prescription_id: string;

  @ManyToOne(() => Prescription, (prescription) => prescription.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'prescription_id' })
  prescription: Prescription;

  // ============================================================================
  // Medication
  // ============================================================================

  @Column({ type: 'varchar', length: 255 })
  medication_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index('idx_prescription_items_medication')
  medication_rxnorm_code: string | null; // Normalized RxNorm code for drug database lookup

  @Column({ type: 'varchar', length: 100 })
  dosage: string; // e.g., "500mg"

  @Column({ type: 'varchar', length: 100 })
  frequency: string; // e.g., "twice daily"

  @Column({ type: 'varchar', length: 100, nullable: true })
  duration: string | null; // e.g., "7 days"

  @Column({ type: 'integer', nullable: true })
  quantity: number | null; // Total pills/units to dispense

  // ============================================================================
  // AI Transcription Confidence (per field)
  // FR-013a: Low-confidence fields (< 80) must be highlighted with red/yellow warnings
  // ============================================================================

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  medication_confidence: number | null; // 0-100, < 80 requires explicit pharmacist verification

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  dosage_confidence: number | null; // 0-100, < 80 requires explicit pharmacist verification

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  frequency_confidence: number | null; // 0-100, < 80 requires explicit pharmacist verification

  // ============================================================================
  // Pharmacist Corrections
  // ============================================================================

  @Column({ type: 'boolean', default: false })
  pharmacist_corrected: boolean;

  @Column({ type: 'jsonb', nullable: true })
  original_ai_value: any; // Store original AI extraction if pharmacist corrects

  // ============================================================================
  // Inventory Link
  // ============================================================================

  @Column({ type: 'uuid', nullable: true })
  inventory_item_id: string | null; // FK to inventory_items (will be set after inventory table creation)

  // TODO: Add ManyToOne relationship to InventoryItem when inventory entities are created in Phase 3

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
   * Check if medication name has low AI confidence (< 80%)
   * FR-013a: Must be highlighted with visual warning in UI
   */
  hasMedicationLowConfidence(): boolean {
    return this.medication_confidence !== null && this.medication_confidence < 80;
  }

  /**
   * Check if dosage has low AI confidence (< 80%)
   * FR-013a: Must be highlighted with visual warning in UI
   */
  hasDosageLowConfidence(): boolean {
    return this.dosage_confidence !== null && this.dosage_confidence < 80;
  }

  /**
   * Check if frequency has low AI confidence (< 80%)
   * FR-013a: Must be highlighted with visual warning in UI
   */
  hasFrequencyLowConfidence(): boolean {
    return this.frequency_confidence !== null && this.frequency_confidence < 80;
  }

  /**
   * Check if any field has low AI confidence
   * Returns true if any confidence score < 80
   */
  hasAnyLowConfidence(): boolean {
    return (
      this.hasMedicationLowConfidence() ||
      this.hasDosageLowConfidence() ||
      this.hasFrequencyLowConfidence()
    );
  }

  /**
   * Get list of fields with low confidence
   * Returns array of field names that have confidence < 80
   */
  getLowConfidenceFields(): string[] {
    const fields: string[] = [];

    if (this.hasMedicationLowConfidence()) {
      fields.push('medication_name');
    }
    if (this.hasDosageLowConfidence()) {
      fields.push('dosage');
    }
    if (this.hasFrequencyLowConfidence()) {
      fields.push('frequency');
    }

    return fields;
  }

  /**
   * Check if item was manually corrected by pharmacist
   */
  wasCorrectedByPharmacist(): boolean {
    return this.pharmacist_corrected === true;
  }

  /**
   * Get average confidence score across all fields
   * Returns null if no confidence scores available
   */
  getAverageConfidence(): number | null {
    const scores: number[] = [];

    if (this.medication_confidence !== null) {
      scores.push(this.medication_confidence);
    }
    if (this.dosage_confidence !== null) {
      scores.push(this.dosage_confidence);
    }
    if (this.frequency_confidence !== null) {
      scores.push(this.frequency_confidence);
    }

    if (scores.length === 0) {
      return null;
    }

    const sum = scores.reduce((acc, score) => acc + score, 0);
    return Number((sum / scores.length).toFixed(2));
  }

  /**
   * Mark item as corrected by pharmacist
   * Stores original AI values for audit trail
   */
  markAsCorrected(originalValues: any): void {
    this.pharmacist_corrected = true;
    this.original_ai_value = originalValues;
  }
}
