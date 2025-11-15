/**
 * Doctor Entity
 * Healthcare professional with specialization and licensing information
 * HIPAA/GDPR Compliant - Medical professional data with audit logging
 * Based on: /specs/002-metapharm-platform/data-model.md
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

export interface Qualification {
  degree: string;
  institution: string;
  year: number;
}

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // User Relationship (One-to-One via user_id)
  // ============================================================================

  @Column({ type: 'uuid', unique: true })
  @Index('idx_doctors_user_id')
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // ============================================================================
  // Professional Information
  // ============================================================================

  @Column({ type: 'varchar', length: 100 })
  specialization: string; // e.g., "Cardiology", "General Practice"

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index('idx_doctors_license_number')
  license_number: string; // Medical license number

  @Column({ type: 'varchar', length: 50, default: 'CH' })
  license_country: string; // ISO country code (CH for Switzerland)

  @Column({ type: 'jsonb', nullable: true })
  qualifications: Qualification[] | null; // Medical degrees and certifications

  // ============================================================================
  // Verification & Status
  // ============================================================================

  @Column({ type: 'boolean', default: false })
  is_verified: boolean; // Admin verification of medical credentials

  @Column({ type: 'text', nullable: true })
  bio: string | null; // Professional bio for patient-facing profiles

  // ============================================================================
  // Metadata
  // ============================================================================

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null; // Soft delete

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if doctor profile is soft deleted
   */
  isDeleted(): boolean {
    return this.deleted_at !== null;
  }

  /**
   * Soft delete doctor profile
   */
  softDelete(): void {
    this.deleted_at = new Date();
  }

  /**
   * Check if doctor is verified
   */
  isVerified(): boolean {
    return this.is_verified && !this.isDeleted();
  }
}
