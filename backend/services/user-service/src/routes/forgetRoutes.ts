/**
 * GDPR Forget Routes - Right to Be Forgotten (Article 17)
 * Routes for GDPR deletion requests with cooling-off period
 *
 * Security Features:
 * - JWT authentication required on all endpoints
 * - STRICT rate limiting (2 requests / hour) to prevent abuse
 * - Authorization checks in controllers (user can only manage own data)
 * - PII-safe logging
 *
 * Workflow:
 * 1. POST /api/gdpr/forget - Initiate deletion request (30-day cooling-off)
 * 2. GET /api/gdpr/forget/status/:requestId - Check deletion status
 * 3. POST /api/gdpr/forget/cancel/:requestId - Cancel during cooling-off period
 * 4. POST /api/gdpr/forget/confirm/:requestId - Confirm deletion (admin/after cooling-off)
 *
 * Endpoints:
 * - POST /api/gdpr/forget - Request data deletion
 * - GET /api/gdpr/forget/status/:requestId - Get deletion request status
 * - POST /api/gdpr/forget/cancel/:requestId - Cancel deletion request
 * - POST /api/gdpr/forget/confirm/:requestId - Confirm and execute deletion
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  initiateDeletionRequest,
  checkDeletionStatus,
  cancelDeletion,
  confirmDeletion,
} from '../controllers/forgetController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// ============================================================================
// Rate Limiting Configuration (STRICT - Prevent Abuse)
// ============================================================================

/**
 * Rate limiter for GDPR forget endpoints
 * MORE RESTRICTIVE than export endpoints due to sensitive nature
 * Prevents abuse, DDoS attacks, and malicious deletion attempts
 * Limit: 2 requests per hour per IP address
 */
const gdprForgetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 2, // limit each IP to 2 requests per windowMs
  message: {
    error: 'Too many deletion requests from this IP, please try again later',
    retryAfter: '1 hour',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Rate limiter for status check endpoints (less restrictive)
 * Limit: 10 requests per hour per IP address
 */
const gdprForgetStatusLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many status check requests from this IP, please try again later',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// GDPR Forget Routes (Article 17 - Right to Be Forgotten)
// ============================================================================

/**
 * POST /api/gdpr/forget
 * Initiate deletion request with 30-day cooling-off period
 *
 * SECURITY: Requires authentication + STRICT rate limiting (2 req/hour)
 *
 * Request Body:
 * {
 *   "userId": "string",
 *   "reason": "string" (optional)
 * }
 *
 * Response:
 * {
 *   "message": "Deletion request created successfully",
 *   "requestId": "forget-1234567890-abcd1234",
 *   "status": "pending",
 *   "scheduledDeletionDate": "2025-01-07T12:00:00Z",
 *   "coolingOffPeriodDays": 30,
 *   "cancellationDeadline": "2025-01-07T12:00:00Z",
 *   "timestamp": "2024-12-08T12:00:00Z"
 * }
 */
router.post('/forget', authenticateJWT, gdprForgetLimiter, initiateDeletionRequest);

/**
 * GET /api/gdpr/forget/status/:requestId
 * Check deletion request status
 *
 * SECURITY: Requires authentication + moderate rate limiting (10 req/hour)
 *
 * Response:
 * {
 *   "requestId": "forget-1234567890-abcd1234",
 *   "userId": "user123",
 *   "status": "pending" | "processing" | "completed" | "cancelled" | "failed",
 *   "createdAt": "2024-12-08T12:00:00Z",
 *   "scheduledDeletionDate": "2025-01-07T12:00:00Z",
 *   "processedAt": null,
 *   "reason": "User requested account deletion",
 *   "timestamp": "2024-12-08T12:00:00Z"
 * }
 */
router.get(
  '/forget/status/:requestId',
  authenticateJWT,
  gdprForgetStatusLimiter,
  checkDeletionStatus
);

/**
 * POST /api/gdpr/forget/cancel/:requestId
 * Cancel deletion request during cooling-off period
 *
 * SECURITY: Requires authentication + rate limiting (2 req/hour)
 *
 * Response:
 * {
 *   "message": "Deletion request cancelled successfully",
 *   "requestId": "forget-1234567890-abcd1234",
 *   "status": "cancelled",
 *   "timestamp": "2024-12-08T12:00:00Z"
 * }
 */
router.post(
  '/forget/cancel/:requestId',
  authenticateJWT,
  gdprForgetLimiter,
  cancelDeletion
);

/**
 * POST /api/gdpr/forget/confirm/:requestId
 * Manually confirm and execute deletion
 * (Admin only OR after cooling-off period expires)
 *
 * SECURITY: Requires authentication + rate limiting (2 req/hour)
 *
 * Response:
 * {
 *   "message": "Deletion executed successfully",
 *   "requestId": "forget-1234567890-abcd1234",
 *   "status": "completed" | "failed",
 *   "servicesProcessed": [
 *     {
 *       "service": "user-service",
 *       "status": "anonymized",
 *       "recordsAffected": 1,
 *       "message": "User profile anonymized"
 *     },
 *     ...
 *   ],
 *   "legalRecordsRetained": [
 *     "prescription-service: Retained per Swiss healthcare law (10-year retention)",
 *     ...
 *   ],
 *   "verificationHash": "sha256-hash",
 *   "timestamp": "2024-12-08T12:00:00Z"
 * }
 */
router.post(
  '/forget/confirm/:requestId',
  authenticateJWT,
  gdprForgetLimiter,
  confirmDeletion
);

export default router;
