/**
 * Router Service
 * Unified message router with channel abstraction and fallback logic
 */

import { Repository } from 'typeorm';
import { Message, MessageChannel, MessageStatus } from '../models/Message';
import { IMessageChannel, SendMessageResult } from '../channels';
import { MessageService } from './messageService';

export interface RoutingRule {
  channel: MessageChannel;
  recipientRole?: string;
  priority?: number;
  conditions?: {
    timeOfDay?: { start: string; end: string };
    urgency?: 'low' | 'normal' | 'high' | 'urgent';
    messageType?: string;
  };
}

export interface RouterConfig {
  defaultChannel: MessageChannel;
  fallbackChain: MessageChannel[];
  routingRules: RoutingRule[];
  rateLimits: {
    [key in MessageChannel]?: {
      maxMessages: number;
      windowMs: number;
    };
  };
}

export class RouterService {
  private channels: Map<MessageChannel, IMessageChannel>;
  private rateLimitTracking: Map<string, { count: number; resetAt: Date }>;

  constructor(
    private config: RouterConfig,
    private messageService: MessageService
  ) {
    this.channels = new Map();
    this.rateLimitTracking = new Map();
  }

  /**
   * Register a channel
   */
  registerChannel(channel: IMessageChannel, channelType: MessageChannel): void {
    this.channels.set(channelType, channel);
  }

  /**
   * Route and send a message
   */
  async routeMessage(message: Message): Promise<SendMessageResult> {
    try {
      // Determine the best channel
      const selectedChannel = this.selectChannel(message);

      // Check rate limits
      if (this.isRateLimited(selectedChannel, message)) {
        throw new Error(`Rate limit exceeded for channel: ${selectedChannel}`);
      }

      // Get channel implementation
      const channel = this.channels.get(selectedChannel);

      if (!channel) {
        throw new Error(`Channel ${selectedChannel} not registered`);
      }

      // Check if channel is available
      const isAvailable = await channel.isAvailable();

      if (!isAvailable) {
        // Try fallback channels
        return await this.tryFallbackChannels(message, selectedChannel);
      }

      // Send message
      const result = await channel.sendMessage(message);

      if (result.success) {
        // Update message status
        await this.messageService.updateMessageStatus(message.id, {
          status: MessageStatus.SENT,
          metadata: {
            externalId: result.externalId,
            channel: selectedChannel,
            ...result.metadata,
          },
        });

        // Track rate limit
        this.trackRateLimit(selectedChannel, message);
      } else {
        // Try fallback on failure
        if (this.config.fallbackChain.length > 0) {
          return await this.tryFallbackChannels(message, selectedChannel);
        }

        // Mark as failed
        await this.messageService.updateMessageStatus(message.id, {
          status: MessageStatus.FAILED,
          metadata: {
            errorMessage: result.error,
            attemptedChannel: selectedChannel,
          },
        });
      }

      return result;
    } catch (error) {
      // Mark message as failed
      await this.messageService.updateMessageStatus(message.id, {
        status: MessageStatus.FAILED,
        metadata: {
          errorMessage: (error as Error).message,
        },
      });

      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Select the best channel based on routing rules
   */
  private selectChannel(message: Message): MessageChannel {
    // Check if message already has a preferred channel
    if (message.channel && message.channel !== MessageChannel.IN_APP) {
      return message.channel;
    }

    // Apply routing rules
    const matchingRules = this.config.routingRules
      .filter((rule) => {
        // Filter by recipient role
        if (rule.recipientRole && rule.recipientRole !== message.recipientRole) {
          return false;
        }

        // Filter by urgency
        if (rule.conditions?.urgency) {
          const msgUrgency = message.metadata?.priority || 'normal';
          if (msgUrgency !== rule.conditions.urgency) {
            return false;
          }
        }

        // Filter by time of day
        if (rule.conditions?.timeOfDay) {
          const now = new Date();
          const currentTime = `${now.getHours()}:${now.getMinutes()}`;
          const { start, end } = rule.conditions.timeOfDay;

          if (currentTime < start || currentTime > end) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    if (matchingRules.length > 0) {
      return matchingRules[0].channel;
    }

    // Return default channel
    return this.config.defaultChannel;
  }

  /**
   * Try fallback channels if primary fails
   */
  private async tryFallbackChannels(
    message: Message,
    failedChannel: MessageChannel
  ): Promise<SendMessageResult> {
    const fallbackChannels = this.config.fallbackChain.filter(
      (ch) => ch !== failedChannel
    );

    for (const channelType of fallbackChannels) {
      const channel = this.channels.get(channelType);

      if (!channel) {
        continue;
      }

      const isAvailable = await channel.isAvailable();

      if (!isAvailable) {
        continue;
      }

      // Check rate limits
      if (this.isRateLimited(channelType, message)) {
        continue;
      }

      try {
        const result = await channel.sendMessage(message);

        if (result.success) {
          // Update message with fallback channel
          await this.messageService.updateMessageStatus(message.id, {
            status: MessageStatus.SENT,
            metadata: {
              externalId: result.externalId,
              channel: channelType,
              fallbackFrom: failedChannel,
              ...result.metadata,
            },
          });

          return result;
        }
      } catch (error) {
        console.error(`Fallback channel ${channelType} failed:`, error);
      }
    }

    // All fallbacks failed
    return {
      success: false,
      error: `All channels failed. Primary: ${failedChannel}, Tried fallbacks: ${fallbackChannels.join(', ')}`,
    };
  }

  /**
   * Check if channel is rate limited
   */
  private isRateLimited(channel: MessageChannel, message: Message): boolean {
    const rateLimitConfig = this.config.rateLimits[channel];

    if (!rateLimitConfig) {
      return false;
    }

    const key = `${channel}:${message.senderId}`;
    const tracking = this.rateLimitTracking.get(key);

    if (!tracking) {
      return false;
    }

    // Check if window has expired
    if (new Date() > tracking.resetAt) {
      this.rateLimitTracking.delete(key);
      return false;
    }

    return tracking.count >= rateLimitConfig.maxMessages;
  }

  /**
   * Track rate limit usage
   */
  private trackRateLimit(channel: MessageChannel, message: Message): void {
    const rateLimitConfig = this.config.rateLimits[channel];

    if (!rateLimitConfig) {
      return;
    }

    const key = `${channel}:${message.senderId}`;
    const tracking = this.rateLimitTracking.get(key);

    if (!tracking) {
      this.rateLimitTracking.set(key, {
        count: 1,
        resetAt: new Date(Date.now() + rateLimitConfig.windowMs),
      });
    } else {
      tracking.count += 1;
    }
  }

  /**
   * Get channel status
   */
  async getChannelStatus(): Promise<{
    [key in MessageChannel]?: {
      available: boolean;
      registered: boolean;
    };
  }> {
    const status: any = {};

    for (const [channelType, channel] of this.channels.entries()) {
      status[channelType] = {
        registered: true,
        available: await channel.isAvailable(),
      };
    }

    return status;
  }

  /**
   * Clean up expired rate limit tracking
   */
  cleanupRateLimits(): void {
    const now = new Date();

    for (const [key, tracking] of this.rateLimitTracking.entries()) {
      if (now > tracking.resetAt) {
        this.rateLimitTracking.delete(key);
      }
    }
  }
}
