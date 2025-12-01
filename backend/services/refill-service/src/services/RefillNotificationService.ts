/**
 * Refill Notification Service
 * Handles sending refill reminders and notifications to patients
 * Task: T2-106
 */

import { PrescriptionData } from '../types/refill.types';

export interface NotificationConfig {
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  enablePushNotifications: boolean;
  reminderDaysBefore: number; // Send reminder N days before refill is due
}

export interface RefillReminder {
  patientId: string;
  prescriptionId: string;
  medicationName: string;
  refillDueDate: Date;
  pharmacyName: string;
  notificationType: 'due_soon' | 'due_today' | 'overdue';
}

const DEFAULT_CONFIG: NotificationConfig = {
  enableEmailNotifications: true,
  enableSMSNotifications: true,
  enablePushNotifications: true,
  reminderDaysBefore: 7,
};

export class RefillNotificationService {
  private config: NotificationConfig;
  private emailService: any; // Mock - would be injected in real implementation
  private smsService: any; // Mock - would be injected in real implementation
  private pushService: any; // Mock - would be injected in real implementation

  constructor(config?: Partial<NotificationConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Send refill reminder notification to patient
   * Task: T2-106
   */
  async sendRefillReminder(
    reminder: RefillReminder,
    patientEmail?: string,
    patientPhone?: string
  ): Promise<{
    emailSent: boolean;
    smsSent: boolean;
    pushSent: boolean;
  }> {
    const results = {
      emailSent: false,
      smsSent: false,
      pushSent: false,
    };

    try {
      // Send email notification
      if (this.config.enableEmailNotifications && patientEmail) {
        await this.sendEmailReminder(reminder, patientEmail);
        results.emailSent = true;
      }

      // Send SMS notification
      if (this.config.enableSMSNotifications && patientPhone) {
        await this.sendSMSReminder(reminder, patientPhone);
        results.smsSent = true;
      }

      // Send push notification
      if (this.config.enablePushNotifications) {
        await this.sendPushReminder(reminder);
        results.pushSent = true;
      }
    } catch (error) {
      console.error('Error sending refill reminder:', error);
      // Continue sending other notifications even if one fails
    }

    return results;
  }

  /**
   * Send approval notification to patient
   */
  async sendApprovalNotification(
    patientId: string,
    prescriptionId: string,
    medicationName: string,
    pharmacyName: string,
    patientEmail?: string,
    patientPhone?: string
  ): Promise<{ emailSent: boolean; smsSent: boolean }> {
    const results = {
      emailSent: false,
      smsSent: false,
    };

    try {
      // Send email notification
      if (this.config.enableEmailNotifications && patientEmail) {
        await this.sendApprovalEmailNotification(
          patientId,
          medicationName,
          pharmacyName,
          patientEmail
        );
        results.emailSent = true;
      }

      // Send SMS notification
      if (this.config.enableSMSNotifications && patientPhone) {
        await this.sendApprovalSMSNotification(
          medicationName,
          pharmacyName,
          patientPhone
        );
        results.smsSent = true;
      }
    } catch (error) {
      console.error('Error sending approval notification:', error);
    }

    return results;
  }

  /**
   * Send denial notification to patient with reason
   */
  async sendDenialNotification(
    patientId: string,
    medicationName: string,
    denialReason: string,
    patientEmail?: string,
    patientPhone?: string
  ): Promise<{ emailSent: boolean; smsSent: boolean }> {
    const results = {
      emailSent: false,
      smsSent: false,
    };

    try {
      // Send email notification
      if (this.config.enableEmailNotifications && patientEmail) {
        await this.sendDenialEmailNotification(
          medicationName,
          denialReason,
          patientEmail
        );
        results.emailSent = true;
      }

      // Send SMS notification
      if (this.config.enableSMSNotifications && patientPhone) {
        await this.sendDenialSMSNotification(
          medicationName,
          denialReason,
          patientPhone
        );
        results.smsSent = true;
      }
    } catch (error) {
      console.error('Error sending denial notification:', error);
    }

    return results;
  }

  /**
   * Determine if patient should be sent a reminder
   */
  shouldSendReminder(
    prescription: PrescriptionData,
    currentDate: Date = new Date()
  ): { shouldSend: boolean; reminderType?: string } {
    if (!prescription.lastRefillDate) {
      // No refill history, send reminder
      return {
        shouldSend: true,
        reminderType: 'first_refill_due',
      };
    }

    // Calculate when next refill is due
    const minDaysBetweenRefills = this.getMinDaysBetweenRefills(prescription);
    const lastRefillDate = new Date(prescription.lastRefillDate);
    const nextRefillEligibleDate = new Date(lastRefillDate);
    nextRefillEligibleDate.setDate(
      nextRefillEligibleDate.getDate() + minDaysBetweenRefills
    );

    // Send reminder X days before eligible date
    const reminderDate = new Date(nextRefillEligibleDate);
    reminderDate.setDate(reminderDate.getDate() - this.config.reminderDaysBefore);

    if (currentDate >= reminderDate && currentDate < nextRefillEligibleDate) {
      return {
        shouldSend: true,
        reminderType: 'due_soon',
      };
    }

    if (currentDate >= nextRefillEligibleDate) {
      // Check if overdue (more than 30 days past eligible date)
      const overdueDate = new Date(nextRefillEligibleDate);
      overdueDate.setDate(overdueDate.getDate() + 30);

      if (currentDate >= nextRefillEligibleDate && currentDate <= overdueDate) {
        return {
          shouldSend: true,
          reminderType: 'due_today',
        };
      }

      if (currentDate > overdueDate) {
        return {
          shouldSend: true,
          reminderType: 'overdue',
        };
      }
    }

    return {
      shouldSend: false,
    };
  }

  /**
   * Calculate days until next refill is eligible
   */
  daysUntilNextRefill(
    prescription: PrescriptionData,
    currentDate: Date = new Date()
  ): number {
    if (!prescription.lastRefillDate) {
      return 0; // Can refill now
    }

    const minDaysBetweenRefills = this.getMinDaysBetweenRefills(prescription);
    const lastRefillDate = new Date(prescription.lastRefillDate);
    const nextRefillEligibleDate = new Date(lastRefillDate);
    nextRefillEligibleDate.setDate(
      nextRefillEligibleDate.getDate() + minDaysBetweenRefills
    );

    const daysDiff = Math.ceil(
      (nextRefillEligibleDate.getTime() - currentDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return Math.max(0, daysDiff);
  }

  /**
   * Update notification configuration
   */
  updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  // ============================================================================
  // Private helper methods
  // ============================================================================

  /**
   * Get minimum days between refills for prescription
   */
  private getMinDaysBetweenRefills(prescription: PrescriptionData): number {
    // Default 30 days between refills
    // Would be customized based on medication type in real implementation
    return 30;
  }

  /**
   * Send email reminder (mock implementation)
   */
  private async sendEmailReminder(
    reminder: RefillReminder,
    email: string
  ): Promise<void> {
    // Mock email service call
    console.log(
      `Email reminder sent to ${email} for ${reminder.medicationName}`
    );
    // In production, this would call the actual email service
    // await this.emailService.sendRefillReminder({
    //   to: email,
    //   reminder,
    // });
  }

  /**
   * Send SMS reminder (mock implementation)
   */
  private async sendSMSReminder(
    reminder: RefillReminder,
    phone: string
  ): Promise<void> {
    // Mock SMS service call
    console.log(
      `SMS reminder sent to ${phone} for ${reminder.medicationName}`
    );
    // In production, this would call the actual SMS service
  }

  /**
   * Send push notification (mock implementation)
   */
  private async sendPushReminder(reminder: RefillReminder): Promise<void> {
    // Mock push notification service call
    console.log(
      `Push notification sent to patient ${reminder.patientId} for ${reminder.medicationName}`
    );
    // In production, this would call the actual push service
  }

  /**
   * Send approval email (mock implementation)
   */
  private async sendApprovalEmailNotification(
    patientId: string,
    medicationName: string,
    pharmacyName: string,
    email: string
  ): Promise<void> {
    console.log(
      `Approval email sent to ${email}: Your refill for ${medicationName} has been approved by ${pharmacyName}`
    );
  }

  /**
   * Send approval SMS (mock implementation)
   */
  private async sendApprovalSMSNotification(
    medicationName: string,
    pharmacyName: string,
    phone: string
  ): Promise<void> {
    console.log(
      `Approval SMS sent to ${phone}: Your refill for ${medicationName} has been approved by ${pharmacyName}`
    );
  }

  /**
   * Send denial email (mock implementation)
   */
  private async sendDenialEmailNotification(
    medicationName: string,
    denialReason: string,
    email: string
  ): Promise<void> {
    console.log(
      `Denial email sent to ${email}: Your refill for ${medicationName} has been denied. Reason: ${denialReason}`
    );
  }

  /**
   * Send denial SMS (mock implementation)
   */
  private async sendDenialSMSNotification(
    medicationName: string,
    denialReason: string,
    phone: string
  ): Promise<void> {
    console.log(
      `Denial SMS sent to ${phone}: Your refill for ${medicationName} has been denied. Reason: ${denialReason}`
    );
  }
}
