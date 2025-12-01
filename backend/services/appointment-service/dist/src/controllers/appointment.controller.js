"use strict";
/**
 * Appointment Controller
 * Business logic for appointment CRUD operations
 * HIPAA/GDPR Compliant - Healthcare appointment data management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentController = void 0;
class AppointmentController {
    constructor(appointmentService, availabilityService, reminderService) {
        this.appointmentService = appointmentService;
        this.availabilityService = availabilityService;
        this.reminderService = reminderService;
    }
    // ============================================================================
    // Appointment Operations
    // ============================================================================
    /**
     * Create new appointment
     */
    async createAppointment(data) {
        return this.appointmentService.createAppointment(data);
    }
    /**
     * Get appointment by ID
     */
    async getAppointmentById(id) {
        return this.appointmentService.getAppointmentById(id);
    }
    /**
     * List appointments with filters
     */
    async listAppointments(filters) {
        return this.appointmentService.listAppointments(filters);
    }
    /**
     * Update appointment
     */
    async updateAppointment(id, data) {
        return this.appointmentService.updateAppointment(id, data);
    }
    /**
     * Confirm appointment
     */
    async confirmAppointment(id) {
        return this.appointmentService.confirmAppointment(id);
    }
    /**
     * Cancel appointment
     */
    async cancelAppointment(id, data) {
        return this.appointmentService.cancelAppointment(id, data.cancellation_reason);
    }
    /**
     * Complete appointment
     */
    async completeAppointment(id) {
        return this.appointmentService.completeAppointment(id);
    }
    /**
     * Delete appointment
     */
    async deleteAppointment(id) {
        return this.appointmentService.deleteAppointment(id);
    }
    /**
     * Get upcoming appointments for provider
     */
    async getUpcomingAppointments(providerId, daysAhead) {
        return this.appointmentService.getUpcomingAppointments(providerId, daysAhead);
    }
    /**
     * Get appointments in date range
     */
    async getAppointmentsInRange(providerId, startDate, endDate) {
        return this.appointmentService.getAppointmentsInRange(providerId, startDate, endDate);
    }
    // ============================================================================
    // Availability Operations
    // ============================================================================
    /**
     * Create availability slot
     */
    async createAvailabilitySlot(data) {
        return this.availabilityService.createSlot(data);
    }
    /**
     * Get availability slot by ID
     */
    async getAvailabilitySlotById(id) {
        return this.availabilityService.getSlotById(id);
    }
    /**
     * List availability slots with filters
     */
    async listAvailabilitySlots(filters) {
        return this.availabilityService.listSlots(filters);
    }
    /**
     * Update availability slot
     */
    async updateAvailabilitySlot(id, data) {
        return this.availabilityService.updateSlot(id, data);
    }
    /**
     * Block availability slot
     */
    async blockAvailabilitySlot(id, reason) {
        return this.availabilityService.blockSlot(id, reason);
    }
    /**
     * Unblock availability slot
     */
    async unblockAvailabilitySlot(id) {
        return this.availabilityService.unblockSlot(id);
    }
    /**
     * Delete availability slot
     */
    async deleteAvailabilitySlot(id) {
        return this.availabilityService.deleteSlot(id);
    }
    /**
     * Get provider availability slots
     */
    async getProviderSlots(providerId) {
        return this.availabilityService.getProviderSlots(providerId);
    }
    /**
     * Get provider availability for specific day
     */
    async getProviderSlotsByDay(providerId, dayOfWeek) {
        return this.availabilityService.getProviderSlotsByDay(providerId, dayOfWeek);
    }
    /**
     * Get available slots for date
     */
    async getAvailableSlotsForDate(providerId, date) {
        return this.availabilityService.getAvailableSlotsForDate(providerId, date);
    }
    // ============================================================================
    // Reminder Operations
    // ============================================================================
    /**
     * Create reminder
     */
    async createReminder(data) {
        // Get appointment to get patient ID
        const appointment = await this.appointmentService.getAppointmentById(data.appointment_id);
        return this.reminderService.createReminder(data.appointment_id, appointment.patient_id, data.reminder_type, data.hours_before_start);
    }
    /**
     * Get reminders for appointment
     */
    async getAppointmentReminders(appointmentId) {
        return this.reminderService.getAppointmentReminders(appointmentId);
    }
    /**
     * Get pending reminders
     */
    async getPendingReminders() {
        return this.reminderService.getPendingReminders();
    }
    /**
     * Send pending reminders
     */
    async sendPendingReminders() {
        return this.reminderService.sendPendingReminders();
    }
    /**
     * Get reminder statistics
     */
    async getReminderStats(appointmentId) {
        return this.reminderService.getReminderStats(appointmentId);
    }
    /**
     * Create default reminders for appointment
     */
    async createDefaultReminders(appointmentId, patientId, providerId) {
        return this.reminderService.createDefaultReminders(appointmentId, patientId, providerId);
    }
}
exports.AppointmentController = AppointmentController;
//# sourceMappingURL=appointment.controller.js.map