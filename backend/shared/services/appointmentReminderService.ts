/**
 * Appointment Reminder Service
 * Automated reminders for teleconsultation appointments
 * Task T3-026: Implement appointment reminders
 *
 * Features:
 * - 24-hour before reminder
 * - 1-hour before reminder
 * - Swiss timezone support (Europe/Zurich)
 * - Cron-based scheduling
 */

import { DataSource, Repository, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { Teleconsultation, TeleconsultationStatus } from '../models/Teleconsultation';
import { NotificationService, NotificationCategory, NotificationPriority } from './notificationService';
import { format, addHours, subHours, isWithinInterval } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { getUserWithDecryptedPII } from '../utils/userDecryption';

/**
 * Swiss timezone constant
 */
export const SWISS_TIMEZONE = 'Europe/Zurich';

/**
 * Reminder configuration
 */
export interface ReminderConfig {
  hoursBeforeAppointment: number;
  enabled: boolean;
}

/**
 * Default reminder configuration
 */
export const DEFAULT_REMINDER_CONFIG: ReminderConfig[] = [
  { hoursBeforeAppointment: 24, enabled: true }, // 24 hours before
  { hoursBeforeAppointment: 1, enabled: true },  // 1 hour before
];

/**
 * Appointment Reminder Service
 */
export class AppointmentReminderService {
  private teleconsultationRepository: Repository<Teleconsultation>;
  private reminderConfig: ReminderConfig[];
  private isRunning: boolean = false;

  constructor(
    private dataSource: DataSource,
    private notificationService: NotificationService,
    config?: ReminderConfig[]
  ) {
    this.teleconsultationRepository = dataSource.getRepository(Teleconsultation);
    this.reminderConfig = config || DEFAULT_REMINDER_CONFIG;
  }

  /**
   * Static helper methods for timezone conversions (for testing)
   */
  static toSwissTime(date: Date): Date {
    return toZonedTime(date, SWISS_TIMEZONE);
  }

  static fromSwissTime(date: Date): Date {
    return fromZonedTime(date, SWISS_TIMEZONE);
  }

  static formatSwissTime(date: Date, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string {
    return formatInTimeZone(date, SWISS_TIMEZONE, formatStr);
  }

  /**
   * Start the reminder scheduler
   * Run this on a cron schedule (e.g., every 15 minutes)
   */
  async processReminders(): Promise<void> {
    if (this.isRunning) {
      console.log('[AppointmentReminderService] Already processing reminders, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('[AppointmentReminderService] Starting reminder processing...');

    try {
      const now = new Date();
      const swissNow = toZonedTime(now, SWISS_TIMEZONE);

      for (const config of this.reminderConfig) {
        if (!config.enabled) {continue;}

        await this.processRemindersForWindow(swissNow, config.hoursBeforeAppointment);
      }

      console.log('[AppointmentReminderService] Reminder processing complete');
    } catch (error) {
      console.error('[AppointmentReminderService] Error processing reminders:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process reminders for a specific time window
   */
  private async processRemindersForWindow(
    currentTime: Date,
    hoursBeforeAppointment: number
  ): Promise<void> {
    // Calculate the target time window (Swiss timezone)
    const targetTime = addHours(currentTime, hoursBeforeAppointment);
    const windowStart = subHours(targetTime, 0.25); // 15 minutes before target
    const windowEnd = addHours(targetTime, 0.25);   // 15 minutes after target

    console.log(`[AppointmentReminderService] Processing ${hoursBeforeAppointment}h reminders`, {
      currentTime: formatInTimeZone(currentTime, SWISS_TIMEZONE, 'yyyy-MM-dd HH:mm:ss'),
      windowStart: formatInTimeZone(windowStart, SWISS_TIMEZONE, 'yyyy-MM-dd HH:mm:ss'),
      windowEnd: formatInTimeZone(windowEnd, SWISS_TIMEZONE, 'yyyy-MM-dd HH:mm:ss'),
      timezone: SWISS_TIMEZONE,
    });

    // Find scheduled appointments in the target window
    const appointments = await this.teleconsultationRepository.find({
      where: {
        status: TeleconsultationStatus.SCHEDULED,
        scheduled_at: MoreThanOrEqual(fromZonedTime(windowStart, SWISS_TIMEZONE)),
      },
      relations: ['patient', 'pharmacist', 'pharmacy'],
    });

    // Filter appointments within the window (TypeORM doesn't support BETWEEN with dates well)
    const appointmentsInWindow = appointments.filter((apt) => {
      const scheduledTime = toZonedTime(apt.scheduled_at, SWISS_TIMEZONE);
      return isWithinInterval(scheduledTime, { start: windowStart, end: windowEnd });
    });

    console.log(`[AppointmentReminderService] Found ${appointmentsInWindow.length} appointments requiring ${hoursBeforeAppointment}h reminder`);

    // Send reminders for each appointment
    for (const appointment of appointmentsInWindow) {
      try {
        await this.sendReminder(appointment, hoursBeforeAppointment);
      } catch (error) {
        console.error(`[AppointmentReminderService] Failed to send reminder for appointment ${appointment.id}:`, error);
        // Continue processing other appointments
      }
    }
  }

  /**
   * Send reminder for a specific appointment
   */
  private async sendReminder(
    appointment: Teleconsultation,
    hoursBeforeAppointment: number
  ): Promise<void> {
    // Decrypt patient and pharmacist PII for use in notifications
    const patientWithPII = await getUserWithDecryptedPII(appointment.patient);
    const pharmacistWithPII = await getUserWithDecryptedPII(appointment.pharmacist);

    const scheduledTimeSwiss = toZonedTime(appointment.scheduled_at, SWISS_TIMEZONE);
    const formattedTime = formatInTimeZone(
      appointment.scheduled_at,
      SWISS_TIMEZONE,
      'EEEE, d MMMM yyyy à HH:mm'
    );

    const reminderMessage = this.buildReminderMessage(
      appointment,
      hoursBeforeAppointment,
      formattedTime,
      patientWithPII.first_name,
      `${pharmacistWithPII.first_name} ${pharmacistWithPII.last_name}`
    );

    const reminderSubject = this.buildReminderSubject(hoursBeforeAppointment);

    // Determine priority (1-hour reminders are more urgent)
    const priority = hoursBeforeAppointment <= 1
      ? NotificationPriority.HIGH
      : NotificationPriority.NORMAL;

    // Send reminder to patient
    try {
      await this.notificationService.sendEmail(
        appointment.patient_id,
        reminderSubject,
        reminderMessage,
        NotificationCategory.TELECONSULTATION_REMINDER,
        {
          priority,
          metadata: {
            teleconsultation_id: appointment.id,
            scheduled_at: appointment.scheduled_at.toISOString(),
            hours_before: hoursBeforeAppointment,
          },
        }
      );

      // Also send push notification
      await this.notificationService.sendPush(
        appointment.patient_id,
        reminderSubject,
        `Votre consultation avec ${appointment.pharmacy.name} commence dans ${hoursBeforeAppointment}h`,
        NotificationCategory.TELECONSULTATION_REMINDER,
        {
          priority,
          data: {
            teleconsultation_id: appointment.id,
            type: 'teleconsultation_reminder',
          },
        }
      );

      console.log(`[AppointmentReminderService] Sent ${hoursBeforeAppointment}h reminder for appointment ${appointment.id}`);
    } catch (error) {
      console.error(`[AppointmentReminderService] Failed to send reminder:`, error);
      throw error;
    }

    // Send reminder to pharmacist
    try {
      await this.notificationService.sendEmail(
        appointment.pharmacist_id,
        `[Rappel] Téléconsultation dans ${hoursBeforeAppointment}h`,
        `Vous avez une téléconsultation prévue avec ${patientWithPII.first_name} ${patientWithPII.last_name} le ${formattedTime}.`,
        NotificationCategory.TELECONSULTATION_REMINDER,
        {
          priority,
          metadata: {
            teleconsultation_id: appointment.id,
            scheduled_at: appointment.scheduled_at.toISOString(),
            hours_before: hoursBeforeAppointment,
          },
        }
      );

      console.log(`[AppointmentReminderService] Sent ${hoursBeforeAppointment}h reminder to pharmacist for appointment ${appointment.id}`);
    } catch (error) {
      console.error(`[AppointmentReminderService] Failed to send pharmacist reminder:`, error);
      // Don't throw - patient reminder is more critical
    }
  }

  /**
   * Build reminder message for patient
   */
  private buildReminderMessage(
    appointment: Teleconsultation,
    hoursBeforeAppointment: number,
    formattedTime: string,
    patientFirstName: string,
    pharmacistFullName: string
  ): string {
    const timePhrase = hoursBeforeAppointment === 24 ? 'demain' : `dans ${hoursBeforeAppointment} heure${hoursBeforeAppointment > 1 ? 's' : ''}`;

    return `
Bonjour ${patientFirstName},

Ceci est un rappel concernant votre téléconsultation ${timePhrase}.

**Détails de la consultation:**
- Date et heure: ${formattedTime}
- Pharmacie: ${appointment.pharmacy.name}
- Pharmacien: ${pharmacistFullName}
- Durée: ${appointment.duration_minutes} minutes

**Comment rejoindre:**
1. Connectez-vous à votre compte MetaPharm Connect
2. Accédez à "Mes consultations"
3. Cliquez sur "Rejoindre la consultation" quelques minutes avant l'heure prévue

En cas d'empêchement, veuillez annuler ou reprogrammer au moins 24 heures à l'avance.

Cordialement,
L'équipe MetaPharm Connect
    `.trim();
  }

  /**
   * Build reminder subject
   */
  private buildReminderSubject(hoursBeforeAppointment: number): string {
    if (hoursBeforeAppointment === 24) {
      return '[Rappel] Téléconsultation demain';
    } else if (hoursBeforeAppointment === 1) {
      return '[Rappel] Téléconsultation dans 1 heure';
    } else {
      return `[Rappel] Téléconsultation dans ${hoursBeforeAppointment} heures`;
    }
  }

  /**
   * Get upcoming appointments (for testing/debugging)
   */
  async getUpcomingAppointments(hoursAhead: number = 48): Promise<Teleconsultation[]> {
    const now = new Date();
    const swissNow = toZonedTime(now, SWISS_TIMEZONE);
    const futureTime = addHours(swissNow, hoursAhead);

    return this.teleconsultationRepository.find({
      where: {
        status: TeleconsultationStatus.SCHEDULED,
        scheduled_at: LessThanOrEqual(fromZonedTime(futureTime, SWISS_TIMEZONE)),
      },
      relations: ['patient', 'pharmacist', 'pharmacy'],
      order: {
        scheduled_at: 'ASC',
      },
    });
  }

}

/**
 * Singleton instance
 */
let reminderServiceInstance: AppointmentReminderService | null = null;

/**
 * Initialize appointment reminder service
 */
export function initializeAppointmentReminderService(
  dataSource: DataSource,
  notificationService: NotificationService,
  config?: ReminderConfig[]
): AppointmentReminderService {
  reminderServiceInstance = new AppointmentReminderService(dataSource, notificationService, config);
  return reminderServiceInstance;
}

/**
 * Get appointment reminder service instance
 */
export function getAppointmentReminderService(): AppointmentReminderService {
  if (!reminderServiceInstance) {
    throw new Error('AppointmentReminderService not initialized');
  }
  return reminderServiceInstance;
}
