/**
 * AuditTrailEntry Entity
 * Immutable audit logs for compliance (HIPAA, GDPR, Swiss regulations)
 * Based on: /specs/002-metapharm-platform/data-model.md
 *
 * IMPORTANT: This is an append-only table. No UPDATE or DELETE operations allowed.
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
import { User } from './User';
import { Pharmacy } from './Pharmacy';

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}

export interface AuditChanges {
  [field: string]: {
    old: any;
    new: any;
  };
}

export interface DeviceInfo {
  os?: string;
  browser?: string;
  app_version?: string;
  device_model?: string;
  platform?: string;
}

@Entity('audit_trail_entries')
@Index('idx_audit_trail_resource', ['resource_type', 'resource_id'])
export class AuditTrailEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // Context
  // ============================================================================

  @Column({ type: 'varchar', length: 36, nullable: true })
  @Index('idx_audit_trail_pharmacy')
  pharmacy_id: string | null; // Nullable for global events

  @ManyToOne(() => Pharmacy, { nullable: true })
  @JoinColumn({ name: 'pharmacy_id' })
  pharmacy: Pharmacy | null;

  @Column({ type: 'varchar', length: 36 })
  @Index('idx_audit_trail_user')
  user_id: string;

  @ManyToOne(() => User, (user) => user.audit_trail_entries)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // ============================================================================
  // Event
  // ============================================================================

  @Column({ type: 'varchar', length: 100 })
  @Index('idx_audit_trail_event')
  event_type: string; // "prescription.approved", "record.accessed", "delivery.confirmed"

  @Column({
    type: 'varchar',
    length: 50,
  })
  action: AuditAction;

  @Column({ type: 'varchar', length: 100 })
  resource_type: string; // "prescription", "patient_medical_record", "inventory_item"

  @Column({ type: 'varchar', length: 36 })
  resource_id: string;

  // ============================================================================
  // Changes (for UPDATE actions)
  // ============================================================================

  @Column({ type: 'simple-json', nullable: true })
  changes: AuditChanges | null; // {field: {old: value, new: value}}

  // ============================================================================
  // Request Context
  // ============================================================================

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string | null; // IPv4 (15) or IPv6 (45)

  @Column({ type: 'text', nullable: true })
  user_agent: string | null;

  @Column({ type: 'simple-json', nullable: true })
  device_info: DeviceInfo | null;

  // ============================================================================
  // Timestamp (immutable)
  // ============================================================================

  @CreateDateColumn({ type: 'datetime' })
  @Index('idx_audit_trail_created')
  created_at: Date;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if this is an UPDATE action with changes
   */
  hasChanges(): boolean {
    return this.action === AuditAction.UPDATE && this.changes !== null;
  }

  /**
   * Get list of changed fields
   */
  getChangedFields(): string[] {
    if (!this.hasChanges() || !this.changes) return [];
    return Object.keys(this.changes);
  }

  /**
   * Get old value for a specific field
   */
  getOldValue(field: string): any {
    if (!this.hasChanges() || !this.changes) return null;
    return this.changes[field]?.old;
  }

  /**
   * Get new value for a specific field
   */
  getNewValue(field: string): any {
    if (!this.hasChanges() || !this.changes) return null;
    return this.changes[field]?.new;
  }

  /**
   * Check if entry is from a specific pharmacy
   */
  isFromPharmacy(pharmacyId: string): boolean {
    return this.pharmacy_id === pharmacyId;
  }

  /**
   * Check if entry is a global event (no pharmacy context)
   */
  isGlobalEvent(): boolean {
    return this.pharmacy_id === null;
  }

  /**
   * Get formatted event description
   */
  getEventDescription(): string {
    const actionVerb = {
      [AuditAction.CREATE]: 'created',
      [AuditAction.READ]: 'accessed',
      [AuditAction.UPDATE]: 'updated',
      [AuditAction.DELETE]: 'deleted',
    }[this.action];

    return `${this.resource_type} ${actionVerb}`;
  }

  /**
   * Get device platform from device_info
   */
  getDevicePlatform(): string | null {
    return this.device_info?.platform || null;
  }

  /**
   * Get browser from device_info
   */
  getBrowser(): string | null {
    return this.device_info?.browser || null;
  }

  /**
   * Static factory method for creating audit entries
   * (Use this instead of direct instantiation for consistency)
   */
  static create(params: {
    userId: string;
    pharmacyId?: string | null;
    eventType: string;
    action: AuditAction;
    resourceType: string;
    resourceId: string;
    changes?: AuditChanges | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    deviceInfo?: DeviceInfo | null;
  }): AuditTrailEntry {
    const entry = new AuditTrailEntry();
    entry.user_id = params.userId;
    entry.pharmacy_id = params.pharmacyId || null;
    entry.event_type = params.eventType;
    entry.action = params.action;
    entry.resource_type = params.resourceType;
    entry.resource_id = params.resourceId;
    entry.changes = params.changes || null;
    entry.ip_address = params.ipAddress || null;
    entry.user_agent = params.userAgent || null;
    entry.device_info = params.deviceInfo || null;
    return entry;
  }
}
