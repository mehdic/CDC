/**
 * Apple Calendar Service
 * Handles CalDAV protocol for iCloud calendar sync
 * Manages event creation, updates, deletion, and two-way synchronization
 */

import axios, { AxiosInstance } from 'axios';
import { Repository } from 'typeorm';
import { CalendarEvent, CalendarProvider, SyncStatus, EventType } from '../entities/CalendarEvent';
import { CalendarIntegration, IntegrationStatus } from '../entities/CalendarIntegration';
import {
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
  SyncResult,
  SyncError,
} from '../types/calendar.types';
import * as ical from 'ical.js';

export class AppleCalendarService {
  private caldavApi: AxiosInstance;
  private readonly ICLOUD_CALDAV_URL = 'https://caldav.icloud.com';

  constructor(
    private calendarEventRepository: Repository<CalendarEvent>,
    private calendarIntegrationRepository: Repository<CalendarIntegration>
  ) {
    this.caldavApi = axios.create({
      baseURL: this.ICLOUD_CALDAV_URL,
      headers: {
        'Content-Type': 'application/xml',
        Depth: '1',
      },
    });
  }

  /**
   * Test CalDAV credentials
   */
  async validateCredentials(
    username: string,
    password: string,
    serverUrl: string
  ): Promise<boolean> {
    try {
      const response = await axios.request({
        method: 'PROPFIND',
        url: `${serverUrl}/`,
        auth: {
          username,
          password,
        },
        headers: {
          'Content-Type': 'application/xml',
          Depth: '0',
        },
        data: `<?xml version="1.0" encoding="utf-8" ?>
          <D:propfind xmlns:D="DAV:">
            <D:prop>
              <D:displayname />
            </D:prop>
          </D:propfind>`,
      });

      return response.status === 207 || response.status === 200;
    } catch (error) {
      throw new Error(`CalDAV credentials validation failed: ${error}`);
    }
  }

  /**
   * Create event in Apple Calendar
   */
  async createEvent(
    integration: CalendarIntegration,
    event: CreateCalendarEventRequest
  ): Promise<CalendarEvent> {
    if (!integration.caldav_username || !integration.caldav_password) {
      throw new Error('CalDAV credentials not available');
    }

    try {
      const uid = this.generateUID();

      // Create iCalendar event
      const icalEvent = this.createICalEvent({
        uid,
        summary: event.title,
        description: event.description,
        dtstart: event.start_time,
        dtend: event.end_time,
        location: event.location,
        rrule: event.recurrence_rule,
        reminder_minutes: event.reminder_minutes_before,
      });

      // Upload to CalDAV server
      const response = await axios.request({
        method: 'PUT',
        url: `${integration.caldav_server_url}/${integration.calendar_id}/${uid}.ics`,
        auth: {
          username: integration.caldav_username,
          password: integration.caldav_password,
        },
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
        },
        data: icalEvent,
      });

      const etag = response.headers.etag || '';

      // Save to local database
      const calendarEvent = this.calendarEventRepository.create({
        user_id: integration.user_id,
        provider: CalendarProvider.APPLE,
        calendar_integration_id: integration.id,
        external_id: uid,
        title: event.title,
        description: event.description,
        event_type: event.event_type,
        start_time: event.start_time,
        end_time: event.end_time,
        timezone: event.timezone || 'Europe/Zurich',
        location: event.location,
        appointment_id: event.appointment_id,
        medication_id: event.medication_id,
        medication_details: event.medication_details,
        has_reminder: !!event.reminder_minutes_before,
        reminder_minutes_before: event.reminder_minutes_before,
        is_recurring: !!event.recurrence_rule,
        recurrence_rule: event.recurrence_rule,
        sync_status: SyncStatus.SYNCED,
        last_synced_at: new Date(),
        sync_metadata: {
          etag,
          remote_updated_at: new Date().toISOString(),
        },
      });

      return this.calendarEventRepository.save(calendarEvent);
    } catch (error) {
      throw new Error(`Failed to create Apple Calendar event: ${error}`);
    }
  }

  /**
   * Update event in Apple Calendar
   */
  async updateEvent(
    calendarEvent: CalendarEvent,
    updates: UpdateCalendarEventRequest
  ): Promise<CalendarEvent> {
    if (!calendarEvent.calendar_integration_id) {
      throw new Error('Calendar integration ID not found');
    }

    const integration = await this.calendarIntegrationRepository.findOne({
      where: { id: calendarEvent.calendar_integration_id },
    });

    if (!integration || !integration.caldav_password) {
      throw new Error('Calendar integration not found or credentials missing');
    }

    try {
      // Create updated iCalendar event
      const icalEvent = this.createICalEvent({
        uid: calendarEvent.external_id,
        summary: updates.title || calendarEvent.title,
        description: updates.description ?? (calendarEvent.description || undefined),
        dtstart: updates.start_time || calendarEvent.start_time,
        dtend: updates.end_time || calendarEvent.end_time,
        location: updates.location ?? (calendarEvent.location || undefined),
        rrule: updates.recurrence_rule ?? (calendarEvent.recurrence_rule || undefined),
        reminder_minutes: updates.reminder_minutes_before ?? (calendarEvent.reminder_minutes_before || undefined),
      });

      // Upload updated event
      await axios.request({
        method: 'PUT',
        url: `${integration.caldav_server_url}/${integration.calendar_id}/${calendarEvent.external_id}.ics`,
        auth: {
          username: integration.caldav_username!,
          password: integration.caldav_password,
        },
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'If-Match': calendarEvent.sync_metadata?.etag || '*',
        },
        data: icalEvent,
      });

      // Update local record
      Object.assign(calendarEvent, updates, {
        sync_status: SyncStatus.SYNCED,
        last_synced_at: new Date(),
      });

      return this.calendarEventRepository.save(calendarEvent);
    } catch (error) {
      throw new Error(`Failed to update Apple Calendar event: ${error}`);
    }
  }

  /**
   * Delete event from Apple Calendar
   */
  async deleteEvent(calendarEvent: CalendarEvent): Promise<void> {
    if (!calendarEvent.calendar_integration_id) {
      throw new Error('Calendar integration ID not found');
    }

    const integration = await this.calendarIntegrationRepository.findOne({
      where: { id: calendarEvent.calendar_integration_id },
    });

    if (!integration || !integration.caldav_password) {
      throw new Error('Calendar integration not found or credentials missing');
    }

    try {
      await axios.request({
        method: 'DELETE',
        url: `${integration.caldav_server_url}/${integration.calendar_id}/${calendarEvent.external_id}.ics`,
        auth: {
          username: integration.caldav_username!,
          password: integration.caldav_password,
        },
        headers: {
          'If-Match': calendarEvent.sync_metadata?.etag || '*',
        },
      });

      // Mark as deleted locally
      calendarEvent.deleted_at = new Date();
      await this.calendarEventRepository.save(calendarEvent);
    } catch (error) {
      throw new Error(`Failed to delete Apple Calendar event: ${error}`);
    }
  }

  /**
   * Sync all Apple Calendar events for user
   */
  async syncCalendar(integration: CalendarIntegration): Promise<SyncResult> {
    const syncErrors: SyncError[] = [];
    let events_synced = 0;
    let events_created = 0;
    let events_updated = 0;

    try {
      if (!integration.caldav_username || !integration.caldav_password) {
        throw new Error('CalDAV credentials not available');
      }

      // Fetch calendar events using REPORT
      const response = await axios.request({
        method: 'REPORT',
        url: `${integration.caldav_server_url}/${integration.calendar_id}/`,
        auth: {
          username: integration.caldav_username,
          password: integration.caldav_password,
        },
        headers: {
          'Content-Type': 'application/xml',
          Depth: '1',
        },
        data: this.buildCalendarQueryXML(),
      });

      const caldavEvents = this.parseCalDAVResponse(response.data);

      // Process each event
      for (const caldavEvent of caldavEvents) {
        try {
          const localEvent = await this.calendarEventRepository.findOne({
            where: {
              external_id: caldavEvent.uid,
              provider: CalendarProvider.APPLE,
            },
          });

          if (!localEvent) {
            // Create new event
            const newEvent = this.calendarEventRepository.create({
              user_id: integration.user_id,
              provider: CalendarProvider.APPLE,
              calendar_integration_id: integration.id,
              external_id: caldavEvent.uid,
              title: caldavEvent.summary,
              description: caldavEvent.description,
              event_type: EventType.PERSONAL,
              start_time: caldavEvent.dtstart,
              end_time: caldavEvent.dtend,
              timezone: 'Europe/Zurich',
              location: caldavEvent.location,
              has_reminder: !!caldavEvent.has_alarm,
              reminder_minutes_before: caldavEvent.alarm_minutes,
              is_recurring: !!caldavEvent.rrule,
              recurrence_rule: caldavEvent.rrule,
              sync_status: SyncStatus.SYNCED,
              last_synced_at: new Date(),
              sync_metadata: {
                etag: caldavEvent.etag,
                remote_updated_at: caldavEvent.lastModified,
              },
            });

            await this.calendarEventRepository.save(newEvent);
            events_created++;
          } else {
            // Update if remote is newer
            const remoteUpdateTime = new Date(caldavEvent.lastModified);
            const localUpdateTime = localEvent.updated_at;

            if (remoteUpdateTime > localUpdateTime) {
              Object.assign(localEvent, {
                title: caldavEvent.summary,
                description: caldavEvent.description,
                start_time: caldavEvent.dtstart,
                end_time: caldavEvent.dtend,
                location: caldavEvent.location,
                has_reminder: !!caldavEvent.has_alarm,
                reminder_minutes_before: caldavEvent.alarm_minutes,
                is_recurring: !!caldavEvent.rrule,
                recurrence_rule: caldavEvent.rrule,
                sync_status: SyncStatus.SYNCED,
                last_synced_at: new Date(),
                sync_metadata: {
                  etag: caldavEvent.etag,
                  remote_updated_at: caldavEvent.lastModified,
                },
              });

              await this.calendarEventRepository.save(localEvent);
              events_updated++;
            }
          }

          events_synced++;
        } catch (error) {
          syncErrors.push({
            event_id: caldavEvent.uid,
            error: String(error),
            timestamp: new Date(),
          });
        }
      }

      // Update integration sync time
      integration.last_sync_at = new Date();
      integration.last_sync_error = null;
      await this.calendarIntegrationRepository.save(integration);

      return {
        success: true,
        events_synced,
        events_created,
        events_updated,
        conflicts: [],
        errors: syncErrors,
        synced_at: new Date(),
      };
    } catch (error) {
      const errorMessage = String(error);
      integration.last_sync_error = errorMessage;
      await this.calendarIntegrationRepository.save(integration);

      throw new Error(`Apple Calendar sync failed: ${errorMessage}`);
    }
  }

  /**
   * Revoke CalDAV access
   */
  async revokeAccess(integration: CalendarIntegration): Promise<void> {
    integration.status = IntegrationStatus.REVOKED;
    integration.caldav_password = null;
    await this.calendarIntegrationRepository.save(integration);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private generateUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@metapharm.local`;
  }

  private createICalEvent(eventData: {
    uid: string;
    summary: string;
    description?: string;
    dtstart: Date;
    dtend: Date;
    location?: string;
    rrule?: string;
    reminder_minutes?: number;
  }): string {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MetaPharm Connect//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${eventData.uid}`,
      `DTSTAMP:${this.formatICalDateTime(new Date())}`,
      `DTSTART:${this.formatICalDateTime(eventData.dtstart)}`,
      `DTEND:${this.formatICalDateTime(eventData.dtend)}`,
      `SUMMARY:${this.escapeICalText(eventData.summary)}`,
    ];

    if (eventData.description) {
      lines.push(`DESCRIPTION:${this.escapeICalText(eventData.description)}`);
    }

    if (eventData.location) {
      lines.push(`LOCATION:${this.escapeICalText(eventData.location)}`);
    }

    if (eventData.rrule) {
      lines.push(`RRULE:${eventData.rrule}`);
    }

    if (eventData.reminder_minutes) {
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push(`TRIGGER:-PT${eventData.reminder_minutes}M`);
      lines.push(`DESCRIPTION:${this.escapeICalText(eventData.summary)} reminder`);
      lines.push('END:VALARM');
    }

    lines.push('END:VEVENT');
    lines.push('END:VCALENDAR');

    return lines.join('\r\n');
  }

  private formatICalDateTime(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }

  private escapeICalText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')
      .replace(/\n/g, '\\n');
  }

  private buildCalendarQueryXML(): string {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days back
    const futureDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days forward

    return `<?xml version="1.0" encoding="utf-8" ?>
      <C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
        <D:prop>
          <D:getetag />
          <C:calendar-data />
        </D:prop>
        <C:filter>
          <C:comp-filter name="VCALENDAR">
            <C:comp-filter name="VEVENT">
              <C:time-range start="${this.formatICalDateTime(pastDate)}" end="${this.formatICalDateTime(futureDate)}" />
            </C:comp-filter>
          </C:comp-filter>
        </C:filter>
      </C:calendar-query>`;
  }

  private parseCalDAVResponse(
    xmlResponse: string
  ): Array<{
    uid: string;
    summary: string;
    description?: string;
    dtstart: Date;
    dtend: Date;
    location?: string;
    rrule?: string;
    has_alarm: boolean;
    alarm_minutes?: number;
    etag: string;
    lastModified: string;
  }> {
    // Simple parser for CalDAV response
    // In production, use xml2js or similar library
    const events: any[] = [];
    const eventMatches = xmlResponse.matchAll(/<D:href[^>]*>([^<]+)<\/D:href>/g);

    for (const match of eventMatches) {
      const href = match[1];
      const uid = href.split('/').pop()?.replace('.ics', '') || '';

      // Extract iCalendar data from response
      // This is simplified - real implementation should parse XML properly
      const icalMatch = xmlResponse.match(new RegExp(
        `<C:calendar-data[^>]*>([^<]+)</C:calendar-data>`,
        'i'
      ));

      if (icalMatch) {
        const icalData = icalMatch[1];
        const summaryMatch = icalData.match(/SUMMARY:(.+)/);
        const dtStartMatch = icalData.match(/DTSTART[^:]*:(.+)/);
        const dtEndMatch = icalData.match(/DTEND[^:]*:(.+)/);
        const etagMatch = xmlResponse.match(/<D:getetag>([^<]+)<\/D:getetag>/);

        events.push({
          uid,
          summary: summaryMatch?.[1] || 'Untitled',
          dtstart: dtStartMatch ? new Date(dtStartMatch[1]) : new Date(),
          dtend: dtEndMatch ? new Date(dtEndMatch[1]) : new Date(),
          has_alarm: icalData.includes('VALARM'),
          etag: etagMatch?.[1] || '',
          lastModified: new Date().toISOString(),
        });
      }
    }

    return events;
  }
}
