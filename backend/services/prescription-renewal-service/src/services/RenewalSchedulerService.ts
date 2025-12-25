/**
 * Renewal Scheduler Service
 * Business logic for scheduling and sending renewal reminders
 * Task: T8-055
 */

import { DataSource, Repository, LessThanOrEqual } from 'typeorm';
import { RenewalReminder, ReminderChannel } from '../models/RenewalReminder';
import { RenewalPrediction } from '../models/RenewalPrediction';

// ============================================================================
// DTOs
// ============================================================================

export interface CreateReminderRequest {
  predictionId: string;
  patientId: string;
  scheduledFor: Date;
  channel: ReminderChannel;
  message: string;
}

export interface SendReminderRequest {
  reminderId: string;
  provider?: string;
}

export interface ReminderDeliveryResult {
  success: boolean;
  messageId?: string;
  deliveryStatus?: string;
  errorMessage?: string;
}

// ============================================================================
// Service
// ============================================================================

export class RenewalSchedulerService {
  private repository: Repository<RenewalReminder>;
  private predictionRepository: Repository<RenewalPrediction>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(RenewalReminder);
    this.predictionRepository = dataSource.getRepository(RenewalPrediction);
  }

  /**
   * Create a renewal reminder for a prediction
   */
  async createReminder(request: CreateReminderRequest): Promise<RenewalReminder> {
    // Validate inputs
    if (!request.predictionId || !request.patientId) {
      throw new Error('Missing required fields: predictionId, patientId');
    }

    if (!request.scheduledFor || !request.channel || !request.message) {
      throw new Error('Missing required fields: scheduledFor, channel, message');
    }

    // Verify prediction exists
    const prediction = await this.predictionRepository.findOne({
      where: { id: request.predictionId },
    });

    if (!prediction) {
      throw new Error(`Prediction not found: ${request.predictionId}`);
    }

    // Create reminder
    const reminder = this.repository.create({
      predictionId: request.predictionId,
      patientId: request.patientId,
      scheduledFor: request.scheduledFor,
      channel: request.channel,
      message: request.message,
      status: 'scheduled',
      retryCount: 0,
      maxRetries: 3,
    });

    return this.repository.save(reminder);
  }

  /**
   * Schedule reminders for an approved prediction
   * Creates multiple reminders at strategic intervals
   */
  async scheduleRemindersForPrediction(predictionId: string): Promise<RenewalReminder[]> {
    const prediction = await this.predictionRepository.findOne({
      where: { id: predictionId },
    });

    if (!prediction) {
      throw new Error(`Prediction not found: ${predictionId}`);
    }

    if (prediction.status !== 'approved') {
      throw new Error(`Prediction must be approved before scheduling reminders: ${predictionId}`);
    }

    const reminders: RenewalReminder[] = [];

    // Schedule reminder 7 days before predicted date
    const sevenDaysBefore = new Date(prediction.predictedDate);
    sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);

    if (sevenDaysBefore > new Date()) {
      reminders.push(
        await this.createReminder({
          predictionId: prediction.id,
          patientId: prediction.patientId,
          scheduledFor: sevenDaysBefore,
          channel: 'email',
          message: this.generateReminderMessage(prediction, 7),
        })
      );
    }

    // Schedule reminder 3 days before predicted date
    const threeDaysBefore = new Date(prediction.predictedDate);
    threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);

    if (threeDaysBefore > new Date()) {
      reminders.push(
        await this.createReminder({
          predictionId: prediction.id,
          patientId: prediction.patientId,
          scheduledFor: threeDaysBefore,
          channel: 'push',
          message: this.generateReminderMessage(prediction, 3),
        })
      );
    }

    // Schedule reminder on predicted date
    if (prediction.predictedDate > new Date()) {
      reminders.push(
        await this.createReminder({
          predictionId: prediction.id,
          patientId: prediction.patientId,
          scheduledFor: prediction.predictedDate,
          channel: 'sms',
          message: this.generateReminderMessage(prediction, 0),
        })
      );
    }

    return reminders;
  }

  /**
   * Generate reminder message based on days until renewal
   */
  private generateReminderMessage(_prediction: RenewalPrediction, daysUntil: number): string {
    if (daysUntil === 0) {
      return `Your prescription renewal is ready today. Please contact your pharmacy to process the renewal.`;
    }

    return `Reminder: Your prescription renewal is predicted in ${daysUntil} days. Please plan accordingly.`;
  }

  /**
   * Get due reminders (scheduled for now or earlier)
   */
  async getDueReminders(): Promise<RenewalReminder[]> {
    const now = new Date();

    return this.repository.find({
      where: {
        status: 'scheduled',
        scheduledFor: LessThanOrEqual(now),
      },
      order: { scheduledFor: 'ASC' },
    });
  }

  /**
   * Send a reminder via appropriate channel
   * MVP: Logs to console
   * Future: Integrate with Twilio, SendGrid, Firebase Cloud Messaging
   */
  async sendReminder(request: SendReminderRequest): Promise<ReminderDeliveryResult> {
    const reminder = await this.repository.findOne({
      where: { id: request.reminderId },
      relations: ['prediction'],
    });

    if (!reminder) {
      throw new Error(`Reminder not found: ${request.reminderId}`);
    }

    if (reminder.status === 'sent') {
      throw new Error(`Reminder already sent: ${request.reminderId}`);
    }

    // MVP: Simulate sending (log to console)
    // Future: Integrate with actual providers
    try {
      const result = await this.simulateDelivery(reminder, request.provider);

      // Update reminder status
      reminder.status = result.success ? 'sent' : 'failed';
      reminder.sentAt = new Date();
      reminder.deliveryMetadata = {
        provider: request.provider || 'mock',
        messageId: result.messageId,
        deliveryStatus: result.deliveryStatus,
        errorMessage: result.errorMessage,
      };

      if (!result.success) {
        reminder.retryCount += 1;

        // Revert to scheduled if retries available
        if (reminder.retryCount < reminder.maxRetries) {
          reminder.status = 'scheduled';
          // Reschedule for 5 minutes later
          reminder.scheduledFor = new Date(Date.now() + 5 * 60 * 1000);
        }
      }

      await this.repository.save(reminder);

      return result;
    } catch (error) {
      // Handle delivery failure
      reminder.status = 'failed';
      reminder.retryCount += 1;
      reminder.deliveryMetadata = {
        provider: request.provider || 'mock',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };

      await this.repository.save(reminder);

      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Simulate delivery for MVP
   * Future: Replace with actual provider integrations
   */
  private async simulateDelivery(
    reminder: RenewalReminder,
    provider?: string
  ): Promise<ReminderDeliveryResult> {
    console.log(`[REMINDER] Channel: ${reminder.channel}, Patient: ${reminder.patientId}`);
    console.log(`[REMINDER] Message: ${reminder.message}`);
    console.log(`[REMINDER] Provider: ${provider || 'mock'}`);

    // Simulate 95% success rate
    const success = Math.random() > 0.05;

    if (success) {
      return {
        success: true,
        messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        deliveryStatus: 'delivered',
      };
    }

    return {
      success: false,
      deliveryStatus: 'failed',
      errorMessage: 'Simulated delivery failure',
    };
  }

  /**
   * Process all due reminders
   */
  async processDueReminders(): Promise<{ sent: number; failed: number }> {
    const dueReminders = await this.getDueReminders();

    let sent = 0;
    let failed = 0;

    for (const reminder of dueReminders) {
      try {
        const result = await this.sendReminder({ reminderId: reminder.id });
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Failed to send reminder ${reminder.id}:`, error);
        failed++;
      }
    }

    return { sent, failed };
  }

  /**
   * Get reminders for a patient
   */
  async getRemindersForPatient(patientId: string): Promise<RenewalReminder[]> {
    return this.repository.find({
      where: { patientId },
      order: { scheduledFor: 'DESC' },
    });
  }

  /**
   * Cancel a scheduled reminder
   */
  async cancelReminder(reminderId: string): Promise<RenewalReminder> {
    const reminder = await this.repository.findOne({
      where: { id: reminderId },
    });

    if (!reminder) {
      throw new Error(`Reminder not found: ${reminderId}`);
    }

    if (reminder.status === 'sent') {
      throw new Error(`Cannot cancel sent reminder: ${reminderId}`);
    }

    reminder.status = 'cancelled';
    return this.repository.save(reminder);
  }
}
