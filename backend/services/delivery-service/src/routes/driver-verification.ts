/**
 * Driver Verification Routes
 * API endpoints for controlled substance delivery verification
 * Swiss Pharmacy Regulatory Compliance
 */

import { Router } from 'express';
import {
  verifyDriverID,
  verifyDriverLicense,
  getDriverAuthorizations,
  grantAuthorization,
  revokeAuthorization,
  verifyAtDelivery,
  checkPreDeliveryAuthorization,
  createEmergencyOverride,
  getVerificationAuditLogs,
  generateRegulatoryReport
} from '../controllers/driverVerificationController';

const router = Router();

// =========================================================================
// Driver Identity Verification Endpoints
// =========================================================================

/**
 * POST /api/v1/drivers/:id/verify
 * Verify driver's government-issued ID
 *
 * Body:
 * - idType: 'swiss_id' | 'passport' | 'residence_permit' | 'driver_license'
 * - idNumber: string (encrypted)
 * - issuingAuthority: string
 * - issuingCountry: string (ISO 3166-1 alpha-3)
 * - issueDate: ISO date string
 * - expiryDate: ISO date string
 * - photoBase64: string (optional, base64 encoded photo)
 *
 * Response:
 * - 200: { success: true, data: GovernmentID }
 * - 400: { success: false, errors: string[] }
 */
router.post('/drivers/:id/verify', verifyDriverID);

/**
 * POST /api/v1/drivers/:id/verify-license
 * Verify driver's license
 *
 * Body:
 * - licenseNumber: string
 * - categories: string[] (e.g., ['A', 'B', 'C'])
 * - issuingAuthority: string
 * - issueDate: ISO date string
 * - expiryDate: ISO date string
 * - photoBase64: string (optional)
 *
 * Response:
 * - 200: { success: true, data: DriverLicense }
 * - 400: { success: false, errors: string[] }
 */
router.post('/drivers/:id/verify-license', verifyDriverLicense);

// =========================================================================
// Authorization Management Endpoints
// =========================================================================

/**
 * GET /api/v1/drivers/:id/authorizations
 * Get driver's active authorizations for a pharmacy
 *
 * Query parameters:
 * - pharmacyId: UUID (required)
 *
 * Response:
 * - 200: { success: true, data: ControlledSubstanceAuthorization[] }
 */
router.get('/drivers/:id/authorizations', getDriverAuthorizations);

/**
 * POST /api/v1/drivers/:id/authorizations
 * Grant controlled substance authorization to driver
 *
 * Body:
 * - authorizationLevel: 'standard' | 'controlled' | 'narcotic'
 * - pharmacyId: UUID
 * - validFrom: ISO date string
 * - validUntil: ISO date string
 * - restrictions: string[] (optional)
 * - trainingCertificateBase64: string (optional)
 *
 * Response:
 * - 201: { success: true, data: ControlledSubstanceAuthorization }
 * - 400: { success: false, errors: string[] }
 */
router.post('/drivers/:id/authorizations', grantAuthorization);

/**
 * DELETE /api/v1/drivers/:id/authorizations/:authId
 * Revoke driver's controlled substance authorization
 *
 * Body:
 * - reason: string (required)
 *
 * Response:
 * - 200: { success: true, message: string }
 * - 400: { success: false, errors: string[] }
 */
router.delete('/drivers/:id/authorizations/:authId', revokeAuthorization);

// =========================================================================
// Delivery Verification Endpoints
// =========================================================================

/**
 * POST /api/v1/deliveries/:id/check-authorization
 * Pre-delivery authorization check
 *
 * Body:
 * - driverId: UUID
 * - pharmacyId: UUID
 * - requiredLevel: 'standard' | 'controlled' | 'narcotic'
 *
 * Response:
 * - 200: { success: true, data: PreDeliveryCheckResponse }
 */
router.post('/deliveries/:id/check-authorization', checkPreDeliveryAuthorization);

/**
 * POST /api/v1/deliveries/:id/verify-driver
 * Verify driver identity at time of delivery
 *
 * Body:
 * - driverId: UUID
 * - photoBase64: string (base64 encoded photo for facial recognition)
 * - signatureBase64: string (base64 encoded signature)
 * - gpsLatitude: number
 * - gpsLongitude: number
 * - deviceId: string
 *
 * Response:
 * - 200: { success: true, data: { matchScore: number } }
 * - 403: { success: false, errors: string[] }
 */
router.post('/deliveries/:id/verify-driver', verifyAtDelivery);

/**
 * POST /api/v1/deliveries/:id/emergency-override
 * Create emergency override for blocked delivery
 * Requires supervisor approval
 *
 * Body:
 * - driverId: UUID
 * - reason: string
 * - justification: string
 * - approvedBy: UUID (supervisor user ID)
 *
 * Response:
 * - 201: { success: true, data: { overrideId: string } }
 * - 400: { success: false, errors: string[] }
 */
router.post('/deliveries/:id/emergency-override', createEmergencyOverride);

// =========================================================================
// Audit and Reporting Endpoints
// =========================================================================

/**
 * GET /api/v1/audit/driver-verifications
 * Get verification audit logs for a driver
 *
 * Query parameters:
 * - driverId: UUID (required)
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 *
 * Response:
 * - 200: { success: true, data: VerificationAuditLog[] }
 */
router.get('/audit/driver-verifications', getVerificationAuditLogs);

/**
 * GET /api/v1/reports/regulatory
 * Generate regulatory compliance report
 *
 * Query parameters:
 * - startDate: ISO date string (required)
 * - endDate: ISO date string (required)
 *
 * Response:
 * - 200: { success: true, data: RegulatoryReport }
 */
router.get('/reports/regulatory', generateRegulatoryReport);

export default router;
