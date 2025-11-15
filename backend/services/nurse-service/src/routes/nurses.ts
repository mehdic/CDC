/**
 * Nurse Routes
 * RESTful API endpoints for nurse management
 * HIPAA/GDPR Compliant - Protected by JWT auth and RBAC
 */

import { Router, Request, Response } from 'express';
import { NurseController } from '../controllers/nurseController';
import { authenticateJWT, AuthenticatedRequest } from '@shared/middleware/auth';
import { requireRole } from '@shared/middleware/rbac';
import { UserRole } from '@shared/models/User';

const router = Router();
const nurseController = new NurseController();

/**
 * @route   GET /nurses
 * @desc    Get all nurses (paginated)
 * @access  Private - Pharmacist, Doctor, Nurse
 */
router.get(
  '/',
  authenticateJWT,
  requireRole([UserRole.PHARMACIST, UserRole.DOCTOR, UserRole.NURSE]),
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await nurseController.getAllNurses(page, limit);

      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching nurses:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch nurses',
      });
    }
  }
);

/**
 * @route   GET /nurses/search
 * @desc    Search nurses by specialization
 * @access  Private - Pharmacist, Doctor, Nurse, Patient
 */
router.get(
  '/search',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { specialization } = req.query;

      if (!specialization) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Specialization query parameter required',
        });
      }

      const nurses = await nurseController.searchNurses(
        specialization as string
      );

      res.status(200).json({ nurses });
    } catch (error) {
      console.error('Error searching nurses:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to search nurses',
      });
    }
  }
);

/**
 * @route   GET /nurses/certifications/expiring
 * @desc    Get nurses with expiring certifications
 * @access  Private - Pharmacist only
 */
router.get(
  '/certifications/expiring',
  authenticateJWT,
  requireRole(UserRole.PHARMACIST),
  async (req: Request, res: Response) => {
    try {
      const daysThreshold = parseInt(req.query.days as string) || 30;

      const nurses = await nurseController.getNursesWithExpiringCertifications(
        daysThreshold
      );

      res.status(200).json({ nurses, daysThreshold });
    } catch (error) {
      console.error('Error fetching nurses with expiring certifications:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch nurses with expiring certifications',
      });
    }
  }
);

/**
 * @route   GET /nurses/:id
 * @desc    Get nurse by ID
 * @access  Private - Pharmacist, Doctor, Nurse
 */
router.get(
  '/:id',
  authenticateJWT,
  requireRole([UserRole.PHARMACIST, UserRole.DOCTOR, UserRole.NURSE]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const nurse = await nurseController.getNurseById(id);

      res.status(200).json({ nurse });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === 'Nurse not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: errorMessage,
        });
      }

      console.error('Error fetching nurse:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch nurse',
      });
    }
  }
);

/**
 * @route   GET /nurses/user/:userId
 * @desc    Get nurse by user ID
 * @access  Private - Nurse (own profile) or Pharmacist
 */
router.get(
  '/user/:userId',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = req.params;

      // Check authorization: own profile or pharmacist
      if (
        req.user!.userId !== userId &&
        req.user!.role !== UserRole.PHARMACIST
      ) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to access this profile',
        });
      }

      const nurse = await nurseController.getNurseByUserId(userId);

      res.status(200).json({ nurse });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === 'Nurse profile not found for this user') {
        return res.status(404).json({
          error: 'Not Found',
          message: errorMessage,
        });
      }

      console.error('Error fetching nurse by user ID:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch nurse profile',
      });
    }
  }
);

/**
 * @route   POST /nurses
 * @desc    Create new nurse profile
 * @access  Private - Nurse (own profile) or Pharmacist
 */
router.post(
  '/',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { user_id, specialization, license_number, license_country, certifications } =
        req.body;

      // Validation
      if (!user_id || !specialization || !license_number) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'user_id, specialization, and license_number are required',
        });
      }

      // Authorization: creating own profile or pharmacist
      if (
        req.user!.userId !== user_id &&
        req.user!.role !== UserRole.PHARMACIST
      ) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only create your own nurse profile',
        });
      }

      const nurse = await nurseController.createNurse({
        user_id,
        specialization,
        license_number,
        license_country,
        certifications,
      });

      res.status(201).json({
        message: 'Nurse profile created successfully',
        nurse,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (
        errorMessage === 'User not found' ||
        errorMessage === 'User must have nurse role' ||
        errorMessage === 'Nurse profile already exists for this user'
      ) {
        return res.status(400).json({
          error: 'Bad Request',
          message: errorMessage,
        });
      }

      console.error('Error creating nurse:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create nurse profile',
      });
    }
  }
);

/**
 * @route   PUT /nurses/:id
 * @desc    Update nurse profile
 * @access  Private - Nurse (own profile) or Pharmacist
 */
router.put(
  '/:id',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { specialization, license_number, license_country, certifications } =
        req.body;

      // Fetch nurse to check ownership
      const existingNurse = await nurseController.getNurseById(id);

      // Authorization: own profile or pharmacist
      if (
        req.user!.userId !== existingNurse.user_id &&
        req.user!.role !== UserRole.PHARMACIST
      ) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only update your own nurse profile',
        });
      }

      const nurse = await nurseController.updateNurse(id, {
        specialization,
        license_number,
        license_country,
        certifications,
      });

      res.status(200).json({
        message: 'Nurse profile updated successfully',
        nurse,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === 'Nurse not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: errorMessage,
        });
      }

      console.error('Error updating nurse:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update nurse profile',
      });
    }
  }
);

/**
 * @route   POST /nurses/:id/verify
 * @desc    Verify nurse credentials (admin only)
 * @access  Private - Pharmacist only
 */
router.post(
  '/:id/verify',
  authenticateJWT,
  requireRole(UserRole.PHARMACIST),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const nurse = await nurseController.verifyNurse(id);

      res.status(200).json({
        message: 'Nurse verified successfully',
        nurse,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === 'Nurse not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: errorMessage,
        });
      }

      console.error('Error verifying nurse:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to verify nurse',
      });
    }
  }
);

/**
 * @route   DELETE /nurses/:id
 * @desc    Soft delete nurse profile
 * @access  Private - Nurse (own profile) or Pharmacist
 */
router.delete(
  '/:id',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Fetch nurse to check ownership
      const existingNurse = await nurseController.getNurseById(id);

      // Authorization: own profile or pharmacist
      if (
        req.user!.userId !== existingNurse.user_id &&
        req.user!.role !== UserRole.PHARMACIST
      ) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only delete your own nurse profile',
        });
      }

      const result = await nurseController.deleteNurse(id);

      res.status(200).json(result);
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === 'Nurse not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: errorMessage,
        });
      }

      console.error('Error deleting nurse:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete nurse profile',
      });
    }
  }
);

export default router;
