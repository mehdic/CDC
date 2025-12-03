/**
 * Availability Service
 * Business logic for slot availability tracking and calendar management
 * Handles capacity tracking, conflict detection, and availability queries
 */

import { Repository, Between, IsNull, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { VaccinationSlot } from '../entities/VaccinationSlot';
import { VaccinationBooking } from '../entities/VaccinationBooking';
import {
  SlotAvailabilityFilters,
  SlotAvailabilityResponse,
  CalendarDayResponse,
  PharmacyVaccinationStats,
  VaccinationSlotStatus,
  BookingStatus,
} from '../types/vaccination.types';

export class AvailabilityService {
  constructor(
    private slotRepository: Repository<VaccinationSlot>,
    private bookingRepository: Repository<VaccinationBooking>
  ) {}

  /**
   * Get available slots with filters
   */
  async getAvailableSlots(
    filters: SlotAvailabilityFilters
  ): Promise<SlotAvailabilityResponse[]> {
    let query = this.slotRepository.createQueryBuilder('slot');

    query = query
      .where('slot.deleted_at IS NULL')
      .andWhere('slot.pharmacy_id = :pharmacy_id', {
        pharmacy_id: filters.pharmacy_id,
      })
      .andWhere('slot.slot_date BETWEEN :start_date AND :end_date', {
        start_date: filters.start_date,
        end_date: filters.end_date,
      });

    if (filters.vaccine_type) {
      query = query
        .leftJoinAndSelect('slot.template', 'template')
        .andWhere('template.vaccine_type = :vaccine_type', {
          vaccine_type: filters.vaccine_type,
        });
    }

    if (filters.only_available) {
      query = query
        .andWhere('slot.booked_count < slot.capacity')
        .andWhere('slot.start_time > :now', { now: new Date() });
    }

    const slots = await query.orderBy('slot.start_time', 'ASC').getMany();

    // Transform to response format
    return slots.map((slot) => ({
      slot_id: slot.id,
      slot_date: slot.slot_date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      vaccine_type: slot.template?.vaccine_type || ('UNKNOWN' as any),
      capacity: slot.capacity,
      booked_count: slot.booked_count,
      available_spots: slot.getRemainingCapacity(),
      status: slot.status,
    }));
  }

  /**
   * Get calendar view for a pharmacy
   */
  async getPharmacyCalendar(
    pharmacyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarDayResponse[]> {
    const slots = await this.slotRepository.find({
      where: {
        pharmacy_id: pharmacyId,
        slot_date: Between(startDate, endDate),
        deleted_at: IsNull(),
      },
      relations: ['template', 'bookings'],
      order: { slot_date: 'ASC', start_time: 'ASC' },
    });

    // Group by date
    const slotsByDate = new Map<string, VaccinationSlot[]>();

    for (const slot of slots) {
      const dateKey = slot.slot_date.toISOString().split('T')[0];
      if (!slotsByDate.has(dateKey)) {
        slotsByDate.set(dateKey, []);
      }
      slotsByDate.get(dateKey)!.push(slot);
    }

    // Build calendar response
    const calendar: CalendarDayResponse[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const daySlots = slotsByDate.get(dateKey) || [];

      const slotResponses: SlotAvailabilityResponse[] = daySlots.map((slot) => ({
        slot_id: slot.id,
        slot_date: slot.slot_date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        vaccine_type: slot.template?.vaccine_type || ('UNKNOWN' as any),
        capacity: slot.capacity,
        booked_count: slot.booked_count,
        available_spots: slot.getRemainingCapacity(),
        status: slot.status,
      }));

      const totalBookings = daySlots.reduce(
        (sum, slot) => sum + slot.booked_count,
        0
      );

      calendar.push({
        date: new Date(currentDate),
        slots: slotResponses,
        total_slots: daySlots.length,
        total_bookings: totalBookings,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return calendar;
  }

  /**
   * Check if slot has capacity
   */
  async checkSlotCapacity(slotId: string): Promise<boolean> {
    const slot = await this.slotRepository.findOne({
      where: { id: slotId, deleted_at: IsNull() },
    });

    if (!slot) {
      return false;
    }

    return slot.hasAvailableCapacity();
  }

  /**
   * Get pharmacy vaccination statistics
   */
  async getPharmacyStats(
    pharmacyId: string,
    month?: Date
  ): Promise<PharmacyVaccinationStats> {
    const targetMonth = month || new Date();
    const startOfMonth = new Date(
      targetMonth.getFullYear(),
      targetMonth.getMonth(),
      1
    );
    const endOfMonth = new Date(
      targetMonth.getFullYear(),
      targetMonth.getMonth() + 1,
      0
    );

    // Get total slots this month
    const totalSlots = await this.slotRepository.count({
      where: {
        pharmacy_id: pharmacyId,
        slot_date: Between(startOfMonth, endOfMonth),
        deleted_at: IsNull(),
      },
    });

    // Get all bookings this month
    const bookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.slot', 'slot')
      .where('slot.pharmacy_id = :pharmacy_id', { pharmacy_id: pharmacyId })
      .andWhere('slot.slot_date BETWEEN :start AND :end', {
        start: startOfMonth,
        end: endOfMonth,
      })
      .andWhere('booking.deleted_at IS NULL')
      .getMany();

    const totalBookings = bookings.length;

    // Calculate completion rate
    const completedBookings = bookings.filter(
      (b) => b.status === BookingStatus.COMPLETED
    ).length;
    const completionRate =
      totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

    // Calculate no-show rate
    const noShowBookings = bookings.filter(
      (b) => b.status === BookingStatus.NO_SHOW
    ).length;
    const noShowRate =
      totalBookings > 0 ? (noShowBookings / totalBookings) * 100 : 0;

    // Vaccine type breakdown
    const vaccineTypeMap = new Map<string, number>();
    bookings.forEach((booking) => {
      const type = booking.vaccine_type;
      vaccineTypeMap.set(type, (vaccineTypeMap.get(type) || 0) + 1);
    });

    const vaccineTypeBreakdown = Array.from(vaccineTypeMap.entries()).map(
      ([vaccine_type, count]) => ({
        vaccine_type: vaccine_type as any,
        count,
      })
    );

    return {
      total_templates: 0, // This would require counting templates
      total_slots_this_month: totalSlots,
      total_bookings_this_month: totalBookings,
      completion_rate: Math.round(completionRate * 100) / 100,
      no_show_rate: Math.round(noShowRate * 100) / 100,
      vaccine_type_breakdown: vaccineTypeBreakdown,
    };
  }

  /**
   * Update all slot statuses (scheduled job helper)
   */
  async updateSlotStatuses(): Promise<number> {
    const slots = await this.slotRepository.find({
      where: {
        deleted_at: IsNull(),
      },
    });

    let updated = 0;

    for (const slot of slots) {
      const oldStatus = slot.status;
      slot.updateStatus();

      if (oldStatus !== slot.status) {
        await this.slotRepository.save(slot);
        updated++;
      }
    }

    return updated;
  }

  /**
   * Find next available slot for a vaccine type
   */
  async findNextAvailableSlot(
    pharmacyId: string,
    vaccineType: string
  ): Promise<VaccinationSlot | null> {
    const slot = await this.slotRepository
      .createQueryBuilder('slot')
      .leftJoinAndSelect('slot.template', 'template')
      .where('slot.pharmacy_id = :pharmacy_id', { pharmacy_id: pharmacyId })
      .andWhere('slot.deleted_at IS NULL')
      .andWhere('slot.start_time > :now', { now: new Date() })
      .andWhere('slot.booked_count < slot.capacity')
      .andWhere('template.vaccine_type = :vaccine_type', { vaccine_type: vaccineType })
      .orderBy('slot.start_time', 'ASC')
      .getOne();

    return slot || null;
  }

  /**
   * Check for booking conflicts (same patient, overlapping time)
   */
  async checkBookingConflicts(
    patientId: string,
    slotId: string
  ): Promise<boolean> {
    const targetSlot = await this.slotRepository.findOne({
      where: { id: slotId, deleted_at: IsNull() },
    });

    if (!targetSlot) {
      return false;
    }

    // Find all active bookings for patient
    const existingBookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.slot', 'slot')
      .where('booking.patient_id = :patient_id', { patient_id: patientId })
      .andWhere('booking.deleted_at IS NULL')
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN],
      })
      .andWhere(
        '(slot.start_time < :end_time AND slot.end_time > :start_time)',
        {
          start_time: targetSlot.start_time,
          end_time: targetSlot.end_time,
        }
      )
      .getMany();

    return existingBookings.length > 0;
  }
}
