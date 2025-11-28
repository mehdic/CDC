/**
 * Firebase Cloud Messaging Provider
 * Stub implementation - ready for FCM integration
 */

import { INotificationProvider, NotificationPayload } from '../notificationService';
import { NotificationType } from '../../models/Notification';

/**
 * FCM Push Notification Provider
 * TODO: Implement with firebase-admin SDK when FCM credentials are available
 */
export class FCMProvider implements INotificationProvider {
  readonly name = 'FCM';
  readonly type = NotificationType.PUSH;

  private fcmApiKey: string | null;
  private fcmProjectId: string | null;

  constructor() {
    this.fcmApiKey = process.env.FCM_API_KEY || null;
    this.fcmProjectId = process.env.FCM_PROJECT_ID || null;
  }

  /**
   * Send push notification via FCM
   * TODO: Implement actual FCM sending logic
   */
  async send(notification: NotificationPayload): Promise<string> {
    if (!this.fcmApiKey || !this.fcmProjectId) {
      console.warn('[FCMProvider] FCM credentials not configured, using mock mode');
      return this.mockSend(notification);
    }

    // TODO: Implement FCM send
    // import * as admin from 'firebase-admin';
    // const message = {
    //   notification: {
    //     title: notification.push?.title || notification.subject,
    //     body: notification.push?.body || notification.message,
    //   },
    //   data: notification.push?.data || {},
    //   token: userDeviceToken,
    // };
    // const response = await admin.messaging().send(message);
    // return response;

    throw new Error('FCM provider not yet implemented');
  }

  /**
   * Get delivery status from FCM
   */
  async getStatus(messageId: string): Promise<string> {
    // TODO: Implement FCM status check
    return 'pending';
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    return !!(this.fcmApiKey && this.fcmProjectId);
  }

  /**
   * Mock send for development
   */
  private async mockSend(notification: NotificationPayload): Promise<string> {
    const messageId = `fcm-mock-${Date.now()}`;
    console.log(`[FCMProvider] Mock push notification:`, {
      messageId,
      userId: notification.userId,
      title: notification.push?.title,
      body: notification.push?.body,
    });
    return messageId;
  }
}
