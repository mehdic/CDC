/**
 * WhatsApp Business API Integration
 *
 * Handles WhatsApp messaging using Twilio WhatsApp API
 * Supports:
 * - Template messages (pre-approved by WhatsApp)
 * - Session messages (24-hour window after user initiation)
 * - Media messages (images, documents, PDFs)
 */

import twilio from 'twilio';
import { Message, MessageChannel, MessageDirection, MessageStatus } from '../types/message';

export interface WhatsAppConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string; // WhatsApp number format: whatsapp:+14155238886
}

export interface WhatsAppMessageParams {
  to: string; // Format: whatsapp:+41791234567
  body: string;
  mediaUrl?: string[];
  persistentAction?: string[];
}

export interface WhatsAppTemplateParams {
  to: string;
  templateSid: string;
  contentVariables: Record<string, string>;
}

export interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
  statusCode?: number;
}

class WhatsAppClient {
  private client: twilio.Twilio | null = null;
  private fromNumber: string = '';
  private initialized: boolean = false;

  constructor() {
    // Lazy initialization
  }

  /**
   * Initialize WhatsApp client with Twilio credentials
   */
  public initialize(config?: WhatsAppConfig): void {
    const accountSid = config?.accountSid || process.env.TWILIO_ACCOUNT_SID;
    const authToken = config?.authToken || process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = config?.fromNumber || process.env.TWILIO_WHATSAPP_NUMBER || '';

    if (!accountSid || !authToken) {
      throw new Error('WhatsApp configuration missing: TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN required');
    }

    if (!this.fromNumber) {
      throw new Error('WhatsApp from number missing: TWILIO_WHATSAPP_NUMBER required');
    }

    this.client = twilio(accountSid, authToken);
    this.initialized = true;

    console.log('[WhatsApp] Client initialized');
    console.log(`[WhatsApp] From number: ${this.fromNumber}`);
  }

  /**
   * Send a WhatsApp message (stub implementation)
   */
  public async sendMessage(params: WhatsAppMessageParams): Promise<WhatsAppResult> {
    if (!this.initialized) {
      this.initialize();
    }

    try {
      // Validate phone number format
      if (!params.to.startsWith('whatsapp:')) {
        return {
          success: false,
          error: 'Phone number must be in WhatsApp format: whatsapp:+41791234567',
        };
      }

      console.log(`[WhatsApp] STUB: Sending message to ${params.to}`);
      console.log(`[WhatsApp] STUB: Body: ${params.body.substring(0, 50)}...`);

      // STUB: In production, this would call Twilio API
      // const message = await this.client!.messages.create({
      //   from: this.fromNumber,
      //   to: params.to,
      //   body: params.body,
      //   mediaUrl: params.mediaUrl,
      //   persistentAction: params.persistentAction,
      // });

      // Simulate successful send
      const stubMessageId = `WA${Date.now()}${Math.random().toString(36).substring(7)}`;

      console.log(`[WhatsApp] STUB: Message sent successfully. ID: ${stubMessageId}`);

      return {
        success: true,
        messageId: stubMessageId,
        statusCode: 200,
      };
    } catch (error: unknown) {
      console.error('[WhatsApp] Error sending message:', error);

      if (error && typeof error === 'object' && 'status' in error) {
        const twilioError = error as { status: number; message: string };
        return {
          success: false,
          error: twilioError.message,
          statusCode: twilioError.status,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send a WhatsApp template message (stub implementation)
   * Templates must be pre-approved by WhatsApp
   */
  public async sendTemplateMessage(params: WhatsAppTemplateParams): Promise<WhatsAppResult> {
    if (!this.initialized) {
      this.initialize();
    }

    try {
      console.log(`[WhatsApp] STUB: Sending template message to ${params.to}`);
      console.log(`[WhatsApp] STUB: Template SID: ${params.templateSid}`);

      // STUB: In production, this would use Twilio Content API
      // const message = await this.client!.messages.create({
      //   from: this.fromNumber,
      //   to: params.to,
      //   contentSid: params.templateSid,
      //   contentVariables: JSON.stringify(params.contentVariables),
      // });

      const stubMessageId = `WAT${Date.now()}${Math.random().toString(36).substring(7)}`;

      console.log(`[WhatsApp] STUB: Template message sent successfully. ID: ${stubMessageId}`);

      return {
        success: true,
        messageId: stubMessageId,
        statusCode: 200,
      };
    } catch (error: unknown) {
      console.error('[WhatsApp] Error sending template message:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get message status from Twilio (stub implementation)
   */
  public async getMessageStatus(messageId: string): Promise<MessageStatus> {
    if (!this.initialized) {
      this.initialize();
    }

    try {
      console.log(`[WhatsApp] STUB: Fetching status for message ${messageId}`);

      // STUB: In production, this would fetch from Twilio
      // const message = await this.client!.messages(messageId).fetch();
      // return this.mapTwilioStatus(message.status);

      // Simulate delivered status
      return MessageStatus.DELIVERED;
    } catch (error) {
      console.error('[WhatsApp] Error fetching message status:', error);
      return MessageStatus.FAILED;
    }
  }

  /**
   * Handle incoming WhatsApp webhook (stub implementation)
   */
  public async handleIncomingMessage(webhookData: Record<string, unknown>): Promise<Message | null> {
    console.log('[WhatsApp] STUB: Processing incoming webhook');

    try {
      // STUB: In production, this would parse Twilio webhook payload
      // and create a Message object

      const stubMessage: Message = {
        id: `WA_IN_${Date.now()}`,
        conversationId: webhookData.From as string || 'stub-conversation',
        pharmacyId: webhookData.To as string || 'stub-pharmacy',
        channel: MessageChannel.WHATSAPP,
        direction: MessageDirection.INBOUND,
        status: MessageStatus.DELIVERED,
        from: {
          id: webhookData.From as string || 'stub-sender',
          phone: webhookData.From as string,
        },
        to: [
          {
            id: webhookData.To as string || 'stub-recipient',
            phone: webhookData.To as string,
          },
        ],
        body: webhookData.Body as string || '',
        createdAt: new Date(),
        metadata: webhookData,
      };

      return stubMessage;
    } catch (error) {
      console.error('[WhatsApp] Error processing incoming message:', error);
      return null;
    }
  }

  /**
   * Map Twilio status to our MessageStatus enum
   */
  private mapTwilioStatus(twilioStatus: string): MessageStatus {
    const statusMap: Record<string, MessageStatus> = {
      queued: MessageStatus.QUEUED,
      sent: MessageStatus.SENT,
      delivered: MessageStatus.DELIVERED,
      read: MessageStatus.READ,
      failed: MessageStatus.FAILED,
      undelivered: MessageStatus.FAILED,
    };

    return statusMap[twilioStatus] || MessageStatus.FAILED;
  }

  /**
   * Verify webhook signature (stub implementation)
   */
  public verifyWebhookSignature(signature: string, url: string, params: Record<string, unknown>): boolean {
    console.log('[WhatsApp] STUB: Verifying webhook signature');

    // STUB: In production, this would use Twilio webhook validator
    // const validator = twilio.validateRequest(authToken, signature, url, params);
    // return validator;

    return true; // Always valid in stub
  }
}

// Export singleton instance
export const whatsappClient = new WhatsAppClient();

// Initialize on module load if environment variables are present
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    whatsappClient.initialize();
  } catch (error) {
    console.warn('[WhatsApp] Failed to auto-initialize:', error);
  }
}
