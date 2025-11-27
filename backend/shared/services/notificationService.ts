/**
 * Enhanced Notification Service
 * Multi-channel notification delivery with provider pattern
 * Task T3-025: Implement notification service
 *
 * Supports:
 * - Push notifications (Firebase Cloud Messaging)
 * - Email notifications (SendGrid/SES)
 * - SMS notifications (Twilio)
 * - User notification preferences
 * - Notification templates
 */

import { DataSource, Repository } from 'typeorm';
import { Notification, NotificationType, NotificationStatus } from '../models/Notification';
import { User } from '../models/User';

/**
 * Notification categories for organizing notifications
 */
export enum NotificationCategory {
  PRESCRIPTION_STATUS = 'prescription_status',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  DELIVERY_STATUS = 'delivery_status',
  LOW_STOCK_ALERT = 'low_stock_alert',
  TELECONSULTATION_REMINDER = 'teleconsultation_reminder',
  SYSTEM_ALERT = 'system_alert',
}

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Notification provider interface
 * All notification providers must implement this interface
 */
export interface INotificationProvider {
  /**
   * Provider name (e.g., "FCM", "SendGrid", "Twilio")
   */
  readonly name: string;

  /**
   * Provider type
   */
  readonly type: NotificationType;

  /**
   * Send a notification
   * @returns Provider-specific message ID for tracking
   */
  send(notification: NotificationPayload): Promise<string>;

  /**
   * Get delivery status for a message
   */
  getStatus(messageId: string): Promise<string>;

  /**
   * Check if provider is healthy and ready
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Notification payload
 */
export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  subject: string;
  message: string;
  metadata?: Record<string, any>;

  // Channel-specific data
  email?: {
    to: string;
    from?: string;
    html?: string;
    attachments?: any[];
  };
  sms?: {
    to: string;
    from?: string;
  };
  push?: {
    title: string;
    body: string;
    data?: Record<string, any>;
    badge?: number;
    sound?: string;
  };
}

/**
 * User notification preferences
 */
export interface UserNotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  categories: {
    [key in NotificationCategory]?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
  };
}

/**
 * Enhanced Notification Service
 */
export class NotificationService {
  private notificationRepository: Repository<Notification>;
  private userRepository: Repository<User>;
  private providers: Map<NotificationType, INotificationProvider>;

  constructor(private dataSource: DataSource) {
    this.notificationRepository = dataSource.getRepository(Notification);
    this.userRepository = dataSource.getRepository(User);
    this.providers = new Map();
  }

  /**
   * Register a notification provider
   */
  registerProvider(provider: INotificationProvider): void {
    this.providers.set(provider.type, provider);
    console.log(`[NotificationService] Registered provider: ${provider.name} (${provider.type})`);
  }

  /**
   * Get registered provider by type
   */
  getProvider(type: NotificationType): INotificationProvider | undefined {
    return this.providers.get(type);
  }

  /**
   * Send notification through appropriate channels based on user preferences
   */
  async send(payload: NotificationPayload): Promise<Notification> {
    // Get user preferences
    const preferences = await this.getUserPreferences(payload.userId);

    // Determine which channels to use
    const channels = this.determineChannels(payload, preferences);

    // Create notification record
    const notification = this.notificationRepository.create({
      user_id: payload.userId,
      type: payload.type,
      subject: payload.subject,
      message: payload.message,
      status: NotificationStatus.PENDING,
      metadata: {
        category: payload.category,
        priority: payload.priority,
        channels,
        ...payload.metadata,
      },
    });

    await this.notificationRepository.save(notification);

    // Send through all enabled channels
    const sendPromises = channels.map(async (type) => {
      const provider = this.providers.get(type);
      if (!provider) {
        console.warn(`[NotificationService] No provider registered for type: ${type}`);
        return;
      }

      try {
        const messageId = await provider.send(payload);
        notification.metadata = {
          ...notification.metadata,
          [`${type}_message_id`]: messageId,
        };
      } catch (error) {
        console.error(`[NotificationService] Failed to send via ${type}:`, error);
        notification.metadata = {
          ...notification.metadata,
          [`${type}_error`]: (error as Error).message,
        };
      }
    });

    await Promise.allSettled(sendPromises);

    // Update notification status
    notification.markAsSent();
    await this.notificationRepository.save(notification);

    return notification;
  }

  /**
   * Send email notification
   */
  async sendEmail(
    userId: string,
    subject: string,
    message: string,
    category: NotificationCategory,
    options?: {
      html?: string;
      priority?: NotificationPriority;
      metadata?: Record<string, any>;
    }
  ): Promise<Notification> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    return this.send({
      userId,
      type: NotificationType.EMAIL,
      category,
      priority: options?.priority || NotificationPriority.NORMAL,
      subject,
      message,
      metadata: options?.metadata,
      email: {
        to: user.email,
        html: options?.html,
      },
    });
  }

  /**
   * Send SMS notification
   */
  async sendSMS(
    userId: string,
    message: string,
    category: NotificationCategory,
    options?: {
      priority?: NotificationPriority;
      metadata?: Record<string, any>;
    }
  ): Promise<Notification> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.phone) {
      throw new Error(`User not found or phone number missing: ${userId}`);
    }

    return this.send({
      userId,
      type: NotificationType.SMS,
      category,
      priority: options?.priority || NotificationPriority.NORMAL,
      subject: 'SMS Notification',
      message,
      metadata: options?.metadata,
      sms: {
        to: user.phone,
      },
    });
  }

  /**
   * Send push notification
   */
  async sendPush(
    userId: string,
    title: string,
    body: string,
    category: NotificationCategory,
    options?: {
      data?: Record<string, any>;
      priority?: NotificationPriority;
      badge?: number;
      sound?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<Notification> {
    return this.send({
      userId,
      type: NotificationType.PUSH,
      category,
      priority: options?.priority || NotificationPriority.NORMAL,
      subject: title,
      message: body,
      metadata: options?.metadata,
      push: {
        title,
        body,
        data: options?.data,
        badge: options?.badge,
        sound: options?.sound,
      },
    });
  }

  /**
   * Send multi-channel notification
   */
  async sendMultiChannel(
    userId: string,
    subject: string,
    message: string,
    category: NotificationCategory,
    channels: NotificationType[],
    options?: {
      priority?: NotificationPriority;
      metadata?: Record<string, any>;
      html?: string;
    }
  ): Promise<Notification[]> {
    const promises = channels.map((type) => {
      switch (type) {
        case NotificationType.EMAIL:
          return this.sendEmail(userId, subject, message, category, {
            priority: options?.priority,
            html: options?.html,
            metadata: options?.metadata,
          });
        case NotificationType.SMS:
          return this.sendSMS(userId, message, category, {
            priority: options?.priority,
            metadata: options?.metadata,
          });
        case NotificationType.PUSH:
          return this.sendPush(userId, subject, message, category, {
            priority: options?.priority,
            metadata: options?.metadata,
          });
        default:
          throw new Error(`Unsupported notification type: ${type}`);
      }
    });

    return Promise.all(promises);
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<UserNotificationPreferences> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'notification_preferences'],
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Default preferences if not set
    const defaultPreferences: UserNotificationPreferences = {
      email_enabled: true,
      sms_enabled: true,
      push_enabled: true,
      categories: {},
    };

    return (user.notification_preferences as any) || defaultPreferences;
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserNotificationPreferences>
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const currentPreferences = await this.getUserPreferences(userId);
    const updatedPreferences = { ...currentPreferences, ...preferences };

    user.notification_preferences = updatedPreferences as any;
    await this.userRepository.save(user);
  }

  /**
   * Determine which channels to use based on preferences
   */
  private determineChannels(
    payload: NotificationPayload,
    preferences: UserNotificationPreferences
  ): NotificationType[] {
    const channels: NotificationType[] = [];

    // Check category-specific preferences first
    const categoryPrefs = preferences.categories[payload.category];
    if (categoryPrefs) {
      if (categoryPrefs.email && preferences.email_enabled) {
        channels.push(NotificationType.EMAIL);
      }
      if (categoryPrefs.sms && preferences.sms_enabled) {
        channels.push(NotificationType.SMS);
      }
      if (categoryPrefs.push && preferences.push_enabled) {
        channels.push(NotificationType.PUSH);
      }
    } else {
      // Use global preferences
      if (preferences.email_enabled) {
        channels.push(NotificationType.EMAIL);
      }
      if (preferences.push_enabled) {
        channels.push(NotificationType.PUSH);
      }
    }

    // For urgent notifications, always include all enabled channels
    if (payload.priority === NotificationPriority.URGENT) {
      if (preferences.email_enabled && !channels.includes(NotificationType.EMAIL)) {
        channels.push(NotificationType.EMAIL);
      }
      if (preferences.sms_enabled && !channels.includes(NotificationType.SMS)) {
        channels.push(NotificationType.SMS);
      }
      if (preferences.push_enabled && !channels.includes(NotificationType.PUSH)) {
        channels.push(NotificationType.PUSH);
      }
    }

    return channels;
  }

  /**
   * Get notification by ID
   */
  async getNotification(notificationId: string): Promise<Notification | null> {
    return this.notificationRepository.findOne({ where: { id: notificationId } });
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: NotificationStatus;
      category?: NotificationCategory;
    }
  ): Promise<{ notifications: Notification[]; total: number }> {
    const { limit = 50, offset = 0, status, category } = options || {};

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.user_id = :userId', { userId });

    if (status) {
      queryBuilder.andWhere('notification.status = :status', { status });
    }

    if (category) {
      queryBuilder.andWhere("notification.metadata->>'category' = :category", { category });
    }

    const [notifications, total] = await queryBuilder
      .orderBy('notification.created_at', 'DESC')
      .limit(limit)
      .offset(offset)
      .getManyAndCount();

    return { notifications, total };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error(`Notification not found: ${notificationId}`);
    }

    notification.markAsRead();
    await this.notificationRepository.save(notification);
  }

  /**
   * Health check for all providers
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};

    for (const [type, provider] of this.providers.entries()) {
      try {
        health[type] = await provider.healthCheck();
      } catch (error) {
        health[type] = false;
      }
    }

    return health;
  }
}

/**
 * Singleton instance
 */
let notificationServiceInstance: NotificationService | null = null;

/**
 * Initialize notification service
 */
export function initializeNotificationService(dataSource: DataSource): NotificationService {
  notificationServiceInstance = new NotificationService(dataSource);
  return notificationServiceInstance;
}

/**
 * Get notification service instance
 */
export function getNotificationService(): NotificationService {
  if (!notificationServiceInstance) {
    throw new Error('NotificationService not initialized');
  }
  return notificationServiceInstance;
}
