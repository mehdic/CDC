/**
 * Access Control Middleware
 * Role-based access control (RBAC) for medical records
 */

import { Request, Response, NextFunction } from 'express';
import { RecordType } from '../models/MedicalRecord';
import { AuthenticatedUser, AuthenticatedRequest as SharedAuthRequest } from '../../../../shared/middleware/auth';
import { UserRole } from '../../../../shared/models/User';

// Re-export UserRole for backward compatibility
export { UserRole };

// Extend shared AuthenticatedRequest with additional user properties if needed
export interface AuthenticatedRequest extends SharedAuthRequest {
  user?: AuthenticatedUser & {
    id?: string; // Alias for userId for backward compatibility
  };
}

/**
 * Pharmacist can only access limited medical record types:
 * - Allergies
 * - Current medications
 * - Current conditions
 */
const PHARMACIST_ALLOWED_TYPES: RecordType[] = [
  RecordType.ALLERGY,
  RecordType.MEDICATION,
  RecordType.CONDITION,
];

/**
 * Verify user has permission to access medical records
 */
export const requireAuth = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        statusCode: 401,
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied for role: ${req.user.role}`,
        statusCode: 403,
      });
    }

    next();
  };
};

/**
 * Filter medical records based on user role
 */
export const filterRecordsByRole = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { role } = req.user || {};

  // Patients can access all their own records
  if (role === UserRole.PATIENT) {
    return next();
  }

  // Pharmacists can only access limited record types
  if (role === UserRole.PHARMACIST) {
    const requestedType = req.query.recordType as RecordType | undefined;

    if (requestedType && !PHARMACIST_ALLOWED_TYPES.includes(requestedType)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Pharmacists cannot access ${requestedType} records`,
        statusCode: 403,
      });
    }

    // If no specific type requested, filter to allowed types in controller
    req.query.pharmacistFiltered = 'true';
  }

  // Doctors and nurses have broader access
  next();
};

/**
 * Verify user can only access their own patient records
 */
export const requireOwnPatientAccess = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const { role, id: userId } = req.user || {};
  const { patientId } = req.params;

  // Only patients need this check
  if (role === UserRole.PATIENT && userId !== patientId) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You can only access your own medical records',
      statusCode: 403,
    });
  }

  next();
};

/**
 * Mock authentication middleware (for development)
 * In production, this would validate JWT tokens
 */
export const mockAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Check for user info in headers (mock)
  const userId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as UserRole;
  const pharmacyId = req.headers['x-pharmacy-id'] as string | undefined;

  if (!userId || !userRole) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing authentication headers (x-user-id, x-user-role)',
      statusCode: 401,
    });
  }

  req.user = {
    id: userId,
    role: userRole,
    pharmacyId,
  };

  next();
};
