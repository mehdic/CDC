/**
 * Master Account Routes
 * RESTful API endpoints for pharmacy master account management
 * Handles sub-account creation, permissions override, and account administration
 */

import { Router, Request, Response } from 'express';
import { MasterAccountController } from '../controllers/masterAccountController';
import { authenticateJWT, AuthenticatedRequest } from '@shared/middleware/auth';
import { requireRole } from '@shared/middleware/rbac';
import { UserRole, UserStatus } from '@shared/models/User';

const router = Router();
const masterAccountController = new MasterAccountController();

/**
 * @route   POST /master-accounts/sub-accounts
 * @desc    Create sub-account for master pharmacy
 * @access  Private - Pharmacist (master account) only
 */
router.post(
  '/sub-accounts',
  authenticateJWT,
  requireRole(UserRole.PHARMACIST),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        email,
        password_hash,
        first_name_encrypted,
        last_name_encrypted,
        phone_encrypted,
        role,
        permissions_override,
        primary_pharmacy_id,
      } = req.body;

      // Validation
      if (!email || !password_hash || !first_name_encrypted || !last_name_encrypted || !role) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'email, password_hash, first_name_encrypted, last_name_encrypted, and role are required',
        });
      }

      // Verify user is a master account
      const isMaster = await masterAccountController.isMasterAccount(req.user!.userId);

      if (!isMaster) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only master accounts can create sub-accounts',
        });
      }

      const subAccount = await masterAccountController.createSubAccount({
        master_account_id: req.user!.userId,
        email,
        password_hash,
        first_name_encrypted: Buffer.from(first_name_encrypted, 'base64'),
        last_name_encrypted: Buffer.from(last_name_encrypted, 'base64'),
        phone_encrypted: phone_encrypted ? Buffer.from(phone_encrypted, 'base64') : undefined,
        role,
        permissions_override,
        primary_pharmacy_id,
      });

      res.status(201).json({
        message: 'Sub-account created successfully',
        sub_account: {
          id: subAccount.id,
          email: subAccount.email,
          role: subAccount.role,
          status: subAccount.status,
          permissions_override: subAccount.permissions_override,
          created_at: subAccount.created_at,
        },
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (
        errorMessage === 'Master account not found' ||
        errorMessage === 'Master account must be a pharmacist' ||
        errorMessage === 'Master account must be active' ||
        errorMessage === 'Email already in use'
      ) {
        return res.status(400).json({
          error: 'Bad Request',
          message: errorMessage,
        });
      }

      console.error('Error creating sub-account:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create sub-account',
      });
    }
  }
);

/**
 * @route   GET /master-accounts/sub-accounts
 * @desc    List all sub-accounts for master pharmacy
 * @access  Private - Pharmacist (master account) only
 */
router.get(
  '/sub-accounts',
  authenticateJWT,
  requireRole(UserRole.PHARMACIST),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Verify user is a master account
      const isMaster = await masterAccountController.isMasterAccount(req.user!.userId);

      if (!isMaster) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only master accounts can list sub-accounts',
        });
      }

      const subAccounts = await masterAccountController.getSubAccounts(req.user!.userId);

      res.status(200).json({
        sub_accounts: subAccounts.map((subAccount) => ({
          id: subAccount.id,
          email: subAccount.email,
          role: subAccount.role,
          status: subAccount.status,
          permissions_override: subAccount.permissions_override,
          created_at: subAccount.created_at,
          last_login_at: subAccount.last_login_at,
        })),
        total: subAccounts.length,
      });
    } catch (error) {
      console.error('Error fetching sub-accounts:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch sub-accounts',
      });
    }
  }
);

/**
 * @route   GET /master-accounts/sub-accounts/:id
 * @desc    Get sub-account by ID
 * @access  Private - Pharmacist (master account) only
 */
router.get(
  '/sub-accounts/:id',
  authenticateJWT,
  requireRole(UserRole.PHARMACIST),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Verify user is a master account
      const isMaster = await masterAccountController.isMasterAccount(req.user!.userId);

      if (!isMaster) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only master accounts can view sub-accounts',
        });
      }

      const subAccount = await masterAccountController.getSubAccountById(id, req.user!.userId);

      res.status(200).json({
        sub_account: {
          id: subAccount.id,
          email: subAccount.email,
          role: subAccount.role,
          status: subAccount.status,
          permissions_override: subAccount.permissions_override,
          primary_pharmacy_id: subAccount.primary_pharmacy_id,
          created_at: subAccount.created_at,
          updated_at: subAccount.updated_at,
          last_login_at: subAccount.last_login_at,
        },
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === 'Sub-account not found or unauthorized') {
        return res.status(404).json({
          error: 'Not Found',
          message: errorMessage,
        });
      }

      console.error('Error fetching sub-account:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch sub-account',
      });
    }
  }
);

/**
 * @route   PUT /master-accounts/sub-accounts/:id/permissions
 * @desc    Update sub-account permissions
 * @access  Private - Pharmacist (master account) only
 */
router.put(
  '/sub-accounts/:id/permissions',
  authenticateJWT,
  requireRole(UserRole.PHARMACIST),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { permissions } = req.body;

      if (!permissions || typeof permissions !== 'object') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'permissions object is required',
        });
      }

      // Verify user is a master account
      const isMaster = await masterAccountController.isMasterAccount(req.user!.userId);

      if (!isMaster) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only master accounts can update sub-account permissions',
        });
      }

      const subAccount = await masterAccountController.updateSubAccountPermissions(
        id,
        req.user!.userId,
        permissions
      );

      res.status(200).json({
        message: 'Permissions updated successfully',
        sub_account: {
          id: subAccount.id,
          permissions_override: subAccount.permissions_override,
          updated_at: subAccount.updated_at,
        },
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === 'Sub-account not found or unauthorized') {
        return res.status(404).json({
          error: 'Not Found',
          message: errorMessage,
        });
      }

      console.error('Error updating sub-account permissions:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update sub-account permissions',
      });
    }
  }
);

/**
 * @route   PUT /master-accounts/sub-accounts/:id/status
 * @desc    Update sub-account status (active/inactive/suspended)
 * @access  Private - Pharmacist (master account) only
 */
router.put(
  '/sub-accounts/:id/status',
  authenticateJWT,
  requireRole(UserRole.PHARMACIST),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !Object.values(UserStatus).includes(status)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Valid status (active/inactive/suspended) is required',
        });
      }

      // Verify user is a master account
      const isMaster = await masterAccountController.isMasterAccount(req.user!.userId);

      if (!isMaster) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only master accounts can update sub-account status',
        });
      }

      const subAccount = await masterAccountController.updateSubAccountStatus(
        id,
        req.user!.userId,
        status
      );

      res.status(200).json({
        message: 'Status updated successfully',
        sub_account: {
          id: subAccount.id,
          status: subAccount.status,
          updated_at: subAccount.updated_at,
        },
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === 'Sub-account not found or unauthorized') {
        return res.status(404).json({
          error: 'Not Found',
          message: errorMessage,
        });
      }

      console.error('Error updating sub-account status:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update sub-account status',
      });
    }
  }
);

/**
 * @route   DELETE /master-accounts/sub-accounts/:id
 * @desc    Soft delete sub-account
 * @access  Private - Pharmacist (master account) only
 */
router.delete(
  '/sub-accounts/:id',
  authenticateJWT,
  requireRole(UserRole.PHARMACIST),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Verify user is a master account
      const isMaster = await masterAccountController.isMasterAccount(req.user!.userId);

      if (!isMaster) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only master accounts can delete sub-accounts',
        });
      }

      const result = await masterAccountController.deleteSubAccount(id, req.user!.userId);

      res.status(200).json(result);
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === 'Sub-account not found or unauthorized') {
        return res.status(404).json({
          error: 'Not Found',
          message: errorMessage,
        });
      }

      console.error('Error deleting sub-account:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete sub-account',
      });
    }
  }
);

export default router;
