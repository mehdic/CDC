/**
 * AvailabilitySlot Entity
 * Defines when healthcare professionals are available for appointments
 * Supports recurring slots (same time every week) and blocked time periods
 */
import { User } from '@shared/models/User';
export declare class AvailabilitySlot {
    id: string;
    provider_id: string;
    provider: User;
    day_of_week: number;
    start_time: string;
    end_time: string;
    capacity: number;
    timezone: string;
    is_recurring: boolean;
    end_date: Date | null;
    is_active: boolean;
    booked_count: number;
    full_until: Date | null;
    is_blocked: boolean;
    blocked_reason: string | null;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    /**
     * Check if slot is soft deleted
     */
    isDeleted(): boolean;
    /**
     * Soft delete slot
     */
    softDelete(): void;
    /**
     * Check if slot is available for booking
     */
    isAvailable(): boolean;
    /**
     * Check if slot capacity is full
     */
    isFull(): boolean;
    /**
     * Get available spaces in slot
     */
    getAvailableSpaces(): number;
    /**
     * Check if slot should still be available (for recurring slots with end_date)
     */
    isStillRecurring(): boolean;
    /**
     * Get day name for this slot
     */
    getDayName(): string;
    /**
     * Check if slot matches a specific date and day of week
     */
    matchesDate(date: Date): boolean;
    /**
     * Reserve a spot in this slot
     */
    reserve(): void;
    /**
     * Cancel a reservation in this slot
     */
    cancelReservation(): void;
    /**
     * Block this slot with a reason
     */
    block(reason: string): void;
    /**
     * Unblock this slot
     */
    unblock(): void;
}
//# sourceMappingURL=AvailabilitySlot.d.ts.map