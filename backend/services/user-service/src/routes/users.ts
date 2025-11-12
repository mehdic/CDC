/**
 * User Routes
 * Handles user management endpoints
 */

import { Router } from 'express';
import { listUsers, createUser, updatePermissions } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';
import { auditMiddleware } from '../middleware/audit';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Apply audit logging middleware
router.use(auditMiddleware);

// ============================================================================
// User Management Endpoints
// ============================================================================

// GET /account/users - List all users
router.get('/users', listUsers);

// POST /account/users/create - Create new user
router.post('/users/create', createUser);

// PUT /account/users/:id/permissions - Update user permissions
router.put('/users/:id/permissions', updatePermissions);

export default router;
