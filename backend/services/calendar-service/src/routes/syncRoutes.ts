/**
 * Calendar Sync Routes
 * Express routes for OAuth2 flow, sync operations, and integration management
 * All routes (except callback) require JWT authentication
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Repository } from 'typeorm';
import jwt from 'jsonwebtoken';
import { SyncController } from '../controllers/syncController';
import { GoogleSyncService } from '../services/googleSyncService';
import { CalendarIntegration } from '../entities/CalendarIntegration';
import { CalendarEvent } from '../entities/CalendarEvent';

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role?: string;
        [key: string]: any;
      };
    }
  }
}

/**
 * Middleware to validate JWT token
 * Extracts user ID and role from JWT and attaches to req.user
 * Uses proper JWT signature verification for security
 */
const jwtAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Use JWT secret from environment variable with fallback
    const JWT_SECRET = process.env.JWT_SECRET || 'metapharm-calendar-secret';

    try {
      // Verify JWT signature and decode payload
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // Extract user ID and role from JWT claims
      req.user = {
        id: decoded.sub || decoded.userId || decoded.id || '',
        role: decoded.role || decoded.userRole || 'PATIENT', // Extract role from JWT
      };

      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Authentication error' });
  }
};

/**
 * Middleware to validate user roles
 * Allows both patient and staff roles to access calendar sync
 */
const roleAuthMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        required_roles: allowedRoles,
      });
      return;
    }

    next();
  };
};

/**
 * Create sync routes
 * Instantiates controller and sets up all endpoints
 */
export function createSyncRoutes(
  googleSyncService: GoogleSyncService,
  calendarIntegrationRepository: Repository<CalendarIntegration>,
  calendarEventRepository: Repository<CalendarEvent>
): Router {
  const router = Router();
  const controller = new SyncController(
    googleSyncService,
    calendarIntegrationRepository,
    calendarEventRepository
  );

  // ============================================================================
  // OAuth2 Authorization Routes
  // ============================================================================

  /**
   * POST /calendar/google/connect
   * Initiate OAuth2 flow for Google Calendar connection
   * Body: { redirect_uri?: string }
   * Returns: { success: boolean, authorization_url: string }
   */
  router.post(
    '/google/connect',
    jwtAuthMiddleware,
    roleAuthMiddleware(['PATIENT', 'DOCTOR', 'PHARMACIST', 'NURSE']),
    (req, res) => controller.initiateGoogleConnect(req, res)
  );

  /**
   * GET /calendar/google/callback
   * Handle OAuth2 callback from Google
   * Query params: code, state
   * Returns: { success: boolean, integration_id: string, email: string }
   */
  router.get('/google/callback', (req, res) => controller.handleGoogleCallback(req, res));

  // ============================================================================
  // Sync Operations
  // ============================================================================

  /**
   * POST /calendar/google/sync
   * Trigger manual synchronization of Google Calendar
   * Body: { integration_id: string, lookback_days?: number, forward_days?: number }
   * Returns: { success: boolean, sync_result: SyncResult }
   */
  router.post(
    '/google/sync',
    jwtAuthMiddleware,
    roleAuthMiddleware(['PATIENT', 'DOCTOR', 'PHARMACIST', 'NURSE']),
    (req, res) => controller.triggerSync(req, res)
  );

  // ============================================================================
  // Integration Management
  // ============================================================================

  /**
   * GET /calendar/google/integrations
   * List all Google Calendar integrations for user
   * Returns: { success: boolean, integrations: CalendarIntegrationResponse[], total: number }
   */
  router.get(
    '/google/integrations',
    jwtAuthMiddleware,
    roleAuthMiddleware(['PATIENT', 'DOCTOR', 'PHARMACIST', 'NURSE']),
    (req, res) => controller.listIntegrations(req, res)
  );

  /**
   * GET /calendar/google/sync-status/:integration_id
   * Get sync status and statistics for integration
   * Returns: {
   *   success: boolean,
   *   integration_id: string,
   *   status: IntegrationStatus,
   *   last_sync_at: Date,
   *   statistics: { total_events, synced_events, failed_events, pending_events, success_rate }
   * }
   */
  router.get(
    '/google/sync-status/:integration_id',
    jwtAuthMiddleware,
    roleAuthMiddleware(['PATIENT', 'DOCTOR', 'PHARMACIST', 'NURSE']),
    (req, res) => controller.getSyncStatus(req, res)
  );

  /**
   * PUT /calendar/google/settings/:integration_id
   * Update sync settings for integration
   * Body: {
   *   sync_enabled?: boolean,
   *   two_way_sync?: boolean,
   *   sync_frequency_minutes?: number,
   *   settings?: { include_reminders?, reminder_minutes?, sync_medication_reminders?, ... }
   * }
   * Returns: { success: boolean, integration: { ... } }
   */
  router.put(
    '/google/settings/:integration_id',
    jwtAuthMiddleware,
    roleAuthMiddleware(['PATIENT', 'DOCTOR', 'PHARMACIST', 'NURSE']),
    (req, res) => controller.updateSyncSettings(req, res)
  );

  /**
   * DELETE /calendar/google/disconnect
   * Disconnect Google Calendar integration
   * Body: { integration_id: string }
   * Returns: { success: boolean, message: string }
   */
  router.delete(
    '/google/disconnect',
    jwtAuthMiddleware,
    roleAuthMiddleware(['PATIENT', 'DOCTOR', 'PHARMACIST', 'NURSE']),
    (req, res) => controller.disconnectGoogle(req, res)
  );

  return router;
}

export default createSyncRoutes;
