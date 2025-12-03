/**
 * Account Hierarchy API Routes (T6-009)
 * RESTful endpoints for pharmacy account management
 * Security: JWT authentication, RBAC enforcement, tenant isolation
 */

import { Router, Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { AccountHierarchyService } from '../services/AccountHierarchyService';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import { requirePermission, Permission } from '../middleware/rbac';
import { validate } from '../middleware/validateInput';
import { body, param, query } from 'express-validator';

export function createAccountHierarchyRouter(dataSource: DataSource): Router {
  const router = Router();
  const service = new AccountHierarchyService(dataSource);

  // ============================================================================
  // POST /api/v1/accounts/master - Create Master Account
  // ============================================================================

  router.post(
    '/master',
    authenticateJWT,
    requirePermission(Permission.MANAGE_PHARMACY),
    validate([
      body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Name is required (1-255 chars)'),
      body('pharmacy_id').isUUID().withMessage('Valid pharmacy_id is required'),
      body('data_sharing_mode').optional().isIn(['isolated', 'shared_products', 'shared_pricing', 'full_shared']),
      body('cross_account_reporting_enabled').optional().isBoolean(),
    ]),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const account = await service.createMasterAccount({
          name: req.body.name,
          pharmacy_id: req.body.pharmacy_id,
          created_by_user_id: req.user!.userId,
          data_sharing_mode: req.body.data_sharing_mode,
          cross_account_reporting_enabled: req.body.cross_account_reporting_enabled,
        });

        res.status(201).json({
          success: true,
          data: account,
          message: 'Master account created successfully',
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ============================================================================
  // GET /api/v1/accounts/master/:id - Get Master Account
  // ============================================================================

  router.get(
    '/master/:id',
    authenticateJWT,
    validate([param('id').isUUID().withMessage('Valid account ID is required')]),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const account = await service.getAccount(req.params.id);

        if (!account) {
          return res.status(404).json({
            success: false,
            message: 'Account not found',
          });
        }

        if (!account.isMaster()) {
          return res.status(400).json({
            success: false,
            message: 'Account is not a master account',
          });
        }

        res.json({
          success: true,
          data: account,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ============================================================================
  // POST /api/v1/accounts/master/:id/sub-accounts - Create Sub-Account
  // ============================================================================

  router.post(
    '/master/:id/sub-accounts',
    authenticateJWT,
    requirePermission(Permission.MANAGE_PHARMACY),
    validate([
      param('id').isUUID().withMessage('Valid parent account ID is required'),
      body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Name is required (1-255 chars)'),
      body('pharmacy_id').isUUID().withMessage('Valid pharmacy_id is required'),
      body('data_sharing_mode').optional().isIn(['isolated', 'shared_products', 'shared_pricing', 'full_shared']),
    ]),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const subAccount = await service.createSubAccount({
          name: req.body.name,
          pharmacy_id: req.body.pharmacy_id,
          parent_id: req.params.id,
          created_by_user_id: req.user!.userId,
          data_sharing_mode: req.body.data_sharing_mode,
        });

        res.status(201).json({
          success: true,
          data: subAccount,
          message: 'Sub-account created successfully',
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ============================================================================
  // GET /api/v1/accounts/master/:id/sub-accounts - List Sub-Accounts
  // ============================================================================

  router.get(
    '/master/:id/sub-accounts',
    authenticateJWT,
    validate([param('id').isUUID().withMessage('Valid account ID is required')]),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const subAccounts = await service.getSubAccounts(req.params.id);

        res.json({
          success: true,
          data: subAccounts,
          count: subAccounts.length,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ============================================================================
  // PUT /api/v1/accounts/:id - Update Account
  // ============================================================================

  router.put(
    '/:id',
    authenticateJWT,
    requirePermission(Permission.MANAGE_PHARMACY),
    validate([
      param('id').isUUID().withMessage('Valid account ID is required'),
      body('name').optional().trim().isLength({ min: 1, max: 255 }),
      body('status').optional().isIn(['active', 'inactive', 'suspended', 'pending_transfer']),
      body('data_sharing_mode').optional().isIn(['isolated', 'shared_products', 'shared_pricing', 'full_shared']),
      body('cross_account_reporting_enabled').optional().isBoolean(),
    ]),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const updated = await service.updateAccount(req.params.id, req.body, req.user!.userId);

        res.json({
          success: true,
          data: updated,
          message: 'Account updated successfully',
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ============================================================================
  // DELETE /api/v1/accounts/:id - Delete Account (Soft Delete)
  // ============================================================================

  router.delete(
    '/:id',
    authenticateJWT,
    requirePermission(Permission.MANAGE_PHARMACY),
    validate([param('id').isUUID().withMessage('Valid account ID is required')]),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        await service.deleteAccount(req.params.id, req.user!.userId);

        res.json({
          success: true,
          message: 'Account deleted successfully',
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ============================================================================
  // POST /api/v1/accounts/:id/transfer - Initiate Account Transfer
  // ============================================================================

  router.post(
    '/:id/transfer',
    authenticateJWT,
    requirePermission(Permission.MANAGE_PHARMACY),
    validate([
      param('id').isUUID().withMessage('Valid account ID is required'),
      body('target_parent_id').isUUID().withMessage('Valid target parent ID is required'),
    ]),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const updated = await service.initiateTransfer({
          account_id: req.params.id,
          target_parent_id: req.body.target_parent_id,
          requested_by_user_id: req.user!.userId,
        });

        res.json({
          success: true,
          data: updated,
          message: 'Transfer initiated successfully',
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ============================================================================
  // GET /api/v1/accounts/:id/permissions - Get Account Permissions
  // ============================================================================

  router.get(
    '/:id/permissions',
    authenticateJWT,
    validate([param('id').isUUID().withMessage('Valid account ID is required')]),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const account = await service.getAccount(req.params.id);

        if (!account) {
          return res.status(404).json({
            success: false,
            message: 'Account not found',
          });
        }

        res.json({
          success: true,
          data: {
            account_id: account.id,
            roles: account.roles,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ============================================================================
  // PUT /api/v1/accounts/:id/permissions - Update Account Permissions (Future)
  // ============================================================================

  router.put(
    '/:id/permissions',
    authenticateJWT,
    requirePermission(Permission.MANAGE_PHARMACY),
    validate([
      param('id').isUUID().withMessage('Valid account ID is required'),
      body('role_id').isUUID().withMessage('Valid role ID is required'),
      body('permissions').isObject().withMessage('Permissions must be an object'),
    ]),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        // TODO: Implement role permission updates in AccountHierarchyService
        res.status(501).json({
          success: false,
          message: 'Permission updates not yet implemented',
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
