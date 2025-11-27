/**
 * Twilio SMS Provider
 * Stub implementation - ready for Twilio integration
 */

import { INotificationProvider, NotificationPayload } from '../notificationService';
import { NotificationType } from '../../models/Notification';

/**
 * Twilio SMS Provider
 * TODO: Implement with twilio SDK when Twilio credentials are available
 */
export class TwilioSMSProvider implements INotificationProvider {
  readonly name = 'Twilio';
  readonly type = NotificationType.SMS;

  private accountSid: string | null;
  private authToken: string | null;
  private fromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || null;
    this.authToken = process.env.TWILIO_AUTH_TOKEN || null;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '+41000000000';
  }

  /**
   * Send SMS via Twilio
   * TODO: Implement actual Twilio sending logic
   */
  async send(notification: NotificationPayload): Promise<string> {
    if (!this.accountSid || !this.authToken) {
      console.warn('[TwilioSMSProvider] Twilio credentials not configured, using mock mode');
      return this.mockSend(notification);
    }

    // TODO: Implement Twilio send
    // import twilio from 'twilio';
    // const client = twilio(this.accountSid, this.authToken);
    // const message = await client.messages.create({
    //   body: notification.message,
    //   from: notification.sms?.from || this.fromNumber,
    //   to: notification.sms?.to,
    // });
    // return message.sid;

    throw new Error('Twilio SMS provider not yet implemented');
  }

  /**
   * Get delivery status from Twilio
   */
  async getStatus(messageId: string): Promise<string> {
    // TODO: Implement Twilio status check
    // const message = await client.messages(messageId).fetch();
    // return message.status;
    return 'pending';
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    return !!(this.accountSid && this.authToken);
  }

  /**
   * Mock send for development
   */
  private async mockSend(notification: NotificationPayload): Promise<string> {
    const messageId = `twilio-mock-${Date.now()}`;
    console.log(`[TwilioSMSProvider] Mock SMS:`, {
      messageId,
      to: notification.sms?.to,
      message: notification.message.substring(0, 100),
    });
    return messageId;
  }
}
