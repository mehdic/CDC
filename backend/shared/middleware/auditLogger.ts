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

import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { AuthenticatedRequest } from './auth';
import {
  logAuditEvent,
  extractRequestContext,
  createChangesObject,
} from '../utils/audit';
import { AuditAction } from '../models/AuditTrailEntry';

// ============================================================================
// Protected Resource Types (PHI)
// ============================================================================

/**
 * Resource types that contain Protected Health Information (PHI)
 * All operations on these resources MUST be audited per HIPAA requirements
 */
export enum ProtectedResourceType {
  PATIENT_RECORD = 'patient_medical_record',
  PRESCRIPTION = 'prescription',
  PRESCRIPTION_ITEM = 'prescription_item',
  TELECONSULTATION = 'teleconsultation',
  CONSULTATION_NOTE = 'consultation_note',
  TREATMENT_PLAN = 'treatment_plan',
  PATIENT_PROFILE = 'patient_profile',
  MEDICAL_HISTORY = 'medical_history',
  ALLERGY_RECORD = 'allergy_record',
  DIAGNOSIS = 'diagnosis',
  LAB_RESULT = 'lab_result',
}

/**
 * HTTP methods mapped to audit actions
 */
const HTTP_METHOD_TO_ACTION: Record<string, AuditAction> = {
  GET: AuditAction.READ,
  POST: AuditAction.CREATE,
  PUT: AuditAction.UPDATE,
  PATCH: AuditAction.UPDATE,
  DELETE: AuditAction.DELETE,
};

// ============================================================================
// Audit Logging Middleware Factory (T241)
// ============================================================================

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
export function auditLog(
  dataSource: DataSource,
  resourceType: ProtectedResourceType,
  options?: {
    resourceIdParam?: string; // URL param for resource ID (default: 'id')
    eventTypePrefix?: string; // Prefix for event type (default: resource type)
    captureRequestBody?: boolean; // Capture request body changes (default: false for privacy)
    captureResponseBody?: boolean; // Capture response body (default: false for privacy)
  }
) {
  const {
    resourceIdParam = 'id',
    eventTypePrefix = resourceType,
    captureRequestBody = false,
    captureResponseBody = false,
  } = options || {};

  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Skip audit logging for unauthenticated requests (will fail auth later)
      if (!req.user) {
        next();
        return;
      }

      // Extract resource ID from request
      const resourceId =
        req.params[resourceIdParam] ||
        req.body?.id ||
        req.query?.id ||
        'unknown';

      // Determine action based on HTTP method
      const action = HTTP_METHOD_TO_ACTION[req.method] || AuditAction.READ;

      // Build event type (e.g., "prescription.read", "prescription.update")
      const eventType = `${eventTypePrefix}.${action}`;

      // Extract request context (IP, user agent, device info)
      const context = extractRequestContext(req);

      // Capture original response.json to intercept response
      const originalJson = res.json;
      let responseData: any = null;

      if (captureResponseBody) {
        res.json = function (data: any) {
          responseData = data;
          return originalJson.call(this, data);
        };
      }

      // Log the audit event BEFORE processing the request
      // This ensures we log even if the request fails
      const auditPromise = logAuditEvent(dataSource, {
        userId: req.user.userId,
        pharmacyId: req.user.pharmacyId || null,
        eventType,
        action,
        resourceType,
        resourceId,
        changes: captureRequestBody
          ? createChangesObject({}, req.body, Object.keys(req.body || {}))
          : null,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        deviceInfo: context.deviceInfo,
      });

      // Don't wait for audit log to complete (async logging)
      // But log errors if they occur
      auditPromise.catch((error) => {
        console.error('Audit logging failed:', error, {
          userId: req.user?.userId,
          action,
          resourceType,
          resourceId,
          path: req.path,
        });
        // Don't fail the request if audit logging fails
        // But in production, this should trigger an alert
      });

      // Continue processing the request
      next();
    } catch (error) {
      console.error('Audit middleware error:', error);
      // Don't fail the request if audit middleware has an error
      next();
    }
  };
}

// ============================================================================
// Automatic Audit Logging Middleware (T241)
// ============================================================================

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
export function autoAuditLog(dataSource: DataSource) {
  // Map URL path patterns to resource types
  const pathPatterns: Array<{
    pattern: RegExp;
    resourceType: ProtectedResourceType;
    extractResourceId: (path: string) => string | null;
  }> = [
    {
      pattern: /\/api\/v\d+\/prescriptions\/([^/]+)/,
      resourceType: ProtectedResourceType.PRESCRIPTION,
      extractResourceId: (path: string) => {
        const match = path.match(/\/prescriptions\/([^/]+)/);
        return match ? match[1] : null;
      },
    },
    {
      pattern: /\/api\/v\d+\/patients\/([^/]+)\/records/,
      resourceType: ProtectedResourceType.PATIENT_RECORD,
      extractResourceId: (path: string) => {
        const match = path.match(/\/patients\/([^/]+)/);
        return match ? match[1] : null;
      },
    },
    {
      pattern: /\/api\/v\d+\/teleconsultations\/([^/]+)/,
      resourceType: ProtectedResourceType.TELECONSULTATION,
      extractResourceId: (path: string) => {
        const match = path.match(/\/teleconsultations\/([^/]+)/);
        return match ? match[1] : null;
      },
    },
    {
      pattern: /\/api\/v\d+\/consultation-notes\/([^/]+)/,
      resourceType: ProtectedResourceType.CONSULTATION_NOTE,
      extractResourceId: (path: string) => {
        const match = path.match(/\/consultation-notes\/([^/]+)/);
        return match ? match[1] : null;
      },
    },
    {
      pattern: /\/api\/v\d+\/treatment-plans\/([^/]+)/,
      resourceType: ProtectedResourceType.TREATMENT_PLAN,
      extractResourceId: (path: string) => {
        const match = path.match(/\/treatment-plans\/([^/]+)/);
        return match ? match[1] : null;
      },
    },
  ];

  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Skip if not authenticated
      if (!req.user) {
        next();
        return;
      }

      const path = req.path;

      // Check if path matches any PHI resource pattern
      for (const { pattern, resourceType, extractResourceId } of pathPatterns) {
        if (pattern.test(path)) {
          const resourceId = extractResourceId(path) || 'unknown';
          const action = HTTP_METHOD_TO_ACTION[req.method] || AuditAction.READ;
          const eventType = `${resourceType}.${action}`;
          const context = extractRequestContext(req);

          // Log audit event asynchronously
          logAuditEvent(dataSource, {
            userId: req.user.userId,
            pharmacyId: req.user.pharmacyId || null,
            eventType,
            action,
            resourceType,
            resourceId,
            changes: null,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            deviceInfo: context.deviceInfo,
          }).catch((error) => {
            console.error('Auto audit logging failed:', error);
          });

          // Only log once per request
          break;
        }
      }

      next();
    } catch (error) {
      console.error('Auto audit middleware error:', error);
      next();
    }
  };
}

// ============================================================================
// Batch Audit Logging
// ============================================================================

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
export async function batchAuditLog(
  dataSource: DataSource,
  req: AuthenticatedRequest,
  resourceType: ProtectedResourceType,
  resourceIds: string[],
  action: AuditAction
): Promise<void> {
  if (!req.user) {
    throw new Error('Cannot log audit event for unauthenticated request');
  }

  const context = extractRequestContext(req);
  const eventType = `${resourceType}.${action}.batch`;

  const promises = resourceIds.map((resourceId) =>
    logAuditEvent(dataSource, {
      userId: req.user!.userId,
      pharmacyId: req.user!.pharmacyId || null,
      eventType,
      action,
      resourceType,
      resourceId,
      changes: null,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      deviceInfo: context.deviceInfo,
    })
  );

  await Promise.all(promises);
}

// ============================================================================
// Audit Log Query Helpers
// ============================================================================

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
export async function getAuditLogsForResource(
  dataSource: DataSource,
  resourceType: string,
  resourceId: string,
  options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    action?: AuditAction;
    userId?: string;
  }
) {
  const { limit = 100, offset = 0, startDate, endDate, action, userId } = options || {};

  const queryBuilder = dataSource
    .getRepository('AuditTrailEntry')
    .createQueryBuilder('audit')
    .where('audit.resource_type = :resourceType', { resourceType })
    .andWhere('audit.resource_id = :resourceId', { resourceId })
    .orderBy('audit.created_at', 'DESC')
    .limit(limit)
    .offset(offset);

  if (startDate) {
    queryBuilder.andWhere('audit.created_at >= :startDate', { startDate });
  }

  if (endDate) {
    queryBuilder.andWhere('audit.created_at <= :endDate', { endDate });
  }

  if (action) {
    queryBuilder.andWhere('audit.action = :action', { action });
  }

  if (userId) {
    queryBuilder.andWhere('audit.user_id = :userId', { userId });
  }

  return queryBuilder.getMany();
}

/**
 * Get audit logs for a user
 * Useful for tracking user activity
 *
 * @param dataSource TypeORM DataSource
 * @param userId User ID
 * @param options Query options
 * @returns Array of audit trail entries
 */
export async function getAuditLogsForUser(
  dataSource: DataSource,
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    resourceType?: ProtectedResourceType;
  }
) {
  const { limit = 100, offset = 0, startDate, endDate, resourceType } = options || {};

  const queryBuilder = dataSource
    .getRepository('AuditTrailEntry')
    .createQueryBuilder('audit')
    .where('audit.user_id = :userId', { userId })
    .orderBy('audit.created_at', 'DESC')
    .limit(limit)
    .offset(offset);

  if (startDate) {
    queryBuilder.andWhere('audit.created_at >= :startDate', { startDate });
  }

  if (endDate) {
    queryBuilder.andWhere('audit.created_at <= :endDate', { endDate });
  }

  if (resourceType) {
    queryBuilder.andWhere('audit.resource_type = :resourceType', { resourceType });
  }

  return queryBuilder.getMany();
}

// ============================================================================
// HIPAA Compliance Reporting
// ============================================================================

/**
 * Generate HIPAA audit report
 * Useful for compliance audits
 *
 * @param dataSource TypeORM DataSource
 * @param startDate Report start date
 * @param endDate Report end date
 * @returns Audit summary statistics
 */
export async function generateHIPAAAuditReport(
  dataSource: DataSource,
  startDate: Date,
  endDate: Date
) {
  const result = await dataSource
    .getRepository('AuditTrailEntry')
    .createQueryBuilder('audit')
    .select('audit.resource_type', 'resourceType')
    .addSelect('audit.action', 'action')
    .addSelect('COUNT(*)', 'count')
    .where('audit.created_at >= :startDate', { startDate })
    .andWhere('audit.created_at <= :endDate', { endDate })
    .groupBy('audit.resource_type')
    .addGroupBy('audit.action')
    .getRawMany();

  return {
    period: {
      start: startDate,
      end: endDate,
    },
    summary: result,
    totalEvents: result.reduce((sum, r) => sum + parseInt(r.count, 10), 0),
  };
}
