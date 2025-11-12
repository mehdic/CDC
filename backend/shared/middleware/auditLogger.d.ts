/**
 * HIPAA-Compliant Audit Logging Middleware (T241)
 * Automatically logs all access to Protected Health Information (PHI)
 * Based on HIPAA Security Rule § 164.312(b) - Audit Controls
 *
 * Compliance Requirements:
 * - Log all CREATE, READ, UPDATE, DELETE operations on PHI
 * - Capture: user ID, timestamp, action, resource type, resource ID, IP address
 * - Immutable audit trail (append-only, never delete)
 * - Encrypt PII in audit logs
 * - Retain for 7 years (HIPAA requirement)
 *
 * Protected Resources:
 * - Patient medical records
 * - Prescriptions
 * - Teleconsultation sessions and notes
 * - Treatment plans
 * - Consultation notes
 */
import { Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { AuthenticatedRequest } from './auth';
import { AuditAction } from '../models/AuditTrailEntry';
/**
 * Resource types that contain Protected Health Information (PHI)
 * All operations on these resources MUST be audited per HIPAA requirements
 */
export declare enum ProtectedResourceType {
    PATIENT_RECORD = "patient_medical_record",
    PRESCRIPTION = "prescription",
    PRESCRIPTION_ITEM = "prescription_item",
    TELECONSULTATION = "teleconsultation",
    CONSULTATION_NOTE = "consultation_note",
    TREATMENT_PLAN = "treatment_plan",
    PATIENT_PROFILE = "patient_profile",
    MEDICAL_HISTORY = "medical_history",
    ALLERGY_RECORD = "allergy_record",
    DIAGNOSIS = "diagnosis",
    LAB_RESULT = "lab_result"
}
/**
 * Create audit logging middleware for a specific resource type
 *
 * This middleware should be applied to ALL routes that access PHI.
 * It logs the request details to an immutable audit trail.
 *
 * Usage:
 * ```typescript
 * // Log all prescription access
 * router.get(
 *   '/prescriptions/:id',
 *   authenticateJWT,
 *   auditLog(dataSource, ProtectedResourceType.PRESCRIPTION),
 *   getPrescriptionHandler
 * );
 *
 * router.put(
 *   '/prescriptions/:id',
 *   authenticateJWT,
 *   auditLog(dataSource, ProtectedResourceType.PRESCRIPTION),
 *   updatePrescriptionHandler
 * );
 * ```
 *
 * @param dataSource TypeORM DataSource for database connection
 * @param resourceType Type of protected resource being accessed
 * @param options Optional configuration
 * @returns Express middleware function
 */
export declare function auditLog(dataSource: DataSource, resourceType: ProtectedResourceType, options?: {
    resourceIdParam?: string;
    eventTypePrefix?: string;
    captureRequestBody?: boolean;
    captureResponseBody?: boolean;
}): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Automatic audit logging middleware
 * Detects PHI resources from URL path and automatically logs access
 *
 * This is a convenience middleware that can be applied globally.
 * It inspects the request path and automatically determines if it's a PHI resource.
 *
 * Usage:
 * ```typescript
 * app.use(autoAuditLog(dataSource));
 * ```
 *
 * Path patterns detected:
 * - /api/v1/prescriptions/:id → ProtectedResourceType.PRESCRIPTION
 * - /api/v1/patients/:id/records → ProtectedResourceType.PATIENT_RECORD
 * - /api/v1/teleconsultations/:id → ProtectedResourceType.TELECONSULTATION
 *
 * @param dataSource TypeORM DataSource
 * @returns Express middleware
 */
export declare function autoAuditLog(dataSource: DataSource): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Log multiple audit events in a batch
 * Useful for bulk operations (e.g., bulk prescription approval)
 *
 * @param dataSource TypeORM DataSource
 * @param req Express request
 * @param resourceType Resource type
 * @param resourceIds Array of resource IDs
 * @param action Audit action
 */
export declare function batchAuditLog(dataSource: DataSource, req: AuthenticatedRequest, resourceType: ProtectedResourceType, resourceIds: string[], action: AuditAction): Promise<void>;
/**
 * Query audit logs for a specific resource
 * Useful for compliance reporting and security investigations
 *
 * @param dataSource TypeORM DataSource
 * @param resourceType Resource type
 * @param resourceId Resource ID
 * @param options Query options
 * @returns Array of audit trail entries
 */
export declare function getAuditLogsForResource(dataSource: DataSource, resourceType: string, resourceId: string, options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    action?: AuditAction;
    userId?: string;
}): Promise<import("typeorm").ObjectLiteral[]>;
/**
 * Get audit logs for a user
 * Useful for tracking user activity
 *
 * @param dataSource TypeORM DataSource
 * @param userId User ID
 * @param options Query options
 * @returns Array of audit trail entries
 */
export declare function getAuditLogsForUser(dataSource: DataSource, userId: string, options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    resourceType?: ProtectedResourceType;
}): Promise<import("typeorm").ObjectLiteral[]>;
/**
 * Generate HIPAA audit report
 * Useful for compliance audits
 *
 * @param dataSource TypeORM DataSource
 * @param startDate Report start date
 * @param endDate Report end date
 * @returns Audit summary statistics
 */
export declare function generateHIPAAAuditReport(dataSource: DataSource, startDate: Date, endDate: Date): Promise<{
    period: {
        start: Date;
        end: Date;
    };
    summary: any[];
    totalEvents: any;
}>;
//# sourceMappingURL=auditLogger.d.ts.map