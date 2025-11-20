/**
 * Clarification Entity
 * Tracks clarification requests between pharmacists and doctors for unclear prescriptions
 * Based on: /specs/002-metapharm-platform/spec.md
 * User Story 1 (P1): Prescription Processing & Validation (FR-028)
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
import { User } from './User';

export enum ClarificationStatus {
  PENDING = 'pending',           // Waiting for doctor response
  RESPONDED = 'responded',       // Doctor has responded
  RESOLVED = 'resolved',         // Issue resolved, prescription approved
  CANCELLED = 'cancelled',       // Clarification request cancelled
}

@Entity('clarifications')
export class Clarification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Relationships
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_clarifications_prescription')
  prescription_id: string;

  @ManyToOne(() => Prescription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prescription_id' })
  prescription: Prescription;

  @Column({ type: 'uuid' })
  @Index('idx_clarifications_pharmacist')
  pharmacist_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pharmacist_id' })
  pharmacist: User;

  @Column({ type: 'uuid' })
  @Index('idx_clarifications_doctor')
  doctor_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: User;

  // ============================================================================
  // Clarification Details
  // ============================================================================

  @Column({ type: 'text' })
  question: string; // Pharmacist's question/concern

  @Column({ type: 'text', nullable: true })
  response: string | null; // Doctor's response

  @Column({
    type: 'enum',
    enum: ClarificationStatus,
    default: ClarificationStatus.PENDING,
  })
  @Index('idx_clarifications_status')
  status: ClarificationStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string | null; // e.g., 'dosage', 'drug_name', 'instructions', 'interaction'

  // ============================================================================
  // Metadata
  // ============================================================================

  @CreateDateColumn({ type: 'timestamp' })
  @Index('idx_clarifications_created')
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  responded_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  resolved_at: Date | null;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if clarification is pending
   */
  isPending(): boolean {
    return this.status === ClarificationStatus.PENDING;
  }

  /**
   * Check if doctor has responded
   */
  hasResponse(): boolean {
    return this.status === ClarificationStatus.RESPONDED || this.status === ClarificationStatus.RESOLVED;
  }

  /**
   * Check if clarification is resolved
   */
  isResolved(): boolean {
    return this.status === ClarificationStatus.RESOLVED;
  }

  /**
   * Mark as responded by doctor
   */
  markAsResponded(response: string): void {
    this.status = ClarificationStatus.RESPONDED;
    this.response = response;
    this.responded_at = new Date();
  }

  /**
   * Mark as resolved
   */
  markAsResolved(): void {
    this.status = ClarificationStatus.RESOLVED;
    this.resolved_at = new Date();
  }

  /**
   * Cancel clarification request
   */
  cancel(): void {
    this.status = ClarificationStatus.CANCELLED;
  }
}
