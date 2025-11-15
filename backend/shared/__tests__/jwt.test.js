"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt_1 = require("../utils/jwt");
const User_1 = require("../models/User");
describe('JWT Token Utilities', () => {
    const testUser = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        role: User_1.UserRole.PHARMACIST,
        pharmacyId: '123e4567-e89b-12d3-a456-426614174001',
    };
    describe('generateAccessToken', () => {
        it('should generate a valid JWT access token', () => {
            const token = (0, jwt_1.generateAccessToken)(testUser.userId, testUser.email, testUser.role, testUser.pharmacyId);
            expect(token).toBeTruthy();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3);
        });
        it('should include correct payload', () => {
            const token = (0, jwt_1.generateAccessToken)(testUser.userId, testUser.email, testUser.role, testUser.pharmacyId);
            const decoded = (0, jwt_1.verifyAccessToken)(token);
            expect(decoded.userId).toBe(testUser.userId);
            expect(decoded.email).toBe(testUser.email);
            expect(decoded.role).toBe(testUser.role);
            expect(decoded.pharmacyId).toBe(testUser.pharmacyId);
            expect(decoded.type).toBe(jwt_1.TokenType.ACCESS);
        });
        it('should work with null pharmacyId', () => {
            const token = (0, jwt_1.generateAccessToken)(testUser.userId, testUser.email, User_1.UserRole.PATIENT, null);
            const decoded = (0, jwt_1.verifyAccessToken)(token);
            expect(decoded.pharmacyId).toBeNull();
        });
    });
    describe('generateRefreshToken', () => {
        it('should generate a valid JWT refresh token', () => {
            const token = (0, jwt_1.generateRefreshToken)(testUser.userId, testUser.email, testUser.role, testUser.pharmacyId);
            expect(token).toBeTruthy();
            expect(typeof token).toBe('string');
        });
        it('should have refresh token type', () => {
            const token = (0, jwt_1.generateRefreshToken)(testUser.userId, testUser.email, testUser.role, testUser.pharmacyId);
            const decoded = (0, jwt_1.verifyRefreshToken)(token);
            expect(decoded.type).toBe(jwt_1.TokenType.REFRESH);
        });
    });
    describe('generateTokenPair', () => {
        it('should generate both access and refresh tokens', () => {
            const tokens = (0, jwt_1.generateTokenPair)(testUser.userId, testUser.email, testUser.role, testUser.pharmacyId);
            expect(tokens.accessToken).toBeTruthy();
            expect(tokens.refreshToken).toBeTruthy();
            expect(tokens.expiresIn).toBeGreaterThan(0);
        });
        it('should generate different access and refresh tokens', () => {
            const tokens = (0, jwt_1.generateTokenPair)(testUser.userId, testUser.email, testUser.role, testUser.pharmacyId);
            expect(tokens.accessToken).not.toBe(tokens.refreshToken);
        });
    });
    describe('verifyAccessToken', () => {
        it('should verify a valid access token', () => {
            const token = (0, jwt_1.generateAccessToken)(testUser.userId, testUser.email, testUser.role, testUser.pharmacyId);
            const decoded = (0, jwt_1.verifyAccessToken)(token);
            expect(decoded).toBeTruthy();
            expect(decoded.userId).toBe(testUser.userId);
        });
        it('should reject refresh token when expecting access token', () => {
            const refreshToken = (0, jwt_1.generateRefreshToken)(testUser.userId, testUser.email, testUser.role, testUser.pharmacyId);
            expect(() => (0, jwt_1.verifyAccessToken)(refreshToken)).toThrow('expected access token');
        });
        it('should reject invalid token', () => {
            const invalidToken = 'invalid.jwt.token';
            expect(() => (0, jwt_1.verifyAccessToken)(invalidToken)).toThrow();
        });
        it('should reject malformed token', () => {
            const malformedToken = 'not-a-jwt';
            expect(() => (0, jwt_1.verifyAccessToken)(malformedToken)).toThrow();
        });
    });
    describe('verifyRefreshToken', () => {
        it('should verify a valid refresh token', () => {
            const token = (0, jwt_1.generateRefreshToken)(testUser.userId, testUser.email, testUser.role, testUser.pharmacyId);
            const decoded = (0, jwt_1.verifyRefreshToken)(token);
            expect(decoded).toBeTruthy();
            expect(decoded.type).toBe(jwt_1.TokenType.REFRESH);
        });
        it('should reject access token when expecting refresh token', () => {
            const accessToken = (0, jwt_1.generateAccessToken)(testUser.userId, testUser.email, testUser.role, testUser.pharmacyId);
            expect(() => (0, jwt_1.verifyRefreshToken)(accessToken)).toThrow('expected refresh token');
        });
    });
    describe('extractTokenFromHeader', () => {
        it('should extract token from Bearer header', () => {
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
            const header = `Bearer ${token}`;
            const extracted = (0, jwt_1.extractTokenFromHeader)(header);
            expect(extracted).toBe(token);
        });
        it('should return null for missing header', () => {
            const extracted = (0, jwt_1.extractTokenFromHeader)(undefined);
            expect(extracted).toBeNull();
        });
        it('should return null for invalid format', () => {
            const extracted = (0, jwt_1.extractTokenFromHeader)('Invalid format');
            expect(extracted).toBeNull();
        });
        it('should return null for non-Bearer scheme', () => {
            const extracted = (0, jwt_1.extractTokenFromHeader)('Basic abcd1234');
            expect(extracted).toBeNull();
        });
    });
    describe('isTokenExpired', () => {
        it('should return false for fresh token', () => {
            const token = (0, jwt_1.generateAccessToken)(testUser.userId, testUser.email, testUser.role, testUser.pharmacyId);
            const expired = (0, jwt_1.isTokenExpired)(token);
            expect(expired).toBe(false);
        });
        it('should return true for invalid token', () => {
            const invalidToken = 'invalid.token.format';
            const expired = (0, jwt_1.isTokenExpired)(invalidToken);
            expect(expired).toBe(true);
        });
    });
    describe('getTokenTimeRemaining', () => {
        it('should return positive time for fresh token', () => {
            const token = (0, jwt_1.generateAccessToken)(testUser.userId, testUser.email, testUser.role, testUser.pharmacyId);
            const remaining = (0, jwt_1.getTokenTimeRemaining)(token);
            expect(remaining).toBeGreaterThan(0);
            expect(remaining).toBeLessThanOrEqual(3600);
        });
        it('should return 0 for invalid token', () => {
            const invalidToken = 'invalid.token';
            const remaining = (0, jwt_1.getTokenTimeRemaining)(invalidToken);
            expect(remaining).toBe(0);
        });
    });
    describe('refreshAccessToken', () => {
        it('should generate new token pair from valid refresh token', () => {
            const { refreshToken } = (0, jwt_1.generateTokenPair)(testUser.userId, testUser.email, testUser.role, testUser.pharmacyId);
            const newTokens = (0, jwt_1.refreshAccessToken)(refreshToken);
            expect(newTokens.accessToken).toBeTruthy();
            expect(newTokens.refreshToken).toBeTruthy();
            const decoded = (0, jwt_1.verifyAccessToken)(newTokens.accessToken);
            expect(decoded.userId).toBe(testUser.userId);
        });
        it('should throw error for invalid refresh token', () => {
            const invalidToken = 'invalid.refresh.token';
            expect(() => (0, jwt_1.refreshAccessToken)(invalidToken)).toThrow();
        });
    });
    describe('hasValidTokenStructure', () => {
        it('should return true for valid JWT structure', () => {
            const token = (0, jwt_1.generateAccessToken)(testUser.userId, testUser.email, testUser.role, testUser.pharmacyId);
            const isValid = (0, jwt_1.hasValidTokenStructure)(token);
            expect(isValid).toBe(true);
        });
        it('should return false for invalid structure', () => {
            const invalid = [
                '',
                'not-a-jwt',
                'only.two.parts',
                'four.parts.are.invalid',
                'invalid@chars.in.token',
            ];
            for (const token of invalid) {
                const isValid = (0, jwt_1.hasValidTokenStructure)(token);
                expect(isValid).toBe(false);
            }
        });
    });
    describe('token security', () => {
        it('should use different secrets for access and refresh tokens', () => {
            const accessToken = (0, jwt_1.generateAccessToken)(testUser.userId, testUser.email, testUser.role, testUser.pharmacyId);
            expect(() => (0, jwt_1.verifyRefreshToken)(accessToken)).toThrow();
        });
        it('should include expiration in tokens', () => {
            const token = (0, jwt_1.generateAccessToken)(testUser.userId, testUser.email, testUser.role, testUser.pharmacyId);
            const decoded = (0, jwt_1.verifyAccessToken)(token);
            expect(decoded.exp).toBeTruthy();
            expect(decoded.iat).toBeTruthy();
            expect(decoded.exp).toBeGreaterThan(decoded.iat);
        });
        it('should include issuer and audience claims', () => {
            const token = (0, jwt_1.generateAccessToken)(testUser.userId, testUser.email, testUser.role, testUser.pharmacyId);
            const decoded = (0, jwt_1.verifyAccessToken)(token);
            expect(decoded.iss).toBe('metapharm-connect');
            expect(decoded.aud).toBe('metapharm-api');
        });
    });
    describe('role-based tokens', () => {
        it('should generate tokens for all user roles', () => {
            const roles = [
                User_1.UserRole.PHARMACIST,
                User_1.UserRole.DOCTOR,
                User_1.UserRole.NURSE,
                User_1.UserRole.DELIVERY,
                User_1.UserRole.PATIENT,
            ];
            for (const role of roles) {
                const token = (0, jwt_1.generateAccessToken)(testUser.userId, testUser.email, role, testUser.pharmacyId);
                const decoded = (0, jwt_1.verifyAccessToken)(token);
                expect(decoded.role).toBe(role);
            }
        });
    });
});
//# sourceMappingURL=jwt.test.js.map