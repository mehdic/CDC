/**
 * Teleconsultation Reminder Worker
 * Sends appointment reminders using Bull queue
 * Task: T150
 * FR-022: System MUST send reminder notifications 24 hours and 15 minutes before
 */

import Queue from 'bull';
import { DataSource } from 'typeorm';
import { Teleconsultation, TeleconsultationStatus } from '../../../../shared/models/Teleconsultation';
import { User } from '../../../../shared/models/User';
import { subHours, subMinutes, isBefore } from 'date-fns';

// Redis configuration for Bull queue
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Bull queue for reminders
export const reminderQueue = new Queue('teleconsultation-reminders', REDIS_URL);

export interface ReminderJob {
  teleconsultation_id: string;
  type: '24_hour' | '15_minute';
}

/**
 * Schedule reminder jobs for a teleconsultation
 * Called when booking is created (from book.ts)
 */
export async function scheduleReminders(
  teleconsultation: Teleconsultation
): Promise<void> {
  const scheduledAt = new Date(teleconsultation.scheduled_at);
  const now = new Date();

  // Schedule 24-hour reminder
  const reminder24h = subHours(scheduledAt, 24);
  if (isBefore(now, reminder24h)) {
    const delay = reminder24h.getTime() - now.getTime();

    await reminderQueue.add(
      {
        teleconsultation_id: teleconsultation.id,
        type: '24_hour',
      },
      {
        delay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000, // 1 minute
        },
      }
    );

    console.log(
      `[Reminder] Scheduled 24-hour reminder for teleconsultation ${teleconsultation.id}`
    );
  }

  // Schedule 15-minute reminder
  const reminder15min = subMinutes(scheduledAt, 15);
  if (isBefore(now, reminder15min)) {
    const delay = reminder15min.getTime() - now.getTime();

    await reminderQueue.add(
      {
        teleconsultation_id: teleconsultation.id,
        type: '15_minute',
      },
      {
        delay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 30000, // 30 seconds
        },
      }
    );

    console.log(
      `[Reminder] Scheduled 15-minute reminder for teleconsultation ${teleconsultation.id}`
    );
  }
}

/**
 * Process reminder job
 * Sends notification to patient and pharmacist
 */
export async function processReminderJob(
  job: Queue.Job<ReminderJob>,
  dataSource: DataSource
): Promise<void> {
  const { teleconsultation_id, type } = job.data;

  try {
    const teleconsultationRepo = dataSource.getRepository(Teleconsultation);
    const userRepo = dataSource.getRepository(User);

    // Fetch teleconsultation
    const teleconsultation = await teleconsultationRepo.findOne({
      where: { id: teleconsultation_id },
      relations: ['patient', 'pharmacist'],
    });

    if (!teleconsultation) {
      console.error(`[Reminder] Teleconsultation ${teleconsultation_id} not found`);
      return;
    }

    // Skip if cancelled
    if (teleconsultation.status !== TeleconsultationStatus.SCHEDULED) {
      console.log(
        `[Reminder] Skipping reminder - teleconsultation ${teleconsultation_id} is ${teleconsultation.status}`
      );
      return;
    }

    // Send notifications (would integrate with Notification Service in production)
    const reminderMessage =
      type === '24_hour'
        ? 'Your teleconsultation is scheduled for tomorrow'
        : 'Your teleconsultation starts in 15 minutes';

    console.log(
      `[Reminder] Sending ${type} reminder for teleconsultation ${teleconsultation_id}`
    );
    console.log(`  → Patient: ${teleconsultation.patient_id}`);
    console.log(`  → Pharmacist: ${teleconsultation.pharmacist_id}`);
    console.log(`  → Message: ${reminderMessage}`);

    // TODO: Call Notification Service to send actual notifications
    // await notificationService.send({
    //   user_ids: [teleconsultation.patient_id, teleconsultation.pharmacist_id],
    //   type: 'teleconsultation_reminder',
    //   message: reminderMessage,
    //   data: { teleconsultation_id },
    // });
  } catch (error) {
    console.error('[Reminder] Error processing reminder job:', error);
    throw error; // Will trigger retry
  }
}

/**
 * Initialize reminder worker
 * Sets up job processor
 */
export function initializeReminderWorker(dataSource: DataSource): void {
  reminderQueue.process(async (job) => {
    await processReminderJob(job, dataSource);
  });

  reminderQueue.on('completed', (job) => {
    console.log(`[Reminder] Job ${job.id} completed`);
  });

  reminderQueue.on('failed', (job, err) => {
    console.error(`[Reminder] Job ${job.id} failed:`, err);
  });

  console.log('[Reminder] Reminder worker initialized');
}
