/**
 * Email Channel
 * Integration with email providers (SendGrid, SMTP)
 */

import sgMail from '@sendgrid/mail';
import { BaseMessageChannel, SendMessageResult, ChannelConfig } from './ChannelInterface';
import { Message } from '../models/Message';

export interface EmailConfig extends ChannelConfig {
  provider: 'sendgrid' | 'smtp';
  apiKey?: string; // For SendGrid
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  // SMTP settings (if using SMTP)
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
}

export interface EmailTemplate {
  templateId: string;
  dynamicData?: Record<string, any>;
}

export class EmailChannel extends BaseMessageChannel {
  readonly name = 'email';
  private emailConfig: EmailConfig;

  constructor(config: EmailConfig) {
    super(config);
    this.emailConfig = config;

    // Initialize SendGrid if using that provider
    if (config.provider === 'sendgrid' && config.apiKey) {
      sgMail.setApiKey(config.apiKey);
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    if (this.emailConfig.provider === 'sendgrid') {
      return !!this.emailConfig.apiKey;
    }

    if (this.emailConfig.provider === 'smtp') {
      return !!this.emailConfig.smtp;
    }

    return false;
  }

  async sendMessage(message: Message): Promise<SendMessageResult> {
    try {
      this.validateMessage(message);

      if (this.emailConfig.provider === 'sendgrid') {
        return await this.sendViaSendGrid(message);
      } else if (this.emailConfig.provider === 'smtp') {
        return await this.sendViaSMTP(message);
      }

      throw new Error(`Unsupported email provider: ${this.emailConfig.provider}`);
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Send email via SendGrid
   */
  private async sendViaSendGrid(message: Message): Promise<SendMessageResult> {
    const templateId = message.metadata?.templateId as string | undefined;

    const mailOptions: any = {
      from: {
        email: this.emailConfig.fromEmail,
        name: this.emailConfig.fromName,
      },
      to: message.recipientId, // Should be email address
      replyTo: this.emailConfig.replyTo,
    };

    // Use template if specified
    if (templateId) {
      mailOptions.templateId = templateId;
      mailOptions.dynamicTemplateData = message.metadata?.templateData || {};
    } else {
      // Get subject from metadata or use default
      mailOptions.subject = (message.metadata?.subject as string) || 'Message from MetaPharm Connect';

      // Check if HTML content is provided
      const isHtml = message.metadata?.isHtml as boolean | undefined;

      if (isHtml) {
        mailOptions.html = message.content;
      } else {
        mailOptions.text = message.content;
      }
    }

    // Add attachments
    if (message.attachments && message.attachments.length > 0) {
      mailOptions.attachments = message.attachments.map((att) => ({
        filename: att.filename,
        content: att.url, // URL or base64 content
        type: att.mimeType,
        disposition: 'attachment',
      }));
    }

    const response = await this.retryWithBackoff(
      () => sgMail.send(mailOptions),
      this.config.retryPolicy?.maxAttempts || 3,
      this.config.retryPolicy?.backoffMs || 1000
    );

    return {
      success: true,
      externalId: response[0].headers['x-message-id'],
      metadata: {
        statusCode: response[0].statusCode,
        provider: 'sendgrid',
      },
    };
  }

  /**
   * Send email via SMTP
   */
  private async sendViaSMTP(message: Message): Promise<SendMessageResult> {
    // For SMTP, we'd use nodemailer
    // This is a placeholder implementation
    // In production, you'd import and configure nodemailer

    const nodemailer = await import('nodemailer').catch(() => null);

    if (!nodemailer) {
      throw new Error('nodemailer not installed for SMTP support');
    }

    if (!this.emailConfig.smtp) {
      throw new Error('SMTP configuration not provided');
    }

    const transporter = nodemailer.createTransport({
      host: this.emailConfig.smtp.host,
      port: this.emailConfig.smtp.port,
      secure: this.emailConfig.smtp.secure,
      auth: this.emailConfig.smtp.auth,
    });

    const isHtml = message.metadata?.isHtml as boolean | undefined;

    const mailOptions: any = {
      from: `${this.emailConfig.fromName} <${this.emailConfig.fromEmail}>`,
      to: message.recipientId,
      subject: (message.metadata?.subject as string) || 'Message from MetaPharm Connect',
      text: isHtml ? undefined : message.content,
      html: isHtml ? message.content : undefined,
      replyTo: this.emailConfig.replyTo,
    };

    // Add attachments
    if (message.attachments && message.attachments.length > 0) {
      mailOptions.attachments = message.attachments.map((att) => ({
        filename: att.filename,
        path: att.url,
        contentType: att.mimeType,
      }));
    }

    const info = await this.retryWithBackoff(
      () => transporter.sendMail(mailOptions),
      this.config.retryPolicy?.maxAttempts || 3,
      this.config.retryPolicy?.backoffMs || 1000
    );

    return {
      success: true,
      externalId: info.messageId,
      metadata: {
        response: info.response,
        provider: 'smtp',
      },
    };
  }

  /**
   * Handle incoming email webhook (for delivery tracking)
   */
  async handleIncoming(payload: any): Promise<void> {
    // Handle SendGrid webhook events
    if (Array.isArray(payload)) {
      for (const event of payload) {
        await this.processEmailEvent(event);
      }
    } else {
      await this.processEmailEvent(payload);
    }
  }

  /**
   * Process email event (delivered, opened, bounced, etc.)
   */
  private async processEmailEvent(event: any): Promise<void> {
    const eventType = event.event;
    const messageId = event.sg_message_id || event.smtp_id;

    console.log('Email event:', {
      type: eventType,
      messageId,
      email: event.email,
      timestamp: event.timestamp,
    });

    // Event types: delivered, bounce, dropped, open, click, unsubscribe, etc.
    // This would update the message status in the database
    // via the message service (handled by webhook controller)
  }

  /**
   * Verify SendGrid webhook signature
   */
  verifyWebhook(signature: string, payload: any): boolean {
    // SendGrid webhook verification
    // Implementation would depend on SendGrid's signature verification
    return true; // Placeholder
  }
}
