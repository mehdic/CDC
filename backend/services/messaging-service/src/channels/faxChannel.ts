/**
 * Fax Channel
 * Integration with fax-to-digital services (Twilio Fax, eFax, etc.)
 */

import axios, { AxiosInstance } from 'axios';
import { BaseMessageChannel, SendMessageResult, ChannelConfig } from './ChannelInterface';
import { Message } from '../models/Message';

export interface FaxConfig extends ChannelConfig {
  provider: 'twilio' | 'efax';
  accountSid?: string; // Twilio
  authToken?: string; // Twilio
  fromFaxNumber: string;
  apiUrl?: string;
  webhookUrl?: string;
}

export class FaxChannel extends BaseMessageChannel {
  readonly name = 'fax';
  private faxConfig: FaxConfig;
  private client: AxiosInstance | null = null;

  constructor(config: FaxConfig) {
    super(config);
    this.faxConfig = config;

    // Initialize Twilio client if using Twilio
    if (config.provider === 'twilio' && config.accountSid && config.authToken) {
      const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');

      this.client = axios.create({
        baseURL: config.apiUrl || `https://fax.twilio.com/v1`,
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 60000, // Fax can take time
      });
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    if (this.faxConfig.provider === 'twilio') {
      return !!this.client;
    }

    return false;
  }

  async sendMessage(message: Message): Promise<SendMessageResult> {
    try {
      this.validateMessage(message);

      if (this.faxConfig.provider === 'twilio') {
        return await this.sendViaTwilio(message);
      }

      throw new Error(`Unsupported fax provider: ${this.faxConfig.provider}`);
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Send fax via Twilio
   */
  private async sendViaTwilio(message: Message): Promise<SendMessageResult> {
    if (!this.client) {
      throw new Error('Twilio client not initialized');
    }

    // Fax requires a PDF document
    if (!message.attachments || message.attachments.length === 0) {
      throw new Error('Fax requires a PDF attachment');
    }

    const pdfAttachment = message.attachments.find(
      (att) => att.mimeType === 'application/pdf'
    );

    if (!pdfAttachment) {
      throw new Error('Fax requires a PDF document');
    }

    const formData = new URLSearchParams({
      From: this.faxConfig.fromFaxNumber,
      To: message.recipientId, // Should be fax number in E.164 format
      MediaUrl: pdfAttachment.url,
      Quality: 'fine', // or 'superfine'
      StatusCallback: this.faxConfig.webhookUrl || '',
    });

    const response = await this.retryWithBackoff(
      () => this.client!.post('/Faxes', formData.toString()),
      this.config.retryPolicy?.maxAttempts || 3,
      this.config.retryPolicy?.backoffMs || 2000
    );

    return {
      success: true,
      externalId: response.data.sid,
      metadata: {
        status: response.data.status,
        numPages: response.data.num_pages,
        provider: 'twilio',
      },
    };
  }

  /**
   * Handle incoming fax webhook
   */
  async handleIncoming(payload: any): Promise<void> {
    if (this.faxConfig.provider === 'twilio') {
      await this.processTwilioWebhook(payload);
    }
  }

  /**
   * Process Twilio fax webhook
   */
  private async processTwilioWebhook(payload: any): Promise<void> {
    const faxSid = payload.FaxSid;
    const status = payload.FaxStatus;
    const mediaUrl = payload.MediaUrl;

    console.log('Incoming fax webhook:', {
      sid: faxSid,
      status,
      from: payload.From,
      to: payload.To,
      pages: payload.NumPages,
    });

    // For incoming faxes, download and process
    if (payload.Direction === 'inbound' && mediaUrl) {
      await this.processIncomingFax(faxSid, mediaUrl, payload);
    }

    // For outbound faxes, update status
    if (payload.Direction === 'outbound') {
      await this.processOutboundFaxStatus(faxSid, status, payload);
    }
  }

  /**
   * Process incoming fax (download and OCR)
   */
  private async processIncomingFax(
    faxSid: string,
    mediaUrl: string,
    payload: any
  ): Promise<void> {
    try {
      // Download the fax PDF
      const pdfResponse = await axios.get(mediaUrl, {
        responseType: 'arraybuffer',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${this.faxConfig.accountSid}:${this.faxConfig.authToken}`
          ).toString('base64')}`,
        },
      });

      const pdfBuffer = Buffer.from(pdfResponse.data);

      console.log('Downloaded fax PDF:', {
        faxSid,
        size: pdfBuffer.length,
        from: payload.From,
      });

      // Store PDF and extract text with OCR
      // This would integrate with AWS Textract or similar OCR service
      // The extracted text would be stored as message content

      // For now, just log that we received it
      // In production, this would:
      // 1. Upload PDF to S3
      // 2. Run OCR via AWS Textract
      // 3. Create message in database with extracted text
      // 4. Notify recipient
    } catch (error) {
      console.error('Error processing incoming fax:', error);
    }
  }

  /**
   * Process outbound fax status update
   */
  private async processOutboundFaxStatus(
    faxSid: string,
    status: string,
    payload: any
  ): Promise<void> {
    console.log('Outbound fax status update:', {
      faxSid,
      status,
      errorCode: payload.ErrorCode,
      errorMessage: payload.ErrorMessage,
    });

    // Status values: queued, processing, sending, delivered, receiving, received, failed
    // This would update the message status in the database
    // via the message service (handled by webhook controller)
  }

  /**
   * Extract text from PDF using OCR
   */
  async extractTextFromPDF(pdfUrl: string): Promise<string> {
    // This would integrate with AWS Textract or similar
    // Placeholder implementation

    try {
      // In production, use AWS Textract
      // const textract = new AWS.Textract();
      // const result = await textract.detectDocumentText({ ... });

      return 'Extracted text from fax (OCR placeholder)';
    } catch (error) {
      console.error('OCR extraction failed:', error);
      return '';
    }
  }

  /**
   * Generate PDF from text content
   */
  async generatePDFFromText(content: string, title?: string): Promise<Buffer> {
    // This would use a PDF generation library (pdfkit, puppeteer, etc.)
    // Placeholder implementation

    try {
      // In production, use pdfkit or puppeteer
      // const PDFDocument = require('pdfkit');
      // const doc = new PDFDocument();
      // doc.text(content);

      return Buffer.from('PDF content placeholder');
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw error;
    }
  }
}
