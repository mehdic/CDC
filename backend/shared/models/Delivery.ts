/**
 * Delivery Entity
 * Tracks delivery of orders to patients
 * Based on: /specs/002-metapharm-platform/data-model.md
 * Batch 3 Phase 4 - Delivery & Order Services
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
import { User } from './User';

export enum DeliveryStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('deliveries')
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Relationships
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_deliveries_user')
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  @Index('idx_deliveries_order')
  order_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  @Index('idx_deliveries_delivery_personnel')
  delivery_personnel_id: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'delivery_personnel_id' })
  delivery_personnel: User | null;

  // ============================================================================
  // Status
  // ============================================================================

  @Column({
    type: 'varchar',
    length: 50,
    default: DeliveryStatus.PENDING,
  })
  @Index('idx_deliveries_status')
  status: DeliveryStatus;

  // ============================================================================
  // Delivery Information (HIPAA Compliant)
  // ============================================================================

  @Column({ type: 'bytea' })
  delivery_address_encrypted: Buffer; // AWS KMS encrypted PHI

  @Column({ type: 'bytea', nullable: true })
  delivery_notes_encrypted: Buffer | null; // AWS KMS encrypted PHI

  @Column({ type: 'simple-json', nullable: true })
  tracking_info: Record<string, any> | null; // GPS coordinates, timestamps, etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  tracking_number: string | null; // Public tracking number (non-PHI)

  // ============================================================================
  // Timing
  // ============================================================================

  @Column({ type: 'timestamp', nullable: true })
  scheduled_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  picked_up_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  failed_at: Date | null;

  @Column({ type: 'text', nullable: true })
  failure_reason: string | null;

  // ============================================================================
  // Cold Chain Management (T3-066)
  // ============================================================================

  @Column({ type: 'boolean', default: false })
  requires_temperature_control: boolean; // Medication requires refrigeration/cold chain

  @Column({ type: 'varchar', length: 50, nullable: true })
  temperature_range_min: string | null; // e.g., "2" for 2-8°C storage

  @Column({ type: 'varchar', length: 50, nullable: true })
  temperature_range_max: string | null; // e.g., "8" for 2-8°C storage

  @Column({ type: 'integer', nullable: true })
  max_delivery_duration_minutes: number | null; // Max time between pickup and delivery

  @Column({ type: 'timestamp', nullable: true })
  temperature_alert_sent_at: Date | null; // When temperature/time alert was triggered

  @Column({ type: 'text', nullable: true })
  temperature_alert_reason: string | null; // Reason for alert (e.g., "Delivery taking too long")

  // ============================================================================
  // Controlled Substance Handling (T3-067)
  // ============================================================================

  @Column({ type: 'boolean', default: false })
  contains_controlled_substance: boolean; // Delivery includes controlled substances

  @Column({ type: 'varchar', length: 10, nullable: true })
  substance_schedule: string | null; // I, II, III, IV, V (Swiss classification)

  @Column({ type: 'boolean', default: false })
  requires_signature: boolean; // Signature required on delivery

  @Column({ type: 'timestamp', nullable: true })
  signature_obtained_at: Date | null; // When signature was obtained

  @Column({ type: 'varchar', length: 255, nullable: true })
  signature_image_encrypted: string | null; // Base64 encrypted signature

  @Column({ type: 'boolean', default: false })
  age_verification_required: boolean; // Age verification needed (18+ medications)

  @Column({ type: 'timestamp', nullable: true })
  age_verified_at: Date | null; // When age verification was completed

  @Column({ type: 'varchar', length: 50, nullable: true })
  verified_age_minimum: string | null; // Minimum verified age (e.g., "18")

  @Column({ type: 'boolean', default: false })
  id_scanned: boolean; // ID was scanned for verification

  @Column({ type: 'varchar', length: 255, nullable: true })
  id_scan_data_encrypted: string | null; // Encrypted ID scan results

  @Column({ type: 'timestamp', nullable: true })
  id_scanned_at: Date | null; // When ID was scanned

  @Column({ type: 'text', nullable: true })
  special_handling_instructions: string | null; // Special instructions (e.g., "Do not refrigerate", "Keep away from light")

  // ============================================================================
  // Compliance Logging (T3-067)
  // ============================================================================

  @Column({ type: 'simple-json', nullable: true })
  compliance_log: Array<{
    timestamp: string;
    event: string;
    details: string;
    verified_by?: string;
  }> | null; // Audit trail of compliance checks

  // ============================================================================
  // Metadata
  // ============================================================================

  @CreateDateColumn({ type: 'timestamp' })
  @Index('idx_deliveries_created')
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if delivery is pending
   */
  isPending(): boolean {
    return this.status === DeliveryStatus.PENDING;
  }

  /**
   * Check if delivery is assigned
   */
  isAssigned(): boolean {
    return this.status === DeliveryStatus.ASSIGNED;
  }

  /**
   * Check if delivery is in transit
   */
  isInTransit(): boolean {
    return this.status === DeliveryStatus.IN_TRANSIT;
  }

  /**
   * Check if delivery is completed
   */
  isDelivered(): boolean {
    return this.status === DeliveryStatus.DELIVERED;
  }

  /**
   * Check if delivery failed
   */
  isFailed(): boolean {
    return this.status === DeliveryStatus.FAILED;
  }

  /**
   * Check if delivery was cancelled
   */
  isCancelled(): boolean {
    return this.status === DeliveryStatus.CANCELLED;
  }

  /**
   * Mark delivery as assigned
   */
  assign(deliveryPersonnelId: string): void {
    this.status = DeliveryStatus.ASSIGNED;
    this.delivery_personnel_id = deliveryPersonnelId;
  }

  /**
   * Mark delivery as picked up
   */
  pickUp(): void {
    this.status = DeliveryStatus.IN_TRANSIT;
    this.picked_up_at = new Date();
  }

  /**
   * Mark delivery as delivered
   */
  deliver(): void {
    this.status = DeliveryStatus.DELIVERED;
    this.delivered_at = new Date();
  }

  /**
   * Mark delivery as failed
   */
  fail(reason: string): void {
    this.status = DeliveryStatus.FAILED;
    this.failed_at = new Date();
    this.failure_reason = reason;
  }

  /**
   * Cancel delivery
   */
  cancel(): void {
    this.status = DeliveryStatus.CANCELLED;
  }

  // ============================================================================
  // Cold Chain Helper Methods (T3-066)
  // ============================================================================

  /**
   * Check if delivery is exceeding max duration
   */
  isExceedingMaxDuration(): boolean {
    if (!this.max_delivery_duration_minutes || !this.picked_up_at) {
      return false;
    }
    const now = new Date();
    const elapsedMinutes = (now.getTime() - this.picked_up_at.getTime()) / (1000 * 60);
    return elapsedMinutes > this.max_delivery_duration_minutes;
  }

  /**
   * Trigger cold chain alert
   */
  triggerColdChainAlert(reason: string): void {
    this.temperature_alert_sent_at = new Date();
    this.temperature_alert_reason = reason;
    this.addComplianceLog('cold_chain_alert', reason, 'system');
  }

  /**
   * Get temperature range as display string
   */
  getTemperatureRangeDisplay(): string | null {
    if (!this.temperature_range_min || !this.temperature_range_max) {
      return null;
    }
    return `${this.temperature_range_min}°C - ${this.temperature_range_max}°C`;
  }

  // ============================================================================
  // Controlled Substance Helper Methods (T3-067)
  // ============================================================================

  /**
   * Check if age verification is complete
   */
  isAgeVerified(): boolean {
    if (!this.age_verification_required) {
      return false;
    }
    return this.age_verified_at !== null && this.age_verified_at !== undefined;
  }

  /**
   * Check if ID has been scanned
   */
  isIdScanned(): boolean {
    if (!this.id_scanned) {
      return false;
    }
    return this.id_scanned_at !== null && this.id_scanned_at !== undefined;
  }

  /**
   * Verify recipient age
   */
  verifyAge(minimumAge: number): void {
    if (!this.age_verification_required) {
      return;
    }
    this.age_verified_at = new Date();
    this.verified_age_minimum = minimumAge.toString();
    this.addComplianceLog(
      'age_verified',
      `Age verification completed for minimum age ${minimumAge}`,
      'system'
    );
  }

  /**
   * Record ID scan
   */
  scanId(encryptedScanData: string, scannedByPersonId?: string): void {
    this.id_scanned = true;
    this.id_scanned_at = new Date();
    this.id_scan_data_encrypted = encryptedScanData;
    this.addComplianceLog(
      'id_scanned',
      'ID scanned for controlled substance verification',
      scannedByPersonId || 'system'
    );
  }

  /**
   * Record signature
   */
  recordSignature(encryptedSignatureImage: string, signedByName?: string): void {
    this.signature_obtained_at = new Date();
    this.signature_image_encrypted = encryptedSignatureImage;
    this.addComplianceLog(
      'signature_obtained',
      `Signature obtained from ${signedByName || 'recipient'}`,
      'system'
    );
  }

  /**
   * Check if all controlled substance requirements are met
   */
  areControlledSubstanceRequirementsMet(): boolean {
    if (!this.contains_controlled_substance) {
      return true;
    }

    // Signature always required for controlled substances
    if (!this.isSignatureMet()) {
      return false;
    }

    // If age verification is required, must be completed
    if (this.age_verification_required && !this.isAgeVerified()) {
      return false;
    }

    // If ID scan is required, must be completed
    if (this.id_scanned && !this.isIdScanned()) {
      return false;
    }

    return true;
  }

  /**
   * Check if signature requirement is met
   */
  isSignatureMet(): boolean {
    if (!this.requires_signature) {
      return false;
    }
    return this.signature_obtained_at !== null && this.signature_obtained_at !== undefined;
  }

  // ============================================================================
  // Compliance Logging
  // ============================================================================

  /**
   * Add entry to compliance log
   */
  addComplianceLog(event: string, details: string, verifiedBy: string = 'system'): void {
    if (!this.compliance_log) {
      this.compliance_log = [];
    }
    this.compliance_log.push({
      timestamp: new Date().toISOString(),
      event,
      details,
      verified_by: verifiedBy,
    });
  }

  /**
   * Get compliance log
   */
  getComplianceLog(): Array<{ timestamp: string; event: string; details: string; verified_by?: string }> {
    return this.compliance_log || [];
  }
}
