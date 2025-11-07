/**
 * User Entity
 * All platform users across 5 roles: Pharmacist, Doctor, Nurse, Delivery Personnel, Patient
 * Based on: /specs/002-metapharm-platform/data-model.md
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Pharmacy } from './Pharmacy';
import { AuditTrailEntry } from './AuditTrailEntry';

export enum UserRole {
  PHARMACIST = 'pharmacist',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  DELIVERY = 'delivery',
  PATIENT = 'patient',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Identity
  // ============================================================================

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index('idx_users_email')
  email: string;

  @Column({ type: 'boolean', default: false })
  email_verified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password_hash: string | null; // Null if HIN e-ID only

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  @Index('idx_users_hin_id')
  hin_id: string | null; // Swiss HIN e-ID for doctors and pharmacists

  // ============================================================================
  // Role & Status
  // ============================================================================

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  @Index('idx_users_role')
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  // ============================================================================
  // Profile (encrypted with AWS KMS)
  // ============================================================================

  @Column({ type: 'bytea' })
  first_name_encrypted: Buffer; // AWS KMS encrypted PHI

  @Column({ type: 'bytea' })
  last_name_encrypted: Buffer; // AWS KMS encrypted PHI

  @Column({ type: 'bytea', nullable: true })
  phone_encrypted: Buffer | null; // AWS KMS encrypted PHI

  // ============================================================================
  // MFA (Multi-Factor Authentication)
  // ============================================================================

  @Column({ type: 'boolean', default: false })
  mfa_enabled: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mfa_secret: string | null; // DEPRECATED: Use mfa_secret_encrypted instead

  @Column({ type: 'bytea', nullable: true })
  mfa_secret_encrypted: Buffer | null; // AWS KMS encrypted TOTP secret (FR-104)

  // ============================================================================
  // Affiliations
  // ============================================================================

  @Column({ type: 'uuid', nullable: true })
  @Index('idx_users_pharmacy')
  primary_pharmacy_id: string | null;

  @ManyToOne(() => Pharmacy, (pharmacy) => pharmacy.users, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'primary_pharmacy_id' })
  primary_pharmacy: Pharmacy | null;

  // ============================================================================
  // Relationships
  // ============================================================================

  @OneToMany(() => AuditTrailEntry, (auditEntry) => auditEntry.user)
  audit_trail_entries: AuditTrailEntry[];

  // TODO: Add relationships for Prescription, Teleconsultation, etc. in later migrations

  // ============================================================================
  // Metadata
  // ============================================================================

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null; // Soft delete

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if user is soft deleted
   */
  isDeleted(): boolean {
    return this.deleted_at !== null;
  }

  /**
   * Check if user is active
   */
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE && !this.isDeleted();
  }

  /**
   * Check if user has MFA enabled
   */
  hasMFA(): boolean {
    return this.mfa_enabled && (this.mfa_secret_encrypted !== null || this.mfa_secret !== null);
  }

  /**
   * Check if user is a healthcare professional (requires MFA)
   */
  isHealthcareProfessional(): boolean {
    return (
      this.role === UserRole.PHARMACIST ||
      this.role === UserRole.DOCTOR ||
      this.role === UserRole.NURSE
    );
  }

  /**
   * Check if user has HIN e-ID authentication
   */
  hasHINAuth(): boolean {
    return this.hin_id !== null;
  }

  /**
   * Soft delete user
   */
  softDelete(): void {
    this.deleted_at = new Date();
    this.status = UserStatus.INACTIVE;
  }

  /**
   * Update last login timestamp
   */
  updateLastLogin(): void {
    this.last_login_at = new Date();
  }
}
