/**
 * User Controller Tests
 * Tests for user management operations
 */

import { Request, Response } from 'express';
import { listUsers, createUser, updatePermissions } from '../controllers/userController';

// Mock implementations
let mockFindOne: jest.Mock;
let mockFind: jest.Mock;
let mockSave: jest.Mock;
let mockCreate: jest.Mock;
let mockCreateQueryBuilder: jest.Mock;

// Mock TypeORM
jest.mock('../index', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => ({
      findOne: mockFindOne,
      find: mockFind,
      save: mockSave,
      create: mockCreate,
      createQueryBuilder: mockCreateQueryBuilder,
    })),
  },
}));

describe('User Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    mockFindOne = jest.fn();
    mockFind = jest.fn();
    mockSave = jest.fn();
    mockCreate = jest.fn();
    mockCreateQueryBuilder = jest.fn();

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    req = {
      body: {},
      params: {},
      query: {},
      headers: {},
    } as any;

    res = {
      status: statusMock,
      json: jsonMock,
    } as any;
  });

  describe('listUsers', () => {
    it('should return 401 if no userId in request', async () => {
      (req as any).user = undefined;

      await listUsers(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
      });
    });

    it('should list users for master account', async () => {
      (req as any).user = { userId: 'master-123' };

      const mockUsers = [
        {
          id: 'user-1',
          email: 'test@example.com',
          email_verified: true,
          role: 'pharmacist',
          status: 'active',
          mfa_enabled: true,
          permissions_override: [],
          primary_pharmacy_id: null,
          created_at: new Date(),
          last_login_at: new Date(),
        },
      ];

      mockCreateQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockUsers),
      });

      await listUsers(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        users: expect.arrayContaining([
          expect.objectContaining({
            id: 'user-1',
            email: 'test@example.com',
            role: 'pharmacist',
          }),
        ]),
      });
    });
  });

  describe('createUser', () => {
    it('should return 400 for invalid input', async () => {
      (req as any).user = { userId: 'master-123' };
      req.body = { email: 'invalid-email' }; // Invalid data

      await createUser(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid request data',
        })
      );
    });

    it('should return 409 if email already exists', async () => {
      (req as any).user = { userId: 'master-123' };
      req.body = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'doctor',
      };

      mockFindOne.mockResolvedValue({ id: 'existing-user' });

      await createUser(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'User with this email already exists',
      });
    });

    it('should create new user successfully', async () => {
      (req as any).user = { userId: 'master-123' };
      req.body = {
        email: 'newuser@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'doctor',
        permissions: ['prescriptions.create', 'patients.view'],
      };

      mockFindOne.mockResolvedValue(null);
      mockCreate.mockReturnValue({ id: 'new-user-id' });
      mockSave.mockResolvedValue({ id: 'new-user-id', email: 'newuser@example.com', role: 'doctor' });

      await createUser(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        user: expect.objectContaining({
          id: 'new-user-id',
          email: 'newuser@example.com',
        }),
      });
    });
  });

  describe('updatePermissions', () => {
    it('should return 400 for invalid input', async () => {
      (req as any).user = { userId: 'master-123' };
      req.params = { id: 'user-1' };
      req.body = { permissions: 'invalid' }; // Should be array

      await updatePermissions(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 404 if user not found', async () => {
      (req as any).user = { userId: 'master-123' };
      req.params = { id: 'nonexistent' };
      req.body = { permissions: ['prescriptions.view'] };

      mockFindOne.mockResolvedValue(null);

      await updatePermissions(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
      });
    });

    it('should update permissions successfully', async () => {
      (req as any).user = { userId: 'master-123' };
      req.params = { id: 'user-1' };
      req.body = { permissions: ['prescriptions.view', 'patients.view'] };

      const mockUser = {
        id: 'user-1',
        master_account_id: 'master-123',
        permissions_override: [],
      };

      mockFindOne.mockResolvedValue(mockUser);
      mockSave.mockResolvedValue(mockUser);

      await updatePermissions(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Permissions updated successfully',
      });
    });
  });
});
