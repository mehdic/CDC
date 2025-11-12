/**
 * User Controller
 * Handles user management operations (CRUD, permissions)
 */

import { Request, Response } from 'express';
import { AppDataSource } from '../index';
import { User, UserStatus } from '@models/User';
import { AuditLog } from '@models/AuditLog';
import { z } from 'zod';

// ============================================================================
// Validation Schemas
// ============================================================================

const CreateUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['pharmacist', 'doctor', 'nurse', 'delivery', 'patient']),
  permissions: z.array(z.string()).optional(),
});

const UpdatePermissionsSchema = z.object({
  permissions: z.array(z.string()),
});

// ============================================================================
// GET /account/users
// List all users for master account
// ============================================================================

export async function listUsers(req: Request, res: Response) {
  try {
    const userRepository = AppDataSource.getRepository(User);

    // Get current user from auth token (added by auth middleware)
    const currentUserId = (req as any).user?.userId;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Fetch all users for this master account
    const users = await userRepository.createQueryBuilder('user')
      .where('user.master_account_id = :masterId OR user.id = :masterId', {
        masterId: currentUserId,
      })
      .select([
        'user.id',
        'user.email',
        'user.email_verified',
        'user.role',
        'user.status',
        'user.mfa_enabled',
        'user.permissions_override',
        'user.primary_pharmacy_id',
        'user.created_at',
        'user.last_login_at',
      ])
      .getMany();

    // Transform response (can't decrypt encrypted fields here without AWS KMS)
    const usersResponse = users.map(user => ({
      id: user.id,
      email: user.email,
      emailVerified: user.email_verified,
      firstName: '[Encrypted]', // Would decrypt with AWS KMS in production
      lastName: '[Encrypted]',
      role: user.role,
      status: user.status,
      mfaEnabled: user.mfa_enabled,
      permissions: user.permissions_override || [],
      primaryPharmacyId: user.primary_pharmacy_id,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
    }));

    return res.status(200).json({
      success: true,
      users: usersResponse,
    });
  } catch (error) {
    console.error('List users error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to list users',
    });
  }
}

// ============================================================================
// POST /account/users/create
// Create new user
// ============================================================================

export async function createUser(req: Request, res: Response) {
  try {
    // Validate request body
    const validation = CreateUserSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.issues,
      });
    }

    const { email, firstName, lastName, role, permissions } = validation.data;

    // Get current user from auth token
    const currentUserId = (req as any).user?.userId;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const userRepository = AppDataSource.getRepository(User);

    // Check if email already exists
    const existingUser = await userRepository.findOne({ where: { email } });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    // In production, would encrypt firstName/lastName with AWS KMS
    // For now, storing as mock encrypted buffers
    const firstNameBuffer = Buffer.from(firstName, 'utf-8');
    const lastNameBuffer = Buffer.from(lastName, 'utf-8');

    // Create new user
    const newUser = userRepository.create({
      email,
      email_verified: false,
      first_name_encrypted: firstNameBuffer,
      last_name_encrypted: lastNameBuffer,
      role: role as any,
      status: UserStatus.ACTIVE,
      mfa_enabled: false,
      master_account_id: currentUserId,
      primary_pharmacy_id: null,
      permissions_override: permissions ? JSON.stringify(permissions) : null,
    });

    await userRepository.save(newUser);

    // Log audit entry
    await logAudit(
      currentUserId,
      'user.created',
      'user',
      newUser.id,
      {
        email,
        role,
        permissions,
      },
      req
    );

    return res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName,
        lastName,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create user',
    });
  }
}

// ============================================================================
// PUT /account/users/:id/permissions
// Update user permissions
// ============================================================================

export async function updatePermissions(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Validate request body
    const validation = UpdatePermissionsSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.issues,
      });
    }

    const { permissions } = validation.data;

    // Get current user from auth token
    const currentUserId = (req as any).user?.userId;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const userRepository = AppDataSource.getRepository(User);

    // Find user to update
    const user = await userRepository.findOne({ where: { id } });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check authorization (can only update sub-accounts)
    if (user.master_account_id !== currentUserId && user.id !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Can only update your own sub-accounts',
      });
    }

    // Update permissions
    user.permissions_override = JSON.stringify(permissions);
    await userRepository.save(user);

    // Log audit entry
    await logAudit(
      currentUserId,
      'permission.updated',
      'user',
      user.id,
      {
        userId: id,
        permissions,
      },
      req
    );

    return res.status(200).json({
      success: true,
      message: 'Permissions updated successfully',
    });
  } catch (error) {
    console.error('Update permissions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update permissions',
    });
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function logAudit(
  userId: string,
  action: string,
  resource: string,
  resourceId: string,
  details: any,
  req: Request
) {
  try {
    const auditRepository = AppDataSource.getRepository(AuditLog);

    const auditEntry = auditRepository.create({
      user_id: userId,
      action,
      resource,
      resource_id: resourceId,
      details,
      ip_address: req.ip || (req.socket as any).remoteAddress || 'unknown',
      user_agent: req.headers['user-agent'] || 'unknown',
    });

    await auditRepository.save(auditEntry);
  } catch (error) {
    console.error('Failed to create audit entry:', error);
  }
}
