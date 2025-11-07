"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rbac_1 = require("../middleware/rbac");
const User_1 = require("../models/User");
describe('RBAC Middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;
    let jsonMock;
    let statusMock;
    const pharmacistUser = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'pharmacist@test.com',
        role: User_1.UserRole.PHARMACIST,
        pharmacyId: '123e4567-e89b-12d3-a456-426614174001',
        tokenPayload: {},
    };
    const patientUser = {
        userId: '223e4567-e89b-12d3-a456-426614174002',
        email: 'patient@test.com',
        role: User_1.UserRole.PATIENT,
        pharmacyId: null,
        tokenPayload: {},
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
            const middleware = (0, rbac_1.requireRole)(User_1.UserRole.PHARMACIST);
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });
        it('should reject users with incorrect role', () => {
            mockReq.user = patientUser;
            const middleware = (0, rbac_1.requireRole)(User_1.UserRole.PHARMACIST);
            middleware(mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                code: 'INSUFFICIENT_ROLE',
            }));
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should reject unauthenticated users', () => {
            const middleware = (0, rbac_1.requireRole)(User_1.UserRole.PHARMACIST);
            middleware(mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(401);
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should accept multiple roles', () => {
            mockReq.user = pharmacistUser;
            const middleware = (0, rbac_1.requireRole)([User_1.UserRole.PHARMACIST, User_1.UserRole.DOCTOR]);
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should reject when not in allowed roles list', () => {
            mockReq.user = patientUser;
            const middleware = (0, rbac_1.requireRole)([User_1.UserRole.PHARMACIST, User_1.UserRole.DOCTOR]);
            middleware(mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(403);
        });
    });
    describe('requirePermission', () => {
        it('should allow access when user has permission', () => {
            mockReq.user = pharmacistUser;
            const middleware = (0, rbac_1.requirePermission)(rbac_1.Permission.MANAGE_INVENTORY);
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should reject when user lacks permission', () => {
            mockReq.user = patientUser;
            const middleware = (0, rbac_1.requirePermission)(rbac_1.Permission.MANAGE_INVENTORY);
            middleware(mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                code: 'MISSING_PERMISSION',
            }));
        });
        it('should work with prescription permissions', () => {
            mockReq.user = {
                ...pharmacistUser,
                role: User_1.UserRole.DOCTOR,
            };
            const middleware = (0, rbac_1.requirePermission)(rbac_1.Permission.CREATE_PRESCRIPTION);
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
    });
    describe('requireAllPermissions', () => {
        it('should allow when user has all permissions', () => {
            mockReq.user = pharmacistUser;
            const middleware = (0, rbac_1.requireAllPermissions)([
                rbac_1.Permission.MANAGE_INVENTORY,
                rbac_1.Permission.REVIEW_PRESCRIPTION,
            ]);
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should reject when user lacks one permission', () => {
            mockReq.user = pharmacistUser;
            const middleware = (0, rbac_1.requireAllPermissions)([
                rbac_1.Permission.MANAGE_INVENTORY,
                rbac_1.Permission.CREATE_PRESCRIPTION,
            ]);
            middleware(mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                code: 'MISSING_PERMISSIONS',
            }));
        });
    });
    describe('requireAnyPermission', () => {
        it('should allow when user has at least one permission', () => {
            mockReq.user = pharmacistUser;
            const middleware = (0, rbac_1.requireAnyPermission)([
                rbac_1.Permission.MANAGE_INVENTORY,
                rbac_1.Permission.CREATE_PRESCRIPTION,
            ]);
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should reject when user has none of the permissions', () => {
            mockReq.user = patientUser;
            const middleware = (0, rbac_1.requireAnyPermission)([
                rbac_1.Permission.MANAGE_INVENTORY,
                rbac_1.Permission.CREATE_PRESCRIPTION,
            ]);
            middleware(mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(403);
        });
    });
    describe('requireOwnershipOr', () => {
        it('should allow when user has allowed role', () => {
            mockReq.user = pharmacistUser;
            mockReq.params = { userId: 'different-user-id' };
            const middleware = (0, rbac_1.requireOwnershipOr)([User_1.UserRole.PHARMACIST]);
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should allow when user owns resource', () => {
            mockReq.user = patientUser;
            mockReq.params = { userId: patientUser.userId };
            const middleware = (0, rbac_1.requireOwnershipOr)([User_1.UserRole.PHARMACIST]);
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should reject when user neither owns nor has role', () => {
            mockReq.user = patientUser;
            mockReq.params = { userId: 'different-user-id' };
            const middleware = (0, rbac_1.requireOwnershipOr)([User_1.UserRole.PHARMACIST]);
            middleware(mockReq, mockRes, mockNext);
            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                code: 'NOT_OWNER',
            }));
        });
        it('should work with custom ownership field', () => {
            mockReq.user = patientUser;
            mockReq.params = { patientId: patientUser.userId };
            const middleware = (0, rbac_1.requireOwnershipOr)([User_1.UserRole.PHARMACIST], 'patientId');
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
    });
    describe('hasPermission utility', () => {
        it('should return true when role has permission', () => {
            const result = (0, rbac_1.hasPermission)(User_1.UserRole.PHARMACIST, rbac_1.Permission.MANAGE_INVENTORY);
            expect(result).toBe(true);
        });
        it('should return false when role lacks permission', () => {
            const result = (0, rbac_1.hasPermission)(User_1.UserRole.PATIENT, rbac_1.Permission.MANAGE_INVENTORY);
            expect(result).toBe(false);
        });
        it('should correctly check all roles and permissions', () => {
            expect((0, rbac_1.hasPermission)(User_1.UserRole.PHARMACIST, rbac_1.Permission.MANAGE_INVENTORY)).toBe(true);
            expect((0, rbac_1.hasPermission)(User_1.UserRole.DOCTOR, rbac_1.Permission.CREATE_PRESCRIPTION)).toBe(true);
            expect((0, rbac_1.hasPermission)(User_1.UserRole.PATIENT, rbac_1.Permission.UPLOAD_PRESCRIPTION)).toBe(true);
            expect((0, rbac_1.hasPermission)(User_1.UserRole.DELIVERY, rbac_1.Permission.EXECUTE_DELIVERY)).toBe(true);
            expect((0, rbac_1.hasPermission)(User_1.UserRole.NURSE, rbac_1.Permission.PLACE_ORDER)).toBe(true);
        });
    });
    describe('getPermissionsForRole utility', () => {
        it('should return all permissions for pharmacist', () => {
            const permissions = (0, rbac_1.getPermissionsForRole)(User_1.UserRole.PHARMACIST);
            expect(permissions).toContain(rbac_1.Permission.MANAGE_INVENTORY);
            expect(permissions).toContain(rbac_1.Permission.REVIEW_PRESCRIPTION);
            expect(permissions).toContain(rbac_1.Permission.APPROVE_PRESCRIPTION);
            expect(permissions.length).toBeGreaterThan(5);
        });
        it('should return limited permissions for patient', () => {
            const permissions = (0, rbac_1.getPermissionsForRole)(User_1.UserRole.PATIENT);
            expect(permissions).toContain(rbac_1.Permission.UPLOAD_PRESCRIPTION);
            expect(permissions).toContain(rbac_1.Permission.VIEW_OWN_RECORDS);
            expect(permissions).not.toContain(rbac_1.Permission.MANAGE_INVENTORY);
        });
        it('should return different permissions for each role', () => {
            const pharmacistPerms = (0, rbac_1.getPermissionsForRole)(User_1.UserRole.PHARMACIST);
            const doctorPerms = (0, rbac_1.getPermissionsForRole)(User_1.UserRole.DOCTOR);
            const patientPerms = (0, rbac_1.getPermissionsForRole)(User_1.UserRole.PATIENT);
            expect(pharmacistPerms).not.toEqual(doctorPerms);
            expect(patientPerms.length).toBeLessThan(pharmacistPerms.length);
        });
    });
    describe('permission matrix validation', () => {
        it('should enforce principle of least privilege', () => {
            const patientPerms = (0, rbac_1.getPermissionsForRole)(User_1.UserRole.PATIENT);
            expect(patientPerms).not.toContain(rbac_1.Permission.MANAGE_USERS);
            expect(patientPerms).not.toContain(rbac_1.Permission.MANAGE_PHARMACY);
            expect(patientPerms).not.toContain(rbac_1.Permission.APPROVE_PRESCRIPTION);
        });
        it('should prevent cross-role data access', () => {
            expect((0, rbac_1.hasPermission)(User_1.UserRole.DELIVERY, rbac_1.Permission.VIEW_PATIENT_RECORDS)).toBe(false);
            expect((0, rbac_1.hasPermission)(User_1.UserRole.PATIENT, rbac_1.Permission.MANAGE_INVENTORY)).toBe(false);
        });
        it('should allow healthcare professionals to view patient records', () => {
            expect((0, rbac_1.hasPermission)(User_1.UserRole.PHARMACIST, rbac_1.Permission.VIEW_PATIENT_RECORDS)).toBe(true);
            expect((0, rbac_1.hasPermission)(User_1.UserRole.DOCTOR, rbac_1.Permission.VIEW_PATIENT_RECORDS)).toBe(true);
            expect((0, rbac_1.hasPermission)(User_1.UserRole.NURSE, rbac_1.Permission.VIEW_PATIENT_RECORDS)).toBe(true);
        });
    });
    describe('security logging', () => {
        it('should log authorization failures', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            mockReq.user = patientUser;
            const middleware = (0, rbac_1.requireRole)(User_1.UserRole.PHARMACIST);
            middleware(mockReq, mockRes, mockNext);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
        it('should log successful authorization', () => {
            const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
            mockReq.user = pharmacistUser;
            const middleware = (0, rbac_1.requireRole)(User_1.UserRole.PHARMACIST);
            middleware(mockReq, mockRes, mockNext);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
//# sourceMappingURL=middleware-rbac.test.js.map