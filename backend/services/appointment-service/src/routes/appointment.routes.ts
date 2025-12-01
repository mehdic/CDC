/**
 * Appointment Routes
 * RESTful API endpoints for appointment scheduling
 * HIPAA/GDPR Compliant - Protected by JWT auth and RBAC
 */

import { Router, Request, Response } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';
import { authenticateJWT, AuthenticatedRequest } from '@shared/middleware/auth';
import { requireRole } from '@shared/middleware/rbac';
import { UserRole } from '@shared/models/User';
import {
  CreateAppointmentSchema,
  UpdateAppointmentSchema,
  CancelAppointmentSchema,
  ListAppointmentsSchema,
  CreateAvailabilitySlotSchema,
  UpdateAvailabilitySlotSchema,
  ListAvailabilitySlotsSchema,
  CreateReminderSchema,
} from '../validators/appointment.validators';

const router = Router();
let appointmentController: AppointmentController;

/**
 * Initialize controller (called from index.ts after dependencies are set up)
 */
export function initializeRoutes(controller: AppointmentController) {
  appointmentController = controller;
}

// ============================================================================
// Appointment Endpoints
// ============================================================================

/**
 * @route   POST /appointments
 * @desc    Create new appointment
 * @access  Private - Doctor, Nurse, Pharmacist
 */
router.post(
  '/',
  authenticateJWT,
  requireRole([UserRole.DOCTOR, UserRole.NURSE, UserRole.PHARMACIST]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validated = CreateAppointmentSchema.parse(req.body);
      const appointment = await appointmentController.createAppointment(
        validated
      );

      res.status(201).json({
        message: 'Appointment created successfully',
        appointment,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (
        errorMessage.includes('Invalid') ||
        errorMessage.includes('required')
      ) {
        return res.status(400).json({
          error: 'Bad Request',
          message: errorMessage,
        });
      }

      if (errorMessage.includes('conflicting')) {
        return res.status(409).json({
          error: 'Conflict',
          message: errorMessage,
        });
      }

      console.error('Error creating appointment:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create appointment',
      });
    }
  }
);

/**
 * @route   GET /appointments
 * @desc    List appointments with filters
 * @access  Private - All authenticated users
 * @query   provider_id, patient_id, status, start_date, end_date, page, limit
 */
router.get(
  '/',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const filters = ListAppointmentsSchema.parse(req.query);
      const result = await appointmentController.listAppointments(filters);

      res.status(200).json(result);
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage.includes('Invalid')) {
        return res.status(400).json({
          error: 'Bad Request',
          message: errorMessage,
        });
      }

      console.error('Error listing appointments:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to list appointments',
      });
    }
  }
);

/**
 * @route   GET /appointments/:id
 * @desc    Get appointment by ID
 * @access  Private - All authenticated users
 */
router.get(
  '/:id',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const appointment = await appointmentController.getAppointmentById(id);

      res.status(200).json({ appointment });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: errorMessage,
        });
      }

      console.error('Error fetching appointment:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch appointment',
      });
    }
  }
);

/**
 * @route   PUT /appointments/:id
 * @desc    Update appointment
 * @access  Private - Doctor, Nurse, Pharmacist
 */
router.put(
  '/:id',
  authenticateJWT,
  requireRole([UserRole.DOCTOR, UserRole.NURSE, UserRole.PHARMACIST]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const validated = UpdateAppointmentSchema.parse(req.body);
      const appointment = await appointmentController.updateAppointment(
        id,
        validated
      );

      res.status(200).json({
        message: 'Appointment updated successfully',
        appointment,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: errorMessage,
        });
      }

      if (
        errorMessage.includes('Invalid') ||
        errorMessage.includes('Cannot')
      ) {
        return res.status(400).json({
          error: 'Bad Request',
          message: errorMessage,
        });
      }

      if (errorMessage.includes('conflicting')) {
        return res.status(409).json({
          error: 'Conflict',
          message: errorMessage,
        });
      }

      console.error('Error updating appointment:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update appointment',
      });
    }
  }
);

/**
 * @route   POST /appointments/:id/confirm
 * @desc    Confirm appointment
 * @access  Private - Doctor, Nurse, Pharmacist
 */
router.post(
  '/:id/confirm',
  authenticateJWT,
  requireRole([UserRole.DOCTOR, UserRole.NURSE, UserRole.PHARMACIST]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const appointment = await appointmentController.confirmAppointment(id);

      res.status(200).json({
        message: 'Appointment confirmed successfully',
        appointment,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: errorMessage,
        });
      }

      if (errorMessage.includes('Only')) {
        return res.status(400).json({
          error: 'Bad Request',
          message: errorMessage,
        });
      }

      console.error('Error confirming appointment:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to confirm appointment',
      });
    }
  }
);

/**
 * @route   POST /appointments/:id/cancel
 * @desc    Cancel appointment
 * @access  Private - Doctor, Nurse, Pharmacist, Patient
 */
router.post(
  '/:id/cancel',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const validated = CancelAppointmentSchema.parse(req.body);
      const appointment = await appointmentController.cancelAppointment(
        id,
        validated
      );

      res.status(200).json({
        message: 'Appointment cancelled successfully',
        appointment,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: errorMessage,
        });
      }

      if (errorMessage.includes('cannot be cancelled')) {
        return res.status(400).json({
          error: 'Bad Request',
          message: errorMessage,
        });
      }

      console.error('Error cancelling appointment:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to cancel appointment',
      });
    }
  }
);

/**
 * @route   POST /appointments/:id/complete
 * @desc    Mark appointment as completed
 * @access  Private - Doctor, Nurse, Pharmacist
 */
router.post(
  '/:id/complete',
  authenticateJWT,
  requireRole([UserRole.DOCTOR, UserRole.NURSE, UserRole.PHARMACIST]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const appointment = await appointmentController.completeAppointment(id);

      res.status(200).json({
        message: 'Appointment marked as completed',
        appointment,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: errorMessage,
        });
      }

      if (errorMessage.includes('Only')) {
        return res.status(400).json({
          error: 'Bad Request',
          message: errorMessage,
        });
      }

      console.error('Error completing appointment:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to complete appointment',
      });
    }
  }
);

/**
 * @route   DELETE /appointments/:id
 * @desc    Soft delete appointment
 * @access  Private - Doctor, Nurse, Pharmacist
 */
router.delete(
  '/:id',
  authenticateJWT,
  requireRole([UserRole.DOCTOR, UserRole.NURSE, UserRole.PHARMACIST]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      await appointmentController.deleteAppointment(id);

      res.status(200).json({
        message: 'Appointment deleted successfully',
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: errorMessage,
        });
      }

      console.error('Error deleting appointment:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete appointment',
      });
    }
  }
);

/**
 * @route   GET /appointments/provider/:providerId/upcoming
 * @desc    Get upcoming appointments for provider
 * @access  Private - Doctor, Nurse, Pharmacist
 * @query   days (default: 7)
 */
router.get(
  '/provider/:providerId/upcoming',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { providerId } = req.params;
      const days = req.query.days ? parseInt(req.query.days as string) : 7;

      const appointments =
        await appointmentController.getUpcomingAppointments(providerId, days);

      res.status(200).json({
        appointments,
        count: appointments.length,
      });
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch upcoming appointments',
      });
    }
  }
);

// ============================================================================
// Availability Slot Endpoints
// ============================================================================

/**
 * @route   POST /availability
 * @desc    Create availability slot
 * @access  Private - Doctor, Nurse, Pharmacist
 */
router.post(
  '/availability',
  authenticateJWT,
  requireRole([UserRole.DOCTOR, UserRole.NURSE, UserRole.PHARMACIST]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const validated = CreateAvailabilitySlotSchema.parse(req.body);
      const slot = await appointmentController.createAvailabilitySlot(
        validated
      );

      res.status(201).json({
        message: 'Availability slot created successfully',
        slot,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (
        errorMessage.includes('Invalid') ||
        errorMessage.includes('already exists')
      ) {
        return res.status(400).json({
          error: 'Bad Request',
          message: errorMessage,
        });
      }

      console.error('Error creating availability slot:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create availability slot',
      });
    }
  }
);

/**
 * @route   GET /availability
 * @desc    List availability slots
 * @access  Private - All authenticated users
 */
router.get(
  '/availability',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const filters = ListAvailabilitySlotsSchema.parse(req.query);
      const result = await appointmentController.listAvailabilitySlots(
        filters
      );

      res.status(200).json(result);
    } catch (error) {
      console.error('Error listing availability slots:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to list availability slots',
      });
    }
  }
);

/**
 * @route   GET /availability/:id
 * @desc    Get availability slot by ID
 * @access  Private - All authenticated users
 */
router.get(
  '/availability/:id',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const slot = await appointmentController.getAvailabilitySlotById(id);

      res.status(200).json({ slot });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: errorMessage,
        });
      }

      console.error('Error fetching availability slot:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch availability slot',
      });
    }
  }
);

/**
 * @route   PUT /availability/:id
 * @desc    Update availability slot
 * @access  Private - Doctor, Nurse, Pharmacist
 */
router.put(
  '/availability/:id',
  authenticateJWT,
  requireRole([UserRole.DOCTOR, UserRole.NURSE, UserRole.PHARMACIST]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const validated = UpdateAvailabilitySlotSchema.parse(req.body);
      const slot = await appointmentController.updateAvailabilitySlot(
        id,
        validated
      );

      res.status(200).json({
        message: 'Availability slot updated successfully',
        slot,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: errorMessage,
        });
      }

      if (errorMessage.includes('Invalid')) {
        return res.status(400).json({
          error: 'Bad Request',
          message: errorMessage,
        });
      }

      console.error('Error updating availability slot:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update availability slot',
      });
    }
  }
);

/**
 * @route   DELETE /availability/:id
 * @desc    Delete availability slot
 * @access  Private - Doctor, Nurse, Pharmacist
 */
router.delete(
  '/availability/:id',
  authenticateJWT,
  requireRole([UserRole.DOCTOR, UserRole.NURSE, UserRole.PHARMACIST]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      await appointmentController.deleteAvailabilitySlot(id);

      res.status(200).json({
        message: 'Availability slot deleted successfully',
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: errorMessage,
        });
      }

      console.error('Error deleting availability slot:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete availability slot',
      });
    }
  }
);

/**
 * @route   GET /availability/provider/:providerId
 * @desc    Get provider availability slots
 * @access  Private - All authenticated users
 */
router.get(
  '/availability/provider/:providerId',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { providerId } = req.params;
      const slots = await appointmentController.getProviderSlots(providerId);

      res.status(200).json({
        slots,
        count: slots.length,
      });
    } catch (error) {
      console.error('Error fetching provider availability:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch provider availability',
      });
    }
  }
);

export default router;
