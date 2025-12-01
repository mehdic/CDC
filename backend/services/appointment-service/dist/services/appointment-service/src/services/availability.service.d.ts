/**
 * Availability Service
 * Manages provider availability slots and working hours
 */
import { Repository } from 'typeorm';
import { AvailabilitySlot } from '../entities/AvailabilitySlot';
import { AvailabilitySlotCreateRequest, AvailabilitySlotUpdateRequest, AvailabilityListFilters, PaginationResult } from '../types/appointment.types';
export declare class AvailabilityService {
    private availabilityRepository;
    constructor(availabilityRepository: Repository<AvailabilitySlot>);
    /**
     * Create new availability slot
     */
    createSlot(data: AvailabilitySlotCreateRequest): Promise<AvailabilitySlot>;
    /**
     * Get availability slot by ID
     */
    getSlotById(id: string): Promise<AvailabilitySlot>;
    /**
     * Get all availability slots with filters
     */
    listSlots(filters: AvailabilityListFilters): Promise<PaginationResult<AvailabilitySlot>>;
    /**
     * Get slots for a specific provider and day
     */
    getProviderSlotsByDay(providerId: string, dayOfWeek: number): Promise<AvailabilitySlot[]>;
    /**
     * Get all active slots for a provider
     */
    getProviderSlots(providerId: string): Promise<AvailabilitySlot[]>;
    /**
     * Update availability slot
     */
    updateSlot(id: string, data: AvailabilitySlotUpdateRequest): Promise<AvailabilitySlot>;
    /**
     * Block/unblock availability slot
     */
    blockSlot(id: string, reason: string): Promise<AvailabilitySlot>;
    /**
     * Unblock availability slot
     */
    unblockSlot(id: string): Promise<AvailabilitySlot>;
    /**
     * Soft delete availability slot
     */
    deleteSlot(id: string): Promise<void>;
    /**
     * Get available slots for a provider on a specific date
     */
    getAvailableSlotsForDate(providerId: string, date: Date): Promise<AvailabilitySlot[]>;
    /**
     * Calculate free slots within a time range
     */
    calculateFreeSlots(providerId: string, startDate: Date, endDate: Date): Promise<number>;
    /**
     * Reserve slot capacity
     */
    reserveSlot(slotId: string): Promise<AvailabilitySlot>;
    /**
     * Release slot capacity
     */
    releaseSlot(slotId: string): Promise<AvailabilitySlot>;
}
//# sourceMappingURL=availability.service.d.ts.map