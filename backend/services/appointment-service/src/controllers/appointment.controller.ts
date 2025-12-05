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
import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  CancelAppointmentInput,
  ListAppointmentsInput,
  CreateAvailabilitySlotInput,
  UpdateAvailabilitySlotInput,
  ListAvailabilitySlotsInput,
  CreateReminderInput,
} from '../validators/appointment.validators';
import { ReminderType, AppointmentCreateRequest, AvailabilitySlotCreateRequest } from '../types/appointment.types';

export class AppointmentController {
  constructor(
    private appointmentService: AppointmentService,
    private availabilityService: AvailabilityService,
    private reminderService: ReminderService
  ) {}

  // ============================================================================
  // Appointment Operations
  // ============================================================================

  /**
   * Create new appointment
   */
  async createAppointment(data: CreateAppointmentInput): Promise<Appointment> {
    // Cast validated input to service request type
    // The validator ensures all required fields are present
    const request = data as any as AppointmentCreateRequest;
    return this.appointmentService.createAppointment(request);
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(id: string): Promise<Appointment> {
    return this.appointmentService.getAppointmentById(id);
  }

  /**
   * List appointments with filters
   */
  async listAppointments(filters: ListAppointmentsInput) {
    return this.appointmentService.listAppointments(filters);
  }

  /**
   * Update appointment
   */
  async updateAppointment(
    id: string,
    data: UpdateAppointmentInput
  ): Promise<Appointment> {
    return this.appointmentService.updateAppointment(id, data);
  }

  /**
   * Confirm appointment
   */
  async confirmAppointment(id: string): Promise<Appointment> {
    return this.appointmentService.confirmAppointment(id);
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(
    id: string,
    data: CancelAppointmentInput
  ): Promise<Appointment> {
    return this.appointmentService.cancelAppointment(
      id,
      data.cancellation_reason
    );
  }

  /**
   * Complete appointment
   */
  async completeAppointment(id: string): Promise<Appointment> {
    return this.appointmentService.completeAppointment(id);
  }

  /**
   * Delete appointment
   */
  async deleteAppointment(id: string): Promise<void> {
    return this.appointmentService.deleteAppointment(id);
  }

  /**
   * Get upcoming appointments for provider
   */
  async getUpcomingAppointments(providerId: string, daysAhead?: number) {
    return this.appointmentService.getUpcomingAppointments(
      providerId,
      daysAhead
    );
  }

  /**
   * Get appointments in date range
   */
  async getAppointmentsInRange(
    providerId: string,
    startDate: Date,
    endDate: Date
  ) {
    return this.appointmentService.getAppointmentsInRange(
      providerId,
      startDate,
      endDate
    );
  }

  // ============================================================================
  // Availability Operations
  // ============================================================================

  /**
   * Create availability slot
   */
  async createAvailabilitySlot(
    data: CreateAvailabilitySlotInput
  ): Promise<AvailabilitySlot> {
    // Cast validated input to service request type
    const request = data as any as AvailabilitySlotCreateRequest;
    return this.availabilityService.createSlot(request);
  }

  /**
   * Get availability slot by ID
   */
  async getAvailabilitySlotById(id: string): Promise<AvailabilitySlot> {
    return this.availabilityService.getSlotById(id);
  }

  /**
   * List availability slots with filters
   */
  async listAvailabilitySlots(filters: ListAvailabilitySlotsInput) {
    return this.availabilityService.listSlots(filters);
  }

  /**
   * Update availability slot
   */
  async updateAvailabilitySlot(
    id: string,
    data: UpdateAvailabilitySlotInput
  ): Promise<AvailabilitySlot> {
    return this.availabilityService.updateSlot(id, data);
  }

  /**
   * Block availability slot
   */
  async blockAvailabilitySlot(
    id: string,
    reason: string
  ): Promise<AvailabilitySlot> {
    return this.availabilityService.blockSlot(id, reason);
  }

  /**
   * Unblock availability slot
   */
  async unblockAvailabilitySlot(id: string): Promise<AvailabilitySlot> {
    return this.availabilityService.unblockSlot(id);
  }

  /**
   * Delete availability slot
   */
  async deleteAvailabilitySlot(id: string): Promise<void> {
    return this.availabilityService.deleteSlot(id);
  }

  /**
   * Get provider availability slots
   */
  async getProviderSlots(providerId: string): Promise<AvailabilitySlot[]> {
    return this.availabilityService.getProviderSlots(providerId);
  }

  /**
   * Get provider availability for specific day
   */
  async getProviderSlotsByDay(
    providerId: string,
    dayOfWeek: number
  ): Promise<AvailabilitySlot[]> {
    return this.availabilityService.getProviderSlotsByDay(
      providerId,
      dayOfWeek
    );
  }

  /**
   * Get available slots for date
   */
  async getAvailableSlotsForDate(
    providerId: string,
    date: Date
  ): Promise<AvailabilitySlot[]> {
    return this.availabilityService.getAvailableSlotsForDate(
      providerId,
      date
    );
  }

  // ============================================================================
  // Reminder Operations
  // ============================================================================

  /**
   * Create reminder
   */
  async createReminder(data: CreateReminderInput) {
    // Get appointment to get patient ID
    const appointment = await this.appointmentService.getAppointmentById(
      data.appointment_id
    );

    return this.reminderService.createReminder(
      data.appointment_id,
      appointment.patient_id,
      data.reminder_type,
      data.hours_before_start
    );
  }

  /**
   * Get reminders for appointment
   */
  async getAppointmentReminders(appointmentId: string) {
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
  async getReminderStats(appointmentId: string) {
    return this.reminderService.getReminderStats(appointmentId);
  }

  /**
   * Create default reminders for appointment
   */
  async createDefaultReminders(
    appointmentId: string,
    patientId: string,
    providerId: string
  ) {
    return this.reminderService.createDefaultReminders(
      appointmentId,
      patientId,
      providerId
    );
  }
}
