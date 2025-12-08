/**
 * Calendar Types & Interfaces
 * Type definitions for calendar operations and API contracts
 */

import { CalendarProvider, SyncStatus, EventType } from '../entities/CalendarEvent';

// ============================================================================
// Request/Response Types
// ============================================================================

export interface CreateCalendarEventRequest {
  title: string;
  description?: string;
  event_type: EventType;
  start_time: Date;
  end_time: Date;
  timezone?: string;
  location?: string;
  appointment_id?: string;
  medication_id?: string;
  medication_details?: {
    medication_name: string;
    dosage: string;
    instructions: string;
  };
  has_reminder?: boolean;
  reminder_minutes_before?: number;
  is_recurring?: boolean;
  recurrence_rule?: string;
}

export interface UpdateCalendarEventRequest extends Partial<CreateCalendarEventRequest> {
  sync_status?: SyncStatus;
}

export interface SyncCalendarRequest {
  calendar_integration_id: string;
  force_sync?: boolean;
  start_date?: Date;
  end_date?: Date;
}

export interface CalendarEventResponse {
  id: string;
  user_id: string;
  provider: CalendarProvider;
  external_id: string;
  title: string;
  description?: string;
  event_type: EventType;
  start_time: Date;
  end_time: Date;
  timezone: string;
  location?: string;
  has_reminder: boolean;
  reminder_minutes_before?: number;
  sync_status: SyncStatus;
  last_synced_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface SyncResult {
  success: boolean;
  events_synced: number;
  events_created: number;
  events_updated: number;
  conflicts: ConflictEvent[];
  errors: SyncError[];
  synced_at: Date;
}

export interface ConflictEvent {
  event_id: string;
  title: string;
  local_modified_at: Date;
  remote_modified_at: Date;
  resolution: 'keep_local' | 'keep_remote' | 'pending';
}

export interface SyncError {
  event_id: string;
  error: string;
  timestamp: Date;
}

// ============================================================================
// Google Calendar Types
// ============================================================================

export interface GoogleCalendarConfig {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

export interface GoogleAuthToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  recurringEventId?: string;
  recurrence?: string[];
  etag: string;
}

// ============================================================================
// Apple Calendar Types
// ============================================================================

export interface AppleCalendarConfig {
  server_url: string;
}

export interface AppleCalendarEvent {
  uid: string;
  summary: string;
  description?: string;
  dtstart: string; // iCal datetime
  dtend: string;
  location?: string;
  rrule?: string;
  valarm?: {
    action: 'DISPLAY' | 'EMAIL';
    trigger: string; // e.g., "-PT15M"
    description: string;
  }[];
  dtstamp: string;
  last_modified: string;
}

// ============================================================================
// Sync Strategy
// ============================================================================

export enum ConflictResolutionStrategy {
  KEEP_LOCAL = 'keep_local',
  KEEP_REMOTE = 'keep_remote',
  MERGE = 'merge',
  MANUAL = 'manual',
}

export interface SyncOptions {
  resolution_strategy: ConflictResolutionStrategy;
  exclude_past_events: boolean;
  days_lookback: number; // How many days in the past to sync
  days_forward: number; // How many days in the future to sync
  include_recurring: boolean;
}

// ============================================================================
// Calendar Integration Types
// ============================================================================

export interface CalendarIntegrationResponse {
  id: string;
  user_id: string;
  provider: CalendarProvider;
  account_email: string;
  status: string;
  sync_enabled: boolean;
  two_way_sync: boolean;
  sync_frequency_minutes: number;
  last_sync_at?: Date;
  settings?: {
    include_reminders?: boolean;
    reminder_minutes?: number;
    sync_medication_reminders?: boolean;
    sync_appointments?: boolean;
  };
}

export interface DisconnectCalendarRequest {
  calendar_integration_id: string;
  revoke_access?: boolean; // Whether to revoke access from provider
}

// ============================================================================
// Timezone Types
// ============================================================================

export interface TimezoneInfo {
  tzid: string; // IANA timezone identifier
  name: string;
  offset_minutes: number;
  is_dst: boolean;
}

// ============================================================================
// Pagination & Filtering
// ============================================================================

export interface CalendarListFilters {
  provider?: CalendarProvider;
  event_type?: EventType;
  sync_status?: SyncStatus;
  start_date?: Date;
  end_date?: Date;
  has_errors?: boolean;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// ============================================================================
// OAuth Authorization Types
// ============================================================================

export interface OAuthAuthorizationRequest {
  provider: 'google' | 'apple' | CalendarProvider;
  user_id: string;
  redirect_uri: string;
}

export interface OAuthCallbackRequest {
  provider: 'google' | 'apple' | CalendarProvider;
  code: string;
  state: string;
}

export interface OAuthCallbackResponse {
  success: boolean;
  integration_id?: string;
  message?: string;
}
