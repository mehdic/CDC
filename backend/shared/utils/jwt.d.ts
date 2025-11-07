import { UserRole } from '../models/User';
export declare enum TokenType {
    ACCESS = "access",
    REFRESH = "refresh"
}
export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
    pharmacyId: string | null;
    type: TokenType;
    iat?: number;
    exp?: number;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export declare function generateAccessToken(userId: string, email: string, role: UserRole, pharmacyId: string | null): string;
export declare function generateRefreshToken(userId: string, email: string, role: UserRole, pharmacyId: string | null): string;
export declare function generateTokenPair(userId: string, email: string, role: UserRole, pharmacyId: string | null): TokenPair;
export declare function verifyAccessToken(token: string): JWTPayload;
export declare function verifyRefreshToken(token: string): JWTPayload;
export declare function decodeTokenUnsafe(token: string): JWTPayload | null;
export declare function extractTokenFromHeader(authHeader: string | undefined): string | null;
export declare function isTokenExpired(token: string): boolean;
export declare function getTokenTimeRemaining(token: string): number;
export declare function refreshAccessToken(refreshToken: string): TokenPair;
export declare function hasValidTokenStructure(token: string): boolean;
export declare function sanitizeTokenForLogging(token: string): string;
//# sourceMappingURL=jwt.d.ts.map