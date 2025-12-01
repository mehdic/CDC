/**
 * Channel Interface
 * Base interface for all messaging channels
 */

import { Message } from '../models/Message';

export interface SendMessageResult {
  success: boolean;
  externalId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ChannelConfig {
  enabled: boolean;
  rateLimit?: {
    maxMessages: number;
    windowMs: number;
  };
  retryPolicy?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

export interface IMessageChannel {
  /**
   * Channel name
   */
  readonly name: string;

  /**
   * Check if channel is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Send a message through this channel
   */
  sendMessage(message: Message): Promise<SendMessageResult>;

  /**
   * Handle incoming webhook/callback
   */
  handleIncoming?(payload: any): Promise<void>;

  /**
   * Verify webhook signature (for security)
   */
  verifyWebhook?(signature: string, payload: any): boolean;

  /**
   * Get channel configuration
   */
  getConfig(): ChannelConfig;
}

export abstract class BaseMessageChannel implements IMessageChannel {
  abstract readonly name: string;
  protected config: ChannelConfig;

  constructor(config: ChannelConfig) {
    this.config = config;
  }

  abstract isAvailable(): Promise<boolean>;
  abstract sendMessage(message: Message): Promise<SendMessageResult>;

  getConfig(): ChannelConfig {
    return this.config;
  }

  /**
   * Default retry logic
   */
  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxAttempts = 3,
    backoffMs = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxAttempts) {
          const delay = backoffMs * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Max retry attempts reached');
  }

  /**
   * Validate message before sending
   */
  protected validateMessage(message: Message): void {
    if (!message.content || message.content.trim().length === 0) {
      throw new Error('Message content cannot be empty');
    }

    if (!message.recipientId) {
      throw new Error('Recipient ID is required');
    }
  }
}
