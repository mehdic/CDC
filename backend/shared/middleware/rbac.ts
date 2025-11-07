/**
 * RBAC (Role-Based Access Control) Middleware (T042)
 * Implements permission checking based on user roles
 * Based on: /specs/002-metapharm-platform/plan.md
 *
 * Security Requirements:
 * - RBAC for 5 user roles (FR-001)
 * - Principle of least privilege (FR-112)
 * - Prevent unauthorized cross-role data access (FR-112)
 * - Audit logging for authorization failures (FR-007)
 */

import { Response, NextFunction } from 'express';
import { UserRole } from '../models/User';
import { AuthenticatedRequest } from './auth';

// ============================================================================
// Role Hierarchies & Permissions
// ============================================================================

/**
 * Role hierarchy - higher roles inherit permissions of lower roles
 * Currently flat hierarchy - each role has distinct permissions
 * Can be extended to support hierarchical RBAC if needed
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.PATIENT]: 1,
  [UserRole.DELIVERY]: 2,
  [UserRole.NURSE]: 3,
  [UserRole.PHARMACIST]: 4,
  [UserRole.DOCTOR]: 4, // Same level as pharmacist, different permissions
};

/**
 * Permission definitions
 * Maps high-level permissions to allowed roles
 */
export enum Permission {
  // Prescription permissions
  CREATE_PRESCRIPTION = 'create_prescription',
  UPLOAD_PRESCRIPTION = 'upload_prescription',
  REVIEW_PRESCRIPTION = 'review_prescription',
  APPROVE_PRESCRIPTION = 'approve_prescription',
  VIEW_PRESCRIPTION = 'view_prescription',

  // Teleconsultation permissions
  BOOK_CONSULTATION = 'book_consultation',
  CONDUCT_CONSULTATION = 'conduct_consultation',
  VIEW_CONSULTATION = 'view_consultation',

  // Inventory permissions
  MANAGE_INVENTORY = 'manage_inventory',
  VIEW_INVENTORY = 'view_inventory',
  SCAN_QR_CODE = 'scan_qr_code',

  // Delivery permissions
  MANAGE_DELIVERIES = 'manage_deliveries',
  EXECUTE_DELIVERY = 'execute_delivery',
  TRACK_DELIVERY = 'track_delivery',

  // E-commerce permissions
  PLACE_ORDER = 'place_order',
  MANAGE_ORDERS = 'manage_orders',

  // Medical records permissions
  VIEW_OWN_RECORDS = 'view_own_records',
  VIEW_PATIENT_RECORDS = 'view_patient_records',
  EDIT_PATIENT_RECORDS = 'edit_patient_records',

  // Analytics permissions
  VIEW_ANALYTICS = 'view_analytics',

  // Admin permissions
  MANAGE_USERS = 'manage_users',
  MANAGE_PHARMACY = 'manage_pharmacy',
}

/**
 * Permission to roles mapping
 * Defines which roles have which permissions
 */
const PERMISSION_ROLES: Record<Permission, UserRole[]> = {
  // Prescription permissions
  [Permission.CREATE_PRESCRIPTION]: [UserRole.DOCTOR],
  [Permission.UPLOAD_PRESCRIPTION]: [UserRole.PATIENT],
  [Permission.REVIEW_PRESCRIPTION]: [UserRole.PHARMACIST],
  [Permission.APPROVE_PRESCRIPTION]: [UserRole.PHARMACIST],
  [Permission.VIEW_PRESCRIPTION]: [
    UserRole.PATIENT,
    UserRole.PHARMACIST,
    UserRole.DOCTOR,
    UserRole.NURSE,
  ],

  // Teleconsultation permissions
  [Permission.BOOK_CONSULTATION]: [UserRole.PATIENT],
  [Permission.CONDUCT_CONSULTATION]: [UserRole.PHARMACIST],
  [Permission.VIEW_CONSULTATION]: [UserRole.PATIENT, UserRole.PHARMACIST],

  // Inventory permissions
  [Permission.MANAGE_INVENTORY]: [UserRole.PHARMACIST],
  [Permission.VIEW_INVENTORY]: [UserRole.PHARMACIST, UserRole.NURSE],
  [Permission.SCAN_QR_CODE]: [UserRole.PHARMACIST, UserRole.DELIVERY],

  // Delivery permissions
  [Permission.MANAGE_DELIVERIES]: [UserRole.PHARMACIST],
  [Permission.EXECUTE_DELIVERY]: [UserRole.DELIVERY],
  [Permission.TRACK_DELIVERY]: [
    UserRole.PATIENT,
    UserRole.PHARMACIST,
    UserRole.NURSE,
    UserRole.DELIVERY,
  ],

  // E-commerce permissions
  [Permission.PLACE_ORDER]: [UserRole.PATIENT, UserRole.NURSE],
  [Permission.MANAGE_ORDERS]: [UserRole.PHARMACIST],

  // Medical records permissions
  [Permission.VIEW_OWN_RECORDS]: [UserRole.PATIENT],
  [Permission.VIEW_PATIENT_RECORDS]: [
    UserRole.PHARMACIST,
    UserRole.DOCTOR,
    UserRole.NURSE,
  ],
  [Permission.EDIT_PATIENT_RECORDS]: [UserRole.PHARMACIST, UserRole.DOCTOR],

  // Analytics permissions
  [Permission.VIEW_ANALYTICS]: [UserRole.PHARMACIST],

  // Admin permissions
  [Permission.MANAGE_USERS]: [UserRole.PHARMACIST], // Pharmacy master account
  [Permission.MANAGE_PHARMACY]: [UserRole.PHARMACIST], // Pharmacy master account
};

// ============================================================================
// Role-Based Middleware (T042)
// ============================================================================

/**
 * Require Role Middleware Factory
 * Creates middleware that checks if user has one of the allowed roles
 *
 * Usage:
 * ```
 * // Single role
 * router.post('/prescriptions', authenticateJWT, requireRole(UserRole.DOCTOR), handler);
 *
 * // Multiple roles
 * router.get('/prescriptions/:id', authenticateJWT, requireRole([UserRole.PHARMACIST, UserRole.DOCTOR]), handler);
 * ```
 *
 * @param allowedRoles - Single role or array of allowed roles
 * @returns Express middleware function
 */
export function requireRole(
  allowedRoles: UserRole | UserRole[]
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void {
  // Normalize to array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Ensure user is authenticated
    if (!req.user) {
      console.warn('Authorization check failed: User not authenticated', {
        ip: req.ip,
        path: req.path,
        method: req.method,
      });

      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'NO_AUTH',
      });
      return;
    }

    // Check if user role is allowed
    if (!roles.includes(req.user.role)) {
      console.warn('Authorization failed: Insufficient role', {
        userId: req.user.userId,
        userRole: req.user.role,
        requiredRoles: roles,
        ip: req.ip,
        path: req.path,
        method: req.method,
      });

      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource',
        code: 'INSUFFICIENT_ROLE',
      });
      return;
    }

    // Authorization successful
    console.info('Authorization successful', {
      userId: req.user.userId,
      role: req.user.role,
      path: req.path,
      method: req.method,
    });

    next();
  };
}

/**
 * Require Permission Middleware Factory
 * Creates middleware that checks if user has a specific permission
 *
 * Usage:
 * ```
 * router.post('/prescriptions/:id/approve',
 *   authenticateJWT,
 *   requirePermission(Permission.APPROVE_PRESCRIPTION),
 *   handler
 * );
 * ```
 *
 * @param permission - Required permission
 * @returns Express middleware function
 */
export function requirePermission(
  permission: Permission
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Ensure user is authenticated
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'NO_AUTH',
      });
      return;
    }

    // Check if user role has the required permission
    const allowedRoles = PERMISSION_ROLES[permission];

    if (!allowedRoles.includes(req.user.role)) {
      console.warn('Authorization failed: Missing permission', {
        userId: req.user.userId,
        userRole: req.user.role,
        requiredPermission: permission,
        ip: req.ip,
        path: req.path,
        method: req.method,
      });

      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to perform this action',
        code: 'MISSING_PERMISSION',
      });
      return;
    }

    next();
  };
}

/**
 * Require Multiple Permissions Middleware Factory
 * Creates middleware that checks if user has ALL of the specified permissions
 *
 * Usage:
 * ```
 * router.post('/admin-action',
 *   authenticateJWT,
 *   requireAllPermissions([Permission.MANAGE_USERS, Permission.MANAGE_PHARMACY]),
 *   handler
 * );
 * ```
 *
 * @param permissions - Array of required permissions
 * @returns Express middleware function
 */
export function requireAllPermissions(
  permissions: Permission[]
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'NO_AUTH',
      });
      return;
    }

    // Check if user has all permissions
    const missingPermissions = permissions.filter((permission) => {
      const allowedRoles = PERMISSION_ROLES[permission];
      return !allowedRoles.includes(req.user!.role);
    });

    if (missingPermissions.length > 0) {
      console.warn('Authorization failed: Missing multiple permissions', {
        userId: req.user.userId,
        userRole: req.user.role,
        missingPermissions,
        ip: req.ip,
        path: req.path,
      });

      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have all required permissions',
        code: 'MISSING_PERMISSIONS',
      });
      return;
    }

    next();
  };
}

/**
 * Require Any Permission Middleware Factory
 * Creates middleware that checks if user has AT LEAST ONE of the specified permissions
 *
 * Usage:
 * ```
 * router.get('/prescriptions',
 *   authenticateJWT,
 *   requireAnyPermission([Permission.VIEW_PRESCRIPTION, Permission.REVIEW_PRESCRIPTION]),
 *   handler
 * );
 * ```
 *
 * @param permissions - Array of permissions (user needs at least one)
 * @returns Express middleware function
 */
export function requireAnyPermission(
  permissions: Permission[]
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'NO_AUTH',
      });
      return;
    }

    // Check if user has at least one permission
    const hasPermission = permissions.some((permission) => {
      const allowedRoles = PERMISSION_ROLES[permission];
      return allowedRoles.includes(req.user!.role);
    });

    if (!hasPermission) {
      console.warn('Authorization failed: No matching permissions', {
        userId: req.user.userId,
        userRole: req.user.role,
        requiredPermissions: permissions,
        ip: req.ip,
        path: req.path,
      });

      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource',
        code: 'NO_MATCHING_PERMISSION',
      });
      return;
    }

    next();
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a user role has a specific permission
 * Utility function for programmatic permission checks
 *
 * @param role - User role to check
 * @param permission - Permission to check for
 * @returns True if role has permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const allowedRoles = PERMISSION_ROLES[permission];
  return allowedRoles.includes(role);
}

/**
 * Get all permissions for a role
 *
 * @param role - User role
 * @returns Array of permissions the role has
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  const permissions: Permission[] = [];

  for (const [permission, roles] of Object.entries(PERMISSION_ROLES)) {
    if (roles.includes(role)) {
      permissions.push(permission as Permission);
    }
  }

  return permissions;
}

/**
 * Check if role A has equal or higher privilege than role B
 * Based on role hierarchy
 *
 * @param roleA - First role
 * @param roleB - Second role
 * @returns True if roleA >= roleB in hierarchy
 */
export function hasEqualOrHigherRole(roleA: UserRole, roleB: UserRole): boolean {
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB];
}

/**
 * Resource ownership check
 * Helper function to check if user owns a resource
 * Can be extended with database queries for more complex ownership checks
 *
 * @param req - Authenticated request
 * @param resourceOwnerId - ID of the resource owner
 * @returns True if user owns the resource
 */
export function isResourceOwner(
  req: AuthenticatedRequest,
  resourceOwnerId: string
): boolean {
  if (!req.user) {
    return false;
  }

  return req.user.userId === resourceOwnerId;
}

/**
 * Require Resource Ownership or Role Middleware Factory
 * Allows access if user owns the resource OR has one of the allowed roles
 *
 * Usage:
 * ```
 * router.get('/prescriptions/:id',
 *   authenticateJWT,
 *   requireOwnershipOr([UserRole.PHARMACIST]),
 *   handler
 * );
 * ```
 *
 * Note: This middleware expects resourceOwnerId to be set in req.params or req.body
 *
 * @param allowedRoles - Roles that can access regardless of ownership
 * @param ownershipField - Field name containing owner ID (default: 'userId')
 * @returns Express middleware function
 */
export function requireOwnershipOr(
  allowedRoles: UserRole[],
  ownershipField: string = 'userId'
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'NO_AUTH',
      });
      return;
    }

    // Check if user has allowed role
    if (allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    // Check ownership
    const resourceOwnerId = req.params[ownershipField] || req.body[ownershipField];

    if (!resourceOwnerId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Resource owner ID not provided',
        code: 'NO_OWNER_ID',
      });
      return;
    }

    if (req.user.userId !== resourceOwnerId) {
      console.warn('Authorization failed: Not resource owner and insufficient role', {
        userId: req.user.userId,
        userRole: req.user.role,
        resourceOwnerId,
        ip: req.ip,
        path: req.path,
      });

      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource',
        code: 'NOT_OWNER',
      });
      return;
    }

    next();
  };
}
