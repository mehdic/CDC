/**
 * CalendarIntegration Entity
 * Stores OAuth tokens and CalDAV credentials for calendar sync
 * Manages authentication state for Google and Apple calendar integrations
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
import { CalendarProvider } from './CalendarEvent';

export enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

@Entity('calendar_integrations')
@Index('idx_calendar_integrations_user_provider', ['user_id', 'provider'])
@Index('idx_calendar_integrations_status', ['status'])
export class CalendarIntegration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // User Reference
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_calendar_integrations_user_id')
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // ============================================================================
  // Provider Information
  // ============================================================================

  @Column({
    type: 'enum',
    enum: CalendarProvider,
  })
  provider: CalendarProvider;

  @Column({ type: 'varchar', length: 255 })
  account_email: string; // Google email or Apple email

  // ============================================================================
  // OAuth Credentials (Google Calendar)
  // ============================================================================

  @Column({ type: 'text', nullable: true })
  access_token: string | null; // Encrypted OAuth access token

  @Column({ type: 'text', nullable: true })
  refresh_token: string | null; // Encrypted OAuth refresh token (for token renewal)

  @Column({ type: 'timestamp with time zone', nullable: true })
  token_expiry: Date | null; // When access token expires

  // ============================================================================
  // CalDAV Credentials (Apple Calendar)
  // ============================================================================

  @Column({ type: 'text', nullable: true })
  caldav_username: string | null; // iCloud username or email

  @Column({ type: 'text', nullable: true })
  caldav_password: string | null; // Encrypted app-specific password

  @Column({ type: 'varchar', length: 255, nullable: true })
  caldav_server_url: string | null; // CalDAV server URL (e.g., caldav.icloud.com)

  // ============================================================================
  // Sync Configuration
  // ============================================================================

  @Column({ type: 'boolean', default: true })
  sync_enabled: boolean;

  @Column({ type: 'boolean', default: true })
  two_way_sync: boolean; // Allow changes to sync back to MetaPharm

  @Column({ type: 'integer', default: 30 })
  sync_frequency_minutes: number; // How often to sync (minimum 15)

  @Column({ type: 'timestamp with time zone', nullable: true })
  last_sync_at: Date | null;

  @Column({ type: 'text', nullable: true })
  last_sync_error: string | null;

  // ============================================================================
  // Status & Configuration
  // ============================================================================

  @Column({
    type: 'enum',
    enum: IntegrationStatus,
    default: IntegrationStatus.INACTIVE,
  })
  status: IntegrationStatus;

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    include_reminders?: boolean;
    reminder_minutes?: number;
    sync_medication_reminders?: boolean;
    sync_appointments?: boolean;
    auto_accept_meetings?: boolean;
    calendar_name?: string; // Target calendar name
  } | null;

  // ============================================================================
  // Metadata
  // ============================================================================

  @Column({ type: 'text', nullable: true })
  calendar_id: string | null; // Primary calendar ID from provider

  @Column({ type: 'jsonb', nullable: true })
  provider_metadata: {
    scope?: string;
    token_type?: string;
    calendar_ids?: string[];
    [key: string]: any;
  } | null;

  // ============================================================================
  // Timestamps
  // ============================================================================

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  deleted_at: Date | null;
}
