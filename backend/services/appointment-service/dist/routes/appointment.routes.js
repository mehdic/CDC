"use strict";
/**
 * Appointment Routes
 * RESTful API endpoints for appointment scheduling
 * HIPAA/GDPR Compliant - Protected by JWT auth and RBAC
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeRoutes = initializeRoutes;
const express_1 = require("express");
const auth_1 = require("@shared/middleware/auth");
const rbac_1 = require("@shared/middleware/rbac");
const User_1 = require("@shared/models/User");
const appointment_validators_1 = require("../validators/appointment.validators");
const router = (0, express_1.Router)();
let appointmentController;
/**
 * Initialize controller (called from index.ts after dependencies are set up)
 */
function initializeRoutes(controller) {
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
router.post('/', auth_1.authenticateJWT, (0, rbac_1.requireRole)([User_1.UserRole.DOCTOR, User_1.UserRole.NURSE, User_1.UserRole.PHARMACIST]), async (req, res) => {
    try {
        const validated = appointment_validators_1.CreateAppointmentSchema.parse(req.body);
        const appointment = await appointmentController.createAppointment(validated);
        res.status(201).json({
            message: 'Appointment created successfully',
            appointment,
        });
    }
    catch (error) {
        const errorMessage = error.message;
        if (errorMessage.includes('Invalid') ||
            errorMessage.includes('required')) {
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
});
/**
 * @route   GET /appointments
 * @desc    List appointments with filters
 * @access  Private - All authenticated users
 * @query   provider_id, patient_id, status, start_date, end_date, page, limit
 */
router.get('/', auth_1.authenticateJWT, async (req, res) => {
    try {
        const filters = appointment_validators_1.ListAppointmentsSchema.parse(req.query);
        const result = await appointmentController.listAppointments(filters);
        res.status(200).json(result);
    }
    catch (error) {
        const errorMessage = error.message;
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
});
/**
 * @route   GET /appointments/:id
 * @desc    Get appointment by ID
 * @access  Private - All authenticated users
 */
router.get('/:id', auth_1.authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const appointment = await appointmentController.getAppointmentById(id);
        res.status(200).json({ appointment });
    }
    catch (error) {
        const errorMessage = error.message;
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
});
/**
 * @route   PUT /appointments/:id
 * @desc    Update appointment
 * @access  Private - Doctor, Nurse, Pharmacist
 */
router.put('/:id', auth_1.authenticateJWT, (0, rbac_1.requireRole)([User_1.UserRole.DOCTOR, User_1.UserRole.NURSE, User_1.UserRole.PHARMACIST]), async (req, res) => {
    try {
        const { id } = req.params;
        const validated = appointment_validators_1.UpdateAppointmentSchema.parse(req.body);
        const appointment = await appointmentController.updateAppointment(id, validated);
        res.status(200).json({
            message: 'Appointment updated successfully',
            appointment,
        });
    }
    catch (error) {
        const errorMessage = error.message;
        if (errorMessage.includes('not found')) {
            return res.status(404).json({
                error: 'Not Found',
                message: errorMessage,
            });
        }
        if (errorMessage.includes('Invalid') ||
            errorMessage.includes('Cannot')) {
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
});
/**
 * @route   POST /appointments/:id/confirm
 * @desc    Confirm appointment
 * @access  Private - Doctor, Nurse, Pharmacist
 */
router.post('/:id/confirm', auth_1.authenticateJWT, (0, rbac_1.requireRole)([User_1.UserRole.DOCTOR, User_1.UserRole.NURSE, User_1.UserRole.PHARMACIST]), async (req, res) => {
    try {
        const { id } = req.params;
        const appointment = await appointmentController.confirmAppointment(id);
        res.status(200).json({
            message: 'Appointment confirmed successfully',
            appointment,
        });
    }
    catch (error) {
        const errorMessage = error.message;
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
});
/**
 * @route   POST /appointments/:id/cancel
 * @desc    Cancel appointment
 * @access  Private - Doctor, Nurse, Pharmacist, Patient
 */
router.post('/:id/cancel', auth_1.authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const validated = appointment_validators_1.CancelAppointmentSchema.parse(req.body);
        const appointment = await appointmentController.cancelAppointment(id, validated);
        res.status(200).json({
            message: 'Appointment cancelled successfully',
            appointment,
        });
    }
    catch (error) {
        const errorMessage = error.message;
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
});
/**
 * @route   POST /appointments/:id/complete
 * @desc    Mark appointment as completed
 * @access  Private - Doctor, Nurse, Pharmacist
 */
router.post('/:id/complete', auth_1.authenticateJWT, (0, rbac_1.requireRole)([User_1.UserRole.DOCTOR, User_1.UserRole.NURSE, User_1.UserRole.PHARMACIST]), async (req, res) => {
    try {
        const { id } = req.params;
        const appointment = await appointmentController.completeAppointment(id);
        res.status(200).json({
            message: 'Appointment marked as completed',
            appointment,
        });
    }
    catch (error) {
        const errorMessage = error.message;
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
});
/**
 * @route   DELETE /appointments/:id
 * @desc    Soft delete appointment
 * @access  Private - Doctor, Nurse, Pharmacist
 */
router.delete('/:id', auth_1.authenticateJWT, (0, rbac_1.requireRole)([User_1.UserRole.DOCTOR, User_1.UserRole.NURSE, User_1.UserRole.PHARMACIST]), async (req, res) => {
    try {
        const { id } = req.params;
        await appointmentController.deleteAppointment(id);
        res.status(200).json({
            message: 'Appointment deleted successfully',
        });
    }
    catch (error) {
        const errorMessage = error.message;
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
});
/**
 * @route   GET /appointments/provider/:providerId/upcoming
 * @desc    Get upcoming appointments for provider
 * @access  Private - Doctor, Nurse, Pharmacist
 * @query   days (default: 7)
 */
router.get('/provider/:providerId/upcoming', auth_1.authenticateJWT, async (req, res) => {
    try {
        const { providerId } = req.params;
        const days = req.query.days ? parseInt(req.query.days) : 7;
        const appointments = await appointmentController.getUpcomingAppointments(providerId, days);
        res.status(200).json({
            appointments,
            count: appointments.length,
        });
    }
    catch (error) {
        console.error('Error fetching upcoming appointments:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch upcoming appointments',
        });
    }
});
// ============================================================================
// Availability Slot Endpoints
// ============================================================================
/**
 * @route   POST /availability
 * @desc    Create availability slot
 * @access  Private - Doctor, Nurse, Pharmacist
 */
router.post('/availability', auth_1.authenticateJWT, (0, rbac_1.requireRole)([User_1.UserRole.DOCTOR, User_1.UserRole.NURSE, User_1.UserRole.PHARMACIST]), async (req, res) => {
    try {
        const validated = appointment_validators_1.CreateAvailabilitySlotSchema.parse(req.body);
        const slot = await appointmentController.createAvailabilitySlot(validated);
        res.status(201).json({
            message: 'Availability slot created successfully',
            slot,
        });
    }
    catch (error) {
        const errorMessage = error.message;
        if (errorMessage.includes('Invalid') ||
            errorMessage.includes('already exists')) {
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
});
/**
 * @route   GET /availability
 * @desc    List availability slots
 * @access  Private - All authenticated users
 */
router.get('/availability', auth_1.authenticateJWT, async (req, res) => {
    try {
        const filters = appointment_validators_1.ListAvailabilitySlotsSchema.parse(req.query);
        const result = await appointmentController.listAvailabilitySlots(filters);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Error listing availability slots:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to list availability slots',
        });
    }
});
/**
 * @route   GET /availability/:id
 * @desc    Get availability slot by ID
 * @access  Private - All authenticated users
 */
router.get('/availability/:id', auth_1.authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const slot = await appointmentController.getAvailabilitySlotById(id);
        res.status(200).json({ slot });
    }
    catch (error) {
        const errorMessage = error.message;
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
});
/**
 * @route   PUT /availability/:id
 * @desc    Update availability slot
 * @access  Private - Doctor, Nurse, Pharmacist
 */
router.put('/availability/:id', auth_1.authenticateJWT, (0, rbac_1.requireRole)([User_1.UserRole.DOCTOR, User_1.UserRole.NURSE, User_1.UserRole.PHARMACIST]), async (req, res) => {
    try {
        const { id } = req.params;
        const validated = appointment_validators_1.UpdateAvailabilitySlotSchema.parse(req.body);
        const slot = await appointmentController.updateAvailabilitySlot(id, validated);
        res.status(200).json({
            message: 'Availability slot updated successfully',
            slot,
        });
    }
    catch (error) {
        const errorMessage = error.message;
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
});
/**
 * @route   DELETE /availability/:id
 * @desc    Delete availability slot
 * @access  Private - Doctor, Nurse, Pharmacist
 */
router.delete('/availability/:id', auth_1.authenticateJWT, (0, rbac_1.requireRole)([User_1.UserRole.DOCTOR, User_1.UserRole.NURSE, User_1.UserRole.PHARMACIST]), async (req, res) => {
    try {
        const { id } = req.params;
        await appointmentController.deleteAvailabilitySlot(id);
        res.status(200).json({
            message: 'Availability slot deleted successfully',
        });
    }
    catch (error) {
        const errorMessage = error.message;
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
});
/**
 * @route   GET /availability/provider/:providerId
 * @desc    Get provider availability slots
 * @access  Private - All authenticated users
 */
router.get('/availability/provider/:providerId', auth_1.authenticateJWT, async (req, res) => {
    try {
        const { providerId } = req.params;
        const slots = await appointmentController.getProviderSlots(providerId);
        res.status(200).json({
            slots,
            count: slots.length,
        });
    }
    catch (error) {
        console.error('Error fetching provider availability:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch provider availability',
        });
    }
});
exports.default = router;
//# sourceMappingURL=appointment.routes.js.map