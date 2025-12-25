/**
 * Calendar Sync Controller
 * Handles OAuth2 flow, sync operations, and integration management
 * Endpoints for connecting Google Calendar, syncing, and disconnecting
 */

import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { GoogleSyncService } from '../services/googleSyncService';
import { CalendarIntegration } from '../entities/CalendarIntegration';
import { CalendarEvent, SyncStatus } from '../entities/CalendarEvent';
import { OAuthAuthorizationRequest, OAuthCallbackRequest } from '../types/calendar.types';

// Import the shared authenticated user type
import { AuthenticatedUser } from '../../../../shared/middleware/auth';

// Extend Express Request to include user property (compatible with shared auth)
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export class SyncController {
  constructor(
    private googleSyncService: GoogleSyncService,
    private calendarIntegrationRepository: Repository<CalendarIntegration>,
    private calendarEventRepository: Repository<CalendarEvent>
  ) {}

  /**
   * POST /calendar/google/connect
   * Initiate OAuth2 flow for Google Calendar connection
   * Returns authorization URL for user to visit
   */
  async initiateGoogleConnect(req: Request, res: Response): Promise<void> {
    try {
      // Validate user ID from JWT token
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Get redirect URI from request or config
      const redirectUri = req.body.redirect_uri || process.env.GOOGLE_OAUTH_REDIRECT_URI;
      if (!redirectUri) {
        res.status(400).json({ error: 'Missing redirect_uri' });
        return;
      }

      // Initiate OAuth flow
      const authRequest: OAuthAuthorizationRequest = {
        provider: 'google',
        user_id: userId,
        redirect_uri: redirectUri,
      };

      const authUrl = this.googleSyncService.initiateOAuthFlow(authRequest);

      res.status(200).json({
        success: true,
        authorization_url: authUrl,
        message: 'Visit the authorization URL to grant calendar access',
      });
    } catch (error) {
      console.error('Error initiating Google OAuth:', error);
      res.status(500).json({
        error: 'Failed to initiate Google Calendar connection',
        details: String(error),
      });
    }
  }

  /**
   * GET /calendar/google/callback
   * Handle OAuth2 callback from Google
   * Exchanges authorization code for access token and creates integration
   */
  async handleGoogleCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code, state } = req.query;

      // Validate required parameters
      if (!code || !state) {
        res.status(400).json({
          error: 'Missing authorization code or state parameter',
        });
        return;
      }

      // Handle OAuth callback
      const callbackRequest: OAuthCallbackRequest = {
        provider: 'google',
        code: code as string,
        state: state as string,
      };

      const result = await this.googleSyncService.handleOAuthCallback(callbackRequest);

      res.status(200).json({
        success: true,
        integration_id: result.integration_id,
        email: result.email,
        message: 'Google Calendar successfully connected',
      });
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      res.status(500).json({
        error: 'Failed to process OAuth callback',
        details: String(error),
      });
    }
  }

  /**
   * POST /calendar/google/sync
   * Trigger manual synchronization of Google Calendar
   * Performs two-way sync with conflict resolution
   */
  async triggerSync(req: Request, res: Response): Promise<void> {
    try {
      // Validate user ID from JWT token
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { integration_id, lookback_days, forward_days } = req.body;

      // Validate integration exists and belongs to user
      const integration = await this.calendarIntegrationRepository.findOne({
        where: { id: integration_id },
      });

      if (!integration) {
        res.status(404).json({ error: 'Calendar integration not found' });
        return;
      }

      if (integration.user_id !== userId) {
        res.status(403).json({ error: 'Unauthorized to access this integration' });
        return;
      }

      // Perform sync
      const syncResult = await this.googleSyncService.performTwoWaySync(
        integration,
        lookback_days || 90,
        forward_days || 90
      );

      res.status(200).json({
        success: true,
        sync_result: syncResult,
        message: `Synchronized ${syncResult.events_synced} events`,
      });
    } catch (error) {
      console.error('Error during sync:', error);
      res.status(500).json({
        error: 'Failed to synchronize calendar',
        details: String(error),
      });
    }
  }

  /**
   * DELETE /calendar/google/disconnect
   * Disconnect Google Calendar integration
   * Revokes access tokens and removes integration
   */
  async disconnectGoogle(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { integration_id } = req.body;

      // Validate integration exists and belongs to user
      const integration = await this.calendarIntegrationRepository.findOne({
        where: { id: integration_id },
      });

      if (!integration) {
        res.status(404).json({ error: 'Calendar integration not found' });
        return;
      }

      if (integration.user_id !== userId) {
        res.status(403).json({ error: 'Unauthorized to disconnect this integration' });
        return;
      }

      // Disconnect and revoke access
      await this.googleSyncService.disconnectCalendar(integration);

      res.status(200).json({
        success: true,
        message: 'Google Calendar integration disconnected',
      });
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      res.status(500).json({
        error: 'Failed to disconnect calendar',
        details: String(error),
      });
    }
  }

  /**
   * GET /calendar/google/integrations
   * List all Google Calendar integrations for user
   * Returns status, email, and sync configuration
   */
  async listIntegrations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Fetch all integrations for user
      const integrations = await this.calendarIntegrationRepository.find({
        where: { user_id: userId },
      });

      // Format response without sensitive data
      const formattedIntegrations = integrations.map((integration) => ({
        id: integration.id,
        provider: integration.provider,
        email: integration.account_email,
        status: integration.status,
        sync_enabled: integration.sync_enabled,
        two_way_sync: integration.two_way_sync,
        sync_frequency_minutes: integration.sync_frequency_minutes,
        last_sync_at: integration.last_sync_at,
        created_at: integration.created_at,
      }));

      res.status(200).json({
        success: true,
        integrations: formattedIntegrations,
        total: formattedIntegrations.length,
      });
    } catch (error) {
      console.error('Error listing integrations:', error);
      res.status(500).json({
        error: 'Failed to retrieve integrations',
        details: String(error),
      });
    }
  }

  /**
   * GET /calendar/google/sync-status/:integration_id
   * Get sync status and statistics for integration
   * Shows event counts, last sync time, and any errors
   */
  async getSyncStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { integration_id } = req.params;

      // Validate integration exists and belongs to user
      const integration = await this.calendarIntegrationRepository.findOne({
        where: { id: integration_id },
      });

      if (!integration) {
        res.status(404).json({ error: 'Calendar integration not found' });
        return;
      }

      if (integration.user_id !== userId) {
        res.status(403).json({ error: 'Unauthorized to access this integration' });
        return;
      }

      // Get event statistics
      const totalEvents = await this.calendarEventRepository.count({
        where: { calendar_integration_id: integration_id },
      });

      const syncedEvents = await this.calendarEventRepository.count({
        where: {
          calendar_integration_id: integration_id,
          sync_status: SyncStatus.SYNCED,
        },
      });

      const failedEvents = await this.calendarEventRepository.count({
        where: {
          calendar_integration_id: integration_id,
          sync_status: SyncStatus.FAILED,
        },
      });

      const pendingEvents = await this.calendarEventRepository.count({
        where: {
          calendar_integration_id: integration_id,
          sync_status: SyncStatus.PENDING,
        },
      });

      res.status(200).json({
        success: true,
        integration_id: integration.id,
        status: integration.status,
        last_sync_at: integration.last_sync_at,
        last_sync_error: integration.last_sync_error,
        sync_frequency_minutes: integration.sync_frequency_minutes,
        statistics: {
          total_events: totalEvents,
          synced_events: syncedEvents,
          failed_events: failedEvents,
          pending_events: pendingEvents,
          success_rate: totalEvents > 0 ? ((syncedEvents / totalEvents) * 100).toFixed(2) : 0,
        },
      });
    } catch (error) {
      console.error('Error getting sync status:', error);
      res.status(500).json({
        error: 'Failed to retrieve sync status',
        details: String(error),
      });
    }
  }

  /**
   * PUT /calendar/google/settings/:integration_id
   * Update sync settings for integration
   * Configure reminder preferences, sync frequency, and event types
   */
  async updateSyncSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { integration_id } = req.params;
      const { sync_enabled, two_way_sync, sync_frequency_minutes, settings } = req.body;

      // Validate integration exists and belongs to user
      const integration = await this.calendarIntegrationRepository.findOne({
        where: { id: integration_id },
      });

      if (!integration) {
        res.status(404).json({ error: 'Calendar integration not found' });
        return;
      }

      if (integration.user_id !== userId) {
        res.status(403).json({ error: 'Unauthorized to update this integration' });
        return;
      }

      // Validate sync frequency
      if (sync_frequency_minutes && sync_frequency_minutes < 15) {
        res.status(400).json({ error: 'Sync frequency must be at least 15 minutes' });
        return;
      }

      // Update integration
      if (sync_enabled !== undefined) integration.sync_enabled = sync_enabled;
      if (two_way_sync !== undefined) integration.two_way_sync = two_way_sync;
      if (sync_frequency_minutes) integration.sync_frequency_minutes = sync_frequency_minutes;
      if (settings) {
        integration.settings = {
          ...integration.settings,
          ...settings,
        };
      }

      await this.calendarIntegrationRepository.save(integration);

      res.status(200).json({
        success: true,
        message: 'Sync settings updated',
        integration: {
          id: integration.id,
          sync_enabled: integration.sync_enabled,
          two_way_sync: integration.two_way_sync,
          sync_frequency_minutes: integration.sync_frequency_minutes,
          settings: integration.settings,
        },
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({
        error: 'Failed to update sync settings',
        details: String(error),
      });
    }
  }
}
