/**
 * Reminder Service
 * Manages appointment reminders for patients and providers
 * Supports email, SMS, in-app notifications
 */
import { Repository } from 'typeorm';
import { AppointmentReminder } from '../entities/AppointmentReminder';
import { Appointment } from '../entities/Appointment';
import { ReminderType } from '../types/appointment.types';
export declare class ReminderService {
    private reminderRepository;
    private appointmentRepository;
    constructor(reminderRepository: Repository<AppointmentReminder>, appointmentRepository: Repository<Appointment>);
    /**
     * Create reminder for appointment
     */
    createReminder(appointmentId: string, recipientId: string, reminderType: ReminderType, hoursBeforeStart: number): Promise<AppointmentReminder>;
    /**
     * Get reminder by ID
     */
    getReminderById(id: string): Promise<AppointmentReminder>;
    /**
     * Get reminders for appointment
     */
    getAppointmentReminders(appointmentId: string): Promise<AppointmentReminder[]>;
    /**
     * Get reminders for recipient
     */
    getRecipientReminders(recipientId: string): Promise<AppointmentReminder[]>;
    /**
     * Get pending reminders (due to be sent)
     */
    getPendingReminders(): Promise<AppointmentReminder[]>;
    /**
     * Mark reminder as sent
     */
    markAsSent(id: string): Promise<AppointmentReminder>;
    /**
     * Mark reminder as failed
     */
    markAsFailed(id: string, reason: string): Promise<AppointmentReminder>;
    /**
     * Reset reminder for retry
     */
    resetForRetry(id: string): Promise<AppointmentReminder>;
    /**
     * Delete reminder
     */
    deleteReminder(id: string): Promise<void>;
    /**
     * Create default reminders for appointment (24h and 1h before)
     */
    createDefaultReminders(appointmentId: string, patientId: string, providerId: string): Promise<AppointmentReminder[]>;
    /**
     * Send all pending reminders (batch operation)
     */
    sendPendingReminders(): Promise<{
        sent: number;
        failed: number;
        errors: Array<{
            reminderId: string;
            error: string;
        }>;
    }>;
    /**
     * Get reminder statistics for appointment
     */
    getReminderStats(appointmentId: string): Promise<{
        total: number;
        sent: number;
        pending: number;
        failed: number;
    }>;
    /**
     * Clean up old completed reminders
     */
    cleanupOldReminders(daysOld?: number): Promise<number>;
    /**
     * Reschedule reminder for a different time
     */
    rescheduleReminder(id: string, newHoursBeforeStart: number): Promise<AppointmentReminder>;
}
//# sourceMappingURL=reminder.service.d.ts.map