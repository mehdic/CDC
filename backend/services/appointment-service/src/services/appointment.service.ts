/**
 * Appointment Service
 * Business logic for appointment CRUD operations
 * Handles scheduling, conflict detection, and status management
 */

import { Repository, Between, In, IsNull } from 'typeorm';
import { Appointment } from '../entities/Appointment';
import { AvailabilitySlot } from '../entities/AvailabilitySlot';
import {
  AppointmentStatus,
  AppointmentType,
  AppointmentCreateRequest,
  AppointmentUpdateRequest,
  AppointmentConflictCheckRequest,
  AppointmentListFilters,
  PaginationResult,
  AppointmentResponse,
} from '../types/appointment.types';

export class AppointmentService {
  constructor(
    private appointmentRepository: Repository<Appointment>,
    private availabilityRepository: Repository<AvailabilitySlot>
  ) {}

  /**
   * Create new appointment with conflict detection
   */
  async createAppointment(
    data: AppointmentCreateRequest
  ): Promise<Appointment> {
    // Validate times
    if (data.scheduled_end <= data.scheduled_start) {
      throw new Error('End time must be after start time');
    }

    // Check for conflicts
    const hasConflict = await this.checkConflicts({
      provider_id: data.provider_id,
      scheduled_start: data.scheduled_start,
      scheduled_end: data.scheduled_end,
    });

    if (hasConflict) {
      throw new Error('Provider has conflicting appointments');
    }

    // Check availability slots
    const hasAvailability = await this.checkAvailability(
      data.provider_id,
      data.scheduled_start
    );

    if (!hasAvailability) {
      throw new Error('No availability slot for requested time');
    }

    // Create appointment
    const appointment = this.appointmentRepository.create({
      provider_id: data.provider_id,
      patient_id: data.patient_id,
      appointment_type: data.appointment_type,
      scheduled_start: data.scheduled_start,
      scheduled_end: data.scheduled_end,
      reason: data.reason || null,
      notes: data.notes || null,
      location: data.location || null,
      status: AppointmentStatus.PENDING,
      timezone: 'UTC',
    });

    await this.appointmentRepository.save(appointment);

    // Update availability slot booked count
    await this.updateSlotBooking(data.provider_id, data.scheduled_start, 1);

    return appointment;
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id, deleted_at: IsNull() },
      relations: ['provider', 'patient', 'reminders'],
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    return appointment;
  }

  /**
   * Get all appointments with filters and pagination
   */
  async listAppointments(
    filters: AppointmentListFilters
  ): Promise<PaginationResult<Appointment>> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    let query = this.appointmentRepository.createQueryBuilder('appointment');

    // Apply filters
    query = query.where('appointment.deleted_at IS NULL');

    if (filters.provider_id) {
      query = query.andWhere('appointment.provider_id = :provider_id', {
        provider_id: filters.provider_id,
      });
    }

    if (filters.patient_id) {
      query = query.andWhere('appointment.patient_id = :patient_id', {
        patient_id: filters.patient_id,
      });
    }

    if (filters.status) {
      query = query.andWhere('appointment.status = :status', {
        status: filters.status,
      });
    }

    if (filters.appointment_type) {
      query = query.andWhere(
        'appointment.appointment_type = :appointment_type',
        { appointment_type: filters.appointment_type }
      );
    }

    if (filters.start_date) {
      query = query.andWhere(
        'appointment.scheduled_start >= :start_date',
        { start_date: filters.start_date }
      );
    }

    if (filters.end_date) {
      query = query.andWhere('appointment.scheduled_end <= :end_date', {
        end_date: filters.end_date,
      });
    }

    // Get total count
    const total = await query.getCount();

    // Apply pagination and sorting
    const appointments = await query
      .leftJoinAndSelect('appointment.provider', 'provider')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .orderBy('appointment.scheduled_start', 'ASC')
      .take(limit)
      .skip(skip)
      .getMany();

    return {
      data: appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update appointment
   */
  async updateAppointment(
    id: string,
    data: AppointmentUpdateRequest
  ): Promise<Appointment> {
    const appointment = await this.getAppointmentById(id);

    // Check if appointment can be updated
    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new Error('Cannot update completed appointment');
    }

    // If times are being updated, check for conflicts
    if (data.scheduled_start || data.scheduled_end) {
      const newStart = data.scheduled_start || appointment.scheduled_start;
      const newEnd = data.scheduled_end || appointment.scheduled_end;

      if (newEnd <= newStart) {
        throw new Error('End time must be after start time');
      }

      const hasConflict = await this.checkConflicts({
        provider_id: appointment.provider_id,
        scheduled_start: newStart,
        scheduled_end: newEnd,
        exclude_appointment_id: id,
      });

      if (hasConflict) {
        throw new Error('Provider has conflicting appointments');
      }
    }

    // Update fields
    if (data.appointment_type) appointment.appointment_type = data.appointment_type;
    if (data.scheduled_start) appointment.scheduled_start = data.scheduled_start;
    if (data.scheduled_end) appointment.scheduled_end = data.scheduled_end;
    if (data.reason !== undefined) appointment.reason = data.reason;
    if (data.notes !== undefined) appointment.notes = data.notes;
    if (data.location !== undefined) appointment.location = data.location;
    if (data.status) appointment.status = data.status;

    await this.appointmentRepository.save(appointment);
    return appointment;
  }

  /**
   * Confirm appointment
   */
  async confirmAppointment(id: string): Promise<Appointment> {
    const appointment = await this.getAppointmentById(id);

    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new Error('Only pending appointments can be confirmed');
    }

    appointment.status = AppointmentStatus.CONFIRMED;
    appointment.confirmed_at = new Date();

    await this.appointmentRepository.save(appointment);
    return appointment;
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(
    id: string,
    reason?: string
  ): Promise<Appointment> {
    const appointment = await this.getAppointmentById(id);

    if (!appointment.canBeCancelled()) {
      throw new Error('Appointment cannot be cancelled');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancelled_at = new Date();
    if (reason) appointment.cancellation_reason = reason;

    await this.appointmentRepository.save(appointment);

    // Release availability slot booking
    await this.updateSlotBooking(
      appointment.provider_id,
      appointment.scheduled_start,
      -1
    );

    return appointment;
  }

  /**
   * Mark appointment as completed
   */
  async completeAppointment(id: string): Promise<Appointment> {
    const appointment = await this.getAppointmentById(id);

    if (
      appointment.status !== AppointmentStatus.CONFIRMED &&
      appointment.status !== AppointmentStatus.IN_PROGRESS
    ) {
      throw new Error('Only confirmed or in-progress appointments can be completed');
    }

    appointment.status = AppointmentStatus.COMPLETED;
    appointment.completed_at = new Date();

    await this.appointmentRepository.save(appointment);
    return appointment;
  }

  /**
   * Soft delete appointment
   */
  async deleteAppointment(id: string): Promise<void> {
    const appointment = await this.getAppointmentById(id);
    appointment.softDelete();
    await this.appointmentRepository.save(appointment);
  }

  /**
   * Check for appointment conflicts
   */
  async checkConflicts(
    request: AppointmentConflictCheckRequest
  ): Promise<boolean> {
    let query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.provider_id = :provider_id', {
        provider_id: request.provider_id,
      })
      .andWhere('appointment.deleted_at IS NULL')
      .andWhere(
        'appointment.status NOT IN (:...statuses)',
        {
          statuses: [AppointmentStatus.CANCELLED],
        }
      )
      .andWhere(
        '(appointment.scheduled_start < :end_time AND appointment.scheduled_end > :start_time)',
        {
          start_time: request.scheduled_start,
          end_time: request.scheduled_end,
        }
      );

    if (request.exclude_appointment_id) {
      query = query.andWhere('appointment.id != :exclude_id', {
        exclude_id: request.exclude_appointment_id,
      });
    }

    const count = await query.getCount();
    return count > 0;
  }

  /**
   * Check if provider has availability for given time
   */
  private async checkAvailability(
    providerId: string,
    appointmentTime: Date
  ): Promise<boolean> {
    const dayOfWeek = appointmentTime.getDay();
    const hours = appointmentTime.getHours();
    const minutes = appointmentTime.getMinutes();
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    const slot = await this.availabilityRepository.findOne({
      where: {
        provider_id: providerId,
        day_of_week: dayOfWeek,
        is_active: true,
        is_blocked: false,
      },
    });

    if (!slot) {
      return false;
    }

    // Check if time falls within slot
    return timeString >= slot.start_time && timeString < slot.end_time;
  }

  /**
   * Update slot booking count
   */
  private async updateSlotBooking(
    providerId: string,
    appointmentTime: Date,
    increment: number
  ): Promise<void> {
    const dayOfWeek = appointmentTime.getDay();

    const slot = await this.availabilityRepository.findOne({
      where: {
        provider_id: providerId,
        day_of_week: dayOfWeek,
      },
    });

    if (slot) {
      slot.booked_count = Math.max(0, slot.booked_count + increment);
      await this.availabilityRepository.save(slot);
    }
  }

  /**
   * Get upcoming appointments for a provider
   */
  async getUpcomingAppointments(
    providerId: string,
    daysAhead: number = 7
  ): Promise<Appointment[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.appointmentRepository.find({
      where: {
        provider_id: providerId,
        deleted_at: IsNull(),
        scheduled_start: Between(now, futureDate),
        status: In([AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING]),
      },
      relations: ['patient'],
      order: { scheduled_start: 'ASC' },
    });
  }

  /**
   * Get appointments for a specific date range
   */
  async getAppointmentsInRange(
    providerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: {
        provider_id: providerId,
        deleted_at: IsNull(),
        scheduled_start: Between(startDate, endDate),
      },
      relations: ['patient'],
      order: { scheduled_start: 'ASC' },
    });
  }
}
