/**
 * Roles Routes
 * Handles role and permission management
 */

import { Router, Request, Response } from 'express';
import { AppDataSource } from '../index';
import { RolePermission } from '@models/RolePermission';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware
router.use(authenticateToken);

// ============================================================================
// GET /account/roles
// List all available roles with permissions
// ============================================================================

router.get('/roles', async (req: Request, res: Response) => {
  try {
    const roleRepository = AppDataSource.getRepository(RolePermission);
    const roles = await roleRepository.find();

    const rolesResponse = roles.map(role => ({
      id: role.id,
      role: role.role,
      displayName: role.display_name,
      description: role.description,
      permissions: role.permissions,
      createdAt: role.created_at,
    }));

    return res.status(200).json({
      success: true,
      roles: rolesResponse,
    });
  } catch (error) {
    console.error('List roles error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to list roles',
    });
  }
});

export default router;
