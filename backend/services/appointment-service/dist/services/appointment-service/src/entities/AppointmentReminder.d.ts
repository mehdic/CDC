/**
 * AppointmentReminder Entity
 * Tracks reminders sent to patients and providers for upcoming appointments
 * Supports multiple reminder types: email, SMS, in-app, notifications
 */
import { User } from '@shared/models/User';
import { Appointment } from './Appointment';
import { ReminderStatus, ReminderType } from '../types/appointment.types';
export declare class AppointmentReminder {
    id: string;
    appointment_id: string;
    appointment: Appointment;
    recipient_id: string;
    recipient: User;
    reminder_type: ReminderType;
    status: ReminderStatus;
    hours_before_start: number;
    scheduled_at: Date;
    sent_at: Date | null;
    failed_reason: string | null;
    retry_count: number;
    deleted_at: Date | null;
    created_at: Date;
    updated_at: Date;
    /**
     * Check if reminder is soft deleted
     */
    isDeleted(): boolean;
    /**
     * Soft delete reminder
     */
    softDelete(): void;
    /**
     * Check if reminder is due to be sent
     */
    isDue(): boolean;
    /**
     * Check if reminder has been sent
     */
    hasBeenSent(): boolean;
    /**
     * Check if reminder failed to send
     */
    hasFailed(): boolean;
    /**
     * Mark reminder as sent
     */
    markAsSent(): void;
    /**
     * Mark reminder as failed
     */
    markAsFailed(reason: string): void;
    /**
     * Reset reminder for retry
     */
    resetForRetry(): void;
}
//# sourceMappingURL=AppointmentReminder.d.ts.map