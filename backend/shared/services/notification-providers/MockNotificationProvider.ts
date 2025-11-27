/**
 * Mock Notification Provider
 * For testing and development without real external services
 */

import { INotificationProvider, NotificationPayload } from '../notificationService';
import { NotificationType } from '../../models/Notification';

/**
 * Mock notification provider for testing
 * Stores notifications in memory instead of sending to real services
 */
export class MockNotificationProvider implements INotificationProvider {
  readonly name: string;
  readonly type: NotificationType;
  private sentNotifications: Array<{ id: string; payload: NotificationPayload; sentAt: Date }> = [];

  constructor(type: NotificationType) {
    this.type = type;
    this.name = `Mock${type.charAt(0).toUpperCase() + type.slice(1)}Provider`;
  }

  /**
   * Mock send - stores notification in memory
   */
  async send(notification: NotificationPayload): Promise<string> {
    const messageId = `mock-${this.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.sentNotifications.push({
      id: messageId,
      payload: notification,
      sentAt: new Date(),
    });

    console.log(`[${this.name}] Mock sent notification:`, {
      messageId,
      userId: notification.userId,
      subject: notification.subject,
      category: notification.category,
      priority: notification.priority,
    });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return messageId;
  }

  /**
   * Mock get status - always returns 'delivered'
   */
  async getStatus(messageId: string): Promise<string> {
    const notification = this.sentNotifications.find((n) => n.id === messageId);
    return notification ? 'delivered' : 'not_found';
  }

  /**
   * Mock health check - always returns true
   */
  async healthCheck(): Promise<boolean> {
    return true;
  }

  /**
   * Get all sent notifications (for testing)
   */
  getSentNotifications(): Array<{ id: string; payload: NotificationPayload; sentAt: Date }> {
    return this.sentNotifications;
  }

  /**
   * Clear sent notifications (for testing)
   */
  clearSentNotifications(): void {
    this.sentNotifications = [];
  }

  /**
   * Get notification count (for testing)
   */
  getSentCount(): number {
    return this.sentNotifications.length;
  }
}
