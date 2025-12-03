/**
 * GDPR Routes
 * Routes for GDPR compliance features
 *
 * Endpoints:
 * - POST /api/gdpr/export - Request data export
 * - GET /api/gdpr/export/:requestId/download - Download data export
 * - POST /api/gdpr/erasure - Request right to be forgotten
 * - GET /api/gdpr/erasure/:requestId - Get erasure request status
 * - GET /api/gdpr/audit/:userId - Get audit trail (admin only)
 */

import { Router } from 'express';
import {
  requestDataExport,
  downloadDataExport,
  requestDataErasure,
  getErasureStatus,
  getAuditTrail,
} from '../controllers/gdprController';

const router = Router();

// ============================================================================
// GDPR Data Export Routes (Article 15 - Right to Access)
// ============================================================================

/**
 * POST /api/gdpr/export
 * Request a comprehensive data export for a user
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
router.post('/export', requestDataExport);

/**
 * GET /api/gdpr/export/:requestId/download
 * Download a previously created data export
 *
 * Response:
 * - JSON file (Content-Type: application/json) or
 * - CSV file (Content-Type: text/csv)
 */
router.get('/export/:requestId/download', downloadDataExport);

// ============================================================================
// GDPR Data Erasure Routes (Article 17 - Right to Erasure)
// ============================================================================

/**
 * POST /api/gdpr/erasure
 * Request right to be forgotten (data erasure/anonymization)
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
router.post('/erasure', requestDataErasure);

/**
 * GET /api/gdpr/erasure/:requestId
 * Get the status and details of an erasure request
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
router.get('/erasure/:requestId', getErasureStatus);

// ============================================================================
// GDPR Audit Routes
// ============================================================================

/**
 * GET /api/gdpr/audit/:userId
 * Get the GDPR audit trail for a specific user
 * (Admin/User access only - implement authorization middleware in production)
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
router.get('/audit/:userId', getAuditTrail);

export default router;
