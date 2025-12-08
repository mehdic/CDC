/**
 * GDPR Forget Controller (Right to Be Forgotten - Article 17)
 * Implements deletion request workflow with 30-day cooling-off period
 *
 * Security Features:
 * - JWT authentication required
 * - User can only request deletion of their own data
 * - Admin override with audit trail
 * - PII-safe logging throughout
 * - Cancellation during cooling-off period
 *
 * Workflow:
 * 1. User initiates deletion request → Status: pending (30-day wait)
 * 2. User can cancel during cooling-off period
 * 3. After 30 days → Scheduler processes deletion → Status: completed
 * 4. Audit trail preserved (anonymized)
 */

/* eslint-disable no-console */

import { Response } from 'express';
import type { AuthenticatedRequest } from '../../../../shared/middleware/auth';
import {
  createDeletionRequest,
  getDeletionRequestStatus,
  cancelDeletionRequest,
  confirmDeletionRequest,
} from '../services/dataDeletionService';
import * as crypto from 'crypto';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Hash user/patient ID for safe logging (GDPR compliance)
 * Never log raw user IDs to prevent PII leakage
 */
function hashForLogging(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').substring(0, 8);
}

/**
 * Check if user has admin role
 */
function isAdminUser(user: AuthenticatedRequest['user']): boolean {
  if (!user) {
    return false;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const payload = user.tokenPayload as any;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  if (payload?.roles?.includes('admin')) {
    return true;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (payload?.isAdmin === true) {
    return true;
  }
  return false;
}

// ============================================================================
// Controller Functions
// ============================================================================

/**
 * POST /api/gdpr/forget
 * Initiate deletion request with 30-day cooling-off period
 *
 * Request Body:
 * {
 *   "userId": "string",
 *   "reason": "string" (optional)
 * }
 *
 * Response:
 * {
 *   "message": "Deletion request created",
 *   "requestId": "forget-1234567890-abcd1234",
 *   "status": "pending",
 *   "scheduledDeletionDate": "2025-01-07T12:00:00Z",
 *   "coolingOffPeriodDays": 30,
 *   "cancellationDeadline": "2025-01-07T12:00:00Z"
 * }
 */
export async function initiateDeletionRequest(
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  try {
    const { userId, reason } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'userId is required',
        timestamp: new Date().toISOString(),
      });
    }

    // SECURITY: Authorization check - user can only delete their own data
    const authenticatedUserId = req.user?.userId;
    const isAdmin = isAdminUser(req.user);

    if (!isAdmin && authenticatedUserId !== userId) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      console.warn(
        `⚠️  SECURITY: Unauthorized deletion attempt - User ${hashForLogging(
          authenticatedUserId ?? 'unknown'
        )} tried to delete data of ${hashForLogging(userId)}`
      );
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only request deletion of your own data',
        timestamp: new Date().toISOString(),
      });
    }

    // Check if user already has a pending deletion request
    const existingRequest = await getDeletionRequestStatus(userId);
    if (existingRequest && existingRequest.status === 'pending') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'You already have a pending deletion request',
        requestId: existingRequest.requestId,
        scheduledDeletionDate: existingRequest.scheduledDeletionDate,
        timestamp: new Date().toISOString(),
      });
    }

    // Create deletion request
    const deletionRequest = await createDeletionRequest(
      userId,
      reason || 'User requested account deletion',
      req
    );

    console.log(
      `✅ GDPR Forget: Created deletion request ${deletionRequest.requestId} for user ${hashForLogging(
        userId
      )}`
    );

    return res.status(201).json({
      message: 'Deletion request created successfully',
      requestId: deletionRequest.requestId,
      status: deletionRequest.status,
      scheduledDeletionDate: deletionRequest.scheduledDeletionDate,
      coolingOffPeriodDays: 30,
      cancellationDeadline: deletionRequest.scheduledDeletionDate,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating deletion request:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create deletion request',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * GET /api/gdpr/forget/status/:requestId
 * Check deletion request status
 *
 * Response:
 * {
 *   "requestId": "forget-1234567890-abcd1234",
 *   "userId": "user123",
 *   "status": "pending" | "processing" | "completed" | "cancelled" | "failed",
 *   "createdAt": "2024-12-08T12:00:00Z",
 *   "scheduledDeletionDate": "2025-01-07T12:00:00Z",
 *   "processedAt": null,
 *   "reason": "User requested account deletion"
 * }
 */
export async function checkDeletionStatus(
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  try {
    const { requestId } = req.params;

    if (!requestId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'requestId is required',
        timestamp: new Date().toISOString(),
      });
    }

    // Get deletion request
    const deletionRequest = await getDeletionRequestStatus(requestId);

    if (!deletionRequest) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Deletion request ${requestId} not found`,
        timestamp: new Date().toISOString(),
      });
    }

    // SECURITY: Authorization check - user can only view their own deletion status
    const authenticatedUserId = req.user?.userId;
    const isAdmin = isAdminUser(req.user);

    if (!isAdmin && authenticatedUserId !== deletionRequest.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only view your own deletion requests',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(
      `📋 GDPR Forget: Status check for request ${requestId} - ${deletionRequest.status}`
    );

    return res.status(200).json({
      ...deletionRequest,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching deletion status:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch deletion status',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * POST /api/gdpr/forget/cancel/:requestId
 * Cancel deletion request during cooling-off period
 *
 * Response:
 * {
 *   "message": "Deletion request cancelled successfully",
 *   "requestId": "forget-1234567890-abcd1234",
 *   "status": "cancelled"
 * }
 */
export async function cancelDeletion(
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  try {
    const { requestId } = req.params;

    if (!requestId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'requestId is required',
        timestamp: new Date().toISOString(),
      });
    }

    // Get deletion request
    const deletionRequest = await getDeletionRequestStatus(requestId);

    if (!deletionRequest) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Deletion request ${requestId} not found`,
        timestamp: new Date().toISOString(),
      });
    }

    // SECURITY: Authorization check - user can only cancel their own deletion request
    const authenticatedUserId = req.user?.userId;
    const isAdmin = isAdminUser(req.user);

    if (!isAdmin && authenticatedUserId !== deletionRequest.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only cancel your own deletion requests',
        timestamp: new Date().toISOString(),
      });
    }

    // Check if request can be cancelled (only pending requests)
    if (deletionRequest.status !== 'pending') {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Cannot cancel deletion request with status: ${deletionRequest.status}`,
        timestamp: new Date().toISOString(),
      });
    }

    // Check if cooling-off period has expired
    const now = new Date();
    const scheduledDate = new Date(deletionRequest.scheduledDeletionDate);
    if (now >= scheduledDate) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cooling-off period has expired. Cannot cancel deletion.',
        timestamp: new Date().toISOString(),
      });
    }

    // Cancel deletion request
    const cancelledRequest = await cancelDeletionRequest(requestId, req);

    console.log(
      `🚫 GDPR Forget: Cancelled deletion request ${requestId} for user ${hashForLogging(
        deletionRequest.userId
      )}`
    );

    return res.status(200).json({
      message: 'Deletion request cancelled successfully',
      requestId: cancelledRequest.requestId,
      status: cancelledRequest.status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error cancelling deletion request:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to cancel deletion request',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * POST /api/gdpr/forget/confirm/:requestId
 * Manually confirm and execute deletion (admin only or after cooling-off period)
 *
 * Response:
 * {
 *   "message": "Deletion executed successfully",
 *   "requestId": "forget-1234567890-abcd1234",
 *   "status": "completed",
 *   "servicesProcessed": [...],
 *   "verificationHash": "sha256-hash"
 * }
 */
export async function confirmDeletion(
  req: AuthenticatedRequest,
  res: Response
): Promise<Response> {
  try {
    const { requestId } = req.params;

    if (!requestId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'requestId is required',
        timestamp: new Date().toISOString(),
      });
    }

    // Get deletion request
    const deletionRequest = await getDeletionRequestStatus(requestId);

    if (!deletionRequest) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Deletion request ${requestId} not found`,
        timestamp: new Date().toISOString(),
      });
    }

    // SECURITY: Only admin or user themselves after cooling-off period
    const authenticatedUserId = req.user?.userId;
    const isAdmin = isAdminUser(req.user);
    const now = new Date();
    const scheduledDate = new Date(deletionRequest.scheduledDeletionDate);
    const coolingOffExpired = now >= scheduledDate;

    if (!isAdmin && authenticatedUserId !== deletionRequest.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only confirm your own deletion requests',
        timestamp: new Date().toISOString(),
      });
    }

    if (!isAdmin && !coolingOffExpired) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot confirm deletion until cooling-off period expires',
        coolingOffExpiresAt: deletionRequest.scheduledDeletionDate,
        timestamp: new Date().toISOString(),
      });
    }

    // Check if request is in pending status
    if (deletionRequest.status !== 'pending') {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Cannot confirm deletion request with status: ${deletionRequest.status}`,
        timestamp: new Date().toISOString(),
      });
    }

    // Execute deletion
    const executedRequest = await confirmDeletionRequest(requestId, req);

    console.log(
      `✅ GDPR Forget: Executed deletion request ${requestId} for user ${hashForLogging(
        deletionRequest.userId
      )} - ${executedRequest.status}`
    );

    return res.status(200).json({
      message: 'Deletion executed successfully',
      requestId: executedRequest.requestId,
      status: executedRequest.status,
      servicesProcessed: executedRequest.servicesProcessed,
      legalRecordsRetained: executedRequest.legalRecordsRetained,
      verificationHash: executedRequest.verificationHash,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error confirming deletion request:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to execute deletion',
      timestamp: new Date().toISOString(),
    });
  }
}
