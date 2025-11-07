import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../utils/jwt';
import { UserRole } from '../models/User';
export interface AuthenticatedUser {
    userId: string;
    email: string;
    role: UserRole;
    pharmacyId: string | null;
    tokenPayload: JWTPayload;
}
export interface AuthenticatedRequest extends Request {
    user?: AuthenticatedUser;
}
export declare function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export declare function optionalAuthenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export declare function requireMFA(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export declare function requireHINAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export declare function requirePharmacyAffiliation(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export declare function getUserIdFromRequest(req: AuthenticatedRequest): string | null;
export declare function getPharmacyIdFromRequest(req: AuthenticatedRequest): string | null;
export declare function isAuthenticated(req: AuthenticatedRequest): boolean;
export declare function getUserRoleFromRequest(req: AuthenticatedRequest): UserRole | null;
//# sourceMappingURL=auth.d.ts.map