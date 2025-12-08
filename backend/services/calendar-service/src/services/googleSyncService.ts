/**
 * Google Calendar Sync Service
 * Specialized service for OAuth2 flow, two-way sync, and medication reminder integration
 * Handles token management, appointment sync, and timezone conversion
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
  ConflictEvent,
  SyncError,
  OAuthAuthorizationRequest,
  OAuthCallbackRequest,
} from '../types/calendar.types';

export class GoogleSyncService {
  private googleApi: AxiosInstance;
  private readonly GOOGLE_CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3';
  private readonly GOOGLE_AUTH_URL = 'https://oauth2.googleapis.com';

  constructor(
    private calendarEventRepository: Repository<CalendarEvent>,
    private calendarIntegrationRepository: Repository<CalendarIntegration>,
    private clientId: string,
    private clientSecret: string,
    private redirectUri: string
  ) {
    this.googleApi = axios.create({
      baseURL: this.GOOGLE_CALENDAR_API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Initiate OAuth2 authorization flow
   * Returns authorization URL for user to grant calendar access
   */
  initiateOAuthFlow(request: OAuthAuthorizationRequest): string {
    const state = Buffer.from(
      JSON.stringify({
        userId: request.user_id,
        timestamp: Date.now(),
        nonce: Math.random().toString(36).substring(7),
      })
    ).toString('base64');

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ].join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    return `${this.GOOGLE_AUTH_URL}/auth?${params.toString()}`;
  }

  /**
   * Handle OAuth2 callback and exchange code for tokens
   * Creates calendar integration record with encrypted tokens
   */
  async handleOAuthCallback(
    request: OAuthCallbackRequest
  ): Promise<{ integration_id: string; email: string }> {
    try {
      // Validate state parameter
      if (!request.state) {
        throw new Error('Invalid OAuth state parameter');
      }

      const decodedState = JSON.parse(
        Buffer.from(request.state, 'base64').toString('utf-8')
      );

      // Exchange code for tokens
      const tokenResponse = await axios.post(`${this.GOOGLE_AUTH_URL}/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: request.code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      });

      const tokens: GoogleAuthToken = tokenResponse.data;

      // Get user's primary calendar email
      const userInfoResponse = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        }
      );

      const userEmail = userInfoResponse.data.email;

      // Get primary calendar ID
      const calendarResponse = await this.googleApi.get('/calendars/primary', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      const calendarId = calendarResponse.data.id;

      // Check if integration already exists for this user
      let integration = await this.calendarIntegrationRepository.findOne({
        where: {
          user_id: decodedState.userId,
          provider: CalendarProvider.GOOGLE,
          account_email: userEmail,
        },
      });

      if (integration) {
        // Update existing integration
        integration.access_token = tokens.access_token;
        integration.refresh_token = tokens.refresh_token || integration.refresh_token;
        integration.token_expiry = new Date(Date.now() + tokens.expires_in * 1000);
        integration.status = IntegrationStatus.ACTIVE;
        integration.calendar_id = calendarId;
        integration.provider_metadata = {
          scope: tokens.scope,
          token_type: tokens.token_type,
          calendar_ids: [calendarId],
        };
      } else {
        // Create new integration
        integration = this.calendarIntegrationRepository.create({
          user_id: decodedState.userId,
          provider: CalendarProvider.GOOGLE,
          account_email: userEmail,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: new Date(Date.now() + tokens.expires_in * 1000),
          status: IntegrationStatus.ACTIVE,
          calendar_id: calendarId,
          sync_enabled: true,
          two_way_sync: true,
          sync_frequency_minutes: 30,
          settings: {
            include_reminders: true,
            reminder_minutes: 15,
            sync_medication_reminders: true,
            sync_appointments: true,
          },
          provider_metadata: {
            scope: tokens.scope,
            token_type: tokens.token_type,
            calendar_ids: [calendarId],
          },
        });
      }

      await this.calendarIntegrationRepository.save(integration);

      return {
        integration_id: integration.id,
        email: userEmail,
      };
    } catch (error) {
      throw new Error(`Failed to handle OAuth callback: ${error}`);
    }
  }

  /**
   * Refresh access token using refresh token
   * Handles token expiration and renewal automatically
   */
  async refreshAccessToken(integration: CalendarIntegration): Promise<GoogleAuthToken> {
    if (!integration.refresh_token) {
      throw new Error('No refresh token available for this integration');
    }

    try {
      const response = await axios.post(`${this.GOOGLE_AUTH_URL}/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
      });

      const newToken: GoogleAuthToken = response.data;

      // Update integration with new token
      integration.access_token = newToken.access_token;
      integration.token_expiry = new Date(Date.now() + newToken.expires_in * 1000);

      await this.calendarIntegrationRepository.save(integration);

      return newToken;
    } catch (error) {
      throw new Error(`Failed to refresh access token: ${error}`);
    }
  }

  /**
   * Ensure valid access token
   * Refreshes token if expired
   */
  private async ensureValidToken(integration: CalendarIntegration): Promise<string> {
    if (!integration.access_token) {
      throw new Error('No access token available');
    }

    // Check if token is expired or expiring soon (within 5 minutes)
    if (integration.token_expiry && new Date() >= new Date(integration.token_expiry.getTime() - 5 * 60 * 1000)) {
      if (integration.refresh_token) {
        await this.refreshAccessToken(integration);
      } else {
        throw new Error('Access token expired and no refresh token available');
      }
    }

    return integration.access_token;
  }

  /**
   * Two-way sync: Pull appointments from Google Calendar and sync local changes
   * Handles medication reminders and timezone conversion
   */
  async performTwoWaySync(
    integration: CalendarIntegration,
    lookbackDays: number = 90,
    forwardDays: number = 90
  ): Promise<SyncResult> {
    const syncErrors: SyncError[] = [];
    const conflicts: ConflictEvent[] = [];
    let events_synced = 0;
    let events_created = 0;
    let events_updated = 0;

    try {
      const accessToken = await this.ensureValidToken(integration);

      if (!integration.calendar_id) {
        throw new Error('Calendar ID not configured');
      }

      // Calculate date range
      const timeMin = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
      const timeMax = new Date(Date.now() + forwardDays * 24 * 60 * 60 * 1000);

      // Fetch all events from Google Calendar
      const response = await this.googleApi.get(
        `/calendars/${integration.calendar_id}/events`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            showDeleted: false,
            singleEvents: true,
            maxResults: 2500,
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            orderBy: 'startTime',
          },
        }
      );

      const googleEvents: GoogleCalendarEvent[] = response.data.items || [];

      // Process each event from Google Calendar
      for (const googleEvent of googleEvents) {
        try {
          // Check if event exists locally
          const localEvent = await this.calendarEventRepository.findOne({
            where: {
              external_id: googleEvent.id,
              provider: CalendarProvider.GOOGLE,
              user_id: integration.user_id,
            },
          });

          if (!localEvent) {
            // Create new event from Google
            const newEvent = this.calendarEventRepository.create({
              user_id: integration.user_id,
              provider: CalendarProvider.GOOGLE,
              calendar_integration_id: integration.id,
              external_id: googleEvent.id,
              title: googleEvent.summary || 'Untitled Event',
              description: googleEvent.description,
              event_type: this.detectEventType(googleEvent),
              start_time: new Date(googleEvent.start.dateTime),
              end_time: new Date(googleEvent.end.dateTime),
              timezone: googleEvent.start.timeZone || 'Europe/Zurich',
              location: googleEvent.location,
              has_reminder: !!googleEvent.reminders?.overrides?.length,
              reminder_minutes_before: googleEvent.reminders?.overrides?.[0]?.minutes || 15,
              is_recurring: !!googleEvent.recurringEventId,
              recurrence_rule: googleEvent.recurrence?.[0],
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
            // Check for conflicts and update if needed
            const remoteUpdateTime = new Date((googleEvent as any).updated);
            const localUpdateTime = localEvent.updated_at;

            if (remoteUpdateTime > localUpdateTime) {
              // Remote is newer - update local
              Object.assign(localEvent, {
                title: googleEvent.summary || 'Untitled Event',
                description: googleEvent.description,
                start_time: new Date(googleEvent.start.dateTime),
                end_time: new Date(googleEvent.end.dateTime),
                timezone: googleEvent.start.timeZone || 'Europe/Zurich',
                location: googleEvent.location,
                has_reminder: !!googleEvent.reminders?.overrides?.length,
                reminder_minutes_before: googleEvent.reminders?.overrides?.[0]?.minutes || 15,
                sync_status: SyncStatus.SYNCED,
                last_synced_at: new Date(),
                sync_metadata: {
                  etag: googleEvent.etag,
                  remote_updated_at: (googleEvent as any).updated,
                },
              });

              await this.calendarEventRepository.save(localEvent);
              events_updated++;
            } else if (
              remoteUpdateTime < localUpdateTime &&
              integration.two_way_sync &&
              localEvent.sync_status === SyncStatus.SYNCED
            ) {
              // Local is newer - push to Google Calendar
              try {
                await this.syncLocalEventToGoogle(integration, localEvent, accessToken);
                events_updated++;
              } catch (error) {
                syncErrors.push({
                  event_id: localEvent.id,
                  error: `Failed to sync local event to Google: ${error}`,
                  timestamp: new Date(),
                });
              }
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

      // Check for local events that need to be synced to Google (if two-way sync enabled)
      if (integration.two_way_sync) {
        const unsyncedLocalEvents = await this.calendarEventRepository.find({
          where: {
            user_id: integration.user_id,
            calendar_integration_id: integration.id,
            sync_status: SyncStatus.PENDING,
            provider: CalendarProvider.GOOGLE,
          },
        });

        for (const localEvent of unsyncedLocalEvents) {
          try {
            await this.syncLocalEventToGoogle(integration, localEvent, accessToken);
            events_created++;
            events_synced++;
          } catch (error) {
            syncErrors.push({
              event_id: localEvent.id,
              error: `Failed to sync local event to Google: ${error}`,
              timestamp: new Date(),
            });
          }
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

      throw new Error(`Two-way sync failed: ${errorMessage}`);
    }
  }

  /**
   * Sync local event to Google Calendar
   * Creates or updates event in Google Calendar
   */
  private async syncLocalEventToGoogle(
    integration: CalendarIntegration,
    localEvent: CalendarEvent,
    accessToken: string
  ): Promise<void> {
    const googleEvent: Partial<GoogleCalendarEvent> = {
      summary: localEvent.title,
      description: localEvent.description || undefined,
      start: {
        dateTime: localEvent.start_time.toISOString(),
        timeZone: localEvent.timezone || 'Europe/Zurich',
      },
      end: {
        dateTime: localEvent.end_time.toISOString(),
        timeZone: localEvent.timezone || 'Europe/Zurich',
      },
      location: localEvent.location || undefined,
    };

    // Add reminders
    if (localEvent.has_reminder) {
      googleEvent.reminders = {
        useDefault: false,
        overrides: [
          {
            method: 'popup' as const,
            minutes: localEvent.reminder_minutes_before || 15,
          },
          {
            method: 'email' as const,
            minutes: localEvent.reminder_minutes_before || 15,
          },
        ],
      };
    }

    // Add recurrence rule if applicable
    if (localEvent.is_recurring && localEvent.recurrence_rule) {
      googleEvent.recurrence = [localEvent.recurrence_rule];
    }

    try {
      if (localEvent.external_id) {
        // Update existing event
        await this.googleApi.patch(
          `/calendars/${integration.calendar_id}/events/${localEvent.external_id}`,
          googleEvent,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      } else {
        // Create new event
        const response = await this.googleApi.post(
          `/calendars/${integration.calendar_id}/events`,
          googleEvent,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        // Update local event with external ID
        localEvent.external_id = response.data.id;
      }

      localEvent.sync_status = SyncStatus.SYNCED;
      localEvent.last_synced_at = new Date();
      await this.calendarEventRepository.save(localEvent);
    } catch (error) {
      throw new Error(`Failed to sync event to Google: ${error}`);
    }
  }

  /**
   * Detect event type from Google Calendar event
   * Used to categorize synced events
   */
  private detectEventType(googleEvent: GoogleCalendarEvent): EventType {
    const title = (googleEvent.summary || '').toLowerCase();
    const description = (googleEvent.description || '').toLowerCase();

    // Check for medication reminders
    if (title.includes('medication') || description.includes('medication')) {
      return EventType.MEDICATION_REMINDER;
    }

    // Check for teleconsultation
    if (
      title.includes('consult') ||
      title.includes('video call') ||
      title.includes('appointment') ||
      description.includes('consult')
    ) {
      return EventType.TELECONSULTATION;
    }

    // Check for delivery
    if (title.includes('delivery') || description.includes('delivery')) {
      return EventType.DELIVERY;
    }

    // Check for appointment
    if (title.includes('appointment') || description.includes('appointment')) {
      return EventType.APPOINTMENT;
    }

    return EventType.PERSONAL;
  }

  /**
   * Create medication reminder in Google Calendar
   * Syncs medication reminder with reminder notifications
   */
  async createMedicationReminder(
    integration: CalendarIntegration,
    event: CreateCalendarEventRequest
  ): Promise<CalendarEvent> {
    const accessToken = await this.ensureValidToken(integration);

    try {
      const googleEvent: Partial<GoogleCalendarEvent> = {
        summary: event.title,
        description: this.formatMedicationDescription(event.medication_details),
        start: {
          dateTime: event.start_time.toISOString(),
          timeZone: event.timezone || 'Europe/Zurich',
        },
        end: {
          dateTime: event.end_time.toISOString(),
          timeZone: event.timezone || 'Europe/Zurich',
        },
        reminders: {
          useDefault: false,
          overrides: [
            {
              method: 'popup' as const,
              minutes: event.reminder_minutes_before || 15,
            },
            {
              method: 'email' as const,
              minutes: event.reminder_minutes_before || 15,
            },
          ],
        },
      };

      // Add recurrence if it's a recurring medication
      if (event.is_recurring && event.recurrence_rule) {
        googleEvent.recurrence = [event.recurrence_rule];
      }

      const response = await this.googleApi.post(
        `/calendars/${integration.calendar_id}/events`,
        googleEvent,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Save to local database
      const calendarEvent = this.calendarEventRepository.create({
        user_id: integration.user_id,
        provider: CalendarProvider.GOOGLE,
        calendar_integration_id: integration.id,
        external_id: response.data.id,
        title: event.title,
        description: event.description,
        event_type: EventType.MEDICATION_REMINDER,
        start_time: event.start_time,
        end_time: event.end_time,
        timezone: event.timezone || 'Europe/Zurich',
        medication_id: event.medication_id,
        medication_details: event.medication_details,
        has_reminder: true,
        reminder_minutes_before: event.reminder_minutes_before || 15,
        is_recurring: event.is_recurring,
        recurrence_rule: event.recurrence_rule,
        sync_status: SyncStatus.SYNCED,
        last_synced_at: new Date(),
        sync_metadata: {
          etag: response.data.etag,
          remote_updated_at: response.data.updated,
        },
      });

      return this.calendarEventRepository.save(calendarEvent);
    } catch (error) {
      throw new Error(`Failed to create medication reminder in Google Calendar: ${error}`);
    }
  }

  /**
   * Format medication details for Google Calendar event description
   */
  private formatMedicationDescription(
    medicationDetails?: {
      medication_name: string;
      dosage: string;
      instructions: string;
    }
  ): string {
    if (!medicationDetails) {
      return 'Medication reminder';
    }

    return `Medication: ${medicationDetails.medication_name}
Dosage: ${medicationDetails.dosage}
Instructions: ${medicationDetails.instructions}`;
  }

  /**
   * Disconnect Google Calendar integration
   * Revokes access token and removes integration
   */
  async disconnectCalendar(integration: CalendarIntegration): Promise<void> {
    try {
      // Revoke access token
      if (integration.access_token) {
        try {
          await axios.post(`${this.GOOGLE_AUTH_URL}/revoke?token=${integration.access_token}`);
        } catch (error) {
          // Token might already be revoked, continue with cleanup
          console.warn('Error revoking token:', error);
        }
      }

      // Mark integration as revoked
      integration.status = IntegrationStatus.REVOKED;
      integration.access_token = null;
      integration.refresh_token = null;
      integration.sync_enabled = false;
      await this.calendarIntegrationRepository.save(integration);

      // Optionally delete associated events
      await this.calendarEventRepository.delete({
        calendar_integration_id: integration.id,
      });
    } catch (error) {
      throw new Error(`Failed to disconnect Google Calendar: ${error}`);
    }
  }

  /**
   * Trigger manual sync for integration
   * Used for on-demand synchronization
   */
  async triggerManualSync(integrationId: string): Promise<SyncResult> {
    const integration = await this.calendarIntegrationRepository.findOne({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new Error('Calendar integration not found');
    }

    if (integration.provider !== CalendarProvider.GOOGLE) {
      throw new Error('This service only handles Google Calendar');
    }

    return this.performTwoWaySync(integration);
  }
}
