/**
 * Role-Based Access Control Middleware
 * Controls who can access what medical records based on their role
 */

import { Request, Response, NextFunction } from 'express';

export type UserRole = 'patient' | 'pharmacist' | 'doctor' | 'nurse' | 'admin';

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  hinToken?: string; // For healthcare professionals
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Authentication middleware (stub)
 * In production, this would verify JWT tokens
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  // STUB: Extract user from headers (in production, verify JWT)
  const userId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as UserRole;
  const hinToken = req.headers['x-hin-token'] as string;

  if (!userId || !userRole) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Attach user to request
  req.user = {
    id: userId,
    role: userRole,
    hinToken,
  };

  next();
}

/**
 * Require specific role(s)
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}

/**
 * Require HIN e-ID authentication for healthcare professionals
 */
export function requireHinAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const healthcareProfessionals: UserRole[] = ['pharmacist', 'doctor', 'nurse'];
  if (healthcareProfessionals.includes(req.user.role) && !req.user.hinToken) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'HIN e-ID authentication required for healthcare professionals',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
}

/**
 * Check if user can access patient records
 * - Patient can access their own records
 * - Healthcare professionals can access with consent
 */
export function canAccessPatientRecords(
  userId: string,
  userRole: UserRole,
  patientId: string
): boolean {
  // Patient can access their own records
  if (userRole === 'patient' && userId === patientId) {
    return true;
  }

  // Healthcare professionals and admins can access (consent checked in controller)
  if (['pharmacist', 'doctor', 'nurse', 'admin'].includes(userRole)) {
    return true;
  }

  return false;
}

/**
 * Get allowed record types for a role
 * - Pharmacist: allergies, medications, conditions (prescription-related)
 * - Nurse: medications, allergies (medication administration)
 * - Doctor: all types
 * - Patient: all their own records
 */
export function getAllowedRecordTypes(role: UserRole): string[] {
  const rolePermissions: Record<UserRole, string[]> = {
    patient: ['diagnosis', 'allergy', 'medication', 'procedure', 'lab_result', 'immunization', 'condition'],
    pharmacist: ['allergy', 'medication', 'condition'],
    nurse: ['allergy', 'medication'],
    doctor: ['diagnosis', 'allergy', 'medication', 'procedure', 'lab_result', 'immunization', 'condition'],
    admin: ['diagnosis', 'allergy', 'medication', 'procedure', 'lab_result', 'immunization', 'condition'],
  };

  return rolePermissions[role] || [];
}

/**
 * Filter records based on role permissions
 */
export function filterRecordsByRole<T extends { recordType: string }>(
  records: T[],
  role: UserRole
): T[] {
  const allowedTypes = getAllowedRecordTypes(role);
  return records.filter(record => allowedTypes.includes(record.recordType));
}
