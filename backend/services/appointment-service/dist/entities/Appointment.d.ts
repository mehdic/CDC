/**
 * Appointment Entity
 * Represents scheduled appointments between healthcare professionals and patients
 * Supports: teleconsultations, in-person visits, home visits
 * HIPAA/GDPR Compliant - Healthcare appointment data with audit logging
 */
import { User } from '@shared/models/User';
import { AppointmentReminder } from './AppointmentReminder';
import { AppointmentStatus, AppointmentType } from '../types/appointment.types';
export declare class Appointment {
    id: string;
    provider_id: string;
    provider: User;
    patient_id: string;
    patient: User;
    appointment_type: AppointmentType;
    status: AppointmentStatus;
    scheduled_start: Date;
    scheduled_end: Date;
    reason: string | null;
    notes: string | null;
    location: string | null;
    timezone: string;
    is_recurring: boolean;
    recurring_appointment_id: string | null;
    created_at: Date;
    updated_at: Date;
    confirmed_at: Date | null;
    started_at: Date | null;
    completed_at: Date | null;
    cancelled_at: Date | null;
    cancellation_reason: string | null;
    deleted_at: Date | null;
    reminders: AppointmentReminder[];
    /**
     * Check if appointment is soft deleted
     */
    isDeleted(): boolean;
    /**
     * Soft delete appointment
     */
    softDelete(): void;
    /**
     * Check if appointment is in the future
     */
    isFuture(): boolean;
    /**
     * Check if appointment has passed
     */
    isPast(): boolean;
    /**
     * Check if appointment is currently happening
     */
    isNow(): boolean;
    /**
     * Check if appointment can be cancelled
     */
    canBeCancelled(): boolean;
    /**
     * Get duration in minutes
     */
    getDurationMinutes(): number;
    /**
     * Check if appointment is within reminder window (hours before start)
     */
    isWithinReminderWindow(hoursBeforeStart: number): boolean;
}
//# sourceMappingURL=Appointment.d.ts.map