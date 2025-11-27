/**
 * SendGrid Email Provider
 * Stub implementation - ready for SendGrid integration
 */

import { INotificationProvider, NotificationPayload } from '../notificationService';
import { NotificationType } from '../../models/Notification';

/**
 * SendGrid Email Provider
 * TODO: Implement with @sendgrid/mail when SendGrid API key is available
 */
export class SendGridProvider implements INotificationProvider {
  readonly name = 'SendGrid';
  readonly type = NotificationType.EMAIL;

  private apiKey: string | null;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || null;
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@metapharm.ch';
  }

  /**
   * Send email via SendGrid
   * TODO: Implement actual SendGrid sending logic
   */
  async send(notification: NotificationPayload): Promise<string> {
    if (!this.apiKey) {
      console.warn('[SendGridProvider] SendGrid API key not configured, using mock mode');
      return this.mockSend(notification);
    }

    // TODO: Implement SendGrid send
    // import sgMail from '@sendgrid/mail';
    // sgMail.setApiKey(this.apiKey);
    // const msg = {
    //   to: notification.email?.to,
    //   from: notification.email?.from || this.fromEmail,
    //   subject: notification.subject,
    //   text: notification.message,
    //   html: notification.email?.html || notification.message,
    // };
    // const [response] = await sgMail.send(msg);
    // return response.headers['x-message-id'];

    throw new Error('SendGrid provider not yet implemented');
  }

  /**
   * Get delivery status from SendGrid
   */
  async getStatus(messageId: string): Promise<string> {
    // TODO: Implement SendGrid status check via webhook or API
    return 'pending';
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    return !!this.apiKey;
  }

  /**
   * Mock send for development
   */
  private async mockSend(notification: NotificationPayload): Promise<string> {
    const messageId = `sendgrid-mock-${Date.now()}`;
    console.log(`[SendGridProvider] Mock email:`, {
      messageId,
      to: notification.email?.to,
      subject: notification.subject,
      message: notification.message.substring(0, 100),
    });
    return messageId;
  }
}
