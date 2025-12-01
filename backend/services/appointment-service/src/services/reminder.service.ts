/**
 * Reminder Service
 * Manages appointment reminders for patients and providers
 * Supports email, SMS, in-app notifications
 */

import { Repository, LessThanOrEqual, IsNull } from 'typeorm';
import { AppointmentReminder } from '../entities/AppointmentReminder';
import { Appointment } from '../entities/Appointment';
import { ReminderStatus, ReminderType } from '../types/appointment.types';

export class ReminderService {
  constructor(
    private reminderRepository: Repository<AppointmentReminder>,
    private appointmentRepository: Repository<Appointment>
  ) {}

  /**
   * Create reminder for appointment
   */
  async createReminder(
    appointmentId: string,
    recipientId: string,
    reminderType: ReminderType,
    hoursBeforeStart: number
  ): Promise<AppointmentReminder> {
    // Get appointment to calculate scheduled time
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Calculate scheduled reminder time
    const scheduledAt = new Date(
      appointment.scheduled_start.getTime() -
        hoursBeforeStart * 3600000
    );

    // Check if reminder already exists
    const existing = await this.reminderRepository.findOne({
      where: {
        appointment_id: appointmentId,
        recipient_id: recipientId,
        reminder_type: reminderType,
        hours_before_start: hoursBeforeStart,
        deleted_at: IsNull(),
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
      status: ReminderStatus.PENDING,
    });

    await this.reminderRepository.save(reminder);
    return reminder;
  }

  /**
   * Get reminder by ID
   */
  async getReminderById(id: string): Promise<AppointmentReminder> {
    const reminder = await this.reminderRepository.findOne({
      where: { id, deleted_at: IsNull() },
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
  async getAppointmentReminders(
    appointmentId: string
  ): Promise<AppointmentReminder[]> {
    return this.reminderRepository.find({
      where: { appointment_id: appointmentId, deleted_at: IsNull() },
      relations: ['recipient'],
      order: { scheduled_at: 'ASC' },
    });
  }

  /**
   * Get reminders for recipient
   */
  async getRecipientReminders(recipientId: string): Promise<AppointmentReminder[]> {
    return this.reminderRepository.find({
      where: { recipient_id: recipientId, deleted_at: IsNull() },
      relations: ['appointment'],
      order: { scheduled_at: 'ASC' },
    });
  }

  /**
   * Get pending reminders (due to be sent)
   */
  async getPendingReminders(): Promise<AppointmentReminder[]> {
    const now = new Date();

    return this.reminderRepository.find({
      where: {
        status: ReminderStatus.PENDING,
        scheduled_at: LessThanOrEqual(now),
        deleted_at: IsNull(),
      },
      relations: ['appointment', 'recipient'],
      order: { scheduled_at: 'ASC' },
    });
  }

  /**
   * Mark reminder as sent
   */
  async markAsSent(id: string): Promise<AppointmentReminder> {
    const reminder = await this.getReminderById(id);
    reminder.markAsSent();
    await this.reminderRepository.save(reminder);
    return reminder;
  }

  /**
   * Mark reminder as failed
   */
  async markAsFailed(
    id: string,
    reason: string
  ): Promise<AppointmentReminder> {
    const reminder = await this.getReminderById(id);
    reminder.markAsFailed(reason);
    await this.reminderRepository.save(reminder);
    return reminder;
  }

  /**
   * Reset reminder for retry
   */
  async resetForRetry(id: string): Promise<AppointmentReminder> {
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
  async deleteReminder(id: string): Promise<void> {
    const reminder = await this.getReminderById(id);
    reminder.softDelete();
    await this.reminderRepository.save(reminder);
  }

  /**
   * Create default reminders for appointment (24h and 1h before)
   */
  async createDefaultReminders(
    appointmentId: string,
    patientId: string,
    providerId: string
  ): Promise<AppointmentReminder[]> {
    const reminders: AppointmentReminder[] = [];

    // 24 hour reminder for patient
    const reminder24h = await this.createReminder(
      appointmentId,
      patientId,
      ReminderType.IN_APP,
      24
    );
    reminders.push(reminder24h);

    // 1 hour reminder for patient
    const reminder1h = await this.createReminder(
      appointmentId,
      patientId,
      ReminderType.NOTIFICATION,
      1
    );
    reminders.push(reminder1h);

    // 24 hour reminder for provider
    const providerReminder24h = await this.createReminder(
      appointmentId,
      providerId,
      ReminderType.IN_APP,
      24
    );
    reminders.push(providerReminder24h);

    // 1 hour reminder for provider
    const providerReminder1h = await this.createReminder(
      appointmentId,
      providerId,
      ReminderType.NOTIFICATION,
      1
    );
    reminders.push(providerReminder1h);

    return reminders;
  }

  /**
   * Send all pending reminders (batch operation)
   */
  async sendPendingReminders(): Promise<{
    sent: number;
    failed: number;
    errors: Array<{ reminderId: string; error: string }>;
  }> {
    const pendingReminders = await this.getPendingReminders();

    let sent = 0;
    let failed = 0;
    const errors: Array<{ reminderId: string; error: string }> = [];

    for (const reminder of pendingReminders) {
      try {
        // In a real implementation, this would send via email, SMS, etc.
        // For now, we just mark as sent
        await this.markAsSent(reminder.id);
        sent++;
      } catch (error) {
        failed++;
        errors.push({
          reminderId: reminder.id,
          error: (error as Error).message,
        });
        await this.markAsFailed(reminder.id, (error as Error).message);
      }
    }

    return { sent, failed, errors };
  }

  /**
   * Get reminder statistics for appointment
   */
  async getReminderStats(appointmentId: string): Promise<{
    total: number;
    sent: number;
    pending: number;
    failed: number;
  }> {
    const reminders = await this.getAppointmentReminders(appointmentId);

    const stats = {
      total: reminders.length,
      sent: reminders.filter((r) => r.status === ReminderStatus.SENT).length,
      pending: reminders.filter((r) => r.status === ReminderStatus.PENDING)
        .length,
      failed: reminders.filter((r) => r.status === ReminderStatus.FAILED)
        .length,
    };

    return stats;
  }

  /**
   * Clean up old completed reminders
   */
  async cleanupOldReminders(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const reminders = await this.reminderRepository.find({
      where: {
        deleted_at: IsNull(),
        status: ReminderStatus.SENT,
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
  async rescheduleReminder(
    id: string,
    newHoursBeforeStart: number
  ): Promise<AppointmentReminder> {
    const reminder = await this.getReminderById(id);

    if (reminder.status === ReminderStatus.SENT) {
      throw new Error('Cannot reschedule already sent reminder');
    }

    reminder.hours_before_start = newHoursBeforeStart;
    reminder.scheduled_at = new Date(
      reminder.appointment.scheduled_start.getTime() -
        newHoursBeforeStart * 3600000
    );

    await this.reminderRepository.save(reminder);
    return reminder;
  }
}
