/**
 * Notification Service Client
 * Integration with Notification Service for multi-channel notifications
 * Task: T8-010 - Notification Service Integration
 *
 * Features:
 * - Send email notifications
 * - Send SMS notifications
 * - Send push notifications (FCM)
 * - Event-driven notifications for:
 *   - Prescription ready for pickup
 *   - Delivery status updates
 *   - Appointment reminders
 * - Async notification queueing via Redis
 */

import axios, { AxiosInstance } from 'axios';
import { createClient, RedisClientType } from 'redis';

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface SendNotificationRequest {
  userId: string;
  channel: NotificationChannel | NotificationChannel[];
  type: string;
  priority?: NotificationPriority;
  title?: string;
  subject?: string;
  message: string;
  data?: Record<string, any>;
  phoneNumber?: string;
  email?: string;
  template?: string;
  templateData?: Record<string, any>;
}

export interface NotificationResponse {
  id: string;
  userId: string;
  channels: string[];
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  trackingId?: string;
}

/**
 * Notification Service Client
 * Handles all notification delivery operations
 */
export class NotificationClient {
  private httpClient: AxiosInstance;
  private redisClient: RedisClientType | null = null;
  private baseUrl: string;
  private serviceKey: string;
  private useRedisQueue: boolean = true;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;

  constructor(baseUrl?: string, serviceKey?: string, redisUrl?: string) {
    this.baseUrl = baseUrl || process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:4006';
    this.serviceKey = serviceKey || process.env.SERVICE_KEY || '';

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        ...(this.serviceKey && { Authorization: `Bearer ${this.serviceKey}` }),
      },
    });

    // Initialize Redis client if available
    if (redisUrl || process.env.REDIS_URL) {
      this.initializeRedis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
    }
  }

  /**
   * Initialize Redis connection for queue-based notifications
   */
  private async initializeRedis(redisUrl: string): Promise<void> {
    try {
      this.redisClient = createClient({ url: redisUrl });
      this.redisClient.on('error', (err) => {
        console.error('[NotificationClient] Redis error:', err);
        this.redisClient = null;
      });
      await this.redisClient.connect();
      console.log('[NotificationClient] Redis connected for notification queue');
    } catch (error) {
      console.warn('[NotificationClient] Failed to connect to Redis:', error);
      this.useRedisQueue = false;
    }
  }

  /**
   * Send notification (queued via Redis if available, otherwise direct)
   */
  public async sendNotification(request: SendNotificationRequest): Promise<NotificationResponse | null> {
    try {
      // Use Redis queue if available for better reliability
      if (this.useRedisQueue && this.redisClient?.isOpen) {
        return await this.queueNotification(request);
      }

      // Fall back to direct HTTP if Redis unavailable
      return await this.sendDirectNotification(request);
    } catch (error) {
      console.error('[NotificationClient] Failed to send notification:', error);
      return null;
    }
  }

  /**
   * Queue notification via Redis for async processing
   */
  private async queueNotification(request: SendNotificationRequest): Promise<NotificationResponse | null> {
    try {
      if (!this.redisClient?.isOpen) {
        throw new Error('Redis client not connected');
      }

      const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const queueKey = 'notification:queue';

      // Add to queue
      await this.redisClient.rPush(queueKey, JSON.stringify({
        id: notificationId,
        timestamp: new Date().toISOString(),
        request,
      }));

      console.log(`[NotificationClient] Notification queued: ${notificationId}`);

      return {
        id: notificationId,
        userId: request.userId,
        channels: Array.isArray(request.channel) ? request.channel : [request.channel],
        status: 'queued',
        trackingId: notificationId,
      };
    } catch (error) {
      console.error('[NotificationClient] Failed to queue notification:', error);
      // Fall back to direct send
      return this.sendDirectNotification(request);
    }
  }

  /**
   * Send notification directly via HTTP
   */
  private async sendDirectNotification(request: SendNotificationRequest): Promise<NotificationResponse | null> {
    try {
      const response = await this.executeWithRetry(() =>
        this.httpClient.post('/notifications/send', request)
      );

      return {
        id: response.data.id || `notif-${Date.now()}`,
        userId: request.userId,
        channels: Array.isArray(request.channel) ? request.channel : [request.channel],
        status: response.data.status || 'sent',
        sentAt: new Date(),
        trackingId: response.data.trackingId,
      };
    } catch (error) {
      console.error('[NotificationClient] Failed to send direct notification:', error);
      return null;
    }
  }

  /**
   * Send prescription ready notification
   */
  public async sendPrescriptionReadyNotification(
    userId: string,
    prescriptionId: string,
    pharmacyName: string,
    pickupCode?: string,
  ): Promise<NotificationResponse | null> {
    return this.sendNotification({
      userId,
      channel: ['push', 'email', 'sms'],
      type: 'prescription_ready',
      priority: 'high',
      title: 'Prescription Ready for Pickup',
      subject: 'Your prescription is ready',
      message: `Your prescription is ready for pickup at ${pharmacyName}${pickupCode ? `. Pickup code: ${pickupCode}` : '.'}`,
      data: {
        prescription_id: prescriptionId,
        pharmacy_name: pharmacyName,
        pickup_code: pickupCode,
        action: 'navigate_to_pharmacy',
      },
      template: 'prescription_ready',
    });
  }

  /**
   * Send prescription rejected notification
   */
  public async sendPrescriptionRejectedNotification(
    userId: string,
    prescriptionId: string,
    reason: string,
  ): Promise<NotificationResponse | null> {
    return this.sendNotification({
      userId,
      channel: ['push', 'email'],
      type: 'prescription_rejected',
      priority: 'high',
      title: 'Prescription Rejected',
      subject: 'Your prescription has been rejected',
      message: `Your prescription has been rejected. Reason: ${reason}`,
      data: {
        prescription_id: prescriptionId,
        reason,
        action: 'contact_pharmacy',
      },
      template: 'prescription_rejected',
      templateData: { reason },
    });
  }

  /**
   * Send delivery status update notification
   */
  public async sendDeliveryStatusNotification(
    userId: string,
    orderId: string,
    status: 'out_for_delivery' | 'delivered' | 'delayed',
    details?: Record<string, any>,
  ): Promise<NotificationResponse | null> {
    const statusMessages: Record<string, string> = {
      out_for_delivery: 'Your delivery is on the way',
      delivered: 'Your delivery has been completed',
      delayed: 'Your delivery is delayed',
    };

    return this.sendNotification({
      userId,
      channel: ['push', 'sms'],
      type: 'delivery_status_update',
      priority: status === 'delayed' ? 'high' : 'normal',
      title: `Delivery ${status.replace(/_/g, ' ')}`,
      message: statusMessages[status],
      data: {
        order_id: orderId,
        status,
        ...details,
      },
      template: `delivery_${status}`,
    });
  }

  /**
   * Send appointment reminder notification
   */
  public async sendAppointmentReminderNotification(
    userId: string,
    appointmentId: string,
    appointmentTime: Date,
    appointmentType: string,
  ): Promise<NotificationResponse | null> {
    const timeUntilAppointment = appointmentTime.getTime() - Date.now();
    const hoursUntil = Math.round(timeUntilAppointment / (1000 * 60 * 60));

    return this.sendNotification({
      userId,
      channel: ['push', 'email', 'sms'],
      type: 'appointment_reminder',
      priority: hoursUntil < 4 ? 'high' : 'normal',
      title: `Reminder: ${appointmentType} Appointment`,
      subject: `Appointment reminder`,
      message: `Your ${appointmentType} appointment is in ${hoursUntil} hours. Please arrive on time.`,
      data: {
        appointment_id: appointmentId,
        appointment_time: appointmentTime.toISOString(),
        appointment_type: appointmentType,
        hours_until: hoursUntil,
      },
      template: 'appointment_reminder',
    });
  }

  /**
   * Send email notification
   */
  public async sendEmail(
    email: string,
    subject: string,
    message: string,
    template?: string,
    templateData?: Record<string, any>,
  ): Promise<NotificationResponse | null> {
    return this.sendNotification({
      userId: '', // Email-based
      channel: 'email',
      type: 'email',
      subject,
      message,
      email,
      template,
      templateData,
    });
  }

  /**
   * Send SMS notification
   */
  public async sendSMS(
    phoneNumber: string,
    message: string,
    priority?: NotificationPriority,
  ): Promise<NotificationResponse | null> {
    return this.sendNotification({
      userId: '', // Phone-based
      channel: 'sms',
      type: 'sms',
      message,
      phoneNumber,
      priority: priority || 'normal',
    });
  }

  /**
   * Send push notification
   */
  public async sendPush(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, any>,
  ): Promise<NotificationResponse | null> {
    return this.sendNotification({
      userId,
      channel: 'push',
      type: 'push',
      title,
      message,
      data,
    });
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/health', { timeout: 3000 });
      return response.status === 200;
    } catch (error) {
      console.warn('[NotificationClient] Health check failed:', error);
      return false;
    }
  }

  /**
   * Get notification status
   */
  public async getNotificationStatus(notificationId: string): Promise<NotificationResponse | null> {
    try {
      const response = await this.httpClient.get(`/notifications/${notificationId}/status`);
      return response.data;
    } catch (error) {
      console.error('[NotificationClient] Failed to get notification status:', error);
      return null;
    }
  }

  /**
   * Close Redis connection
   */
  public async closeRedisConnection(): Promise<void> {
    if (this.redisClient?.isOpen) {
      await this.redisClient.quit();
      console.log('[NotificationClient] Redis connection closed');
    }
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry(
    fn: () => Promise<any>,
    attempt: number = 0,
  ): Promise<any> {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt < this.retryAttempts && this.isRetryableError(error)) {
        const delay = this.retryDelay * Math.pow(2, attempt);
        console.log(`[NotificationClient] Retrying in ${delay}ms... (attempt ${attempt + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeWithRetry(fn, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return true;
    }

    if (error.response?.status >= 500) {
      return true;
    }

    if (error.message?.includes('ECONNRESET')) {
      return true;
    }

    return false;
  }
}

// Singleton instance
export const notificationClient = new NotificationClient();

export default NotificationClient;
