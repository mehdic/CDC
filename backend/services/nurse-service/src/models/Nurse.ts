/**
 * Nurse Entity
 * Healthcare professional with specialization and certification information
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

export interface Certification {
  name: string;
  issuer: string;
  expiry: string; // ISO date string (YYYY-MM-DD)
}

@Entity('nurses')
export class Nurse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // User Relationship (One-to-One via user_id)
  // ============================================================================

  @Column({ type: 'uuid', unique: true })
  @Index('idx_nurses_user_id')
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // ============================================================================
  // Professional Information
  // ============================================================================

  @Column({ type: 'varchar', length: 100 })
  specialization: string; // e.g., "Pediatric", "Geriatric", "ICU"

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index('idx_nurses_license_number')
  license_number: string; // Nursing license number

  @Column({ type: 'varchar', length: 50, default: 'CH' })
  license_country: string; // ISO country code (CH for Switzerland)

  @Column({ type: 'jsonb', nullable: true })
  certifications: Certification[] | null; // Nursing certifications with expiry dates

  // ============================================================================
  // Verification & Status
  // ============================================================================

  @Column({ type: 'boolean', default: false })
  is_verified: boolean; // Admin verification of nursing credentials

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
   * Check if nurse profile is soft deleted
   */
  isDeleted(): boolean {
    return this.deleted_at !== null;
  }

  /**
   * Soft delete nurse profile
   */
  softDelete(): void {
    this.deleted_at = new Date();
  }

  /**
   * Check if nurse is verified
   */
  isVerified(): boolean {
    return this.is_verified && !this.isDeleted();
  }

  /**
   * Get certifications that are still valid
   */
  getValidCertifications(): Certification[] {
    if (!this.certifications) return [];

    const now = new Date();
    return this.certifications.filter(cert => {
      const expiry = new Date(cert.expiry);
      return expiry > now;
    });
  }

  /**
   * Check if any certification is expiring soon (within 30 days)
   */
  hasCertificationsExpiringSoon(daysThreshold: number = 30): boolean {
    if (!this.certifications) return false;

    const now = new Date();
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + daysThreshold);

    return this.certifications.some(cert => {
      const expiry = new Date(cert.expiry);
      return expiry > now && expiry <= threshold;
    });
  }
}
