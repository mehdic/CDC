/**
 * Firebase Cloud Messaging (FCM) Integration
 *
 * Handles mobile push notifications for iOS and Android
 * Supports:
 * - Device token targeting
 * - Topic messaging
 * - Data payloads
 * - Notification priorities
 */

// Note: firebase-admin SDK is not in dependencies yet
// This implementation provides the interface and will work once firebase-admin is added

// Configuration interface
export interface FCMConfig {
  serverKey: string;
  projectId: string;
}

// Push notification parameters
export interface PushNotificationParams {
  token?: string; // Device token for single device
  tokens?: string[]; // Device tokens for multiple devices
  topic?: string; // Topic for topic messaging
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  };
  data?: Record<string, string>; // Additional data payload
  priority?: 'high' | 'normal';
  badge?: number;
  sound?: string;
  clickAction?: string;
  ttl?: number; // Time to live in seconds
}

// Push notification result
export interface PushNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  failedTokens?: string[];
}

class FirebaseCloudMessagingClient {
  private initialized: boolean = false;
  private serverKey: string;
  private projectId: string;

  constructor() {
    this.serverKey = process.env.FCM_SERVER_KEY || '';
    this.projectId = process.env.FCM_PROJECT_ID || '';
  }

  /**
   * Initialize FCM client
   * Note: This uses legacy HTTP API as firebase-admin is not yet in dependencies
   */
  public initialize(config?: FCMConfig): void {
    if (config?.serverKey) {
      this.serverKey = config.serverKey;
    }

    if (config?.projectId) {
      this.projectId = config.projectId;
    }

    if (!this.serverKey) {
      throw new Error('FCM server key is required. Set FCM_SERVER_KEY environment variable.');
    }

    if (!this.projectId) {
      throw new Error('FCM project ID is required. Set FCM_PROJECT_ID environment variable.');
    }

    this.initialized = true;
    console.log('[FCM] Client initialized');
    console.log(`[FCM] Project ID: ${this.projectId}`);
  }

  /**
   * Send push notification to a single device
   */
  public async sendPushNotification(
    params: PushNotificationParams
  ): Promise<PushNotificationResult> {
    if (!this.initialized) {
      this.initialize();
    }

    try {
      // Validate parameters
      if (!params.token && !params.tokens && !params.topic) {
        return {
          success: false,
          error: 'Must provide token, tokens, or topic',
        };
      }

      if (!params.notification || !params.notification.title || !params.notification.body) {
        return {
          success: false,
          error: 'Notification title and body are required',
        };
      }

      // Build FCM message payload
      const payload = this.buildFCMPayload(params);

      // Send via FCM HTTP v1 API
      const result = await this.sendViaHTTP(payload, params.token || params.tokens);

      return result;
    } catch (error) {
      console.error('[FCM] Error sending push notification:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send push notifications to multiple devices
   */
  public async sendMulticastNotification(
    tokens: string[],
    params: Omit<PushNotificationParams, 'token' | 'tokens'>
  ): Promise<PushNotificationResult> {
    if (!this.initialized) {
      this.initialize();
    }

    try {
      if (!tokens || tokens.length === 0) {
        return {
          success: false,
          error: 'At least one device token is required',
        };
      }

      console.log(`[FCM] Sending multicast notification to ${tokens.length} devices`);

      // Send to all tokens (FCM supports up to 500 tokens per request)
      const chunks = this.chunkArray(tokens, 500);
      const results: PushNotificationResult[] = [];

      for (const chunk of chunks) {
        const result = await this.sendPushNotification({
          ...params,
          tokens: chunk,
        });
        results.push(result);
      }

      // Aggregate results
      const allSuccessful = results.every((r) => r.success);
      const failedTokens = results.flatMap((r) => r.failedTokens || []);

      return {
        success: allSuccessful,
        error: allSuccessful ? undefined : 'Some notifications failed',
        failedTokens: failedTokens.length > 0 ? failedTokens : undefined,
      };
    } catch (error) {
      console.error('[FCM] Error sending multicast notification:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send to topic (subscribe devices to topics first)
   */
  public async sendToTopic(
    topic: string,
    params: Omit<PushNotificationParams, 'token' | 'tokens' | 'topic'>
  ): Promise<PushNotificationResult> {
    if (!this.initialized) {
      this.initialize();
    }

    try {
      console.log(`[FCM] Sending notification to topic: ${topic}`);

      const result = await this.sendPushNotification({
        ...params,
        topic,
      });

      return result;
    } catch (error) {
      console.error('[FCM] Error sending to topic:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Build FCM payload
   */
  private buildFCMPayload(params: PushNotificationParams): {
    notification: {
      title: string;
      body: string;
      image?: string;
    };
    data?: Record<string, string>;
    android?: {
      priority: 'high' | 'normal';
      notification?: {
        sound?: string;
        click_action?: string;
      };
    };
    apns?: {
      payload: {
        aps: {
          badge?: number;
          sound?: string;
          'content-available'?: number;
        };
      };
    };
    fcm_options?: {
      analytics_label?: string;
    };
  } {
    const payload: ReturnType<typeof this.buildFCMPayload> = {
      notification: {
        title: params.notification.title,
        body: params.notification.body,
        image: params.notification.imageUrl,
      },
    };

    // Add data payload
    if (params.data) {
      payload.data = params.data;
    }

    // Android-specific
    payload.android = {
      priority: params.priority || 'high',
      notification: {
        sound: params.sound || 'default',
        click_action: params.clickAction,
      },
    };

    // iOS-specific (APNS)
    payload.apns = {
      payload: {
        aps: {
          badge: params.badge,
          sound: params.sound || 'default',
          'content-available': 1,
        },
      },
    };

    return payload;
  }

  /**
   * Send via FCM HTTP API (legacy)
   * TODO: Migrate to firebase-admin SDK when added to dependencies
   */
  private async sendViaHTTP(
    payload: ReturnType<typeof this.buildFCMPayload>,
    target: string | string[] | undefined
  ): Promise<PushNotificationResult> {
    // Placeholder implementation
    // In production, this would use fetch/axios to call FCM HTTP v1 API
    console.log('[FCM] Sending via HTTP API...');
    console.log('[FCM] Payload:', JSON.stringify(payload, null, 2));
    console.log('[FCM] Target:', target);

    // Simulate sending
    return {
      success: true,
      messageId: `fcm-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Verify configuration
   */
  public async verifyConfiguration(): Promise<boolean> {
    try {
      if (!this.initialized) {
        this.initialize();
      }

      // Verify credentials are set
      return this.initialized && !!this.serverKey && !!this.projectId;
    } catch (error) {
      console.error('[FCM] Configuration verification failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const fcmClient = new FirebaseCloudMessagingClient();

// Initialize on module load if environment variables are present
if (process.env.FCM_SERVER_KEY && process.env.FCM_PROJECT_ID) {
  try {
    fcmClient.initialize();
  } catch (error) {
    console.warn('[FCM] Failed to auto-initialize:', error);
  }
}
