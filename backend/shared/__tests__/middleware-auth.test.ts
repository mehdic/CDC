/**
 * Tests for JWT Authentication Middleware (T041)
 */

import { Request, Response, NextFunction } from 'express';
import {
  authenticateJWT,
  optionalAuthenticateJWT,
  requireMFA,
  requireHINAuth,
  requirePharmacyAffiliation,
  AuthenticatedRequest,
} from '../middleware/auth';
import { generateAccessToken, generateTokenPair } from '../utils/jwt';
import { UserRole } from '../models/User';

describe('JWT Authentication Middleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  const testUser = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'pharmacist@test.com',
    role: UserRole.PHARMACIST,
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
      const token = generateAccessToken(
        testUser.userId,
        testUser.email,
        testUser.role,
        testUser.pharmacyId
      );

      mockReq.headers!.authorization = `Bearer ${token}`;

      authenticateJWT(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user!.userId).toBe(testUser.userId);
      expect(mockReq.user!.role).toBe(testUser.role);
    });

    it('should reject request with no token', () => {
      authenticateJWT(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'NO_TOKEN',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid token', () => {
      mockReq.headers!.authorization = 'Bearer invalid.token.here';

      authenticateJWT(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'INVALID_TOKEN',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject malformed Authorization header', () => {
      mockReq.headers!.authorization = 'NotBearer token123';

      authenticateJWT(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should attach all user context fields', () => {
      const token = generateAccessToken(
        testUser.userId,
        testUser.email,
        testUser.role,
        testUser.pharmacyId
      );

      mockReq.headers!.authorization = `Bearer ${token}`;

      authenticateJWT(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

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
      const token = generateAccessToken(
        testUser.userId,
        testUser.email,
        testUser.role,
        testUser.pharmacyId
      );

      mockReq.headers!.authorization = `Bearer ${token}`;

      optionalAuthenticateJWT(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
    });

    it('should proceed without authentication when no token', () => {
      optionalAuthenticateJWT(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });

    it('should proceed without authentication when invalid token', () => {
      mockReq.headers!.authorization = 'Bearer invalid.token';

      optionalAuthenticateJWT(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

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
          type: 'access' as any,
          mfaVerified: true,
        },
      };

      requireMFA(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

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
          type: 'access' as any,
        },
      };

      requireMFA(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'MFA_REQUIRED',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject when user not authenticated', () => {
      requireMFA(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

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
          type: 'access' as any,
          hinAuthenticated: true,
        },
      };

      requireHINAuth(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

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
          type: 'access' as any,
        },
      };

      requireHINAuth(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'HIN_AUTH_REQUIRED',
        })
      );
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
          type: 'access' as any,
        },
      };

      requirePharmacyAffiliation(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject when no pharmacy affiliation', () => {
      mockReq.user = {
        userId: testUser.userId,
        email: testUser.email,
        role: UserRole.PATIENT,
        pharmacyId: null,
        tokenPayload: {
          userId: testUser.userId,
          email: testUser.email,
          role: UserRole.PATIENT,
          pharmacyId: null,
          type: 'access' as any,
        },
      };

      requirePharmacyAffiliation(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'NO_PHARMACY_AFFILIATION',
        })
      );
    });
  });

  describe('middleware chaining', () => {
    it('should work with multiple middleware in sequence', () => {
      const token = generateAccessToken(
        testUser.userId,
        testUser.email,
        testUser.role,
        testUser.pharmacyId
      );

      mockReq.headers!.authorization = `Bearer ${token}`;

      // First middleware: authenticateJWT
      authenticateJWT(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockReq.user).toBeDefined();

      // Second middleware: requirePharmacyAffiliation
      const mockNext2 = jest.fn();
      requirePharmacyAffiliation(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext2
      );

      expect(mockNext2).toHaveBeenCalled();
    });
  });

  describe('security logging', () => {
    it('should log authentication failures', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockReq.headers!.authorization = 'Bearer invalid.token';

      authenticateJWT(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log successful authentication', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

      const token = generateAccessToken(
        testUser.userId,
        testUser.email,
        testUser.role,
        testUser.pharmacyId
      );

      mockReq.headers!.authorization = `Bearer ${token}`;

      authenticateJWT(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
