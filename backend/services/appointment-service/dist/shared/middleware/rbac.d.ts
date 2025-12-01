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
/**
 * Permission definitions
 * Maps high-level permissions to allowed roles
 */
export declare enum Permission {
    CREATE_PRESCRIPTION = "create_prescription",
    UPLOAD_PRESCRIPTION = "upload_prescription",
    REVIEW_PRESCRIPTION = "review_prescription",
    APPROVE_PRESCRIPTION = "approve_prescription",
    VIEW_PRESCRIPTION = "view_prescription",
    BOOK_CONSULTATION = "book_consultation",
    CONDUCT_CONSULTATION = "conduct_consultation",
    VIEW_CONSULTATION = "view_consultation",
    MANAGE_INVENTORY = "manage_inventory",
    VIEW_INVENTORY = "view_inventory",
    SCAN_QR_CODE = "scan_qr_code",
    MANAGE_DELIVERIES = "manage_deliveries",
    EXECUTE_DELIVERY = "execute_delivery",
    TRACK_DELIVERY = "track_delivery",
    PLACE_ORDER = "place_order",
    MANAGE_ORDERS = "manage_orders",
    VIEW_OWN_RECORDS = "view_own_records",
    VIEW_PATIENT_RECORDS = "view_patient_records",
    EDIT_PATIENT_RECORDS = "edit_patient_records",
    VIEW_ANALYTICS = "view_analytics",
    MANAGE_USERS = "manage_users",
    MANAGE_PHARMACY = "manage_pharmacy"
}
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
export declare function requireRole(allowedRoles: UserRole | UserRole[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
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
export declare function requirePermission(permission: Permission): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
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
export declare function requireAllPermissions(permissions: Permission[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
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
export declare function requireAnyPermission(permissions: Permission[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Check if a user role has a specific permission
 * Utility function for programmatic permission checks
 *
 * @param role - User role to check
 * @param permission - Permission to check for
 * @returns True if role has permission
 */
export declare function hasPermission(role: UserRole, permission: Permission): boolean;
/**
 * Get all permissions for a role
 *
 * @param role - User role
 * @returns Array of permissions the role has
 */
export declare function getPermissionsForRole(role: UserRole): Permission[];
/**
 * Check if role A has equal or higher privilege than role B
 * Based on role hierarchy
 *
 * @param roleA - First role
 * @param roleB - Second role
 * @returns True if roleA >= roleB in hierarchy
 */
export declare function hasEqualOrHigherRole(roleA: UserRole, roleB: UserRole): boolean;
/**
 * Resource ownership check
 * Helper function to check if user owns a resource
 * Can be extended with database queries for more complex ownership checks
 *
 * @param req - Authenticated request
 * @param resourceOwnerId - ID of the resource owner
 * @returns True if user owns the resource
 */
export declare function isResourceOwner(req: AuthenticatedRequest, resourceOwnerId: string): boolean;
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
export declare function requireOwnershipOr(allowedRoles: UserRole[], ownershipField?: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=rbac.d.ts.map