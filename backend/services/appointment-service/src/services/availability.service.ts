/**
 * Availability Service
 * Manages provider availability slots and working hours
 */

import { Repository, IsNull } from 'typeorm';
import { AvailabilitySlot } from '../entities/AvailabilitySlot';
import {
  AvailabilitySlotCreateRequest,
  AvailabilitySlotUpdateRequest,
  AvailabilityListFilters,
  PaginationResult,
} from '../types/appointment.types';

export class AvailabilityService {
  constructor(private availabilityRepository: Repository<AvailabilitySlot>) {}

  /**
   * Create new availability slot
   */
  async createSlot(data: AvailabilitySlotCreateRequest): Promise<AvailabilitySlot> {
    // Validate day of week
    if (data.day_of_week < 0 || data.day_of_week > 6) {
      throw new Error('Invalid day of week (0-6)');
    }

    // Validate capacity
    if (data.capacity < 1) {
      throw new Error('Capacity must be at least 1');
    }

    // Check for duplicate slots at same time
    const existing = await this.availabilityRepository.findOne({
      where: {
        provider_id: data.provider_id,
        day_of_week: data.day_of_week,
      },
    });

    if (existing && !existing.isDeleted()) {
      throw new Error('Availability slot already exists for this day');
    }

    const slot = this.availabilityRepository.create({
      provider_id: data.provider_id,
      day_of_week: data.day_of_week,
      start_time: data.start_time,
      end_time: data.end_time,
      capacity: data.capacity,
      is_recurring: data.is_recurring,
      end_date: data.end_date || null,
      timezone: 'UTC',
      is_active: true,
      booked_count: 0,
    });

    await this.availabilityRepository.save(slot);
    return slot;
  }

  /**
   * Get availability slot by ID
   */
  async getSlotById(id: string): Promise<AvailabilitySlot> {
    const slot = await this.availabilityRepository.findOne({
      where: { id, deleted_at: IsNull() },
      relations: ['provider'],
    });

    if (!slot) {
      throw new Error('Availability slot not found');
    }

    return slot;
  }

  /**
   * Get all availability slots with filters
   */
  async listSlots(
    filters: AvailabilityListFilters
  ): Promise<PaginationResult<AvailabilitySlot>> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    let query = this.availabilityRepository.createQueryBuilder('slot');

    // Apply filters
    query = query.where('slot.deleted_at IS NULL');

    if (filters.provider_id) {
      query = query.andWhere('slot.provider_id = :provider_id', {
        provider_id: filters.provider_id,
      });
    }

    if (filters.day_of_week !== undefined) {
      query = query.andWhere('slot.day_of_week = :day_of_week', {
        day_of_week: filters.day_of_week,
      });
    }

    if (filters.is_active !== undefined) {
      query = query.andWhere('slot.is_active = :is_active', {
        is_active: filters.is_active,
      });
    }

    // Get total count
    const total = await query.getCount();

    // Apply pagination and sorting
    const slots = await query
      .leftJoinAndSelect('slot.provider', 'provider')
      .orderBy('slot.day_of_week', 'ASC')
      .addOrderBy('slot.start_time', 'ASC')
      .take(limit)
      .skip(skip)
      .getMany();

    return {
      data: slots,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get slots for a specific provider and day
   */
  async getProviderSlotsByDay(
    providerId: string,
    dayOfWeek: number
  ): Promise<AvailabilitySlot[]> {
    return this.availabilityRepository.find({
      where: {
        provider_id: providerId,
        day_of_week: dayOfWeek,
        deleted_at: IsNull(),
        is_active: true,
      },
      relations: ['provider'],
      order: { start_time: 'ASC' },
    });
  }

  /**
   * Get all active slots for a provider
   */
  async getProviderSlots(providerId: string): Promise<AvailabilitySlot[]> {
    return this.availabilityRepository.find({
      where: {
        provider_id: providerId,
        deleted_at: IsNull(),
        is_active: true,
      },
      relations: ['provider'],
      order: { day_of_week: 'ASC', start_time: 'ASC' },
    });
  }

  /**
   * Update availability slot
   */
  async updateSlot(
    id: string,
    data: AvailabilitySlotUpdateRequest
  ): Promise<AvailabilitySlot> {
    const slot = await this.getSlotById(id);

    // Update fields
    if (data.day_of_week !== undefined) {
      if (data.day_of_week < 0 || data.day_of_week > 6) {
        throw new Error('Invalid day of week (0-6)');
      }
      slot.day_of_week = data.day_of_week;
    }

    if (data.start_time !== undefined) {
      slot.start_time = data.start_time;
    }

    if (data.end_time !== undefined) {
      slot.end_time = data.end_time;
    }

    if (data.capacity !== undefined) {
      if (data.capacity < 1) {
        throw new Error('Capacity must be at least 1');
      }
      slot.capacity = data.capacity;
    }

    if (data.is_active !== undefined) {
      slot.is_active = data.is_active;
    }

    if (data.end_date !== undefined) {
      slot.end_date = data.end_date;
    }

    await this.availabilityRepository.save(slot);
    return slot;
  }

  /**
   * Block/unblock availability slot
   */
  async blockSlot(id: string, reason: string): Promise<AvailabilitySlot> {
    const slot = await this.getSlotById(id);
    slot.block(reason);
    await this.availabilityRepository.save(slot);
    return slot;
  }

  /**
   * Unblock availability slot
   */
  async unblockSlot(id: string): Promise<AvailabilitySlot> {
    const slot = await this.getSlotById(id);
    slot.unblock();
    await this.availabilityRepository.save(slot);
    return slot;
  }

  /**
   * Soft delete availability slot
   */
  async deleteSlot(id: string): Promise<void> {
    const slot = await this.getSlotById(id);
    slot.softDelete();
    await this.availabilityRepository.save(slot);
  }

  /**
   * Get available slots for a provider on a specific date
   */
  async getAvailableSlotsForDate(
    providerId: string,
    date: Date
  ): Promise<AvailabilitySlot[]> {
    const dayOfWeek = date.getDay();

    const slots = await this.availabilityRepository.find({
      where: {
        provider_id: providerId,
        day_of_week: dayOfWeek,
        deleted_at: IsNull(),
        is_active: true,
        is_blocked: false,
      },
      relations: ['provider'],
      order: { start_time: 'ASC' },
    });

    // Filter out slots that are fully booked or past their end_date
    return slots.filter((slot) => {
      const isAvailable = slot.isAvailable();
      const isStillRecurring = slot.isStillRecurring();
      return isAvailable && isStillRecurring;
    });
  }

  /**
   * Calculate free slots within a time range
   */
  async calculateFreeSlots(
    providerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const slots = await this.availabilityRepository.find({
      where: {
        provider_id: providerId,
        deleted_at: IsNull(),
        is_active: true,
        is_blocked: false,
      },
    });

    let totalFree = 0;

    // For each day in range, calculate free slots
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      const daySlots = slots.filter((s) => s.day_of_week === dayOfWeek);

      for (const slot of daySlots) {
        if (slot.isStillRecurring()) {
          totalFree += slot.getAvailableSpaces();
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return totalFree;
  }

  /**
   * Reserve slot capacity
   */
  async reserveSlot(slotId: string): Promise<AvailabilitySlot> {
    const slot = await this.getSlotById(slotId);

    if (slot.isFull()) {
      throw new Error('Slot is fully booked');
    }

    slot.reserve();
    await this.availabilityRepository.save(slot);
    return slot;
  }

  /**
   * Release slot capacity
   */
  async releaseSlot(slotId: string): Promise<AvailabilitySlot> {
    const slot = await this.getSlotById(slotId);
    slot.cancelReservation();
    await this.availabilityRepository.save(slot);
    return slot;
  }
}
