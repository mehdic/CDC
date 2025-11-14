/**
 * Doctor Routes
 * RESTful API endpoints for doctor management
 * HIPAA/GDPR Compliant - Protected by JWT auth and RBAC
 */

import { Router, Request, Response } from 'express';
import { DoctorController } from '../controllers/doctorController';
import { authenticateJWT, AuthenticatedRequest } from '@shared/middleware/auth';
import { requireRole } from '@shared/middleware/rbac';
import { UserRole } from '@shared/models/User';

const router = Router();
const doctorController = new DoctorController();

/**
 * @route   GET /doctors
 * @desc    Get all doctors (paginated)
 * @access  Private - Pharmacist, Doctor, Nurse
 * @query   page - Page number (default: 1)
 * @query   limit - Results per page (default: 20)
 */
router.get(
  '/',
  authenticateJWT,
  requireRole([UserRole.PHARMACIST, UserRole.DOCTOR, UserRole.NURSE]),
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await doctorController.getAllDoctors(page, limit);

      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch doctors',
      });
    }
  }
);

/**
 * @route   GET /doctors/search
 * @desc    Search doctors by specialization
 * @access  Private - Pharmacist, Doctor, Nurse, Patient
 * @query   specialization - Specialization to search for
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

      const doctors = await doctorController.searchDoctors(
        specialization as string
      );

      res.status(200).json({ doctors });
    } catch (error) {
      console.error('Error searching doctors:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to search doctors',
      });
    }
  }
);

/**
 * @route   GET /doctors/:id
 * @desc    Get doctor by ID
 * @access  Private - Pharmacist, Doctor, Nurse
 * @param   id - Doctor ID (UUID)
 */
router.get(
  '/:id',
  authenticateJWT,
  requireRole([UserRole.PHARMACIST, UserRole.DOCTOR, UserRole.NURSE]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const doctor = await doctorController.getDoctorById(id);

      res.status(200).json({ doctor });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === 'Doctor not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: errorMessage,
        });
      }

      console.error('Error fetching doctor:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch doctor',
      });
    }
  }
);

/**
 * @route   GET /doctors/user/:userId
 * @desc    Get doctor by user ID
 * @access  Private - Doctor (own profile) or Pharmacist
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

      const doctor = await doctorController.getDoctorByUserId(userId);

      res.status(200).json({ doctor });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === 'Doctor profile not found for this user') {
        return res.status(404).json({
          error: 'Not Found',
          message: errorMessage,
        });
      }

      console.error('Error fetching doctor by user ID:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch doctor profile',
      });
    }
  }
);

/**
 * @route   POST /doctors
 * @desc    Create new doctor profile
 * @access  Private - Doctor (own profile) or Pharmacist
 * @body    user_id, specialization, license_number, license_country, qualifications, bio
 */
router.post(
  '/',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { user_id, specialization, license_number, license_country, qualifications, bio } =
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
          message: 'You can only create your own doctor profile',
        });
      }

      const doctor = await doctorController.createDoctor({
        user_id,
        specialization,
        license_number,
        license_country,
        qualifications,
        bio,
      });

      res.status(201).json({
        message: 'Doctor profile created successfully',
        doctor,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (
        errorMessage === 'User not found' ||
        errorMessage === 'User must have doctor role' ||
        errorMessage === 'Doctor profile already exists for this user'
      ) {
        return res.status(400).json({
          error: 'Bad Request',
          message: errorMessage,
        });
      }

      console.error('Error creating doctor:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create doctor profile',
      });
    }
  }
);

/**
 * @route   PUT /doctors/:id
 * @desc    Update doctor profile
 * @access  Private - Doctor (own profile) or Pharmacist
 * @param   id - Doctor ID (UUID)
 * @body    specialization, license_number, license_country, qualifications, bio
 */
router.put(
  '/:id',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { specialization, license_number, license_country, qualifications, bio } =
        req.body;

      // Fetch doctor to check ownership
      const existingDoctor = await doctorController.getDoctorById(id);

      // Authorization: own profile or pharmacist
      if (
        req.user!.userId !== existingDoctor.user_id &&
        req.user!.role !== UserRole.PHARMACIST
      ) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only update your own doctor profile',
        });
      }

      const doctor = await doctorController.updateDoctor(id, {
        specialization,
        license_number,
        license_country,
        qualifications,
        bio,
      });

      res.status(200).json({
        message: 'Doctor profile updated successfully',
        doctor,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === 'Doctor not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: errorMessage,
        });
      }

      console.error('Error updating doctor:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update doctor profile',
      });
    }
  }
);

/**
 * @route   POST /doctors/:id/verify
 * @desc    Verify doctor credentials (admin only)
 * @access  Private - Pharmacist only
 * @param   id - Doctor ID (UUID)
 */
router.post(
  '/:id/verify',
  authenticateJWT,
  requireRole(UserRole.PHARMACIST),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const doctor = await doctorController.verifyDoctor(id);

      res.status(200).json({
        message: 'Doctor verified successfully',
        doctor,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === 'Doctor not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: errorMessage,
        });
      }

      console.error('Error verifying doctor:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to verify doctor',
      });
    }
  }
);

/**
 * @route   DELETE /doctors/:id
 * @desc    Soft delete doctor profile
 * @access  Private - Doctor (own profile) or Pharmacist
 * @param   id - Doctor ID (UUID)
 */
router.delete(
  '/:id',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      // Fetch doctor to check ownership
      const existingDoctor = await doctorController.getDoctorById(id);

      // Authorization: own profile or pharmacist
      if (
        req.user!.userId !== existingDoctor.user_id &&
        req.user!.role !== UserRole.PHARMACIST
      ) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only delete your own doctor profile',
        });
      }

      const result = await doctorController.deleteDoctor(id);

      res.status(200).json(result);
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === 'Doctor not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: errorMessage,
        });
      }

      console.error('Error deleting doctor:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete doctor profile',
      });
    }
  }
);

export default router;
