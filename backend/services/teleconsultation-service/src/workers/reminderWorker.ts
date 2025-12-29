/**
 * Teleconsultation Reminder Worker
 * INT-013: Send reminder notifications before appointments
 *
 * Reminders schedule:
 * - 24 hours before appointment
 * - 1 hour before appointment
 * - 15 minutes before appointment
 *
 * Sent to both patient and pharmacist via notification service
 */

import { DataSource, LessThanOrEqual } from 'typeorm';
import { Teleconsultation, TeleconsultationStatus } from '../../../../shared/models/Teleconsultation';
import { User } from '../../../../shared/models/User';
import { Pharmacy } from '../../../../shared/models/Pharmacy';
import { Prescription } from '../../../../shared/models/Prescription';
import { PrescriptionItem } from '../../../../shared/models/PrescriptionItem';
import { TreatmentPlan } from '../../../../shared/models/TreatmentPlan';
import { ConsultationNote } from '../../../../shared/models/ConsultationNote';
import { AuditTrailEntry } from '../../../../shared/models/AuditTrailEntry';
import { Cart } from '../../../../shared/models/Cart';
import { CartItem } from '../../../../shared/models/CartItem';

// Create a DataSource for the reminder worker
export const ReminderDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'metapharm',
  entities: [Teleconsultation, User, Pharmacy, Prescription, PrescriptionItem, TreatmentPlan, ConsultationNote, AuditTrailEntry, Cart, CartItem],
  synchronize: false,
  logging: false,
});

interface NotificationParams {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Track which reminders have been sent to avoid duplicates
const sentReminders = new Set<string>();

/**
 * Send email notification via notification service
 */
async function sendNotification(params: NotificationParams): Promise<void> {
  const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4005';

  try {
    const response = await fetch(`${notificationServiceUrl}/notifications/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Notification service error: ${response.status} - ${error}`);
    }
  } catch (error) {
    console.error('[Reminder Worker] Failed to send notification:', error);
    throw error;
  }
}

/**
 * Generate reminder key to track sent reminders
 */
function getReminderKey(consultationId: string, reminderType: string): string {
  return `${consultationId}-${reminderType}`;
}

/**
 * Send 24-hour reminder
 */
async function send24HourReminder(consultation: Teleconsultation): Promise<void> {
  const reminderKey = getReminderKey(consultation.id, '24h');

  if (sentReminders.has(reminderKey)) {
    return; // Already sent
  }

  const scheduledDate = new Date(consultation.scheduled_at);
  const formattedDate = scheduledDate.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Send to patient
  if (consultation.patient?.email) {
    await sendNotification({
      to: consultation.patient.email,
      subject: 'Reminder: Teleconsultation Tomorrow',
      text: `Your teleconsultation with the pharmacist is scheduled for tomorrow at ${formattedDate}.`,
      html: `
        <h2>Teleconsultation Reminder</h2>
        <p>Your teleconsultation appointment is scheduled for <strong>tomorrow</strong>.</p>
        <p><strong>Date & Time:</strong> ${formattedDate}</p>
        <p><strong>Duration:</strong> ${consultation.duration_minutes} minutes</p>
        <p><strong>Pharmacist ID:</strong> ${consultation.pharmacist_id}</p>
        <p>Please ensure you have a stable internet connection and your device is ready.</p>
      `,
    });
  }

  // Send to pharmacist
  if (consultation.pharmacist?.email) {
    await sendNotification({
      to: consultation.pharmacist.email,
      subject: 'Reminder: Teleconsultation Tomorrow',
      text: `You have a teleconsultation scheduled for tomorrow at ${formattedDate}.`,
      html: `
        <h2>Teleconsultation Reminder</h2>
        <p>You have a teleconsultation scheduled for <strong>tomorrow</strong>.</p>
        <p><strong>Date & Time:</strong> ${formattedDate}</p>
        <p><strong>Duration:</strong> ${consultation.duration_minutes} minutes</p>
        <p><strong>Patient ID:</strong> ${consultation.patient_id}</p>
        <p>Please ensure you have reviewed any relevant patient history before the appointment.</p>
      `,
    });
  }

  sentReminders.add(reminderKey);
  console.log(`[Reminder Worker] Sent 24-hour reminder for consultation ${consultation.id}`);
}

/**
 * Send 1-hour reminder
 */
async function send1HourReminder(consultation: Teleconsultation): Promise<void> {
  const reminderKey = getReminderKey(consultation.id, '1h');

  if (sentReminders.has(reminderKey)) {
    return; // Already sent
  }

  const scheduledDate = new Date(consultation.scheduled_at);
  const formattedTime = scheduledDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Send to patient
  if (consultation.patient?.email) {
    await sendNotification({
      to: consultation.patient.email,
      subject: 'Reminder: Teleconsultation in 1 Hour',
      text: `Your teleconsultation is starting in 1 hour at ${formattedTime}.`,
      html: `
        <h2>Teleconsultation Starting Soon</h2>
        <p>Your teleconsultation appointment is starting in <strong>1 hour</strong>.</p>
        <p><strong>Time:</strong> ${formattedTime}</p>
        <p><strong>Duration:</strong> ${consultation.duration_minutes} minutes</p>
        <p>Please be ready at the scheduled time.</p>
      `,
    });
  }

  // Send to pharmacist
  if (consultation.pharmacist?.email) {
    await sendNotification({
      to: consultation.pharmacist.email,
      subject: 'Reminder: Teleconsultation in 1 Hour',
      text: `You have a teleconsultation starting in 1 hour at ${formattedTime}.`,
      html: `
        <h2>Teleconsultation Starting Soon</h2>
        <p>You have a teleconsultation starting in <strong>1 hour</strong>.</p>
        <p><strong>Time:</strong> ${formattedTime}</p>
        <p><strong>Duration:</strong> ${consultation.duration_minutes} minutes</p>
        <p><strong>Patient ID:</strong> ${consultation.patient_id}</p>
      `,
    });
  }

  sentReminders.add(reminderKey);
  console.log(`[Reminder Worker] Sent 1-hour reminder for consultation ${consultation.id}`);
}

/**
 * Send 15-minute reminder
 */
async function send15MinuteReminder(consultation: Teleconsultation): Promise<void> {
  const reminderKey = getReminderKey(consultation.id, '15m');

  if (sentReminders.has(reminderKey)) {
    return; // Already sent
  }

  // Send to patient
  if (consultation.patient?.email) {
    await sendNotification({
      to: consultation.patient.email,
      subject: 'Reminder: Teleconsultation Starting Soon (15 min)',
      text: 'Your teleconsultation is starting in 15 minutes. Please join the video call.',
      html: `
        <h2>Teleconsultation Starting Now</h2>
        <p>Your teleconsultation appointment is starting in <strong>15 minutes</strong>.</p>
        <p>Please join the video call at the scheduled time.</p>
        <p><strong>Duration:</strong> ${consultation.duration_minutes} minutes</p>
      `,
    });
  }

  // Send to pharmacist
  if (consultation.pharmacist?.email) {
    await sendNotification({
      to: consultation.pharmacist.email,
      subject: 'Reminder: Teleconsultation Starting Soon (15 min)',
      text: 'You have a teleconsultation starting in 15 minutes.',
      html: `
        <h2>Teleconsultation Starting Now</h2>
        <p>You have a teleconsultation starting in <strong>15 minutes</strong>.</p>
        <p><strong>Patient ID:</strong> ${consultation.patient_id}</p>
        <p><strong>Duration:</strong> ${consultation.duration_minutes} minutes</p>
      `,
    });
  }

  sentReminders.add(reminderKey);
  console.log(`[Reminder Worker] Sent 15-minute reminder for consultation ${consultation.id}`);
}

/**
 * Process reminders for upcoming consultations
 */
export async function processReminders(): Promise<void> {
  // Use the ReminderDataSource
  const dataSource = ReminderDataSource;
  const consultationRepo = dataSource.getRepository(Teleconsultation);
  const now = new Date();

  try {
    // Find all scheduled consultations in the next 25 hours
    const upcomingWindow = new Date(now.getTime() + 25 * 60 * 60 * 1000); // 25 hours from now

    const upcomingConsultations = await consultationRepo.find({
      where: {
        status: TeleconsultationStatus.SCHEDULED,
        scheduled_at: LessThanOrEqual(upcomingWindow),
      },
      relations: ['patient', 'pharmacist'],
    });

    console.log(`[Reminder Worker] Found ${upcomingConsultations.length} upcoming consultations`);

    for (const consultation of upcomingConsultations) {
      const scheduledTime = new Date(consultation.scheduled_at);
      const timeUntilConsultation = scheduledTime.getTime() - now.getTime();
      const hoursUntil = timeUntilConsultation / (1000 * 60 * 60);
      const minutesUntil = timeUntilConsultation / (1000 * 60);

      try {
        // 24-hour reminder (send between 23.5 and 24.5 hours before)
        if (hoursUntil >= 23.5 && hoursUntil <= 24.5) {
          await send24HourReminder(consultation);
        }

        // 1-hour reminder (send between 55 and 65 minutes before)
        if (minutesUntil >= 55 && minutesUntil <= 65) {
          await send1HourReminder(consultation);
        }

        // 15-minute reminder (send between 10 and 20 minutes before)
        if (minutesUntil >= 10 && minutesUntil <= 20) {
          await send15MinuteReminder(consultation);
        }
      } catch (error) {
        console.error(`[Reminder Worker] Error processing consultation ${consultation.id}:`, error);
        // Continue with next consultation
      }
    }
  } catch (error) {
    console.error('[Reminder Worker] Error fetching consultations:', error);
    throw error;
  }
}

/**
 * Start the reminder worker
 * Runs every 5 minutes to check for upcoming consultations
 */
export async function startReminderWorker(): Promise<NodeJS.Timeout> {
  console.log('[Reminder Worker] Starting teleconsultation reminder worker');

  // Initialize database connection
  if (!ReminderDataSource.isInitialized) {
    await ReminderDataSource.initialize();
    console.log('[Reminder Worker] Database connection established');
  }

  // Run immediately on start
  processReminders().catch(error => {
    console.error('[Reminder Worker] Error in initial run:', error);
  });

  // Then run every 5 minutes
  const intervalId = setInterval(() => {
    processReminders().catch(error => {
      console.error('[Reminder Worker] Error in scheduled run:', error);
    });
  }, 5 * 60 * 1000); // 5 minutes

  console.log('[Reminder Worker] Worker started, checking every 5 minutes');

  return intervalId;
}

/**
 * Stop the reminder worker
 */
export async function stopReminderWorker(intervalId: NodeJS.Timeout): Promise<void> {
  clearInterval(intervalId);

  if (ReminderDataSource.isInitialized) {
    await ReminderDataSource.destroy();
    console.log('[Reminder Worker] Database connection closed');
  }

  console.log('[Reminder Worker] Worker stopped');
}
