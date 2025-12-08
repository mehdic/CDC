/**
 * Google Sync Service Tests
 * Unit tests for OAuth2 flow, two-way sync, medication reminders, and timezone handling
 */

// Mock axios before importing anything else
jest.mock('axios');

import axios from 'axios';
import { Repository } from 'typeorm';
import { GoogleSyncService } from '../services/googleSyncService';
import {
  CreateCalendarEventRequest,
  OAuthAuthorizationRequest,
} from '../types/calendar.types';

const mockAxios = axios as jest.Mocked<typeof axios>;

// Mock CalendarProvider and related enums
const CalendarProvider = {
  GOOGLE: 'google',
  APPLE: 'apple',
};

const EventType = {
  APPOINTMENT: 'appointment',
  MEDICATION_REMINDER: 'medication_reminder',
  TELECONSULTATION: 'teleconsultation',
  DELIVERY: 'delivery',
  PERSONAL: 'personal',
};

const IntegrationStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
};

// Mock repositories
const mockCalendarEventRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  delete: jest.fn(),
} as unknown as Repository<any>;

const mockCalendarIntegrationRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
} as unknown as Repository<any>;

describe('GoogleSyncService', () => {
  let googleSyncService: GoogleSyncService;

  beforeEach(() => {
    jest.clearAllMocks();

    googleSyncService = new GoogleSyncService(
      mockCalendarEventRepository,
      mockCalendarIntegrationRepository,
      'test-client-id',
      'test-client-secret',
      'http://localhost:3000/callback'
    );
  });

  // ============================================================================
  // OAuth2 Flow Tests
  // ============================================================================

  describe('initiateOAuthFlow', () => {
    it('should generate valid OAuth authorization URL', () => {
      const request: OAuthAuthorizationRequest = {
        provider: CalendarProvider.GOOGLE as any,
        user_id: 'user-123',
        redirect_uri: 'http://localhost:3000/callback',
      };

      const authUrl = googleSyncService.initiateOAuthFlow(request);

      expect(authUrl).toContain('https://oauth2.googleapis.com/auth');
      expect(authUrl).toContain('client_id=test-client-id');
      expect(authUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback');
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('access_type=offline');
      expect(authUrl).toContain('prompt=consent');
    });

    it('should include proper scopes in authorization URL', () => {
      const request: OAuthAuthorizationRequest = {
        provider: CalendarProvider.GOOGLE as any,
        user_id: 'user-123',
        redirect_uri: 'http://localhost:3000/callback',
      };

      const authUrl = googleSyncService.initiateOAuthFlow(request);

      expect(authUrl).toContain('googleapis.com/auth/calendar');
      expect(authUrl).toContain('googleapis.com/auth/calendar.events');
    });

    it('should encode state parameter with user info', () => {
      const request: OAuthAuthorizationRequest = {
        provider: CalendarProvider.GOOGLE as any,
        user_id: 'user-123',
        redirect_uri: 'http://localhost:3000/callback',
      };

      const authUrl = googleSyncService.initiateOAuthFlow(request);
      const stateParam = new URL(authUrl).searchParams.get('state');

      expect(stateParam).toBeDefined();
      const decodedState = JSON.parse(Buffer.from(stateParam!, 'base64').toString());
      expect(decodedState.userId).toBe('user-123');
      expect(decodedState.timestamp).toBeDefined();
      expect(decodedState.nonce).toBeDefined();
    });
  });

  describe('handleOAuthCallback', () => {
    it('should exchange code for tokens and create integration', async () => {
      const state = Buffer.from(
        JSON.stringify({
          userId: 'user-123',
          timestamp: Date.now(),
          nonce: 'test-nonce',
        })
      ).toString('base64');

      // Mock axios post for token exchange
      const mockPost = jest.fn();
      (axios.post as jest.Mock) = mockPost;
      mockPost.mockResolvedValueOnce({
        data: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'https://www.googleapis.com/auth/calendar',
        },
      });

      // Mock axios get for user info
      const mockGet = jest.fn();
      (axios.get as jest.Mock) = mockGet;
      mockGet.mockResolvedValueOnce({
        data: {
          email: 'user@gmail.com',
        },
      });

      // Mock Google API get for calendar
      const mockGoogleApiGet = jest.fn();
      (googleSyncService as any).googleApi.get = mockGoogleApiGet;
      mockGoogleApiGet.mockResolvedValueOnce({
        data: {
          id: 'primary',
        },
      });

      // Mock repository methods
      (mockCalendarIntegrationRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
      (mockCalendarIntegrationRepository.create as jest.Mock).mockReturnValueOnce({
        id: 'integration-123',
        user_id: 'user-123',
        provider: CalendarProvider.GOOGLE,
        account_email: 'user@gmail.com',
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        calendar_id: 'primary',
        status: IntegrationStatus.ACTIVE,
      });

      (mockCalendarIntegrationRepository.save as jest.Mock).mockResolvedValueOnce({
        id: 'integration-123',
      });

      const result = await googleSyncService.handleOAuthCallback({
        provider: CalendarProvider.GOOGLE as any,
        code: 'test-code',
        state,
      });

      expect(result.integration_id).toBe('integration-123');
      expect(result.email).toBe('user@gmail.com');
      expect(mockCalendarIntegrationRepository.save).toHaveBeenCalled();
    });

    it('should throw error if state is invalid', async () => {
      await expect(
        googleSyncService.handleOAuthCallback({
          provider: CalendarProvider.GOOGLE as any,
          code: 'test-code',
          state: 'invalid-base64!!!',
        })
      ).rejects.toThrow();
    });
  });

  // ============================================================================
  // Two-Way Sync Tests
  // ============================================================================

  describe('performTwoWaySync', () => {
    it('should sync events from Google Calendar', async () => {
      const integration = {
        id: 'integration-123',
        user_id: 'user-123',
        provider: CalendarProvider.GOOGLE,
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        token_expiry: new Date(Date.now() + 3600000),
        calendar_id: 'primary',
        two_way_sync: true,
      };

      const googleEvent = {
        id: 'google-event-123',
        summary: 'Team Meeting',
        description: 'Sprint planning',
        start: { dateTime: '2025-12-10T10:00:00Z', timeZone: 'Europe/Zurich' },
        end: { dateTime: '2025-12-10T11:00:00Z', timeZone: 'Europe/Zurich' },
        reminders: { overrides: [{ minutes: 15, method: 'popup' }] },
        etag: 'etag-123',
        updated: '2025-12-10T09:00:00Z',
      } as any;

      const mockGoogleApiGet = jest.fn();
      (googleSyncService as any).googleApi.get = mockGoogleApiGet;
      mockGoogleApiGet.mockResolvedValueOnce({
        data: { items: [googleEvent] },
      });

      (mockCalendarEventRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
      (mockCalendarEventRepository.create as jest.Mock).mockReturnValueOnce({
        id: 'event-123',
        external_id: 'google-event-123',
        title: 'Team Meeting',
        sync_status: 'synced',
      });
      (mockCalendarEventRepository.save as jest.Mock).mockResolvedValueOnce({
        id: 'event-123',
      });
      (mockCalendarEventRepository.find as jest.Mock).mockResolvedValueOnce([]);
      (mockCalendarIntegrationRepository.save as jest.Mock).mockResolvedValueOnce({});

      const result = await googleSyncService.performTwoWaySync(integration as any);

      expect(result.success).toBe(true);
      expect(result.events_synced).toBe(1);
      expect(result.events_created).toBe(1);
      expect(mockCalendarEventRepository.save).toHaveBeenCalled();
    });

    it('should handle token refresh when token is expired', async () => {
      const integration = {
        id: 'integration-123',
        user_id: 'user-123',
        provider: CalendarProvider.GOOGLE,
        access_token: 'old-token',
        refresh_token: 'test-refresh',
        token_expiry: new Date(Date.now() - 1000), // Expired
        calendar_id: 'primary',
      };

      const mockPost = jest.fn();
      (axios.post as jest.Mock) = mockPost;
      mockPost.mockResolvedValueOnce({
        data: {
          access_token: 'new-token',
          expires_in: 3600,
          token_type: 'Bearer',
        },
      });

      (mockCalendarIntegrationRepository.save as jest.Mock).mockResolvedValueOnce({});

      const mockGoogleApiGet = jest.fn();
      (googleSyncService as any).googleApi.get = mockGoogleApiGet;
      mockGoogleApiGet.mockResolvedValueOnce({
        data: { items: [] },
      });

      (mockCalendarEventRepository.find as jest.Mock).mockResolvedValueOnce([]);

      const result = await googleSyncService.performTwoWaySync(integration as any);

      expect(result.success).toBe(true);
      expect(axios.post).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Medication Reminder Tests
  // ============================================================================

  describe('createMedicationReminder', () => {
    it('should create medication reminder in Google Calendar', async () => {
      const integration = {
        id: 'integration-123',
        user_id: 'user-123',
        calendar_id: 'primary',
        access_token: 'test-token',
        token_expiry: new Date(Date.now() + 3600000),
      };

      const medicationEvent: CreateCalendarEventRequest = {
        title: 'Take Aspirin',
        event_type: EventType.MEDICATION_REMINDER as any,
        start_time: new Date('2025-12-10T08:00:00Z'),
        end_time: new Date('2025-12-10T08:30:00Z'),
        timezone: 'Europe/Zurich',
        medication_id: 'med-123',
        medication_details: {
          medication_name: 'Aspirin',
          dosage: '100mg',
          instructions: 'Take with water',
        },
        has_reminder: true,
        reminder_minutes_before: 15,
        is_recurring: true,
        recurrence_rule: 'FREQ=DAILY',
      };

      const mockGoogleApiPost = jest.fn();
      (googleSyncService as any).googleApi.post = mockGoogleApiPost;
      mockGoogleApiPost.mockResolvedValueOnce({
        data: {
          id: 'google-event-123',
          etag: 'etag-123',
          updated: '2025-12-10T08:00:00Z',
        },
      });

      (mockCalendarEventRepository.create as jest.Mock).mockReturnValueOnce({
        id: 'event-123',
        external_id: 'google-event-123',
        event_type: EventType.MEDICATION_REMINDER,
        medication_id: 'med-123',
        title: 'Take Aspirin',
        sync_status: 'synced',
      });

      (mockCalendarEventRepository.save as jest.Mock).mockResolvedValueOnce({
        id: 'event-123',
      });

      const result = await googleSyncService.createMedicationReminder(integration as any, medicationEvent);

      expect(result.id).toBe('event-123');
      expect(result.event_type).toBe(EventType.MEDICATION_REMINDER);
      expect(result.medication_id).toBe('med-123');
      expect(mockGoogleApiPost).toHaveBeenCalled();
    });

    it('should include medication details in event description', async () => {
      const integration = {
        id: 'integration-123',
        user_id: 'user-123',
        calendar_id: 'primary',
        access_token: 'test-token',
        token_expiry: new Date(Date.now() + 3600000),
      };

      const medicationEvent: CreateCalendarEventRequest = {
        title: 'Medication Reminder',
        event_type: EventType.MEDICATION_REMINDER as any,
        start_time: new Date('2025-12-10T08:00:00Z'),
        end_time: new Date('2025-12-10T08:30:00Z'),
        medication_details: {
          medication_name: 'Ibuprofen',
          dosage: '400mg',
          instructions: 'Take after meals',
        },
        has_reminder: true,
        reminder_minutes_before: 10,
      };

      const mockGoogleApiPost = jest.fn();
      (googleSyncService as any).googleApi.post = mockGoogleApiPost;
      mockGoogleApiPost.mockResolvedValueOnce({
        data: {
          id: 'google-event-123',
          etag: 'etag-123',
          updated: new Date().toISOString(),
        },
      });

      (mockCalendarEventRepository.create as jest.Mock).mockReturnValueOnce({});
      (mockCalendarEventRepository.save as jest.Mock).mockResolvedValueOnce({});

      await googleSyncService.createMedicationReminder(integration as any, medicationEvent);

      // Verify the call includes medication details in description
      const callArgs = mockGoogleApiPost.mock.calls[0];
      const eventData = callArgs[1];
      expect(eventData.description).toContain('Ibuprofen');
      expect(eventData.description).toContain('400mg');
      expect(eventData.description).toContain('Take after meals');
    });

    it('should set reminders for medication events', async () => {
      const integration = {
        id: 'integration-123',
        user_id: 'user-123',
        calendar_id: 'primary',
        access_token: 'test-token',
        token_expiry: new Date(Date.now() + 3600000),
      };

      const medicationEvent: CreateCalendarEventRequest = {
        title: 'Medication',
        event_type: EventType.MEDICATION_REMINDER as any,
        start_time: new Date('2025-12-10T08:00:00Z'),
        end_time: new Date('2025-12-10T08:30:00Z'),
        has_reminder: true,
        reminder_minutes_before: 20,
      };

      const mockGoogleApiPost = jest.fn();
      (googleSyncService as any).googleApi.post = mockGoogleApiPost;
      mockGoogleApiPost.mockResolvedValueOnce({
        data: {
          id: 'google-event-123',
          etag: 'etag-123',
          updated: new Date().toISOString(),
        },
      });

      (mockCalendarEventRepository.create as jest.Mock).mockReturnValueOnce({});
      (mockCalendarEventRepository.save as jest.Mock).mockResolvedValueOnce({});

      await googleSyncService.createMedicationReminder(integration as any, medicationEvent);

      const callArgs = mockGoogleApiPost.mock.calls[0];
      const eventData = callArgs[1];
      expect(eventData.reminders).toBeDefined();
      expect(eventData.reminders.overrides).toHaveLength(2);
      expect(eventData.reminders.overrides[0].minutes).toBe(20);
      expect(eventData.reminders.overrides[1].minutes).toBe(20);
    });
  });

  // ============================================================================
  // Timezone Handling Tests
  // ============================================================================

  describe('timezone handling', () => {
    it('should preserve Europe/Zurich timezone in sync', async () => {
      const integration = {
        id: 'integration-123',
        user_id: 'user-123',
        provider: CalendarProvider.GOOGLE,
        access_token: 'test-token',
        token_expiry: new Date(Date.now() + 3600000),
        calendar_id: 'primary',
      };

      const googleEvent = {
        id: 'google-event-123',
        summary: 'Test Event',
        start: { dateTime: '2025-12-10T10:00:00Z', timeZone: 'Europe/Zurich' },
        end: { dateTime: '2025-12-10T11:00:00Z', timeZone: 'Europe/Zurich' },
        etag: 'etag-123',
        updated: new Date().toISOString(),
      } as any;

      const mockGoogleApiGet = jest.fn();
      (googleSyncService as any).googleApi.get = mockGoogleApiGet;
      mockGoogleApiGet.mockResolvedValueOnce({
        data: { items: [googleEvent] },
      });

      (mockCalendarEventRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
      (mockCalendarEventRepository.create as jest.Mock).mockReturnValueOnce({
        timezone: 'Europe/Zurich',
      });
      (mockCalendarEventRepository.save as jest.Mock).mockResolvedValueOnce({});
      (mockCalendarEventRepository.find as jest.Mock).mockResolvedValueOnce([]);
      (mockCalendarIntegrationRepository.save as jest.Mock).mockResolvedValueOnce({});

      const result = await googleSyncService.performTwoWaySync(integration as any);

      const createCall = (mockCalendarEventRepository.create as jest.Mock).mock.calls[0];
      const createdEvent = createCall[0];
      expect(createdEvent.timezone).toBe('Europe/Zurich');
      expect(result.success).toBe(true);
    });

    it('should default to Europe/Zurich when timezone not specified', async () => {
      const integration = {
        id: 'integration-123',
        user_id: 'user-123',
        access_token: 'test-token',
        token_expiry: new Date(Date.now() + 3600000),
        calendar_id: 'primary',
      };

      const googleEvent = {
        id: 'google-event-123',
        summary: 'Test Event',
        start: { dateTime: '2025-12-10T10:00:00Z', timeZone: undefined },
        end: { dateTime: '2025-12-10T11:00:00Z', timeZone: undefined },
        etag: 'etag-123',
        updated: new Date().toISOString(),
      } as any;

      const mockGoogleApiGet = jest.fn();
      (googleSyncService as any).googleApi.get = mockGoogleApiGet;
      mockGoogleApiGet.mockResolvedValueOnce({
        data: { items: [googleEvent] },
      });

      (mockCalendarEventRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
      (mockCalendarEventRepository.create as jest.Mock).mockReturnValueOnce({
        timezone: 'Europe/Zurich',
      });
      (mockCalendarEventRepository.save as jest.Mock).mockResolvedValueOnce({});
      (mockCalendarEventRepository.find as jest.Mock).mockResolvedValueOnce([]);
      (mockCalendarIntegrationRepository.save as jest.Mock).mockResolvedValueOnce({});

      await googleSyncService.performTwoWaySync(integration as any);

      const createCall = (mockCalendarEventRepository.create as jest.Mock).mock.calls[0];
      const createdEvent = createCall[0];
      expect(createdEvent.timezone).toBe('Europe/Zurich');
    });
  });

  // ============================================================================
  // Disconnect Tests
  // ============================================================================

  describe('disconnectCalendar', () => {
    it('should revoke access and mark integration as revoked', async () => {
      const integration = {
        id: 'integration-123',
        user_id: 'user-123',
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        status: IntegrationStatus.ACTIVE,
        sync_enabled: true,
      };

      const mockPost = jest.fn();
      (axios.post as jest.Mock) = mockPost;
      mockPost.mockResolvedValueOnce({});

      (mockCalendarIntegrationRepository.save as jest.Mock).mockResolvedValueOnce({});
      (mockCalendarEventRepository.delete as jest.Mock).mockResolvedValueOnce({});

      await googleSyncService.disconnectCalendar(integration as any);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/revoke?token=test-token'),
        undefined
      );
      expect(integration.status).toBe(IntegrationStatus.REVOKED);
      expect(integration.access_token).toBeNull();
      expect(integration.sync_enabled).toBe(false);
      expect(mockCalendarIntegrationRepository.save).toHaveBeenCalled();
      expect(mockCalendarEventRepository.delete).toHaveBeenCalled();
    });

    it('should handle revoke errors gracefully', async () => {
      const integration = {
        id: 'integration-123',
        access_token: 'test-token',
        status: IntegrationStatus.ACTIVE,
        sync_enabled: true,
      };

      const mockPost = jest.fn();
      (axios.post as jest.Mock) = mockPost;
      mockPost.mockRejectedValueOnce(new Error('Revoke failed'));

      (mockCalendarIntegrationRepository.save as jest.Mock).mockResolvedValueOnce({});
      (mockCalendarEventRepository.delete as jest.Mock).mockResolvedValueOnce({});

      // Should not throw even if revoke fails
      await googleSyncService.disconnectCalendar(integration as any);

      expect(mockCalendarIntegrationRepository.save).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Event Type Detection Tests
  // ============================================================================

  describe('event type detection', () => {
    it('should detect medication reminder events', async () => {
      const integration = {
        id: 'integration-123',
        user_id: 'user-123',
        access_token: 'test-token',
        token_expiry: new Date(Date.now() + 3600000),
        calendar_id: 'primary',
      };

      const googleEvent = {
        id: 'event-1',
        summary: 'Take Medication',
        description: 'Medication reminder for daily vitamins',
        start: { dateTime: '2025-12-10T08:00:00Z', timeZone: 'Europe/Zurich' },
        end: { dateTime: '2025-12-10T08:30:00Z', timeZone: 'Europe/Zurich' },
        etag: 'etag-1',
        updated: new Date().toISOString(),
      } as any;

      const mockGoogleApiGet = jest.fn();
      (googleSyncService as any).googleApi.get = mockGoogleApiGet;
      mockGoogleApiGet.mockResolvedValueOnce({
        data: { items: [googleEvent] },
      });

      (mockCalendarEventRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
      (mockCalendarEventRepository.create as jest.Mock).mockReturnValueOnce({
        event_type: EventType.MEDICATION_REMINDER,
      });
      (mockCalendarEventRepository.save as jest.Mock).mockResolvedValueOnce({});
      (mockCalendarEventRepository.find as jest.Mock).mockResolvedValueOnce([]);
      (mockCalendarIntegrationRepository.save as jest.Mock).mockResolvedValueOnce({});

      await googleSyncService.performTwoWaySync(integration as any);

      const createCall = (mockCalendarEventRepository.create as jest.Mock).mock.calls[0];
      expect(createCall[0].event_type).toBe(EventType.MEDICATION_REMINDER);
    });

    it('should detect appointment events', async () => {
      const integration = {
        id: 'integration-123',
        user_id: 'user-123',
        access_token: 'test-token',
        token_expiry: new Date(Date.now() + 3600000),
        calendar_id: 'primary',
      };

      const googleEvent = {
        id: 'event-1',
        summary: 'Doctor Appointment',
        start: { dateTime: '2025-12-10T14:00:00Z', timeZone: 'Europe/Zurich' },
        end: { dateTime: '2025-12-10T15:00:00Z', timeZone: 'Europe/Zurich' },
        etag: 'etag-1',
        updated: new Date().toISOString(),
      } as any;

      const mockGoogleApiGet = jest.fn();
      (googleSyncService as any).googleApi.get = mockGoogleApiGet;
      mockGoogleApiGet.mockResolvedValueOnce({
        data: { items: [googleEvent] },
      });

      (mockCalendarEventRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
      (mockCalendarEventRepository.create as jest.Mock).mockReturnValueOnce({
        event_type: EventType.APPOINTMENT,
      });
      (mockCalendarEventRepository.save as jest.Mock).mockResolvedValueOnce({});
      (mockCalendarEventRepository.find as jest.Mock).mockResolvedValueOnce([]);
      (mockCalendarIntegrationRepository.save as jest.Mock).mockResolvedValueOnce({});

      await googleSyncService.performTwoWaySync(integration as any);

      const createCall = (mockCalendarEventRepository.create as jest.Mock).mock.calls[0];
      expect(createCall[0].event_type).toBe(EventType.APPOINTMENT);
    });

    it('should default to PERSONAL event type for unknown events', async () => {
      const integration = {
        id: 'integration-123',
        user_id: 'user-123',
        access_token: 'test-token',
        token_expiry: new Date(Date.now() + 3600000),
        calendar_id: 'primary',
      };

      const googleEvent = {
        id: 'event-1',
        summary: 'Random Event',
        start: { dateTime: '2025-12-10T14:00:00Z', timeZone: 'Europe/Zurich' },
        end: { dateTime: '2025-12-10T15:00:00Z', timeZone: 'Europe/Zurich' },
        etag: 'etag-1',
        updated: new Date().toISOString(),
      } as any;

      const mockGoogleApiGet = jest.fn();
      (googleSyncService as any).googleApi.get = mockGoogleApiGet;
      mockGoogleApiGet.mockResolvedValueOnce({
        data: { items: [googleEvent] },
      });

      (mockCalendarEventRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
      (mockCalendarEventRepository.create as jest.Mock).mockReturnValueOnce({
        event_type: EventType.PERSONAL,
      });
      (mockCalendarEventRepository.save as jest.Mock).mockResolvedValueOnce({});
      (mockCalendarEventRepository.find as jest.Mock).mockResolvedValueOnce([]);
      (mockCalendarIntegrationRepository.save as jest.Mock).mockResolvedValueOnce({});

      await googleSyncService.performTwoWaySync(integration as any);

      const createCall = (mockCalendarEventRepository.create as jest.Mock).mock.calls[0];
      expect(createCall[0].event_type).toBe(EventType.PERSONAL);
    });
  });
});
