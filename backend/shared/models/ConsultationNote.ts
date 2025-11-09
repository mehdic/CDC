/**
 * ConsultationNote Entity
 * AI-transcribed and pharmacist-edited notes from teleconsultations
 * Based on: /specs/002-metapharm-platform/data-model.md
 * User Story 2 (P2): Secure Teleconsultation (FR-025, FR-025a, FR-028)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Teleconsultation } from './Teleconsultation';

/**
 * Edit history entry for audit trail (FR-025a)
 */
export interface EditHistoryEntry {
  timestamp: Date;
  user_id: string;
  changes: {
    field: string;
    old_value: string;
    new_value: string;
  }[];
  original_ai_version?: string;  // Preserved original AI transcript
}

/**
 * AI-highlighted medical term
 */
export interface HighlightedTerm {
  term: string;
  timestamp: number;  // Seconds into consultation
  confidence: number;  // 0-100
  category?: string;  // 'medication', 'symptom', 'diagnosis', etc.
}

@Entity('consultation_notes')
export class ConsultationNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Relationship
  // ============================================================================

  @Column({ type: 'uuid', unique: true })
  @Index('idx_consultation_notes_teleconsultation')
  teleconsultation_id: string;

  @OneToOne(() => Teleconsultation, (tc) => tc.consultation_note, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'teleconsultation_id' })
  teleconsultation: Teleconsultation;

  // ============================================================================
  // AI Transcript (Encrypted - PHI)
  // ============================================================================

  @Column({ type: 'bytea', nullable: true })
  ai_transcript_encrypted: Buffer | null;  // AWS KMS encrypted

  @Column({ type: 'text', nullable: true })
  ai_summary: string | null;  // AI-generated summary

  @Column({ type: 'jsonb', nullable: true })
  ai_highlighted_terms: HighlightedTerm[] | null;

  // ============================================================================
  // Pharmacist Edits (Encrypted - PHI)
  // ============================================================================

  @Column({ type: 'bytea', nullable: true })
  pharmacist_notes_encrypted: Buffer | null;  // AWS KMS encrypted

  @Column({ type: 'boolean', default: false })
  edited: boolean;

  /**
   * FR-025a: Immutable audit trail of all transcript edits
   * Original AI version is preserved in edit_history[0].original_ai_version
   * All subsequent edits are tracked with user_id, timestamp, and changes
   */
  @Column({ type: 'jsonb', nullable: true })
  edit_history: EditHistoryEntry[] | null;

  // ============================================================================
  // Metadata
  // ============================================================================

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
