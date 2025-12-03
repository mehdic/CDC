/**
 * Calendar Service - Main Export
 * Exports all services, entities, and types for calendar integration
 */

// Entities
export { CalendarEvent, CalendarProvider, SyncStatus, EventType } from './entities/CalendarEvent';
export {
  CalendarIntegration,
  IntegrationStatus,
} from './entities/CalendarIntegration';

// Services
export { GoogleCalendarService } from './services/google-calendar.service';
export { AppleCalendarService } from './services/apple-calendar.service';
export { CalendarSyncService } from './services/calendar-sync.service';

// Types
export {
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
  SyncCalendarRequest,
  CalendarEventResponse,
  SyncResult,
  ConflictEvent,
  SyncError,
  GoogleCalendarConfig,
  GoogleAuthToken,
  GoogleCalendarEvent,
  AppleCalendarConfig,
  AppleCalendarEvent,
  ConflictResolutionStrategy,
  SyncOptions,
  CalendarIntegrationResponse,
  DisconnectCalendarRequest,
  TimezoneInfo,
  CalendarListFilters,
  PaginationResult,
  OAuthAuthorizationRequest,
  OAuthCallbackRequest,
  OAuthCallbackResponse,
} from './types/calendar.types';
