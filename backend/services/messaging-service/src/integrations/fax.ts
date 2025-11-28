/**
 * Fax Gateway Integration
 *
 * Handles fax sending and receiving using Twilio Fax API
 * Supports:
 * - Send fax from PDF documents
 * - Receive fax and convert to PDF
 * - Fax status tracking
 */

import twilio from 'twilio';
import PDFDocument from 'pdfkit';
import { Message, MessageChannel, MessageDirection, MessageStatus } from '../types/message';

export interface FaxConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string; // Fax-enabled Twilio number
}

export interface FaxParams {
  to: string; // Fax number format: +14155551234
  pdfUrl?: string; // URL to PDF document
  pdfContent?: Buffer; // PDF content as buffer
  quality?: 'standard' | 'fine' | 'superfine';
}

export interface FaxResult {
  success: boolean;
  faxId?: string;
  error?: string;
  statusCode?: number;
}

class FaxClient {
  private client: twilio.Twilio | null = null;
  private fromNumber: string = '';
  private initialized: boolean = false;

  constructor() {
    // Lazy initialization
  }

  /**
   * Initialize Fax client with Twilio credentials
   */
  public initialize(config?: FaxConfig): void {
    const accountSid = config?.accountSid || process.env.TWILIO_ACCOUNT_SID;
    const authToken = config?.authToken || process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = config?.fromNumber || process.env.TWILIO_FAX_NUMBER || '';

    if (!accountSid || !authToken) {
      throw new Error('Fax configuration missing: TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN required');
    }

    if (!this.fromNumber) {
      throw new Error('Fax from number missing: TWILIO_FAX_NUMBER required');
    }

    this.client = twilio(accountSid, authToken);
    this.initialized = true;

    console.log('[Fax] Client initialized');
    console.log(`[Fax] From number: ${this.fromNumber}`);
  }

  /**
   * Send a fax (stub implementation)
   */
  public async sendFax(params: FaxParams): Promise<FaxResult> {
    if (!this.initialized) {
      this.initialize();
    }

    try {
      // Validate fax number
      if (!params.to || !this.isValidFaxNumber(params.to)) {
        return {
          success: false,
          error: 'Invalid fax number format. Use E.164 format: +14155551234',
        };
      }

      // Validate PDF source
      if (!params.pdfUrl && !params.pdfContent) {
        return {
          success: false,
          error: 'Either pdfUrl or pdfContent is required',
        };
      }

      console.log(`[Fax] STUB: Sending fax to ${params.to}`);
      console.log(`[Fax] STUB: Quality: ${params.quality || 'standard'}`);

      // STUB: In production, this would call Twilio Fax API
      // const fax = await this.client!.fax.v1.faxes.create({
      //   from: this.fromNumber,
      //   to: params.to,
      //   mediaUrl: params.pdfUrl,
      //   quality: params.quality || 'standard',
      // });

      // Simulate successful send
      const stubFaxId = `FX${Date.now()}${Math.random().toString(36).substring(7)}`;

      console.log(`[Fax] STUB: Fax queued successfully. ID: ${stubFaxId}`);

      return {
        success: true,
        faxId: stubFaxId,
        statusCode: 200,
      };
    } catch (error: unknown) {
      console.error('[Fax] Error sending fax:', error);

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
   * Get fax status from Twilio (stub implementation)
   */
  public async getFaxStatus(faxId: string): Promise<MessageStatus> {
    if (!this.initialized) {
      this.initialize();
    }

    try {
      console.log(`[Fax] STUB: Fetching status for fax ${faxId}`);

      // STUB: In production, this would fetch from Twilio
      // const fax = await this.client!.fax.v1.faxes(faxId).fetch();
      // return this.mapTwilioFaxStatus(fax.status);

      // Simulate delivered status
      return MessageStatus.DELIVERED;
    } catch (error) {
      console.error('[Fax] Error fetching fax status:', error);
      return MessageStatus.FAILED;
    }
  }

  /**
   * Handle incoming fax webhook (stub implementation)
   */
  public async handleIncomingFax(webhookData: Record<string, unknown>): Promise<Message | null> {
    console.log('[Fax] STUB: Processing incoming fax webhook');

    try {
      // STUB: In production, this would:
      // 1. Parse Twilio webhook payload
      // 2. Download fax PDF from MediaUrl
      // 3. Store PDF in file storage
      // 4. Create Message object

      const stubMessage: Message = {
        id: `FAX_IN_${Date.now()}`,
        conversationId: webhookData.From as string || 'stub-conversation',
        pharmacyId: webhookData.To as string || 'stub-pharmacy',
        channel: MessageChannel.FAX,
        direction: MessageDirection.INBOUND,
        status: MessageStatus.DELIVERED,
        from: {
          id: webhookData.From as string || 'stub-sender',
          faxNumber: webhookData.From as string,
        },
        to: [
          {
            id: webhookData.To as string || 'stub-recipient',
            faxNumber: webhookData.To as string,
          },
        ],
        body: 'Fax received',
        attachments: webhookData.MediaUrl
          ? [
              {
                id: `fax-${Date.now()}`,
                filename: 'received-fax.pdf',
                mimeType: 'application/pdf',
                size: webhookData.NumPages ? (webhookData.NumPages as number) * 50000 : 50000,
                url: webhookData.MediaUrl as string,
              },
            ]
          : undefined,
        createdAt: new Date(),
        metadata: webhookData,
      };

      return stubMessage;
    } catch (error) {
      console.error('[Fax] Error processing incoming fax:', error);
      return null;
    }
  }

  /**
   * Convert document to PDF for faxing (stub implementation)
   */
  public async convertToPDF(content: string, options?: { title?: string }): Promise<Buffer> {
    console.log('[Fax] STUB: Converting content to PDF');

    // STUB: In production, this would create a proper PDF
    // using PDFKit or similar library

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Add title if provided
        if (options?.title) {
          doc.fontSize(16).text(options.title, { underline: true });
          doc.moveDown();
        }

        // Add content
        doc.fontSize(12).text(content);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Validate fax number format (E.164)
   */
  private isValidFaxNumber(number: string): boolean {
    // E.164 format: +[country code][number]
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(number);
  }

  /**
   * Map Twilio fax status to our MessageStatus enum
   */
  private mapTwilioFaxStatus(twilioStatus: string): MessageStatus {
    const statusMap: Record<string, MessageStatus> = {
      queued: MessageStatus.QUEUED,
      processing: MessageStatus.SENT,
      sending: MessageStatus.SENT,
      delivered: MessageStatus.DELIVERED,
      receiving: MessageStatus.SENT,
      received: MessageStatus.DELIVERED,
      'no-answer': MessageStatus.FAILED,
      busy: MessageStatus.FAILED,
      failed: MessageStatus.FAILED,
      canceled: MessageStatus.FAILED,
    };

    return statusMap[twilioStatus] || MessageStatus.FAILED;
  }

  /**
   * Verify webhook signature (stub implementation)
   */
  public verifyWebhookSignature(signature: string, url: string, params: Record<string, unknown>): boolean {
    console.log('[Fax] STUB: Verifying webhook signature');

    // STUB: In production, this would use Twilio webhook validator
    // const validator = twilio.validateRequest(authToken, signature, url, params);
    // return validator;

    return true; // Always valid in stub
  }

  /**
   * Get fax pages count (stub implementation)
   */
  public async getFaxPagesCount(faxId: string): Promise<number> {
    console.log(`[Fax] STUB: Getting pages count for fax ${faxId}`);

    // STUB: In production, this would fetch from Twilio
    // const fax = await this.client!.fax.v1.faxes(faxId).fetch();
    // return fax.numPages || 0;

    return 1; // Stub: 1 page
  }
}

// Export singleton instance
export const faxClient = new FaxClient();

// Initialize on module load if environment variables are present
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    faxClient.initialize();
  } catch (error) {
    console.warn('[Fax] Failed to auto-initialize:', error);
  }
}
