/**
 * Tests for RBAC Middleware (T042)
 */

import { Request, Response, NextFunction } from 'express';
import {
  requireRole,
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  requireOwnershipOr,
  hasPermission,
  getPermissionsForRole,
  Permission,
} from '../middleware/rbac';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserRole } from '../models/User';

describe('RBAC Middleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  const pharmacistUser = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'pharmacist@test.com',
    role: UserRole.PHARMACIST,
    pharmacyId: '123e4567-e89b-12d3-a456-426614174001',
    tokenPayload: {} as any,
  };

  const patientUser = {
    userId: '223e4567-e89b-12d3-a456-426614174002',
    email: 'patient@test.com',
    role: UserRole.PATIENT,
    pharmacyId: null,
    tokenPayload: {} as any,
  };

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      headers: {},
      ip: '127.0.0.1',
      path: '/test',
      method: 'GET',
      params: {},
      body: {},
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();
  });

  describe('requireRole', () => {
    it('should allow access for users with correct role', () => {
      mockReq.user = pharmacistUser;

      const middleware = requireRole(UserRole.PHARMACIST);
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should reject users with incorrect role', () => {
      mockReq.user = patientUser;

      const middleware = requireRole(UserRole.PHARMACIST);
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'INSUFFICIENT_ROLE',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated users', () => {
      const middleware = requireRole(UserRole.PHARMACIST);
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should accept multiple roles', () => {
      mockReq.user = pharmacistUser;

      const middleware = requireRole([UserRole.PHARMACIST, UserRole.DOCTOR]);
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject when not in allowed roles list', () => {
      mockReq.user = patientUser;

      const middleware = requireRole([UserRole.PHARMACIST, UserRole.DOCTOR]);
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(403);
    });
  });

  describe('requirePermission', () => {
    it('should allow access when user has permission', () => {
      mockReq.user = pharmacistUser;

      const middleware = requirePermission(Permission.MANAGE_INVENTORY);
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject when user lacks permission', () => {
      mockReq.user = patientUser;

      const middleware = requirePermission(Permission.MANAGE_INVENTORY);
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'MISSING_PERMISSION',
        })
      );
    });

    it('should work with prescription permissions', () => {
      mockReq.user = {
        ...pharmacistUser,
        role: UserRole.DOCTOR,
      };

      const middleware = requirePermission(Permission.CREATE_PRESCRIPTION);
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireAllPermissions', () => {
    it('should allow when user has all permissions', () => {
      mockReq.user = pharmacistUser;

      const middleware = requireAllPermissions([
        Permission.MANAGE_INVENTORY,
        Permission.REVIEW_PRESCRIPTION,
      ]);

      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject when user lacks one permission', () => {
      mockReq.user = pharmacistUser;

      const middleware = requireAllPermissions([
        Permission.MANAGE_INVENTORY,
        Permission.CREATE_PRESCRIPTION, // Only doctors can do this
      ]);

      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'MISSING_PERMISSIONS',
        })
      );
    });
  });

  describe('requireAnyPermission', () => {
    it('should allow when user has at least one permission', () => {
      mockReq.user = pharmacistUser;

      const middleware = requireAnyPermission([
        Permission.MANAGE_INVENTORY,
        Permission.CREATE_PRESCRIPTION, // Doesn't have this one
      ]);

      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject when user has none of the permissions', () => {
      mockReq.user = patientUser;

      const middleware = requireAnyPermission([
        Permission.MANAGE_INVENTORY,
        Permission.CREATE_PRESCRIPTION,
      ]);

      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(403);
    });
  });

  describe('requireOwnershipOr', () => {
    it('should allow when user has allowed role', () => {
      mockReq.user = pharmacistUser;
      mockReq.params = { userId: 'different-user-id' };

      const middleware = requireOwnershipOr([UserRole.PHARMACIST]);
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow when user owns resource', () => {
      mockReq.user = patientUser;
      mockReq.params = { userId: patientUser.userId };

      const middleware = requireOwnershipOr([UserRole.PHARMACIST]);
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject when user neither owns nor has role', () => {
      mockReq.user = patientUser;
      mockReq.params = { userId: 'different-user-id' };

      const middleware = requireOwnershipOr([UserRole.PHARMACIST]);
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'NOT_OWNER',
        })
      );
    });

    it('should work with custom ownership field', () => {
      mockReq.user = patientUser;
      mockReq.params = { patientId: patientUser.userId };

      const middleware = requireOwnershipOr([UserRole.PHARMACIST], 'patientId');
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('hasPermission utility', () => {
    it('should return true when role has permission', () => {
      const result = hasPermission(UserRole.PHARMACIST, Permission.MANAGE_INVENTORY);
      expect(result).toBe(true);
    });

    it('should return false when role lacks permission', () => {
      const result = hasPermission(UserRole.PATIENT, Permission.MANAGE_INVENTORY);
      expect(result).toBe(false);
    });

    it('should correctly check all roles and permissions', () => {
      // Pharmacist can manage inventory
      expect(hasPermission(UserRole.PHARMACIST, Permission.MANAGE_INVENTORY)).toBe(true);

      // Doctor can create prescriptions
      expect(hasPermission(UserRole.DOCTOR, Permission.CREATE_PRESCRIPTION)).toBe(true);

      // Patient can upload prescriptions
      expect(hasPermission(UserRole.PATIENT, Permission.UPLOAD_PRESCRIPTION)).toBe(true);

      // Delivery can execute deliveries
      expect(hasPermission(UserRole.DELIVERY, Permission.EXECUTE_DELIVERY)).toBe(true);

      // Nurse can place orders
      expect(hasPermission(UserRole.NURSE, Permission.PLACE_ORDER)).toBe(true);
    });
  });

  describe('getPermissionsForRole utility', () => {
    it('should return all permissions for pharmacist', () => {
      const permissions = getPermissionsForRole(UserRole.PHARMACIST);

      expect(permissions).toContain(Permission.MANAGE_INVENTORY);
      expect(permissions).toContain(Permission.REVIEW_PRESCRIPTION);
      expect(permissions).toContain(Permission.APPROVE_PRESCRIPTION);
      expect(permissions.length).toBeGreaterThan(5);
    });

    it('should return limited permissions for patient', () => {
      const permissions = getPermissionsForRole(UserRole.PATIENT);

      expect(permissions).toContain(Permission.UPLOAD_PRESCRIPTION);
      expect(permissions).toContain(Permission.VIEW_OWN_RECORDS);
      expect(permissions).not.toContain(Permission.MANAGE_INVENTORY);
    });

    it('should return different permissions for each role', () => {
      const pharmacistPerms = getPermissionsForRole(UserRole.PHARMACIST);
      const doctorPerms = getPermissionsForRole(UserRole.DOCTOR);
      const patientPerms = getPermissionsForRole(UserRole.PATIENT);

      // Pharmacists and doctors have different permissions
      expect(pharmacistPerms).not.toEqual(doctorPerms);

      // Patients have fewer permissions
      expect(patientPerms.length).toBeLessThan(pharmacistPerms.length);
    });
  });

  describe('permission matrix validation', () => {
    it('should enforce principle of least privilege', () => {
      // Patients should only have minimal permissions
      const patientPerms = getPermissionsForRole(UserRole.PATIENT);

      expect(patientPerms).not.toContain(Permission.MANAGE_USERS);
      expect(patientPerms).not.toContain(Permission.MANAGE_PHARMACY);
      expect(patientPerms).not.toContain(Permission.APPROVE_PRESCRIPTION);
    });

    it('should prevent cross-role data access', () => {
      // Delivery personnel should not access medical records
      expect(hasPermission(UserRole.DELIVERY, Permission.VIEW_PATIENT_RECORDS)).toBe(false);

      // Patients should not manage inventory
      expect(hasPermission(UserRole.PATIENT, Permission.MANAGE_INVENTORY)).toBe(false);
    });

    it('should allow healthcare professionals to view patient records', () => {
      expect(hasPermission(UserRole.PHARMACIST, Permission.VIEW_PATIENT_RECORDS)).toBe(true);
      expect(hasPermission(UserRole.DOCTOR, Permission.VIEW_PATIENT_RECORDS)).toBe(true);
      expect(hasPermission(UserRole.NURSE, Permission.VIEW_PATIENT_RECORDS)).toBe(true);
    });
  });

  describe('security logging', () => {
    it('should log authorization failures', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockReq.user = patientUser;

      const middleware = requireRole(UserRole.PHARMACIST);
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log successful authorization', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

      mockReq.user = pharmacistUser;

      const middleware = requireRole(UserRole.PHARMACIST);
      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
