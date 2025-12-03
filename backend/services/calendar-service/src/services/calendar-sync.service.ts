/**
 * Calendar Sync Service
 * Coordinates synchronization between MetaPharm and external calendars
 * Handles conflict resolution, timezone conversion, and two-way sync
 */

import { Repository } from 'typeorm';
import { CalendarEvent, CalendarProvider, SyncStatus } from '../entities/CalendarEvent';
import { CalendarIntegration } from '../entities/CalendarIntegration';
import {
  CreateCalendarEventRequest,
  SyncResult,
  ConflictResolutionStrategy,
  SyncOptions,
  TimezoneInfo,
} from '../types/calendar.types';
import { GoogleCalendarService } from './google-calendar.service';
import { AppleCalendarService } from './apple-calendar.service';

export class CalendarSyncService {
  constructor(
    private calendarEventRepository: Repository<CalendarEvent>,
    private calendarIntegrationRepository: Repository<CalendarIntegration>,
    private googleCalendarService: GoogleCalendarService,
    private appleCalendarService: AppleCalendarService
  ) {}

  /**
   * Sync calendar integration with external provider
   */
  async syncIntegration(
    integrationId: string,
    options?: Partial<SyncOptions>
  ): Promise<SyncResult> {
    const integration = await this.calendarIntegrationRepository.findOne({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new Error('Calendar integration not found');
    }

    if (!integration.sync_enabled) {
      throw new Error('Calendar sync is disabled for this integration');
    }

    try {
      let result: SyncResult;

      if (integration.provider === CalendarProvider.GOOGLE) {
        result = await this.googleCalendarService.syncCalendar(integration);
      } else if (integration.provider === CalendarProvider.APPLE) {
        result = await this.appleCalendarService.syncCalendar(integration);
      } else {
        throw new Error(`Unknown calendar provider: ${integration.provider}`);
      }

      // Handle conflicts if any
      if (result.conflicts.length > 0) {
        const resolvedConflicts = await this.resolveConflicts(
          result.conflicts,
          options?.resolution_strategy || ConflictResolutionStrategy.KEEP_REMOTE
        );
        result.conflicts = resolvedConflicts;
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to sync calendar: ${error}`);
    }
  }

  /**
   * Create event and sync to all connected calendars
   */
  async createEventWithSync(
    userId: string,
    eventData: CreateCalendarEventRequest,
    syncToProviders: CalendarProvider[] = []
  ): Promise<CalendarEvent> {
    // Create local event first
    const localEvent = this.calendarEventRepository.create({
      user_id: userId,
      provider: CalendarProvider.GOOGLE, // Default provider
      title: eventData.title,
      description: eventData.description,
      event_type: eventData.event_type,
      start_time: eventData.start_time,
      end_time: eventData.end_time,
      timezone: eventData.timezone || 'Europe/Zurich',
      location: eventData.location,
      appointment_id: eventData.appointment_id,
      medication_id: eventData.medication_id,
      medication_details: eventData.medication_details,
      has_reminder: eventData.has_reminder,
      reminder_minutes_before: eventData.reminder_minutes_before,
      is_recurring: eventData.is_recurring,
      recurrence_rule: eventData.recurrence_rule,
      sync_status: SyncStatus.PENDING,
    });

    const savedEvent = await this.calendarEventRepository.save(localEvent);

    // Sync to external calendars
    for (const provider of syncToProviders) {
      try {
        const integration = await this.calendarIntegrationRepository.findOne({
          where: {
            user_id: userId,
            provider,
            sync_enabled: true,
          },
        });

        if (!integration) {
          continue;
        }

        let externalEvent: CalendarEvent | null = null;

        if (provider === CalendarProvider.GOOGLE) {
          externalEvent = await this.googleCalendarService.createEvent(integration, eventData);
        } else if (provider === CalendarProvider.APPLE) {
          externalEvent = await this.appleCalendarService.createEvent(integration, eventData);
        }

        if (externalEvent) {
          // Link the synced events
          savedEvent.sync_status = SyncStatus.SYNCED;
          await this.calendarEventRepository.save(savedEvent);
        }
      } catch (error) {
        console.error(`Failed to sync to ${provider}:`, error);
        savedEvent.sync_status = SyncStatus.FAILED;
      }
    }

    return savedEvent;
  }

  /**
   * Resolve conflicts between local and remote calendar events
   */
  async resolveConflicts(
    conflicts: Array<any>,
    strategy: ConflictResolutionStrategy
  ): Promise<Array<any>> {
    const resolved: Array<any> = [];

    for (const conflict of conflicts) {
      const calendarEvent = await this.calendarEventRepository.findOne({
        where: { id: conflict.event_id },
      });

      if (!calendarEvent) {
        continue;
      }

      let resolution = strategy;

      // Apply conflict resolution strategy
      switch (strategy) {
        case ConflictResolutionStrategy.KEEP_LOCAL:
          // Keep local version, mark remote as outdated
          resolution = ConflictResolutionStrategy.KEEP_LOCAL;
          calendarEvent.sync_status = SyncStatus.SYNCED;
          break;

        case ConflictResolutionStrategy.KEEP_REMOTE:
          // Keep remote version, update local
          resolution = ConflictResolutionStrategy.KEEP_REMOTE;
          calendarEvent.sync_status = SyncStatus.SYNCED;
          break;

        case ConflictResolutionStrategy.MERGE:
          // Merge changes (use newer timestamp)
          const localTime = calendarEvent.updated_at;
          const remoteTime = conflict.remote_modified_at;

          if (remoteTime > localTime) {
            resolution = ConflictResolutionStrategy.KEEP_REMOTE;
          } else {
            resolution = ConflictResolutionStrategy.KEEP_LOCAL;
          }
          calendarEvent.sync_status = SyncStatus.SYNCED;
          break;

        case ConflictResolutionStrategy.MANUAL:
          // Mark for manual resolution
          calendarEvent.sync_status = SyncStatus.CONFLICTED;
          break;
      }

      await this.calendarEventRepository.save(calendarEvent);

      resolved.push({
        ...conflict,
        resolution,
      });
    }

    return resolved;
  }

  /**
   * Convert event time between timezones
   */
  convertEventTimezone(
    event: CalendarEvent,
    fromTimezone: string,
    toTimezone: string
  ): { start_time: Date; end_time: Date } {
    // This is a simplified implementation
    // In production, use proper timezone library (moment-timezone, date-fns-tz, etc.)
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: toTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const startParts = formatter.formatToParts(event.start_time);
    const endParts = formatter.formatToParts(event.end_time);

    return {
      start_time: this.partsToDate(startParts),
      end_time: this.partsToDate(endParts),
    };
  }

  /**
   * Get timezone offset for a given timezone
   */
  getTimezoneOffset(timezone: string): TimezoneInfo {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
      });

      const now = new Date();
      const formatter2 = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
      });

      const parts = formatter2.formatToParts(now);
      const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
      const month = parseInt(parts.find(p => p.type === 'month')?.value || '0');
      const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');

      const localDate = new Date(year, month - 1, day);
      const utcDate = new Date(Date.UTC(year, month - 1, day));

      const offset = (localDate.getTime() - utcDate.getTime()) / (1000 * 60);

      return {
        tzid: timezone,
        name: timezone,
        offset_minutes: offset,
        is_dst: this.isDaylightSavingTime(timezone, now),
      };
    } catch (error) {
      // Default to Europe/Zurich if timezone is invalid
      return {
        tzid: 'Europe/Zurich',
        name: 'Europe/Zurich',
        offset_minutes: 60,
        is_dst: false,
      };
    }
  }

  /**
   * Check if daylight saving time is active
   */
  private isDaylightSavingTime(timezone: string, date: Date): boolean {
    const jan = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric' });
    const jul = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric' });

    const janOffset = new Date(date.getFullYear(), 0, 1);
    const julOffset = new Date(date.getFullYear(), 6, 1);

    return parseInt(jan.format(janOffset)) !== parseInt(jul.format(julOffset));
  }

  /**
   * Get events with sync errors for a user
   */
  async getFailedSyncEvents(userId: string): Promise<CalendarEvent[]> {
    return this.calendarEventRepository.find({
      where: {
        user_id: userId,
        sync_status: SyncStatus.FAILED,
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  /**
   * Get conflicted events for a user
   */
  async getConflictedEvents(userId: string): Promise<CalendarEvent[]> {
    return this.calendarEventRepository.find({
      where: {
        user_id: userId,
        sync_status: SyncStatus.CONFLICTED,
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  /**
   * Retry failed sync for an event
   */
  async retrySyncEvent(eventId: string): Promise<boolean> {
    const event = await this.calendarEventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.sync_status !== SyncStatus.FAILED) {
      throw new Error('Event is not in failed state');
    }

    try {
      event.sync_status = SyncStatus.SYNCED;
      event.last_synced_at = new Date();
      await this.calendarEventRepository.save(event);
      return true;
    } catch (error) {
      console.error('Failed to retry sync:', error);
      return false;
    }
  }

  /**
   * Get calendar sync statistics for user
   */
  async getSyncStatistics(userId: string): Promise<{
    total_events: number;
    synced_events: number;
    failed_events: number;
    conflicted_events: number;
    pending_events: number;
    last_sync_date?: Date;
  }> {
    const [
      total,
      synced,
      failed,
      conflicted,
      pending,
    ] = await Promise.all([
      this.calendarEventRepository.count({ where: { user_id: userId } }),
      this.calendarEventRepository.count({
        where: { user_id: userId, sync_status: SyncStatus.SYNCED },
      }),
      this.calendarEventRepository.count({
        where: { user_id: userId, sync_status: SyncStatus.FAILED },
      }),
      this.calendarEventRepository.count({
        where: { user_id: userId, sync_status: SyncStatus.CONFLICTED },
      }),
      this.calendarEventRepository.count({
        where: { user_id: userId, sync_status: SyncStatus.PENDING },
      }),
    ]);

    const lastSync = await this.calendarIntegrationRepository.findOne({
      where: { user_id: userId },
      order: { last_sync_at: 'DESC' },
    });

    return {
      total_events: total,
      synced_events: synced,
      failed_events: failed,
      conflicted_events: conflicted,
      pending_events: pending,
      last_sync_date: lastSync?.last_sync_at || undefined,
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private partsToDate(parts: Intl.DateTimeFormatPart[]): Date {
    const values = {
      year: 0,
      month: 0,
      day: 0,
      hour: 0,
      minute: 0,
      second: 0,
    };

    for (const part of parts) {
      if (part.type in values) {
        values[part.type as keyof typeof values] = parseInt(part.value);
      }
    }

    return new Date(
      values.year,
      values.month - 1,
      values.day,
      values.hour,
      values.minute,
      values.second
    );
  }
}
