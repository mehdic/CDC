/**
 * Google Calendar Service
 * Handles OAuth2 authentication, event sync, and two-way calendar operations
 * Manages Google Calendar API interactions for event CRUD operations
 */

import axios, { AxiosInstance } from 'axios';
import { Repository } from 'typeorm';
import { CalendarEvent, CalendarProvider, SyncStatus, EventType } from '../entities/CalendarEvent';
import { CalendarIntegration, IntegrationStatus } from '../entities/CalendarIntegration';
import {
  GoogleCalendarEvent,
  GoogleAuthToken,
  SyncResult,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
  ConflictEvent,
  SyncError,
} from '../types/calendar.types';

export class GoogleCalendarService {
  private googleApi: AxiosInstance;
  private readonly GOOGLE_CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3';
  private readonly GOOGLE_AUTH_URL = 'https://oauth2.googleapis.com';

  constructor(
    private calendarEventRepository: Repository<CalendarEvent>,
    private calendarIntegrationRepository: Repository<CalendarIntegration>,
    private clientId: string,
    private clientSecret: string
  ) {
    this.googleApi = axios.create({
      baseURL: this.GOOGLE_CALENDAR_API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generate OAuth authorization URL for user
   */
  getAuthorizationUrl(userId: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.readonly',
      ].join(' '),
      state: Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64'),
      access_type: 'offline',
      prompt: 'consent',
    });

    return `${this.GOOGLE_AUTH_URL}/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<GoogleAuthToken> {
    try {
      const response = await axios.post(`${this.GOOGLE_AUTH_URL}/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to exchange authorization code: ${error}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleAuthToken> {
    try {
      const response = await axios.post(`${this.GOOGLE_AUTH_URL}/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to refresh access token: ${error}`);
    }
  }

  /**
   * Create event in Google Calendar
   */
  async createEvent(
    integration: CalendarIntegration,
    event: CreateCalendarEventRequest
  ): Promise<CalendarEvent> {
    if (!integration.access_token) {
      throw new Error('Google Calendar access token not available');
    }

    try {
      // Create Google Calendar event
      const googleEvent: Partial<GoogleCalendarEvent> = {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.start_time.toISOString(),
          timeZone: event.timezone || 'Europe/Zurich',
        },
        end: {
          dateTime: event.end_time.toISOString(),
          timeZone: event.timezone || 'Europe/Zurich',
        },
        location: event.location,
      };

      // Add reminders if needed
      if (event.has_reminder && event.reminder_minutes_before) {
        googleEvent.reminders = {
          useDefault: false,
          overrides: [
            {
              method: 'popup' as const,
              minutes: event.reminder_minutes_before,
            },
          ],
        };
      }

      // Add recurring event rule if applicable
      if (event.is_recurring && event.recurrence_rule) {
        googleEvent.recurrence = [event.recurrence_rule];
      }

      const response = await this.googleApi.post(
        `/calendars/${integration.calendar_id}/events`,
        googleEvent,
        {
          headers: {
            Authorization: `Bearer ${integration.access_token}`,
          },
        }
      );

      const createdGoogleEvent = response.data;

      // Save to local database
      const calendarEvent = this.calendarEventRepository.create({
        user_id: integration.user_id,
        provider: CalendarProvider.GOOGLE,
        calendar_integration_id: integration.id,
        external_id: createdGoogleEvent.id,
        title: event.title,
        description: event.description,
        event_type: event.event_type,
        start_time: new Date(createdGoogleEvent.start.dateTime),
        end_time: new Date(createdGoogleEvent.end.dateTime),
        timezone: event.timezone || 'Europe/Zurich',
        location: event.location,
        appointment_id: event.appointment_id,
        medication_id: event.medication_id,
        medication_details: event.medication_details,
        has_reminder: event.has_reminder,
        reminder_minutes_before: event.reminder_minutes_before,
        is_recurring: event.is_recurring,
        recurrence_rule: event.recurrence_rule,
        sync_status: SyncStatus.SYNCED,
        last_synced_at: new Date(),
        sync_metadata: {
          etag: createdGoogleEvent.etag,
          remote_updated_at: createdGoogleEvent.updated,
        },
      });

      return this.calendarEventRepository.save(calendarEvent);
    } catch (error) {
      throw new Error(`Failed to create Google Calendar event: ${error}`);
    }
  }

  /**
   * Update event in Google Calendar
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

    if (!integration || !integration.access_token) {
      throw new Error('Calendar integration not found or access revoked');
    }

    try {
      const googleEvent: Partial<GoogleCalendarEvent> = {};

      if (updates.title) googleEvent.summary = updates.title;
      if (updates.description) googleEvent.description = updates.description;
      if (updates.start_time && updates.end_time) {
        googleEvent.start = {
          dateTime: updates.start_time.toISOString(),
          timeZone: updates.timezone || calendarEvent.timezone,
        };
        googleEvent.end = {
          dateTime: updates.end_time.toISOString(),
          timeZone: updates.timezone || calendarEvent.timezone,
        };
      }
      if (updates.location) googleEvent.location = updates.location;

      if (updates.has_reminder && updates.reminder_minutes_before) {
        googleEvent.reminders = {
          useDefault: false,
          overrides: [
            {
              method: 'popup' as const,
              minutes: updates.reminder_minutes_before,
            },
          ],
        };
      }

      await this.googleApi.patch(
        `/calendars/${integration.calendar_id}/events/${calendarEvent.external_id}`,
        googleEvent,
        {
          headers: {
            Authorization: `Bearer ${integration.access_token}`,
          },
        }
      );

      // Update local record
      Object.assign(calendarEvent, updates, {
        sync_status: SyncStatus.SYNCED,
        last_synced_at: new Date(),
      });

      return this.calendarEventRepository.save(calendarEvent);
    } catch (error) {
      throw new Error(`Failed to update Google Calendar event: ${error}`);
    }
  }

  /**
   * Delete event from Google Calendar
   */
  async deleteEvent(calendarEvent: CalendarEvent): Promise<void> {
    if (!calendarEvent.calendar_integration_id) {
      throw new Error('Calendar integration ID not found');
    }

    const integration = await this.calendarIntegrationRepository.findOne({
      where: { id: calendarEvent.calendar_integration_id },
    });

    if (!integration || !integration.access_token) {
      throw new Error('Calendar integration not found or access revoked');
    }

    try {
      await this.googleApi.delete(
        `/calendars/${integration.calendar_id}/events/${calendarEvent.external_id}`,
        {
          headers: {
            Authorization: `Bearer ${integration.access_token}`,
          },
        }
      );

      // Mark as deleted locally
      calendarEvent.deleted_at = new Date();
      await this.calendarEventRepository.save(calendarEvent);
    } catch (error) {
      throw new Error(`Failed to delete Google Calendar event: ${error}`);
    }
  }

  /**
   * Sync all Google Calendar events for user
   */
  async syncCalendar(integration: CalendarIntegration): Promise<SyncResult> {
    const syncErrors: SyncError[] = [];
    const conflicts: ConflictEvent[] = [];
    let events_synced = 0;
    let events_created = 0;
    let events_updated = 0;

    try {
      // Refresh token if expired
      if (integration.token_expiry && new Date() >= integration.token_expiry) {
        if (integration.refresh_token) {
          const newToken = await this.refreshAccessToken(integration.refresh_token);
          integration.access_token = newToken.access_token;
          integration.token_expiry = new Date(Date.now() + newToken.expires_in * 1000);
          await this.calendarIntegrationRepository.save(integration);
        } else {
          throw new Error('Token expired and no refresh token available');
        }
      }

      if (!integration.access_token) {
        throw new Error('No access token available');
      }

      // Fetch events from Google Calendar
      const response = await this.googleApi.get(`/calendars/${integration.calendar_id}/events`, {
        headers: {
          Authorization: `Bearer ${integration.access_token}`,
        },
        params: {
          showDeleted: false,
          singleEvents: true,
          maxResults: 2500,
          timeMin: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days back
          timeMax: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days forward
          orderBy: 'startTime',
        },
      });

      const googleEvents: GoogleCalendarEvent[] = response.data.items || [];

      // Process each Google event
      for (const googleEvent of googleEvents) {
        try {
          // Check if event exists locally
          const localEvent = await this.calendarEventRepository.findOne({
            where: {
              external_id: googleEvent.id,
              provider: CalendarProvider.GOOGLE,
            },
          });

          if (!localEvent) {
            // Create new event
            const newEvent = this.calendarEventRepository.create({
              user_id: integration.user_id,
              provider: CalendarProvider.GOOGLE,
              calendar_integration_id: integration.id,
              external_id: googleEvent.id,
              title: googleEvent.summary,
              description: googleEvent.description,
              event_type: EventType.PERSONAL, // Will be updated if linked to appointment/medication
              start_time: new Date(googleEvent.start.dateTime),
              end_time: new Date(googleEvent.end.dateTime),
              timezone: googleEvent.start.timeZone || 'Europe/Zurich',
              location: googleEvent.location,
              has_reminder: !!googleEvent.reminders?.overrides?.length,
              reminder_minutes_before: googleEvent.reminders?.overrides?.[0]?.minutes,
              is_recurring: !!googleEvent.recurringEventId,
              sync_status: SyncStatus.SYNCED,
              last_synced_at: new Date(),
              sync_metadata: {
                etag: googleEvent.etag,
                remote_updated_at: (googleEvent as any).updated,
              },
            });

            await this.calendarEventRepository.save(newEvent);
            events_created++;
          } else {
            // Update existing event
            const remoteUpdateTime = new Date((googleEvent as any).updated);
            const localUpdateTime = localEvent.updated_at;

            if (remoteUpdateTime > localUpdateTime) {
              // Remote is newer - update local
              Object.assign(localEvent, {
                title: googleEvent.summary,
                description: googleEvent.description,
                start_time: new Date(googleEvent.start.dateTime),
                end_time: new Date(googleEvent.end.dateTime),
                timezone: googleEvent.start.timeZone || 'Europe/Zurich',
                location: googleEvent.location,
                has_reminder: !!googleEvent.reminders?.overrides?.length,
                reminder_minutes_before: googleEvent.reminders?.overrides?.[0]?.minutes,
                sync_status: SyncStatus.SYNCED,
                last_synced_at: new Date(),
                sync_metadata: {
                  etag: googleEvent.etag,
                  remote_updated_at: (googleEvent as any).updated,
                },
              });

              await this.calendarEventRepository.save(localEvent);
              events_updated++;
            } else if (remoteUpdateTime < localUpdateTime && integration.two_way_sync) {
              // Local is newer - need to update remote if two-way sync enabled
              // This would be handled by a separate update operation
              events_updated++;
            }
          }

          events_synced++;
        } catch (error) {
          syncErrors.push({
            event_id: googleEvent.id,
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
        conflicts,
        errors: syncErrors,
        synced_at: new Date(),
      };
    } catch (error) {
      const errorMessage = String(error);
      integration.last_sync_error = errorMessage;
      await this.calendarIntegrationRepository.save(integration);

      throw new Error(`Google Calendar sync failed: ${errorMessage}`);
    }
  }

  /**
   * Revoke Google Calendar access
   */
  async revokeAccess(integration: CalendarIntegration): Promise<void> {
    if (!integration.access_token) {
      return; // Already revoked
    }

    try {
      await axios.post(`${this.GOOGLE_AUTH_URL}/revoke?token=${integration.access_token}`);
    } catch (error) {
      console.warn('Error revoking Google Calendar access:', error);
    }

    // Mark as revoked locally
    integration.status = IntegrationStatus.REVOKED;
    integration.access_token = null;
    integration.refresh_token = null;
    await this.calendarIntegrationRepository.save(integration);
  }
}
