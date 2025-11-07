import { Response, NextFunction } from 'express';
import { UserRole } from '../models/User';
import { AuthenticatedRequest } from './auth';
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
export declare function requireRole(allowedRoles: UserRole | UserRole[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare function requirePermission(permission: Permission): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare function requireAllPermissions(permissions: Permission[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare function requireAnyPermission(permissions: Permission[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare function hasPermission(role: UserRole, permission: Permission): boolean;
export declare function getPermissionsForRole(role: UserRole): Permission[];
export declare function hasEqualOrHigherRole(roleA: UserRole, roleB: UserRole): boolean;
export declare function isResourceOwner(req: AuthenticatedRequest, resourceOwnerId: string): boolean;
export declare function requireOwnershipOr(allowedRoles: UserRole[], ownershipField?: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=rbac.d.ts.map