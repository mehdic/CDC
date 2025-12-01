/**
 * Appointment Service
 * Business logic for appointment CRUD operations
 * Handles scheduling, conflict detection, and status management
 */
import { Repository } from 'typeorm';
import { Appointment } from '../entities/Appointment';
import { AvailabilitySlot } from '../entities/AvailabilitySlot';
import { AppointmentCreateRequest, AppointmentUpdateRequest, AppointmentConflictCheckRequest, AppointmentListFilters, PaginationResult } from '../types/appointment.types';
export declare class AppointmentService {
    private appointmentRepository;
    private availabilityRepository;
    constructor(appointmentRepository: Repository<Appointment>, availabilityRepository: Repository<AvailabilitySlot>);
    /**
     * Create new appointment with conflict detection
     */
    createAppointment(data: AppointmentCreateRequest): Promise<Appointment>;
    /**
     * Get appointment by ID
     */
    getAppointmentById(id: string): Promise<Appointment>;
    /**
     * Get all appointments with filters and pagination
     */
    listAppointments(filters: AppointmentListFilters): Promise<PaginationResult<Appointment>>;
    /**
     * Update appointment
     */
    updateAppointment(id: string, data: AppointmentUpdateRequest): Promise<Appointment>;
    /**
     * Confirm appointment
     */
    confirmAppointment(id: string): Promise<Appointment>;
    /**
     * Cancel appointment
     */
    cancelAppointment(id: string, reason?: string): Promise<Appointment>;
    /**
     * Mark appointment as completed
     */
    completeAppointment(id: string): Promise<Appointment>;
    /**
     * Soft delete appointment
     */
    deleteAppointment(id: string): Promise<void>;
    /**
     * Check for appointment conflicts
     */
    checkConflicts(request: AppointmentConflictCheckRequest): Promise<boolean>;
    /**
     * Check if provider has availability for given time
     */
    private checkAvailability;
    /**
     * Update slot booking count
     */
    private updateSlotBooking;
    /**
     * Get upcoming appointments for a provider
     */
    getUpcomingAppointments(providerId: string, daysAhead?: number): Promise<Appointment[]>;
    /**
     * Get appointments for a specific date range
     */
    getAppointmentsInRange(providerId: string, startDate: Date, endDate: Date): Promise<Appointment[]>;
}
//# sourceMappingURL=appointment.service.d.ts.map