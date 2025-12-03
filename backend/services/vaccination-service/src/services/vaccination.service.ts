/**
 * Vaccination Service
 * Business logic for vaccination slot and booking management
 * Handles slot template CRUD, booking operations, cancellation, and rescheduling
 */

import { Repository, Between, In, IsNull, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { VaccinationSlotTemplate } from '../entities/VaccinationSlotTemplate';
import { VaccinationSlot } from '../entities/VaccinationSlot';
import { VaccinationBooking } from '../entities/VaccinationBooking';
import {
  VaccinationSlotTemplateCreateRequest,
  VaccinationSlotTemplateUpdateRequest,
  VaccinationSlotCreateRequest,
  VaccinationBookingRequest,
  VaccinationBookingCancellationRequest,
  VaccinationBookingRescheduleRequest,
  BookingListFilters,
  PaginationResult,
  BookingStatus,
  VaccinationSlotStatus,
} from '../types/vaccination.types';

export class VaccinationService {
  constructor(
    private templateRepository: Repository<VaccinationSlotTemplate>,
    private slotRepository: Repository<VaccinationSlot>,
    private bookingRepository: Repository<VaccinationBooking>
  ) {}

  // ============================================================================
  // Slot Template Management
  // ============================================================================

  /**
   * Create new slot template
   */
  async createSlotTemplate(
    data: VaccinationSlotTemplateCreateRequest
  ): Promise<VaccinationSlotTemplate> {
    // Validate time range
    if (!this.isValidTimeRange(data.start_time, data.end_time)) {
      throw new Error('End time must be after start time');
    }

    // Validate day of week
    if (data.day_of_week < 0 || data.day_of_week > 6) {
      throw new Error('Day of week must be between 0 (Sunday) and 6 (Saturday)');
    }

    // Validate duration
    if (data.duration_minutes < 5 || data.duration_minutes > 120) {
      throw new Error('Duration must be between 5 and 120 minutes');
    }

    // Validate capacity
    if (data.capacity < 1 || data.capacity > 10) {
      throw new Error('Capacity must be between 1 and 10');
    }

    const template = this.templateRepository.create({
      pharmacy_id: data.pharmacy_id,
      vaccine_type: data.vaccine_type,
      duration_minutes: data.duration_minutes,
      capacity: data.capacity,
      day_of_week: data.day_of_week,
      start_time: data.start_time,
      end_time: data.end_time,
      is_active: data.is_active !== undefined ? data.is_active : true,
    });

    await this.templateRepository.save(template);
    return template;
  }

  /**
   * Get slot template by ID
   */
  async getSlotTemplate(id: string): Promise<VaccinationSlotTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });

    if (!template) {
      throw new Error('Slot template not found');
    }

    return template;
  }

  /**
   * Get all slot templates for a pharmacy
   */
  async getPharmacySlotTemplates(
    pharmacyId: string,
    includeInactive: boolean = false
  ): Promise<VaccinationSlotTemplate[]> {
    const where: any = {
      pharmacy_id: pharmacyId,
      deleted_at: IsNull(),
    };

    if (!includeInactive) {
      where.is_active = true;
    }

    return this.templateRepository.find({
      where,
      order: { day_of_week: 'ASC', start_time: 'ASC' },
    });
  }

  /**
   * Update slot template
   */
  async updateSlotTemplate(
    id: string,
    data: VaccinationSlotTemplateUpdateRequest
  ): Promise<VaccinationSlotTemplate> {
    const template = await this.getSlotTemplate(id);

    // Validate time range if updating times
    if (data.start_time || data.end_time) {
      const startTime = data.start_time || template.start_time;
      const endTime = data.end_time || template.end_time;

      if (!this.isValidTimeRange(startTime, endTime)) {
        throw new Error('End time must be after start time');
      }
    }

    // Update fields
    if (data.vaccine_type) template.vaccine_type = data.vaccine_type;
    if (data.duration_minutes) template.duration_minutes = data.duration_minutes;
    if (data.capacity) template.capacity = data.capacity;
    if (data.day_of_week !== undefined) template.day_of_week = data.day_of_week;
    if (data.start_time) template.start_time = data.start_time;
    if (data.end_time) template.end_time = data.end_time;
    if (data.is_active !== undefined) template.is_active = data.is_active;

    await this.templateRepository.save(template);
    return template;
  }

  /**
   * Delete slot template (soft delete)
   */
  async deleteSlotTemplate(id: string): Promise<void> {
    const template = await this.getSlotTemplate(id);

    // Check if there are future slots using this template
    const futureSlots = await this.slotRepository.count({
      where: {
        template_id: id,
        start_time: MoreThanOrEqual(new Date()),
        deleted_at: IsNull(),
      },
    });

    if (futureSlots > 0) {
      throw new Error(
        `Cannot delete template with ${futureSlots} future slots. Cancel or complete them first.`
      );
    }

    template.softDelete();
    await this.templateRepository.save(template);
  }

  // ============================================================================
  // Slot Generation
  // ============================================================================

  /**
   * Generate slots from template for a date range
   */
  async generateSlotsFromTemplate(
    templateId: string,
    startDate: Date,
    endDate: Date
  ): Promise<VaccinationSlot[]> {
    const template = await this.getSlotTemplate(templateId);

    if (!template.is_active) {
      throw new Error('Cannot generate slots from inactive template');
    }

    const slots: VaccinationSlot[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Check if day matches template day_of_week
      if (currentDate.getDay() === template.day_of_week) {
        // Generate slots for this day
        const daySlots = await this.generateSlotsForDay(template, currentDate);
        slots.push(...daySlots);
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  }

  /**
   * Generate slots for a specific day from template
   */
  private async generateSlotsForDay(
    template: VaccinationSlotTemplate,
    date: Date
  ): Promise<VaccinationSlot[]> {
    const slots: VaccinationSlot[] = [];
    const [startHour, startMinute] = template.start_time.split(':').map(Number);
    const [endHour, endMinute] = template.end_time.split(':').map(Number);

    let currentMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    while (currentMinutes + template.duration_minutes <= endMinutes) {
      const slotStartHour = Math.floor(currentMinutes / 60);
      const slotStartMinute = currentMinutes % 60;

      const slotStart = new Date(date);
      slotStart.setHours(slotStartHour, slotStartMinute, 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + template.duration_minutes);

      // Check if slot already exists
      const existing = await this.slotRepository.findOne({
        where: {
          template_id: template.id,
          slot_date: date,
          start_time: slotStart,
          deleted_at: IsNull(),
        },
      });

      if (!existing) {
        const slot = this.slotRepository.create({
          template_id: template.id,
          pharmacy_id: template.pharmacy_id,
          slot_date: date,
          start_time: slotStart,
          end_time: slotEnd,
          capacity: template.capacity,
          booked_count: 0,
          status: VaccinationSlotStatus.AVAILABLE,
        });

        await this.slotRepository.save(slot);
        slots.push(slot);
      }

      currentMinutes += template.duration_minutes;
    }

    return slots;
  }

  // ============================================================================
  // Booking Management
  // ============================================================================

  /**
   * Create new booking
   */
  async createBooking(
    data: VaccinationBookingRequest
  ): Promise<VaccinationBooking> {
    const slot = await this.slotRepository.findOne({
      where: { id: data.slot_id, deleted_at: IsNull() },
    });

    if (!slot) {
      throw new Error('Vaccination slot not found');
    }

    // Check if slot is in the past
    if (slot.isPast()) {
      throw new Error('Cannot book past vaccination slots');
    }

    // Check if slot has available capacity
    if (!slot.hasAvailableCapacity()) {
      throw new Error('Vaccination slot is fully booked');
    }

    // Check if patient already has a booking for this slot
    const existingBooking = await this.bookingRepository.findOne({
      where: {
        slot_id: data.slot_id,
        patient_id: data.patient_id,
        status: In([BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]),
        deleted_at: IsNull(),
      },
    });

    if (existingBooking) {
      throw new Error('Patient already has a booking for this slot');
    }

    // Create booking
    const booking = this.bookingRepository.create({
      slot_id: data.slot_id,
      patient_id: data.patient_id,
      vaccine_type: data.vaccine_type,
      status: BookingStatus.CONFIRMED,
      notes: data.notes || null,
    });

    await this.bookingRepository.save(booking);

    // Update slot booking count
    slot.incrementBooking();
    await this.slotRepository.save(slot);

    return booking;
  }

  /**
   * Get booking by ID
   */
  async getBooking(id: string): Promise<VaccinationBooking> {
    const booking = await this.bookingRepository.findOne({
      where: { id, deleted_at: IsNull() },
      relations: ['slot'],
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    return booking;
  }

  /**
   * List bookings with filters
   */
  async listBookings(
    filters: BookingListFilters
  ): Promise<PaginationResult<VaccinationBooking>> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    let query = this.bookingRepository.createQueryBuilder('booking');

    query = query
      .leftJoinAndSelect('booking.slot', 'slot')
      .where('booking.deleted_at IS NULL');

    if (filters.patient_id) {
      query = query.andWhere('booking.patient_id = :patient_id', {
        patient_id: filters.patient_id,
      });
    }

    if (filters.pharmacy_id) {
      query = query.andWhere('slot.pharmacy_id = :pharmacy_id', {
        pharmacy_id: filters.pharmacy_id,
      });
    }

    if (filters.status) {
      query = query.andWhere('booking.status = :status', {
        status: filters.status,
      });
    }

    if (filters.start_date) {
      query = query.andWhere('slot.slot_date >= :start_date', {
        start_date: filters.start_date,
      });
    }

    if (filters.end_date) {
      query = query.andWhere('slot.slot_date <= :end_date', {
        end_date: filters.end_date,
      });
    }

    const total = await query.getCount();

    const bookings = await query
      .orderBy('slot.start_time', 'ASC')
      .take(limit)
      .skip(skip)
      .getMany();

    return {
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Cancel booking
   */
  async cancelBooking(
    id: string,
    data: VaccinationBookingCancellationRequest
  ): Promise<VaccinationBooking> {
    const booking = await this.getBooking(id);

    if (!booking.canBeCancelled()) {
      throw new Error('Booking cannot be cancelled');
    }

    booking.cancel(data.cancellation_reason);
    await this.bookingRepository.save(booking);

    // Release slot capacity
    const slot = await this.slotRepository.findOne({
      where: { id: booking.slot_id },
    });

    if (slot) {
      slot.decrementBooking();
      await this.slotRepository.save(slot);
    }

    return booking;
  }

  /**
   * Reschedule booking
   */
  async rescheduleBooking(
    id: string,
    data: VaccinationBookingRescheduleRequest
  ): Promise<VaccinationBooking> {
    const booking = await this.getBooking(id);

    if (!booking.canBeCancelled()) {
      throw new Error('Booking cannot be rescheduled');
    }

    const oldSlotId = booking.slot_id;

    // Check new slot availability
    const newSlot = await this.slotRepository.findOne({
      where: { id: data.new_slot_id, deleted_at: IsNull() },
    });

    if (!newSlot) {
      throw new Error('New slot not found');
    }

    if (!newSlot.hasAvailableCapacity()) {
      throw new Error('New slot is fully booked');
    }

    if (newSlot.isPast()) {
      throw new Error('Cannot reschedule to a past slot');
    }

    // Update booking
    booking.slot_id = data.new_slot_id;
    await this.bookingRepository.save(booking);

    // Update old slot capacity
    const oldSlot = await this.slotRepository.findOne({
      where: { id: oldSlotId },
    });

    if (oldSlot) {
      oldSlot.decrementBooking();
      await this.slotRepository.save(oldSlot);
    }

    // Update new slot capacity
    newSlot.incrementBooking();
    await this.slotRepository.save(newSlot);

    return booking;
  }

  /**
   * Check-in booking
   */
  async checkInBooking(id: string): Promise<VaccinationBooking> {
    const booking = await this.getBooking(id);
    booking.checkIn();
    await this.bookingRepository.save(booking);
    return booking;
  }

  /**
   * Complete booking
   */
  async completeBooking(id: string): Promise<VaccinationBooking> {
    const booking = await this.getBooking(id);
    booking.complete();
    await this.bookingRepository.save(booking);
    return booking;
  }

  /**
   * Mark booking as no-show
   */
  async markNoShow(id: string): Promise<VaccinationBooking> {
    const booking = await this.getBooking(id);
    booking.markNoShow();
    await this.bookingRepository.save(booking);
    return booking;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Validate time range
   */
  private isValidTimeRange(startTime: string, endTime: string): boolean {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    return endMinutes > startMinutes;
  }
}
