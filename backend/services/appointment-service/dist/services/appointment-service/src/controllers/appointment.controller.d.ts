/**
 * Appointment Controller
 * Business logic for appointment CRUD operations
 * HIPAA/GDPR Compliant - Healthcare appointment data management
 */
import { AppointmentService } from '../services/appointment.service';
import { AvailabilityService } from '../services/availability.service';
import { ReminderService } from '../services/reminder.service';
import { Appointment } from '../entities/Appointment';
import { AvailabilitySlot } from '../entities/AvailabilitySlot';
import { CreateAppointmentInput, UpdateAppointmentInput, CancelAppointmentInput, ListAppointmentsInput, CreateAvailabilitySlotInput, UpdateAvailabilitySlotInput, ListAvailabilitySlotsInput, CreateReminderInput } from '../validators/appointment.validators';
export declare class AppointmentController {
    private appointmentService;
    private availabilityService;
    private reminderService;
    constructor(appointmentService: AppointmentService, availabilityService: AvailabilityService, reminderService: ReminderService);
    /**
     * Create new appointment
     */
    createAppointment(data: CreateAppointmentInput): Promise<Appointment>;
    /**
     * Get appointment by ID
     */
    getAppointmentById(id: string): Promise<Appointment>;
    /**
     * List appointments with filters
     */
    listAppointments(filters: ListAppointmentsInput): Promise<import("../types/appointment.types").PaginationResult<Appointment>>;
    /**
     * Update appointment
     */
    updateAppointment(id: string, data: UpdateAppointmentInput): Promise<Appointment>;
    /**
     * Confirm appointment
     */
    confirmAppointment(id: string): Promise<Appointment>;
    /**
     * Cancel appointment
     */
    cancelAppointment(id: string, data: CancelAppointmentInput): Promise<Appointment>;
    /**
     * Complete appointment
     */
    completeAppointment(id: string): Promise<Appointment>;
    /**
     * Delete appointment
     */
    deleteAppointment(id: string): Promise<void>;
    /**
     * Get upcoming appointments for provider
     */
    getUpcomingAppointments(providerId: string, daysAhead?: number): Promise<Appointment[]>;
    /**
     * Get appointments in date range
     */
    getAppointmentsInRange(providerId: string, startDate: Date, endDate: Date): Promise<Appointment[]>;
    /**
     * Create availability slot
     */
    createAvailabilitySlot(data: CreateAvailabilitySlotInput): Promise<AvailabilitySlot>;
    /**
     * Get availability slot by ID
     */
    getAvailabilitySlotById(id: string): Promise<AvailabilitySlot>;
    /**
     * List availability slots with filters
     */
    listAvailabilitySlots(filters: ListAvailabilitySlotsInput): Promise<import("../types/appointment.types").PaginationResult<AvailabilitySlot>>;
    /**
     * Update availability slot
     */
    updateAvailabilitySlot(id: string, data: UpdateAvailabilitySlotInput): Promise<AvailabilitySlot>;
    /**
     * Block availability slot
     */
    blockAvailabilitySlot(id: string, reason: string): Promise<AvailabilitySlot>;
    /**
     * Unblock availability slot
     */
    unblockAvailabilitySlot(id: string): Promise<AvailabilitySlot>;
    /**
     * Delete availability slot
     */
    deleteAvailabilitySlot(id: string): Promise<void>;
    /**
     * Get provider availability slots
     */
    getProviderSlots(providerId: string): Promise<AvailabilitySlot[]>;
    /**
     * Get provider availability for specific day
     */
    getProviderSlotsByDay(providerId: string, dayOfWeek: number): Promise<AvailabilitySlot[]>;
    /**
     * Get available slots for date
     */
    getAvailableSlotsForDate(providerId: string, date: Date): Promise<AvailabilitySlot[]>;
    /**
     * Create reminder
     */
    createReminder(data: CreateReminderInput): Promise<import("../entities/AppointmentReminder").AppointmentReminder>;
    /**
     * Get reminders for appointment
     */
    getAppointmentReminders(appointmentId: string): Promise<import("../entities/AppointmentReminder").AppointmentReminder[]>;
    /**
     * Get pending reminders
     */
    getPendingReminders(): Promise<import("../entities/AppointmentReminder").AppointmentReminder[]>;
    /**
     * Send pending reminders
     */
    sendPendingReminders(): Promise<{
        sent: number;
        failed: number;
        errors: Array<{
            reminderId: string;
            error: string;
        }>;
    }>;
    /**
     * Get reminder statistics
     */
    getReminderStats(appointmentId: string): Promise<{
        total: number;
        sent: number;
        pending: number;
        failed: number;
    }>;
    /**
     * Create default reminders for appointment
     */
    createDefaultReminders(appointmentId: string, patientId: string, providerId: string): Promise<import("../entities/AppointmentReminder").AppointmentReminder[]>;
}
//# sourceMappingURL=appointment.controller.d.ts.map