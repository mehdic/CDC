/**
 * CalendarEvent Entity
 * Represents events synced with external calendars (Google, Apple)
 * Tracks sync status and medication reminders
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

export enum CalendarProvider {
  GOOGLE = 'google',
  APPLE = 'apple',
}

export enum SyncStatus {
  PENDING = 'pending',
  SYNCED = 'synced',
  FAILED = 'failed',
  CONFLICTED = 'conflicted',
}

export enum EventType {
  APPOINTMENT = 'appointment',
  MEDICATION_REMINDER = 'medication_reminder',
  TELECONSULTATION = 'teleconsultation',
  DELIVERY = 'delivery',
  PERSONAL = 'personal',
}

@Entity('calendar_events')
@Index('idx_calendar_events_user_provider', ['user_id', 'provider'])
@Index('idx_calendar_events_status', ['sync_status'])
@Index('idx_calendar_events_external_id', ['external_id'])
@Index('idx_calendar_events_start_time', ['start_time'])
export class CalendarEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================================================
  // User Reference
  // ============================================================================

  @Column({ type: 'uuid' })
  @Index('idx_calendar_events_user_id')
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // ============================================================================
  // Calendar Integration
  // ============================================================================

  @Column({
    type: 'enum',
    enum: CalendarProvider,
  })
  provider: CalendarProvider;

  @Column({ type: 'uuid', nullable: true })
  calendar_integration_id: string | null;

  @Column({ type: 'text', unique: true })
  external_id: string; // Google Calendar eventId or Apple Calendar uid

  // ============================================================================
  // Event Details
  // ============================================================================

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: EventType,
    default: EventType.PERSONAL,
  })
  event_type: EventType;

  @Column({ type: 'timestamp with time zone' })
  start_time: Date;

  @Column({ type: 'timestamp with time zone' })
  end_time: Date;

  @Column({ type: 'varchar', length: 50, default: 'Europe/Zurich' })
  timezone: string; // IANA timezone identifier

  @Column({ type: 'text', nullable: true })
  location: string | null;

  // ============================================================================
  // Healthcare-Specific Fields
  // ============================================================================

  @Column({ type: 'uuid', nullable: true })
  appointment_id: string | null; // Reference to appointment if synced from appointment

  @Column({ type: 'uuid', nullable: true })
  medication_id: string | null; // Reference to medication if reminder

  @Column({ type: 'jsonb', nullable: true })
  medication_details: {
    medication_name: string;
    dosage: string;
    instructions: string;
  } | null;

  @Column({ type: 'boolean', default: false })
  has_reminder: boolean;

  @Column({ type: 'integer', nullable: true })
  reminder_minutes_before: number | null; // Minutes before event

  // ============================================================================
  // Sync Status & Metadata
  // ============================================================================

  @Column({
    type: 'enum',
    enum: SyncStatus,
    default: SyncStatus.PENDING,
  })
  sync_status: SyncStatus;

  @Column({ type: 'text', nullable: true })
  sync_error: string | null; // Error message if sync failed

  @Column({ type: 'timestamp with time zone', nullable: true })
  last_synced_at: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  sync_metadata: {
    etag?: string; // For change detection
    remote_updated_at?: string;
    conflict_resolution?: string;
  } | null;

  @Column({ type: 'boolean', default: false })
  is_recurring: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recurrence_rule: string | null; // iCal RRULE format

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
