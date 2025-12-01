/**
 * In-App Channel
 * Handles in-app messaging (WebSocket/real-time)
 */

import { BaseMessageChannel, SendMessageResult, ChannelConfig } from './ChannelInterface';
import { Message } from '../models/Message';

export class InAppChannel extends BaseMessageChannel {
  readonly name = 'in_app';

  constructor(config: ChannelConfig) {
    super(config);
  }

  async isAvailable(): Promise<boolean> {
    return this.config.enabled;
  }

  async sendMessage(message: Message): Promise<SendMessageResult> {
    try {
      this.validateMessage(message);

      // For in-app messages, we just mark them as delivered immediately
      // The actual delivery happens through WebSocket/Socket.io in real-time
      // This is handled by the notification service

      return {
        success: true,
        externalId: message.id,
        metadata: {
          deliveredAt: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }
}
