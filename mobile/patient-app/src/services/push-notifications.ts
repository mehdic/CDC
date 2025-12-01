/**
 * Push Notifications Service
 * Handles Firebase Cloud Messaging integration for push notifications
 * Supports iOS and Android platforms
 */

import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Push notification types
 */
export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  timestamp: number;
  read: boolean;
}

/**
 * Notification handler type
 */
export type NotificationHandler = (notification: PushNotification) => void;

/**
 * Push Notifications Service
 * Provides methods for managing push notifications
 */
export class PushNotificationsService {
  private static instance: PushNotificationsService;
  private handlers: NotificationHandler[] = [];
  private initialized = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): PushNotificationsService {
    if (!PushNotificationsService.instance) {
      PushNotificationsService.instance = new PushNotificationsService();
    }
    return PushNotificationsService.instance;
  }

  /**
   * Initialize push notifications
   * In production, this would integrate with Firebase Cloud Messaging
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // In a real implementation, you would:
      // 1. Import firebase-react-native
      // 2. Call messaging().getToken() to get device token
      // 3. Save token to backend
      // 4. Set up listeners for incoming messages

      // For now, we simulate the initialization
      console.log('Push notifications initialized');
      this.initialized = true;

      // Request user permission for notifications (iOS)
      if (Platform.OS === 'ios') {
        await this.requestUserPermission();
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  /**
   * Request user permission for notifications (iOS only)
   */
  private async requestUserPermission(): Promise<boolean> {
    try {
      // In production, use react-native-permissions
      // For now, we simulate the request
      return true;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Register notification handler
   */
  registerHandler(handler: NotificationHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Unregister notification handler
   */
  unregisterHandler(handler: NotificationHandler): void {
    this.handlers = this.handlers.filter((h) => h !== handler);
  }

  /**
   * Handle incoming notification
   */
  async handleNotification(notification: PushNotification): Promise<void> {
    try {
      // Save notification to AsyncStorage
      await this.saveNotification(notification);

      // Call all registered handlers
      this.handlers.forEach((handler) => {
        handler(notification);
      });
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  }

  /**
   * Save notification to local storage
   */
  private async saveNotification(notification: PushNotification): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      notifications.push(notification);
      // Keep only last 100 notifications
      const recentNotifications = notifications.slice(-100);
      await AsyncStorage.setItem(
        'push_notifications',
        JSON.stringify(recentNotifications)
      );
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  }

  /**
   * Get all notifications from storage
   */
  async getNotifications(): Promise<PushNotification[]> {
    try {
      const data = await AsyncStorage.getItem('push_notifications');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const updated = notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      await AsyncStorage.setItem(
        'push_notifications',
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const updated = notifications.filter((n) => n.id !== notificationId);
      await AsyncStorage.setItem(
        'push_notifications',
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem('push_notifications');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const notifications = await this.getNotifications();
      return notifications.filter((n) => !n.read).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Get device token
   */
  async getDeviceToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('device_token');
    } catch (error) {
      console.error('Error getting device token:', error);
      return null;
    }
  }

  /**
   * Save device token (called by Firebase FCM setup)
   */
  async setDeviceToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('device_token', token);
    } catch (error) {
      console.error('Error saving device token:', error);
    }
  }
}

export default PushNotificationsService.getInstance();
