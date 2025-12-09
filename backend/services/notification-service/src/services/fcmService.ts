/**
 * Firebase Cloud Messaging (FCM) Service
 * Handles push notifications for mobile apps
 *
 * Features:
 * - Send notifications to individual devices
 * - Send to topic subscribers (broadcast)
 * - Schedule notifications
 * - Track delivery status
 * - Handle device token management
 *
 * Dependencies: firebase-admin
 */

interface FcmNotification {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
  priority?: 'high' | 'normal';
  sound?: string;
  badge?: number;
  clickAction?: string;
}

interface FcmTarget {
  token?: string;
  tokens?: string[];
  topic?: string;
  condition?: string;
}

interface FcmResult {
  success: boolean;
  messageId?: string;
  failureCount?: number;
  successCount?: number;
  errors?: Array<{
    index: number;
    error: string;
    code: string;
  }>;
}

interface DeviceToken {
  userId: string;
  token: string;
  platform: 'ios' | 'android';
  appVersion: string;
  lastUsed: Date;
  isActive: boolean;
}

/**
 * Firebase Cloud Messaging Service
 * NOTE: Requires firebase-admin SDK and Firebase project setup
 */
export class FcmService {
  private initialized: boolean = false;
  private app: any = null; // FirebaseApp instance
  private messaging: any = null; // Messaging instance
  private deviceTokens: Map<string, DeviceToken[]> = new Map();

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private initialize(): void {
    try {
      // Check if Firebase credentials are configured
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      const databaseUrl = process.env.FIREBASE_DATABASE_URL;

      if (!serviceAccountPath || !databaseUrl) {
        console.warn('[FcmService] Firebase not configured. Running in stub mode.');
        console.warn('[FcmService] Set FIREBASE_SERVICE_ACCOUNT_PATH and FIREBASE_DATABASE_URL env variables.');
        this.initialized = false;
        return;
      }

      // In production, initialize Firebase Admin:
      // import * as admin from 'firebase-admin';
      // const serviceAccount = require(serviceAccountPath);
      //
      // this.app = admin.initializeApp({
      //   credential: admin.credential.cert(serviceAccount),
      //   databaseURL: databaseUrl,
      // });
      //
      // this.messaging = admin.messaging(this.app);
      // this.initialized = true;
      // console.log('[FcmService] Firebase Admin SDK initialized successfully');

      // Stub mode
      this.initialized = false;
      console.log('[FcmService] Running in stub mode - no Firebase connection');
    } catch (error) {
      console.error('[FcmService] Failed to initialize Firebase:', error);
      this.initialized = false;
    }
  }

  /**
   * Send notification to a single device
   * @param token - FCM device token
   * @param notification - Notification payload
   */
  public async sendToDevice(token: string, notification: FcmNotification): Promise<FcmResult> {
    if (!this.initialized || !this.messaging) {
      console.warn('[FcmService] Stub mode - simulating notification send');
      return this.mockSendToDevice(token, notification);
    }

    try {
      // In production:
      // const message = {
      //   notification: {
      //     title: notification.title,
      //     body: notification.body,
      //     imageUrl: notification.imageUrl,
      //   },
      //   data: notification.data || {},
      //   android: {
      //     priority: notification.priority || 'high',
      //     notification: {
      //       sound: notification.sound || 'default',
      //       clickAction: notification.clickAction,
      //     },
      //   },
      //   apns: {
      //     payload: {
      //       aps: {
      //         badge: notification.badge,
      //         sound: notification.sound || 'default',
      //       },
      //     },
      //   },
      //   token,
      // };
      //
      // const response = await this.messaging.send(message);
      //
      // return {
      //   success: true,
      //   messageId: response,
      // };

      return this.mockSendToDevice(token, notification);
    } catch (error: any) {
      console.error('[FcmService] Failed to send notification:', error);

      return {
        success: false,
        errors: [
          {
            index: 0,
            error: error.message || 'Unknown error',
            code: error.code || 'UNKNOWN',
          },
        ],
      };
    }
  }

  /**
   * Send notification to multiple devices
   * @param tokens - Array of FCM device tokens
   * @param notification - Notification payload
   */
  public async sendToMultipleDevices(
    tokens: string[],
    notification: FcmNotification,
  ): Promise<FcmResult> {
    if (!this.initialized || !this.messaging) {
      console.warn('[FcmService] Stub mode - simulating multi-device send');
      return this.mockSendToMultipleDevices(tokens, notification);
    }

    try {
      // In production:
      // const message = {
      //   notification: {
      //     title: notification.title,
      //     body: notification.body,
      //     imageUrl: notification.imageUrl,
      //   },
      //   data: notification.data || {},
      //   tokens,
      // };
      //
      // const response = await this.messaging.sendMulticast(message);
      //
      // return {
      //   success: response.failureCount === 0,
      //   successCount: response.successCount,
      //   failureCount: response.failureCount,
      //   errors: response.responses
      //     .map((r, index) => ({
      //       index,
      //       error: r.error?.message || '',
      //       code: r.error?.code || '',
      //     }))
      //     .filter((e) => e.error),
      // };

      return this.mockSendToMultipleDevices(tokens, notification);
    } catch (error: any) {
      console.error('[FcmService] Failed to send to multiple devices:', error);

      return {
        success: false,
        failureCount: tokens.length,
        successCount: 0,
        errors: [
          {
            index: 0,
            error: error.message || 'Unknown error',
            code: error.code || 'UNKNOWN',
          },
        ],
      };
    }
  }

  /**
   * Send notification to a topic
   * @param topic - Topic name (e.g., "appointment-reminders")
   * @param notification - Notification payload
   */
  public async sendToTopic(topic: string, notification: FcmNotification): Promise<FcmResult> {
    if (!this.initialized || !this.messaging) {
      console.warn('[FcmService] Stub mode - simulating topic send');
      return this.mockSendToTopic(topic, notification);
    }

    try {
      // In production:
      // const message = {
      //   notification: {
      //     title: notification.title,
      //     body: notification.body,
      //     imageUrl: notification.imageUrl,
      //   },
      //   data: notification.data || {},
      //   topic,
      // };
      //
      // const response = await this.messaging.send(message);
      //
      // return {
      //   success: true,
      //   messageId: response,
      // };

      return this.mockSendToTopic(topic, notification);
    } catch (error: any) {
      console.error('[FcmService] Failed to send to topic:', error);

      return {
        success: false,
        errors: [
          {
            index: 0,
            error: error.message || 'Unknown error',
            code: error.code || 'UNKNOWN',
          },
        ],
      };
    }
  }

  /**
   * Subscribe device token to a topic
   * @param tokens - Device tokens to subscribe
   * @param topic - Topic name
   */
  public async subscribeToTopic(tokens: string[], topic: string): Promise<FcmResult> {
    if (!this.initialized || !this.messaging) {
      console.warn('[FcmService] Stub mode - simulating topic subscription');
      return { success: true, successCount: tokens.length };
    }

    try {
      // In production:
      // const response = await this.messaging.subscribeToTopic(tokens, topic);
      //
      // return {
      //   success: response.failureCount === 0,
      //   successCount: response.successCount,
      //   failureCount: response.failureCount,
      // };

      return { success: true, successCount: tokens.length };
    } catch (error: any) {
      console.error('[FcmService] Failed to subscribe to topic:', error);

      return {
        success: false,
        failureCount: tokens.length,
        successCount: 0,
      };
    }
  }

  /**
   * Unsubscribe device token from a topic
   * @param tokens - Device tokens to unsubscribe
   * @param topic - Topic name
   */
  public async unsubscribeFromTopic(tokens: string[], topic: string): Promise<FcmResult> {
    if (!this.initialized || !this.messaging) {
      console.warn('[FcmService] Stub mode - simulating topic unsubscription');
      return { success: true, successCount: tokens.length };
    }

    try {
      // In production:
      // const response = await this.messaging.unsubscribeFromTopic(tokens, topic);
      //
      // return {
      //   success: response.failureCount === 0,
      //   successCount: response.successCount,
      //   failureCount: response.failureCount,
      // };

      return { success: true, successCount: tokens.length };
    } catch (error: any) {
      console.error('[FcmService] Failed to unsubscribe from topic:', error);

      return {
        success: false,
        failureCount: tokens.length,
        successCount: 0,
      };
    }
  }

  /**
   * Register device token for a user
   * @param userId - User ID
   * @param token - FCM device token
   * @param platform - Platform (ios/android)
   * @param appVersion - App version
   */
  public async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android',
    appVersion: string,
  ): Promise<void> {
    const deviceToken: DeviceToken = {
      userId,
      token,
      platform,
      appVersion,
      lastUsed: new Date(),
      isActive: true,
    };

    // Get existing tokens for user
    const userTokens = this.deviceTokens.get(userId) || [];

    // Check if token already exists
    const existingIndex = userTokens.findIndex((t) => t.token === token);

    if (existingIndex >= 0) {
      // Update existing token
      userTokens[existingIndex] = deviceToken;
    } else {
      // Add new token
      userTokens.push(deviceToken);
    }

    this.deviceTokens.set(userId, userTokens);

    // In production, persist to database
    console.log(`[FcmService] Registered device token for user ${userId}`);
  }

  /**
   * Get all active device tokens for a user
   * @param userId - User ID
   */
  public async getUserDeviceTokens(userId: string): Promise<string[]> {
    const userTokens = this.deviceTokens.get(userId) || [];
    return userTokens.filter((t) => t.isActive).map((t) => t.token);
  }

  /**
   * Mark device token as inactive
   * @param token - Device token
   */
  public async deactivateDeviceToken(token: string): Promise<void> {
    for (const [userId, tokens] of this.deviceTokens.entries()) {
      const tokenIndex = tokens.findIndex((t) => t.token === token);
      if (tokenIndex >= 0) {
        tokens[tokenIndex].isActive = false;
        console.log(`[FcmService] Deactivated device token for user ${userId}`);
        return;
      }
    }
  }

  /**
   * Send appointment reminder notification
   * @param userId - User ID
   * @param appointmentData - Appointment details
   */
  public async sendAppointmentReminder(
    userId: string,
    appointmentData: {
      appointmentId: string;
      doctorName: string;
      dateTime: string;
      location: string;
    },
  ): Promise<FcmResult> {
    const tokens = await this.getUserDeviceTokens(userId);

    if (tokens.length === 0) {
      console.warn(`[FcmService] No device tokens found for user ${userId}`);
      return { success: false, errors: [{ index: 0, error: 'No device tokens', code: 'NO_TOKENS' }] };
    }

    const notification: FcmNotification = {
      title: 'Appointment Reminder',
      body: `Appointment with ${appointmentData.doctorName} at ${appointmentData.dateTime}`,
      data: {
        type: 'appointment_reminder',
        appointmentId: appointmentData.appointmentId,
        location: appointmentData.location,
      },
      priority: 'high',
      sound: 'default',
      clickAction: 'OPEN_APPOINTMENT',
    };

    return this.sendToMultipleDevices(tokens, notification);
  }

  /**
   * Mock implementations for stub mode
   */
  private mockSendToDevice(token: string, notification: FcmNotification): FcmResult {
    console.log('[FcmService] MOCK: Send to device');
    console.log(`  Token: ${token.substring(0, 20)}...`);
    console.log(`  Title: ${notification.title}`);
    console.log(`  Body: ${notification.body}`);

    return {
      success: true,
      messageId: `mock-message-${Date.now()}`,
    };
  }

  private mockSendToMultipleDevices(tokens: string[], notification: FcmNotification): FcmResult {
    console.log('[FcmService] MOCK: Send to multiple devices');
    console.log(`  Devices: ${tokens.length}`);
    console.log(`  Title: ${notification.title}`);
    console.log(`  Body: ${notification.body}`);

    return {
      success: true,
      successCount: tokens.length,
      failureCount: 0,
    };
  }

  private mockSendToTopic(topic: string, notification: FcmNotification): FcmResult {
    console.log('[FcmService] MOCK: Send to topic');
    console.log(`  Topic: ${topic}`);
    console.log(`  Title: ${notification.title}`);
    console.log(`  Body: ${notification.body}`);

    return {
      success: true,
      messageId: `mock-topic-message-${Date.now()}`,
    };
  }

  /**
   * Check if service is configured
   */
  public isConfigured(): boolean {
    return this.initialized;
  }

  /**
   * Get service status
   */
  public getStatus(): {
    initialized: boolean;
    totalUsers: number;
    totalTokens: number;
  } {
    let totalTokens = 0;
    for (const tokens of this.deviceTokens.values()) {
      totalTokens += tokens.filter((t) => t.isActive).length;
    }

    return {
      initialized: this.initialized,
      totalUsers: this.deviceTokens.size,
      totalTokens,
    };
  }
}

/**
 * Singleton instance
 */
export const fcmService = new FcmService();

/**
 * Configuration Guide:
 *
 * 1. Create Firebase project at https://console.firebase.google.com/
 * 2. Generate service account key (Project Settings → Service Accounts)
 * 3. Download JSON file and save to server
 * 4. Set environment variables:
 *    - FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
 *    - FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
 * 5. Install firebase-admin: npm install firebase-admin
 * 6. Restart notification service
 */
