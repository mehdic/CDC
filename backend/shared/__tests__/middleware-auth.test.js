"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../middleware/auth");
const jwt_1 = require("../utils/jwt");
const User_1 = require("../models/User");
describe('JWT Authentication Middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;
    let jsonMock;
    let statusMock;
    const testUser = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'pharmacist@test.com',
        role: User_1.UserRole.PHARMACIST,
        pharmacyId: '123e4567-e89b-12d3-a456-426614174001',
    };
    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockReq = {
            headers: {},
            ip: '127.0.0.1',
            path: '/test',
            method: 'GET',
        };
        mockRes = {
            status: statusMock,
            json: jsonMock,
        };
        mockNext = jest.fn();
    });
    describe('authenticateJWT', () => {
        it('should authenticate valid token and attach user to request', () => {
            const token = (0, jwt_1.generateAccessToken)(testUser.userId, testUser.email, testUser.role, testUser.pharmacyId);
            mockReq.headers.authorization = `Bearer ${token}`;
            (0, auth_1.authenticateJWT)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user).toBeDefined();
            expect(mockReq.user.userId).toBe(testUser.userId);
            expect(mockReq.user.role).toBe(testUser.role);
        });
        it('should reject request with no token', () => {
            (0, auth_1.authenticateJWT)(mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                code: 'NO_TOKEN',
            }));
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should reject invalid token', () => {
            mockReq.headers.authorization = 'Bearer invalid.token.here';
            (0, auth_1.authenticateJWT)(mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                code: 'INVALID_TOKEN',
            }));
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should reject malformed Authorization header', () => {
            mockReq.headers.authorization = 'NotBearer token123';
            (0, auth_1.authenticateJWT)(mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(401);
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should attach all user context fields', () => {
            const token = (0, jwt_1.generateAccessToken)(testUser.userId, testUser.email, testUser.role, testUser.pharmacyId);
            mockReq.headers.authorization = `Bearer ${token}`;
            (0, auth_1.authenticateJWT)(mockReq, mockRes, mockNext);
            expect(mockReq.user).toMatchObject({
                userId: testUser.userId,
                email: testUser.email,
                role: testUser.role,
                pharmacyId: testUser.pharmacyId,
            });
        });
    });
    describe('optionalAuthenticateJWT', () => {
        it('should authenticate when valid token provided', () => {
            const token = (0, jwt_1.generateAccessToken)(testUser.userId, testUser.email, testUser.role, testUser.pharmacyId);
            mockReq.headers.authorization = `Bearer ${token}`;
            (0, auth_1.optionalAuthenticateJWT)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user).toBeDefined();
        });
        it('should proceed without authentication when no token', () => {
            (0, auth_1.optionalAuthenticateJWT)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user).toBeUndefined();
        });
        it('should proceed without authentication when invalid token', () => {
            mockReq.headers.authorization = 'Bearer invalid.token';
            (0, auth_1.optionalAuthenticateJWT)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user).toBeUndefined();
        });
    });
    describe('requireMFA', () => {
        it('should allow request when MFA verified', () => {
            mockReq.user = {
                ...testUser,
                tokenPayload: {
                    userId: testUser.userId,
                    email: testUser.email,
                    role: testUser.role,
                    pharmacyId: testUser.pharmacyId,
                    type: 'access',
                    mfaVerified: true,
                },
            };
            (0, auth_1.requireMFA)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should reject when MFA not verified', () => {
            mockReq.user = {
                ...testUser,
                tokenPayload: {
                    userId: testUser.userId,
                    email: testUser.email,
                    role: testUser.role,
                    pharmacyId: testUser.pharmacyId,
                    type: 'access',
                },
            };
            (0, auth_1.requireMFA)(mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                code: 'MFA_REQUIRED',
            }));
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should reject when user not authenticated', () => {
            (0, auth_1.requireMFA)(mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(401);
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
    describe('requireHINAuth', () => {
        it('should allow request when HIN authenticated', () => {
            mockReq.user = {
                ...testUser,
                tokenPayload: {
                    userId: testUser.userId,
                    email: testUser.email,
                    role: testUser.role,
                    pharmacyId: testUser.pharmacyId,
                    type: 'access',
                    hinAuthenticated: true,
                },
            };
            (0, auth_1.requireHINAuth)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should reject when HIN not authenticated', () => {
            mockReq.user = {
                ...testUser,
                tokenPayload: {
                    userId: testUser.userId,
                    email: testUser.email,
                    role: testUser.role,
                    pharmacyId: testUser.pharmacyId,
                    type: 'access',
                },
            };
            (0, auth_1.requireHINAuth)(mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                code: 'HIN_AUTH_REQUIRED',
            }));
        });
    });
    describe('requirePharmacyAffiliation', () => {
        it('should allow request when pharmacy affiliated', () => {
            mockReq.user = {
                ...testUser,
                tokenPayload: {
                    userId: testUser.userId,
                    email: testUser.email,
                    role: testUser.role,
                    pharmacyId: testUser.pharmacyId,
                    type: 'access',
                },
            };
            (0, auth_1.requirePharmacyAffiliation)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should reject when no pharmacy affiliation', () => {
            mockReq.user = {
                userId: testUser.userId,
                email: testUser.email,
                role: User_1.UserRole.PATIENT,
                pharmacyId: null,
                tokenPayload: {
                    userId: testUser.userId,
                    email: testUser.email,
                    role: User_1.UserRole.PATIENT,
                    pharmacyId: null,
                    type: 'access',
                },
            };
            (0, auth_1.requirePharmacyAffiliation)(mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                code: 'NO_PHARMACY_AFFILIATION',
            }));
        });
    });
    describe('middleware chaining', () => {
        it('should work with multiple middleware in sequence', () => {
            const token = (0, jwt_1.generateAccessToken)(testUser.userId, testUser.email, testUser.role, testUser.pharmacyId);
            mockReq.headers.authorization = `Bearer ${token}`;
            (0, auth_1.authenticateJWT)(mockReq, mockRes, mockNext);
            expect(mockReq.user).toBeDefined();
            const mockNext2 = jest.fn();
            (0, auth_1.requirePharmacyAffiliation)(mockReq, mockRes, mockNext2);
            expect(mockNext2).toHaveBeenCalled();
        });
    });
    describe('security logging', () => {
        it('should log authentication failures', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            mockReq.headers.authorization = 'Bearer invalid.token';
            (0, auth_1.authenticateJWT)(mockReq, mockRes, mockNext);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
        it('should log successful authentication', () => {
            const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
            const token = (0, jwt_1.generateAccessToken)(testUser.userId, testUser.email, testUser.role, testUser.pharmacyId);
            mockReq.headers.authorization = `Bearer ${token}`;
            (0, auth_1.authenticateJWT)(mockReq, mockRes, mockNext);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
//# sourceMappingURL=middleware-auth.test.js.map