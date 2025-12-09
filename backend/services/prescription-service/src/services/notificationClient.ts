/**
 * Notification Service Client
 * Handles multi-channel notifications (push, SMS, email)
 * Tasks: T8-010 - Notification Service Integration
 *
 * Features:
 * - Push notifications via Firebase Cloud Messaging
 * - SMS notifications via Twilio
 * - Email notifications via SendGrid
 * - Patient preference-based routing
 * - Graceful degradation when service unavailable
 * - Retry logic with exponential backoff
 */

import axios, { AxiosInstance } from 'axios';

// ============================================================================
// Types & Interfaces
// ============================================================================

export enum NotificationChannel {
  PUSH = 'push',
  SMS = 'sms',
  EMAIL = 'email',
}

export enum NotificationType {
  PRESCRIPTION_STATUS = 'prescription_status',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  MEDICATION_ALERT = 'medication_alert',
  ORDER_UPDATE = 'order_update',
  DELIVERY_TRACKING = 'delivery_tracking',
  SYSTEM_ALERT = 'system_alert',
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  preferredLanguage?: string;
  timezone?: string;
}

export interface NotificationPayload {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  channels?: NotificationChannel[];
  preferences?: NotificationPreferences;
  data?: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
  expiresIn?: number; // seconds
}

export interface NotificationResponse {
  id: string;
  recipientId: string;
  type: NotificationType;
  channels: NotificationChannel[];
  status: 'sent' | 'queued' | 'failed';
  timestamps: {
    created: string;
    sent?: string;
  };
  results?: {
    [key in NotificationChannel]?: {
      status: 'success' | 'failed' | 'pending';
      messageId?: string;
      error?: string;
    };
  };
}

export interface NotificationClientConfig {
  notificationServiceUrl: string;
  timeout?: number;
  maxRetries?: number;
  backoffMultiplier?: number;
  enabled?: boolean;
  apiKey?: string;
}

// ============================================================================
// Notification Service Client
// ============================================================================

export class NotificationClient {
  private client: AxiosInstance;
  private config: Required<NotificationClientConfig>;
  private retryQueue: NotificationPayload[] = [];
  private processingQueue: boolean = false;
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: NotificationClientConfig) {
    // Set defaults
    this.config = {
      notificationServiceUrl: config.notificationServiceUrl,
      timeout: config.timeout || 5000,
      maxRetries: config.maxRetries || 3,
      backoffMultiplier: config.backoffMultiplier || 2,
      enabled: config.enabled !== false,
      apiKey: config.apiKey || process.env.NOTIFICATION_API_KEY || '',
    };

    // Initialize axios client
    this.client = axios.create({
      baseURL: this.config.notificationServiceUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NotificationClient/1.0',
        ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey }),
      },
    });

    // Start health check if enabled
    if (this.config.enabled) {
      this.startHealthCheck();
    }
  }

  /**
   * Send a notification
   * @param payload - The notification payload
   * @returns Promise with notification response
   */
  async sendNotification(payload: NotificationPayload): Promise<NotificationResponse> {
    if (!this.config.enabled) {
      console.log('[NotificationClient] Notifications disabled');
      return {
        id: 'disabled',
        recipientId: payload.recipientId,
        type: payload.type,
        channels: payload.channels || [NotificationChannel.PUSH],
        status: 'failed',
        timestamps: {
          created: new Date().toISOString(),
        },
      };
    }

    try {
      console.log(`[NotificationClient] Sending ${payload.type} notification to ${payload.recipientId}`);

      // Determine channels based on preferences
      const channels = this.resolveChannels(payload);

      const response = await this.sendWithRetry({
        ...payload,
        channels,
      });

      return response;
    } catch (error) {
      console.error(`[NotificationClient] Failed to send notification, queueing:`, error instanceof Error ? error.message : error);

      // Queue notification for retry
      this.retryQueue.push(payload);

      // Return response indicating notification was queued
      return {
        id: `queued-${Date.now()}`,
        recipientId: payload.recipientId,
        type: payload.type,
        channels: payload.channels || [NotificationChannel.PUSH],
        status: 'queued',
        timestamps: {
          created: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Send multiple notifications (bulk)
   * @param payloads - Array of notification payloads
   * @returns Promise with array of responses
   */
  async sendBulkNotifications(payloads: NotificationPayload[]): Promise<NotificationResponse[]> {
    const results = await Promise.allSettled(payloads.map((p) => this.sendNotification(p)));

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }

      // Handle rejected promise
      const payload = payloads[index];
      console.error(`[NotificationClient] Bulk send failed for ${payload.recipientId}:`, result.reason);

      return {
        id: `error-${Date.now()}-${index}`,
        recipientId: payload.recipientId,
        type: payload.type,
        channels: payload.channels || [NotificationChannel.PUSH],
        status: 'failed',
        timestamps: {
          created: new Date().toISOString(),
        },
        results: {
          [NotificationChannel.PUSH]: {
            status: 'failed',
            error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
          },
        },
      };
    });
  }

  /**
   * Send notification with retry logic
   * @param payload - The notification payload
   * @param attempt - Current retry attempt (internal)
   * @returns Promise with notification response
   */
  private async sendWithRetry(payload: NotificationPayload, attempt: number = 1): Promise<NotificationResponse> {
    try {
      const response = await this.client.post<NotificationResponse>('/api/notifications/send', payload);
      console.log(`[NotificationClient] ✓ Notification sent: ${response.data.id}`);
      return response.data;
    } catch (error) {
      const isNetworkError = axios.isAxiosError(error) && !error.response;
      const isServerError = axios.isAxiosError(error) && error.response && error.response.status >= 500;
      const shouldRetry = isNetworkError || isServerError;

      if (shouldRetry && attempt < this.config.maxRetries) {
        const delay = this.calculateBackoff(attempt);
        console.log(`[NotificationClient] Retry attempt ${attempt + 1}/${this.config.maxRetries} after ${delay}ms`);

        await this.sleep(delay);
        return this.sendWithRetry(payload, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Resolve notification channels based on preferences
   * @param payload - The notification payload
   * @returns Array of channels to use
   */
  private resolveChannels(payload: NotificationPayload): NotificationChannel[] {
    // If channels explicitly specified, use them
    if (payload.channels && payload.channels.length > 0) {
      return payload.channels;
    }

    // If preferences provided, use them
    if (payload.preferences) {
      const channels: NotificationChannel[] = [];

      if (payload.preferences.pushEnabled) {
        channels.push(NotificationChannel.PUSH);
      }
      if (payload.preferences.smsEnabled) {
        channels.push(NotificationChannel.SMS);
      }
      if (payload.preferences.emailEnabled) {
        channels.push(NotificationChannel.EMAIL);
      }

      // If at least one channel enabled, use those
      if (channels.length > 0) {
        return channels;
      }
    }

    // Default to push notification
    return [NotificationChannel.PUSH];
  }

  /**
   * Calculate exponential backoff delay
   * @param attempt - The current retry attempt
   * @returns Delay in milliseconds
   */
  private calculateBackoff(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    const baseDelay = 1000; // 1 second
    return baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
  }

  /**
   * Sleep for specified milliseconds
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Start periodic health check and queue processing
   */
  private startHealthCheck(): void {
    // Check every 15 seconds
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.client.get('/health');
        // Service is healthy, process queued notifications
        this.processRetryQueue();
      } catch (error) {
        // Service is down, stop processing
        console.warn('[NotificationClient] Notification service health check failed');
      }
    }, 15000);
  }

  /**
   * Process queued notifications
   */
  private async processRetryQueue(): Promise<void> {
    if (this.processingQueue || this.retryQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      while (this.retryQueue.length > 0) {
        const payload = this.retryQueue.shift();
        if (!payload) break;

        try {
          await this.sendWithRetry(payload);
          console.log(`[NotificationClient] ✓ Processed queued notification: ${payload.type}`);
        } catch (error) {
          console.error(`[NotificationClient] Failed to process queued notification:`, error instanceof Error ? error.message : error);
          // Re-queue the notification and stop processing
          this.retryQueue.unshift(payload);
          break;
        }
      }
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Get current retry queue size
   * @returns Number of notifications in retry queue
   */
  getQueueSize(): number {
    return this.retryQueue.length;
  }

  /**
   * Clear the retry queue (use with caution)
   */
  clearQueue(): void {
    this.retryQueue = [];
    console.log('[NotificationClient] Retry queue cleared');
  }

  /**
   * Gracefully shutdown the client
   */
  async shutdown(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      console.log('[NotificationClient] Health check stopped');
    }

    // Process remaining queued notifications
    if (this.retryQueue.length > 0) {
      console.log(`[NotificationClient] Processing ${this.retryQueue.length} remaining queued notifications...`);
      await this.processRetryQueue();
    }

    console.log('[NotificationClient] Shutdown complete');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let notificationClientInstance: NotificationClient | null = null;

/**
 * Initialize the notification client (should be called once at app startup)
 * @param config - Configuration for the notification client
 * @returns The NotificationClient instance
 */
export function initializeNotificationClient(config: NotificationClientConfig): NotificationClient {
  if (notificationClientInstance) {
    console.warn('[NotificationClient] Already initialized, returning existing instance');
    return notificationClientInstance;
  }

  notificationClientInstance = new NotificationClient(config);
  console.log(`[NotificationClient] Initialized with URL: ${config.notificationServiceUrl}`);

  return notificationClientInstance;
}

/**
 * Get the notification client instance
 * @returns The NotificationClient instance or null if not initialized
 */
export function getNotificationClient(): NotificationClient | null {
  if (!notificationClientInstance) {
    console.warn('[NotificationClient] Client not initialized. Call initializeNotificationClient first.');
  }
  return notificationClientInstance;
}
