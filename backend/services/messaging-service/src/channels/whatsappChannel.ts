/**
 * WhatsApp Channel
 * Integration with WhatsApp Business API
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { BaseMessageChannel, SendMessageResult, ChannelConfig } from './ChannelInterface';
import { Message } from '../models/Message';

export interface WhatsAppConfig extends ChannelConfig {
  apiUrl: string;
  phoneNumberId: string;
  accessToken: string;
  webhookSecret: string;
  apiVersion?: string;
}

export interface WhatsAppTemplate {
  name: string;
  language: string;
  components?: {
    type: string;
    parameters: {
      type: string;
      text?: string;
      image?: { link: string };
      document?: { link: string; filename: string };
    }[];
  }[];
}

export class WhatsAppChannel extends BaseMessageChannel {
  readonly name = 'whatsapp';
  private client: AxiosInstance;
  private whatsappConfig: WhatsAppConfig;

  constructor(config: WhatsAppConfig) {
    super(config);
    this.whatsappConfig = config;

    // Initialize WhatsApp API client
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    try {
      // Verify API access
      const response = await this.client.get(`/${this.whatsappConfig.phoneNumberId}`);
      return response.status === 200;
    } catch (error) {
      console.error('WhatsApp API not available:', error);
      return false;
    }
  }

  async sendMessage(message: Message): Promise<SendMessageResult> {
    try {
      this.validateMessage(message);

      // Check if using template
      const templateId = message.metadata?.templateId as string | undefined;

      if (templateId) {
        return await this.sendTemplateMessage(message, templateId);
      }

      // Send text message
      return await this.sendTextMessage(message);
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Send text message
   */
  private async sendTextMessage(message: Message): Promise<SendMessageResult> {
    const payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: message.recipientId, // Should be phone number in E.164 format
      type: 'text',
      text: {
        preview_url: false,
        body: message.content,
      },
    };

    const response = await this.retryWithBackoff(
      () => this.client.post(`/${this.whatsappConfig.phoneNumberId}/messages`, payload),
      this.config.retryPolicy?.maxAttempts || 3,
      this.config.retryPolicy?.backoffMs || 1000
    );

    return {
      success: true,
      externalId: response.data.messages[0].id,
      metadata: {
        waId: response.data.contacts[0].wa_id,
      },
    };
  }

  /**
   * Send template message
   */
  private async sendTemplateMessage(
    message: Message,
    templateName: string
  ): Promise<SendMessageResult> {
    const template: WhatsAppTemplate = {
      name: templateName,
      language: 'fr', // French for Swiss market
      components: [],
    };

    // Add body parameters if present in metadata
    const bodyParams = message.metadata?.templateParams as string[] | undefined;
    if (bodyParams && bodyParams.length > 0) {
      template.components = [
        {
          type: 'body',
          parameters: bodyParams.map((text) => ({
            type: 'text',
            text,
          })),
        },
      ];
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: message.recipientId,
      type: 'template',
      template,
    };

    const response = await this.retryWithBackoff(
      () => this.client.post(`/${this.whatsappConfig.phoneNumberId}/messages`, payload),
      this.config.retryPolicy?.maxAttempts || 3,
      this.config.retryPolicy?.backoffMs || 1000
    );

    return {
      success: true,
      externalId: response.data.messages[0].id,
      metadata: {
        waId: response.data.contacts[0].wa_id,
        template: templateName,
      },
    };
  }

  /**
   * Send media message (image, document, etc.)
   */
  async sendMediaMessage(
    message: Message,
    mediaType: 'image' | 'document' | 'audio' | 'video'
  ): Promise<SendMessageResult> {
    if (!message.attachments || message.attachments.length === 0) {
      throw new Error('No attachments found for media message');
    }

    const attachment = message.attachments[0];

    const payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: message.recipientId,
      type: mediaType,
      [mediaType]: {
        link: attachment.url,
      },
    };

    // Add caption for image/video
    if ((mediaType === 'image' || mediaType === 'video') && message.content) {
      payload[mediaType].caption = message.content;
    }

    // Add filename for document
    if (mediaType === 'document') {
      payload[mediaType].filename = attachment.filename;
    }

    const response = await this.retryWithBackoff(
      () => this.client.post(`/${this.whatsappConfig.phoneNumberId}/messages`, payload),
      this.config.retryPolicy?.maxAttempts || 3,
      this.config.retryPolicy?.backoffMs || 1000
    );

    return {
      success: true,
      externalId: response.data.messages[0].id,
      metadata: {
        waId: response.data.contacts[0].wa_id,
        mediaType,
      },
    };
  }

  /**
   * Handle incoming WhatsApp webhook
   */
  async handleIncoming(payload: any): Promise<void> {
    // Handle different webhook event types
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (value?.messages) {
      // Handle incoming messages
      await this.processIncomingMessages(value.messages);
    }

    if (value?.statuses) {
      // Handle message status updates
      await this.processStatusUpdates(value.statuses);
    }
  }

  /**
   * Process incoming messages
   */
  private async processIncomingMessages(messages: any[]): Promise<void> {
    for (const msg of messages) {
      console.log('Incoming WhatsApp message:', {
        id: msg.id,
        from: msg.from,
        type: msg.type,
        timestamp: msg.timestamp,
      });

      // This would trigger creation of a new message in the database
      // via the message service (handled by webhook controller)
    }
  }

  /**
   * Process status updates (sent, delivered, read)
   */
  private async processStatusUpdates(statuses: any[]): Promise<void> {
    for (const status of statuses) {
      console.log('WhatsApp status update:', {
        id: status.id,
        status: status.status,
        timestamp: status.timestamp,
      });

      // This would update the message status in the database
      // via the message service (handled by webhook controller)
    }
  }

  /**
   * Verify WhatsApp webhook signature
   */
  verifyWebhook(signature: string, payload: any): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.whatsappConfig.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return signature === `sha256=${expectedSignature}`;
  }

  /**
   * Verify webhook token (for initial setup)
   */
  static verifyWebhookToken(token: string, expectedToken: string): boolean {
    return token === expectedToken;
  }
}
