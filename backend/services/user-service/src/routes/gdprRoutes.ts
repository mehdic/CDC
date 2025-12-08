/**
 * GDPR Routes - SECURITY HARDENED
 * Routes for GDPR compliance features
 *
 * Security Features:
 * - JWT authentication required on all endpoints
 * - Rate limiting on export endpoints (5 requests / 15 minutes)
 * - Authorization checks in controllers
 * - PII-safe logging
 *
 * Endpoints:
 * - POST /api/gdpr/export - Request data export
 * - GET /api/gdpr/export/:requestId/download - Download data export
 * - POST /api/gdpr/erasure - Request right to be forgotten
 * - GET /api/gdpr/erasure/:requestId - Get erasure request status
 * - GET /api/gdpr/audit/:userId - Get audit trail (admin only)
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  requestDataExport,
  downloadDataExport,
  requestDataErasure,
  getErasureStatus,
  getAuditTrail,
  requestAccountDeletion,
  getDeletionStatus,
  confirmAccountDeletion,
  cancelAccountDeletion,
} from '../controllers/gdprController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// ============================================================================
// Rate Limiting Configuration (GDPR Security - Vulnerability Fix #3)
// ============================================================================

/**
 * Rate limiter for GDPR export endpoints
 * Prevents abuse, DDoS attacks, and patient ID enumeration attacks
 * Limit: 5 requests per 15 minutes per IP address
 */
const gdprExportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many export requests from this IP, please try again later',
    retryAfter: '15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the \`RateLimit-*\` headers
  legacyHeaders: false, // Disable the \`X-RateLimit-*\` headers
});

// ============================================================================
// GDPR Data Export Routes (Article 15 - Right to Access)
// ============================================================================

/**
 * POST /api/gdpr/export
 * Request a comprehensive data export for a user
 *
 * SECURITY: Requires authentication + rate limiting
 *
 * Request Body:
 * {
 *   "userId": "string",
 *   "format": "json" | "csv" (optional, defaults to "json"),
 *   "includeServices": ["service1", "service2"] (optional)
 * }
 *
 * Response:
 * {
 *   "message": "Data export created successfully",
 *   "requestId": "gdpr-1234567890-abcd1234",
 *   "downloadUrl": "/api/gdpr/export/:requestId/download",
 *   "expiresAt": "2025-12-10T12:00:00Z",
 *   "timestamp": "2025-12-03T12:00:00Z"
 * }
 */
router.post('/export', authenticateToken, gdprExportLimiter, requestDataExport);

/**
 * GET /api/gdpr/export/:requestId/download
 * Download a previously created data export
 *
 * SECURITY: Requires authentication (no rate limit - single download per request)
 *
 * Response:
 * - JSON file (Content-Type: application/json) or
 * - CSV file (Content-Type: text/csv)
 */
router.get('/export/:requestId/download', authenticateToken, downloadDataExport);

// ============================================================================
// GDPR Data Erasure Routes (Article 17 - Right to Erasure)
// ============================================================================

/**
 * POST /api/gdpr/erasure
 * Request right to be forgotten (data erasure/anonymization)
 *
 * SECURITY: Requires authentication + rate limiting
 *
 * Request Body:
 * {
 *   "userId": "string",
 *   "reason": "string" (optional),
 *   "keepLegalRecords": boolean (optional, defaults to true)
 * }
 *
 * Response:
 * {
 *   "message": "Data erasure request processed",
 *   "requestId": "gdpr-1234567890-abcd1234",
 *   "status": "completed" | "partial" | "failed",
 *   "servicesProcessed": [...],
 *   "legalRecordsRetained": [...],
 *   "verificationHash": "sha256-hash",
 *   "timestamp": "2025-12-03T12:00:00Z"
 * }
 */
router.post('/erasure', authenticateToken, gdprExportLimiter, requestDataErasure);

/**
 * GET /api/gdpr/erasure/:requestId
 * Get the status and details of an erasure request
 *
 * SECURITY: Requires authentication
 *
 * Response:
 * {
 *   "requestId": "gdpr-1234567890-abcd1234",
 *   "userId": "user123",
 *   "erasedAt": "2025-12-03T12:00:00Z",
 *   "status": "completed",
 *   "servicesProcessed": [...],
 *   "legalRecordsRetained": [...],
 *   "verificationHash": "sha256-hash"
 * }
 */
router.get('/erasure/:requestId', authenticateToken, getErasureStatus);

// ============================================================================
// GDPR Audit Routes
// ============================================================================

/**
 * GET /api/gdpr/audit/:userId
 * Get the GDPR audit trail for a specific user
 *
 * SECURITY: Requires authentication
 * (Admin/User access only - authorization check in controller)
 *
 * Response:
 * {
 *   "userId": "user123",
 *   "auditLogs": [
 *     {
 *       "id": "audit-1234567890-abcd",
 *       "userId": "user123",
 *       "action": "data_export",
 *       "requestId": "gdpr-1234567890-abcd1234",
 *       "timestamp": "2025-12-03T12:00:00Z",
 *       "ipAddress": "192.168.1.1",
 *       "userAgent": "Mozilla/5.0...",
 *       "status": "success"
 *     }
 *   ],
 *   "count": 1,
 *   "timestamp": "2025-12-03T12:00:00Z"
 * }
 */
router.get('/audit/:userId', authenticateToken, getAuditTrail);

// ============================================================================
// Right to Be Forgotten - New Deletion Workflow (30-day cooling-off period)
// ============================================================================

/**
 * POST /api/gdpr/deletion/request
 * Request account deletion with 30-day cooling-off period
 *
 * SECURITY: Requires authentication + rate limiting
 *
 * Request Body:
 * {
 *   "userId": "string"
 * }
 *
 * Response:
 * {
 *   "message": "Account deletion requested successfully",
 *   "requestId": "deletion-1234567890-abcd1234",
 *   "scheduledFor": "2026-01-07T12:00:00Z",
 *   "status": "pending",
 *   "coolingOffPeriodDays": 30,
 *   "confirmationUrl": "/api/gdpr/deletion/confirm/:requestId",
 *   "cancellationUrl": "/api/gdpr/deletion/cancel/:requestId",
 *   "timestamp": "2025-12-08T12:00:00Z"
 * }
 */
router.post('/deletion/request', authenticateToken, gdprExportLimiter, requestAccountDeletion);

/**
 * GET /api/gdpr/deletion/status/:requestId
 * Check deletion request status
 *
 * SECURITY: Requires authentication
 *
 * Response:
 * {
 *   "requestId": "deletion-1234567890-abcd1234",
 *   "patientId": "patient123",
 *   "status": "pending" | "confirmed" | "processing" | "completed" | "cancelled",
 *   "requestedAt": "2025-12-08T12:00:00Z",
 *   "scheduledFor": "2026-01-07T12:00:00Z",
 *   "confirmedAt": "2026-01-07T12:05:00Z" (optional),
 *   "completedAt": "2026-01-07T12:10:00Z" (optional),
 *   "cancelledAt": "2025-12-15T12:00:00Z" (optional),
 *   "deletionReport": {...} (optional),
 *   "timestamp": "2025-12-08T12:00:00Z"
 * }
 */
router.get('/deletion/status/:requestId', authenticateToken, getDeletionStatus);

/**
 * POST /api/gdpr/deletion/confirm/:requestId
 * Confirm deletion after cooling-off period and execute
 *
 * SECURITY: Requires authentication
 * NOTE: Can only be executed after 30-day cooling-off period
 *
 * Response:
 * {
 *   "message": "Account deletion completed successfully",
 *   "requestId": "deletion-1234567890-abcd1234",
 *   "status": "completed",
 *   "completedAt": "2026-01-07T12:10:00Z",
 *   "deletionReport": {
 *     "servicesProcessed": [...],
 *     "recordsDeleted": 150,
 *     "recordsAnonymized": 25,
 *     "retainedCategories": ["prescriptions: 10-year retention", ...],
 *     "completedAt": "2026-01-07T12:10:00Z"
 *   },
 *   "timestamp": "2026-01-07T12:10:00Z"
 * }
 */
router.post('/deletion/confirm/:requestId', authenticateToken, confirmAccountDeletion);

/**
 * POST /api/gdpr/deletion/cancel/:requestId
 * Cancel deletion request before execution
 *
 * SECURITY: Requires authentication
 *
 * Response:
 * {
 *   "message": "Account deletion cancelled successfully",
 *   "requestId": "deletion-1234567890-abcd1234",
 *   "status": "cancelled",
 *   "cancelledAt": "2025-12-15T12:00:00Z",
 *   "timestamp": "2025-12-15T12:00:00Z"
 * }
 */
router.post('/deletion/cancel/:requestId', authenticateToken, cancelAccountDeletion);

export default router;
