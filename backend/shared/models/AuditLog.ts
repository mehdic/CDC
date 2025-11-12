/**
 * AuditLog Entity
 * Tracks user actions for master account management
 * Separate from AuditTrailEntry (used for prescription/pharmacy audits)
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

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('idx_audit_logs_user_id')
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255 })
  @Index('idx_audit_logs_action')
  action: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resource: string | null;

  @Column({ type: 'uuid', nullable: true })
  resource_id: string | null;

  @Column({ type: 'jsonb', default: {} })
  details: any;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string | null;

  @Column({ type: 'text', nullable: true })
  user_agent: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  @Index('idx_audit_logs_created_at')
  created_at: Date;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if action is a security-related event
   */
  isSecurityEvent(): boolean {
    return this.action.startsWith('mfa.') ||
           this.action.startsWith('login.') ||
           this.action.startsWith('permission.');
  }

  /**
   * Get human-readable action description
   */
  getActionDescription(): string {
    const actionMap: Record<string, string> = {
      'user.created': 'User account created',
      'user.updated': 'User account updated',
      'user.deleted': 'User account deleted',
      'permission.granted': 'Permission granted',
      'permission.revoked': 'Permission revoked',
      'permission.updated': 'Permission updated',
      'mfa.enabled': 'MFA enabled',
      'mfa.disabled': 'MFA disabled',
      'mfa.setup': 'MFA setup initiated',
      'settings.updated': 'Account settings updated',
      'location.added': 'Location added',
      'location.removed': 'Location removed',
    };

    return actionMap[this.action] || this.action;
  }
}
