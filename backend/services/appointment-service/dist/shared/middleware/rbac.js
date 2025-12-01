"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permission = void 0;
exports.requireRole = requireRole;
exports.requirePermission = requirePermission;
exports.requireAllPermissions = requireAllPermissions;
exports.requireAnyPermission = requireAnyPermission;
exports.hasPermission = hasPermission;
exports.getPermissionsForRole = getPermissionsForRole;
exports.hasEqualOrHigherRole = hasEqualOrHigherRole;
exports.isResourceOwner = isResourceOwner;
exports.requireOwnershipOr = requireOwnershipOr;
const User_1 = require("../models/User");
// ============================================================================
// Role Hierarchies & Permissions
// ============================================================================
/**
 * Role hierarchy - higher roles inherit permissions of lower roles
 * Currently flat hierarchy - each role has distinct permissions
 * Can be extended to support hierarchical RBAC if needed
 */
const ROLE_HIERARCHY = {
    [User_1.UserRole.PATIENT]: 1,
    [User_1.UserRole.DELIVERY]: 2,
    [User_1.UserRole.NURSE]: 3,
    [User_1.UserRole.PHARMACIST]: 4,
    [User_1.UserRole.DOCTOR]: 4, // Same level as pharmacist, different permissions
};
/**
 * Permission definitions
 * Maps high-level permissions to allowed roles
 */
var Permission;
(function (Permission) {
    // Prescription permissions
    Permission["CREATE_PRESCRIPTION"] = "create_prescription";
    Permission["UPLOAD_PRESCRIPTION"] = "upload_prescription";
    Permission["REVIEW_PRESCRIPTION"] = "review_prescription";
    Permission["APPROVE_PRESCRIPTION"] = "approve_prescription";
    Permission["VIEW_PRESCRIPTION"] = "view_prescription";
    // Teleconsultation permissions
    Permission["BOOK_CONSULTATION"] = "book_consultation";
    Permission["CONDUCT_CONSULTATION"] = "conduct_consultation";
    Permission["VIEW_CONSULTATION"] = "view_consultation";
    // Inventory permissions
    Permission["MANAGE_INVENTORY"] = "manage_inventory";
    Permission["VIEW_INVENTORY"] = "view_inventory";
    Permission["SCAN_QR_CODE"] = "scan_qr_code";
    // Delivery permissions
    Permission["MANAGE_DELIVERIES"] = "manage_deliveries";
    Permission["EXECUTE_DELIVERY"] = "execute_delivery";
    Permission["TRACK_DELIVERY"] = "track_delivery";
    // E-commerce permissions
    Permission["PLACE_ORDER"] = "place_order";
    Permission["MANAGE_ORDERS"] = "manage_orders";
    // Medical records permissions
    Permission["VIEW_OWN_RECORDS"] = "view_own_records";
    Permission["VIEW_PATIENT_RECORDS"] = "view_patient_records";
    Permission["EDIT_PATIENT_RECORDS"] = "edit_patient_records";
    // Analytics permissions
    Permission["VIEW_ANALYTICS"] = "view_analytics";
    // Admin permissions
    Permission["MANAGE_USERS"] = "manage_users";
    Permission["MANAGE_PHARMACY"] = "manage_pharmacy";
})(Permission || (exports.Permission = Permission = {}));
/**
 * Permission to roles mapping
 * Defines which roles have which permissions
 */
const PERMISSION_ROLES = {
    // Prescription permissions
    [Permission.CREATE_PRESCRIPTION]: [User_1.UserRole.DOCTOR],
    [Permission.UPLOAD_PRESCRIPTION]: [User_1.UserRole.PATIENT],
    [Permission.REVIEW_PRESCRIPTION]: [User_1.UserRole.PHARMACIST],
    [Permission.APPROVE_PRESCRIPTION]: [User_1.UserRole.PHARMACIST],
    [Permission.VIEW_PRESCRIPTION]: [
        User_1.UserRole.PATIENT,
        User_1.UserRole.PHARMACIST,
        User_1.UserRole.DOCTOR,
        User_1.UserRole.NURSE,
    ],
    // Teleconsultation permissions
    [Permission.BOOK_CONSULTATION]: [User_1.UserRole.PATIENT],
    [Permission.CONDUCT_CONSULTATION]: [User_1.UserRole.PHARMACIST],
    [Permission.VIEW_CONSULTATION]: [User_1.UserRole.PATIENT, User_1.UserRole.PHARMACIST],
    // Inventory permissions
    [Permission.MANAGE_INVENTORY]: [User_1.UserRole.PHARMACIST],
    [Permission.VIEW_INVENTORY]: [User_1.UserRole.PHARMACIST, User_1.UserRole.NURSE],
    [Permission.SCAN_QR_CODE]: [User_1.UserRole.PHARMACIST, User_1.UserRole.DELIVERY],
    // Delivery permissions
    [Permission.MANAGE_DELIVERIES]: [User_1.UserRole.PHARMACIST],
    [Permission.EXECUTE_DELIVERY]: [User_1.UserRole.DELIVERY],
    [Permission.TRACK_DELIVERY]: [
        User_1.UserRole.PATIENT,
        User_1.UserRole.PHARMACIST,
        User_1.UserRole.NURSE,
        User_1.UserRole.DELIVERY,
    ],
    // E-commerce permissions
    [Permission.PLACE_ORDER]: [User_1.UserRole.PATIENT, User_1.UserRole.NURSE],
    [Permission.MANAGE_ORDERS]: [User_1.UserRole.PHARMACIST],
    // Medical records permissions
    [Permission.VIEW_OWN_RECORDS]: [User_1.UserRole.PATIENT],
    [Permission.VIEW_PATIENT_RECORDS]: [
        User_1.UserRole.PHARMACIST,
        User_1.UserRole.DOCTOR,
        User_1.UserRole.NURSE,
    ],
    [Permission.EDIT_PATIENT_RECORDS]: [User_1.UserRole.PHARMACIST, User_1.UserRole.DOCTOR],
    // Analytics permissions
    [Permission.VIEW_ANALYTICS]: [User_1.UserRole.PHARMACIST],
    // Admin permissions
    [Permission.MANAGE_USERS]: [User_1.UserRole.PHARMACIST], // Pharmacy master account
    [Permission.MANAGE_PHARMACY]: [User_1.UserRole.PHARMACIST], // Pharmacy master account
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
function requireRole(allowedRoles) {
    // Normalize to array
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return (req, res, next) => {
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
function requirePermission(permission) {
    return (req, res, next) => {
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
function requireAllPermissions(permissions) {
    return (req, res, next) => {
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
            return !allowedRoles.includes(req.user.role);
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
function requireAnyPermission(permissions) {
    return (req, res, next) => {
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
            return allowedRoles.includes(req.user.role);
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
function hasPermission(role, permission) {
    const allowedRoles = PERMISSION_ROLES[permission];
    return allowedRoles.includes(role);
}
/**
 * Get all permissions for a role
 *
 * @param role - User role
 * @returns Array of permissions the role has
 */
function getPermissionsForRole(role) {
    const permissions = [];
    for (const [permission, roles] of Object.entries(PERMISSION_ROLES)) {
        if (roles.includes(role)) {
            permissions.push(permission);
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
function hasEqualOrHigherRole(roleA, roleB) {
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
function isResourceOwner(req, resourceOwnerId) {
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
function requireOwnershipOr(allowedRoles, ownershipField = 'userId') {
    return (req, res, next) => {
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
//# sourceMappingURL=rbac.js.map