"use strict";
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
const ROLE_HIERARCHY = {
    [User_1.UserRole.PATIENT]: 1,
    [User_1.UserRole.DELIVERY]: 2,
    [User_1.UserRole.NURSE]: 3,
    [User_1.UserRole.PHARMACIST]: 4,
    [User_1.UserRole.DOCTOR]: 4,
};
var Permission;
(function (Permission) {
    Permission["CREATE_PRESCRIPTION"] = "create_prescription";
    Permission["UPLOAD_PRESCRIPTION"] = "upload_prescription";
    Permission["REVIEW_PRESCRIPTION"] = "review_prescription";
    Permission["APPROVE_PRESCRIPTION"] = "approve_prescription";
    Permission["VIEW_PRESCRIPTION"] = "view_prescription";
    Permission["BOOK_CONSULTATION"] = "book_consultation";
    Permission["CONDUCT_CONSULTATION"] = "conduct_consultation";
    Permission["VIEW_CONSULTATION"] = "view_consultation";
    Permission["MANAGE_INVENTORY"] = "manage_inventory";
    Permission["VIEW_INVENTORY"] = "view_inventory";
    Permission["SCAN_QR_CODE"] = "scan_qr_code";
    Permission["MANAGE_DELIVERIES"] = "manage_deliveries";
    Permission["EXECUTE_DELIVERY"] = "execute_delivery";
    Permission["TRACK_DELIVERY"] = "track_delivery";
    Permission["PLACE_ORDER"] = "place_order";
    Permission["MANAGE_ORDERS"] = "manage_orders";
    Permission["VIEW_OWN_RECORDS"] = "view_own_records";
    Permission["VIEW_PATIENT_RECORDS"] = "view_patient_records";
    Permission["EDIT_PATIENT_RECORDS"] = "edit_patient_records";
    Permission["VIEW_ANALYTICS"] = "view_analytics";
    Permission["MANAGE_USERS"] = "manage_users";
    Permission["MANAGE_PHARMACY"] = "manage_pharmacy";
})(Permission || (exports.Permission = Permission = {}));
const PERMISSION_ROLES = {
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
    [Permission.BOOK_CONSULTATION]: [User_1.UserRole.PATIENT],
    [Permission.CONDUCT_CONSULTATION]: [User_1.UserRole.PHARMACIST],
    [Permission.VIEW_CONSULTATION]: [User_1.UserRole.PATIENT, User_1.UserRole.PHARMACIST],
    [Permission.MANAGE_INVENTORY]: [User_1.UserRole.PHARMACIST],
    [Permission.VIEW_INVENTORY]: [User_1.UserRole.PHARMACIST, User_1.UserRole.NURSE],
    [Permission.SCAN_QR_CODE]: [User_1.UserRole.PHARMACIST, User_1.UserRole.DELIVERY],
    [Permission.MANAGE_DELIVERIES]: [User_1.UserRole.PHARMACIST],
    [Permission.EXECUTE_DELIVERY]: [User_1.UserRole.DELIVERY],
    [Permission.TRACK_DELIVERY]: [
        User_1.UserRole.PATIENT,
        User_1.UserRole.PHARMACIST,
        User_1.UserRole.NURSE,
        User_1.UserRole.DELIVERY,
    ],
    [Permission.PLACE_ORDER]: [User_1.UserRole.PATIENT, User_1.UserRole.NURSE],
    [Permission.MANAGE_ORDERS]: [User_1.UserRole.PHARMACIST],
    [Permission.VIEW_OWN_RECORDS]: [User_1.UserRole.PATIENT],
    [Permission.VIEW_PATIENT_RECORDS]: [
        User_1.UserRole.PHARMACIST,
        User_1.UserRole.DOCTOR,
        User_1.UserRole.NURSE,
    ],
    [Permission.EDIT_PATIENT_RECORDS]: [User_1.UserRole.PHARMACIST, User_1.UserRole.DOCTOR],
    [Permission.VIEW_ANALYTICS]: [User_1.UserRole.PHARMACIST],
    [Permission.MANAGE_USERS]: [User_1.UserRole.PHARMACIST],
    [Permission.MANAGE_PHARMACY]: [User_1.UserRole.PHARMACIST],
};
function requireRole(allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return (req, res, next) => {
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
        console.info('Authorization successful', {
            userId: req.user.userId,
            role: req.user.role,
            path: req.path,
            method: req.method,
        });
        next();
    };
}
function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
                code: 'NO_AUTH',
            });
            return;
        }
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
function hasPermission(role, permission) {
    const allowedRoles = PERMISSION_ROLES[permission];
    return allowedRoles.includes(role);
}
function getPermissionsForRole(role) {
    const permissions = [];
    for (const [permission, roles] of Object.entries(PERMISSION_ROLES)) {
        if (roles.includes(role)) {
            permissions.push(permission);
        }
    }
    return permissions;
}
function hasEqualOrHigherRole(roleA, roleB) {
    return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB];
}
function isResourceOwner(req, resourceOwnerId) {
    if (!req.user) {
        return false;
    }
    return req.user.userId === resourceOwnerId;
}
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
        if (allowedRoles.includes(req.user.role)) {
            next();
            return;
        }
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