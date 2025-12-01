"use strict";
/**
 * Reminder Service
 * Manages appointment reminders for patients and providers
 * Supports email, SMS, in-app notifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderService = void 0;
const typeorm_1 = require("typeorm");
const appointment_types_1 = require("../types/appointment.types");
class ReminderService {
    constructor(reminderRepository, appointmentRepository) {
        this.reminderRepository = reminderRepository;
        this.appointmentRepository = appointmentRepository;
    }
    /**
     * Create reminder for appointment
     */
    async createReminder(appointmentId, recipientId, reminderType, hoursBeforeStart) {
        // Get appointment to calculate scheduled time
        const appointment = await this.appointmentRepository.findOne({
            where: { id: appointmentId },
        });
        if (!appointment) {
            throw new Error('Appointment not found');
        }
        // Calculate scheduled reminder time
        const scheduledAt = new Date(appointment.scheduled_start.getTime() -
            hoursBeforeStart * 3600000);
        // Check if reminder already exists
        const existing = await this.reminderRepository.findOne({
            where: {
                appointment_id: appointmentId,
                recipient_id: recipientId,
                reminder_type: reminderType,
                hours_before_start: hoursBeforeStart,
                deleted_at: (0, typeorm_1.IsNull)(),
            },
        });
        if (existing) {
            throw new Error('Reminder already exists for this appointment');
        }
        const reminder = this.reminderRepository.create({
            appointment_id: appointmentId,
            recipient_id: recipientId,
            reminder_type: reminderType,
            hours_before_start: hoursBeforeStart,
            scheduled_at: scheduledAt,
            status: appointment_types_1.ReminderStatus.PENDING,
        });
        await this.reminderRepository.save(reminder);
        return reminder;
    }
    /**
     * Get reminder by ID
     */
    async getReminderById(id) {
        const reminder = await this.reminderRepository.findOne({
            where: { id, deleted_at: (0, typeorm_1.IsNull)() },
            relations: ['appointment', 'recipient'],
        });
        if (!reminder) {
            throw new Error('Reminder not found');
        }
        return reminder;
    }
    /**
     * Get reminders for appointment
     */
    async getAppointmentReminders(appointmentId) {
        return this.reminderRepository.find({
            where: { appointment_id: appointmentId, deleted_at: (0, typeorm_1.IsNull)() },
            relations: ['recipient'],
            order: { scheduled_at: 'ASC' },
        });
    }
    /**
     * Get reminders for recipient
     */
    async getRecipientReminders(recipientId) {
        return this.reminderRepository.find({
            where: { recipient_id: recipientId, deleted_at: (0, typeorm_1.IsNull)() },
            relations: ['appointment'],
            order: { scheduled_at: 'ASC' },
        });
    }
    /**
     * Get pending reminders (due to be sent)
     */
    async getPendingReminders() {
        const now = new Date();
        return this.reminderRepository.find({
            where: {
                status: appointment_types_1.ReminderStatus.PENDING,
                scheduled_at: (0, typeorm_1.LessThanOrEqual)(now),
                deleted_at: (0, typeorm_1.IsNull)(),
            },
            relations: ['appointment', 'recipient'],
            order: { scheduled_at: 'ASC' },
        });
    }
    /**
     * Mark reminder as sent
     */
    async markAsSent(id) {
        const reminder = await this.getReminderById(id);
        reminder.markAsSent();
        await this.reminderRepository.save(reminder);
        return reminder;
    }
    /**
     * Mark reminder as failed
     */
    async markAsFailed(id, reason) {
        const reminder = await this.getReminderById(id);
        reminder.markAsFailed(reason);
        await this.reminderRepository.save(reminder);
        return reminder;
    }
    /**
     * Reset reminder for retry
     */
    async resetForRetry(id) {
        const reminder = await this.getReminderById(id);
        if (reminder.retry_count >= 3) {
            throw new Error('Maximum retry attempts exceeded');
        }
        reminder.resetForRetry();
        await this.reminderRepository.save(reminder);
        return reminder;
    }
    /**
     * Delete reminder
     */
    async deleteReminder(id) {
        const reminder = await this.getReminderById(id);
        reminder.softDelete();
        await this.reminderRepository.save(reminder);
    }
    /**
     * Create default reminders for appointment (24h and 1h before)
     */
    async createDefaultReminders(appointmentId, patientId, providerId) {
        const reminders = [];
        // 24 hour reminder for patient
        const reminder24h = await this.createReminder(appointmentId, patientId, appointment_types_1.ReminderType.IN_APP, 24);
        reminders.push(reminder24h);
        // 1 hour reminder for patient
        const reminder1h = await this.createReminder(appointmentId, patientId, appointment_types_1.ReminderType.NOTIFICATION, 1);
        reminders.push(reminder1h);
        // 24 hour reminder for provider
        const providerReminder24h = await this.createReminder(appointmentId, providerId, appointment_types_1.ReminderType.IN_APP, 24);
        reminders.push(providerReminder24h);
        // 1 hour reminder for provider
        const providerReminder1h = await this.createReminder(appointmentId, providerId, appointment_types_1.ReminderType.NOTIFICATION, 1);
        reminders.push(providerReminder1h);
        return reminders;
    }
    /**
     * Send all pending reminders (batch operation)
     */
    async sendPendingReminders() {
        const pendingReminders = await this.getPendingReminders();
        let sent = 0;
        let failed = 0;
        const errors = [];
        for (const reminder of pendingReminders) {
            try {
                // In a real implementation, this would send via email, SMS, etc.
                // For now, we just mark as sent
                await this.markAsSent(reminder.id);
                sent++;
            }
            catch (error) {
                failed++;
                errors.push({
                    reminderId: reminder.id,
                    error: error.message,
                });
                await this.markAsFailed(reminder.id, error.message);
            }
        }
        return { sent, failed, errors };
    }
    /**
     * Get reminder statistics for appointment
     */
    async getReminderStats(appointmentId) {
        const reminders = await this.getAppointmentReminders(appointmentId);
        const stats = {
            total: reminders.length,
            sent: reminders.filter((r) => r.status === appointment_types_1.ReminderStatus.SENT).length,
            pending: reminders.filter((r) => r.status === appointment_types_1.ReminderStatus.PENDING)
                .length,
            failed: reminders.filter((r) => r.status === appointment_types_1.ReminderStatus.FAILED)
                .length,
        };
        return stats;
    }
    /**
     * Clean up old completed reminders
     */
    async cleanupOldReminders(daysOld = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        const reminders = await this.reminderRepository.find({
            where: {
                deleted_at: (0, typeorm_1.IsNull)(),
                status: appointment_types_1.ReminderStatus.SENT,
            },
            relations: ['appointment'],
        });
        let deleted = 0;
        for (const reminder of reminders) {
            if (reminder.sent_at && new Date(reminder.sent_at) < cutoffDate) {
                reminder.softDelete();
                await this.reminderRepository.save(reminder);
                deleted++;
            }
        }
        return deleted;
    }
    /**
     * Reschedule reminder for a different time
     */
    async rescheduleReminder(id, newHoursBeforeStart) {
        const reminder = await this.getReminderById(id);
        if (reminder.status === appointment_types_1.ReminderStatus.SENT) {
            throw new Error('Cannot reschedule already sent reminder');
        }
        reminder.hours_before_start = newHoursBeforeStart;
        reminder.scheduled_at = new Date(reminder.appointment.scheduled_start.getTime() -
            newHoursBeforeStart * 3600000);
        await this.reminderRepository.save(reminder);
        return reminder;
    }
}
exports.ReminderService = ReminderService;
//# sourceMappingURL=reminder.service.js.map