/**
 * Email Integration (SMTP/IMAP)
 *
 * Handles email sending and receiving:
 * - SMTP for sending emails (via nodemailer)
 * - IMAP for receiving/syncing emails (stub)
 * - Email threading support
 */

import nodemailer, { Transporter } from 'nodemailer';
import { Message, MessageChannel, MessageDirection, MessageStatus, MessageAttachment } from '../types/message';

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  imapHost?: string;
  imapPort?: number;
  imapUser?: string;
  imapPassword?: string;
}

export interface EmailParams {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
  replyTo?: string;
  inReplyTo?: string; // Message-ID of the email being replied to
  references?: string[]; // Array of Message-IDs for threading
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailClient {
  private smtpTransporter: Transporter | null = null;
  private fromEmail: string = '';
  private fromName: string = '';
  private initialized: boolean = false;

  constructor() {
    // Lazy initialization
  }

  /**
   * Initialize email client with SMTP/IMAP configuration
   */
  public initialize(config?: EmailConfig): void {
    const smtpConfig = {
      host: config?.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: config?.smtpPort || parseInt(process.env.SMTP_PORT || '587'),
      secure: config?.smtpSecure || process.env.SMTP_SECURE === 'true',
      auth: {
        user: config?.smtpUser || process.env.SMTP_USER || '',
        pass: config?.smtpPassword || process.env.SMTP_PASSWORD || '',
      },
    };

    this.fromEmail = config?.fromEmail || process.env.SMTP_FROM_EMAIL || '';
    this.fromName = config?.fromName || process.env.SMTP_FROM_NAME || 'MetaPharm Connect';

    if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
      throw new Error('Email configuration missing: SMTP_USER and SMTP_PASSWORD required');
    }

    if (!this.fromEmail) {
      throw new Error('From email missing: SMTP_FROM_EMAIL required');
    }

    this.smtpTransporter = nodemailer.createTransport(smtpConfig);
    this.initialized = true;

    console.log('[Email] SMTP client initialized');
    console.log(`[Email] SMTP Host: ${smtpConfig.host}:${smtpConfig.port}`);
    console.log(`[Email] From: ${this.fromName} <${this.fromEmail}>`);
  }

  /**
   * Send an email (stub implementation)
   */
  public async sendEmail(params: EmailParams): Promise<EmailResult> {
    if (!this.initialized) {
      this.initialize();
    }

    try {
      // Validate required parameters
      if (!params.to || params.to.length === 0) {
        return {
          success: false,
          error: 'At least one recipient is required',
        };
      }

      if (!params.subject) {
        return {
          success: false,
          error: 'Email subject is required',
        };
      }

      if (!params.text && !params.html) {
        return {
          success: false,
          error: 'Email must have text or HTML content',
        };
      }

      console.log(`[Email] STUB: Sending email to ${params.to.join(', ')}`);
      console.log(`[Email] STUB: Subject: ${params.subject}`);

      // STUB: In production, this would send via nodemailer
      // const info = await this.smtpTransporter!.sendMail({
      //   from: `"${this.fromName}" <${this.fromEmail}>`,
      //   to: params.to.join(', '),
      //   cc: params.cc?.join(', '),
      //   bcc: params.bcc?.join(', '),
      //   subject: params.subject,
      //   text: params.text,
      //   html: params.html,
      //   attachments: params.attachments,
      //   replyTo: params.replyTo,
      //   inReplyTo: params.inReplyTo,
      //   references: params.references,
      // });

      // Simulate successful send
      const stubMessageId = `<EMAIL${Date.now()}@metapharm.ch>`;

      console.log(`[Email] STUB: Email sent successfully. Message-ID: ${stubMessageId}`);

      return {
        success: true,
        messageId: stubMessageId,
      };
    } catch (error: unknown) {
      console.error('[Email] Error sending email:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send bulk emails (stub implementation)
   */
  public async sendBulkEmails(emails: EmailParams[]): Promise<EmailResult[]> {
    if (!this.initialized) {
      this.initialize();
    }

    console.log(`[Email] STUB: Sending bulk emails: ${emails.length} recipients`);

    const results = await Promise.allSettled(
      emails.map((email) => this.sendEmail(email))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`[Email] Bulk email ${index} failed:`, result.reason);
        return {
          success: false,
          error: result.reason?.message || 'Unknown error',
        };
      }
    });
  }

  /**
   * Fetch emails from IMAP (stub implementation)
   * This would typically run as a background worker
   */
  public async fetchEmails(since?: Date): Promise<Message[]> {
    console.log('[Email] STUB: Fetching emails via IMAP');

    // STUB: In production, this would:
    // 1. Connect to IMAP server
    // 2. Fetch new emails since last sync
    // 3. Parse email headers and body
    // 4. Extract threading information (In-Reply-To, References)
    // 5. Convert to our Message format
    // 6. Store in database

    // Return empty array for now
    return [];
  }

  /**
   * Parse email for threading (stub implementation)
   */
  public async parseEmailThread(messageId: string): Promise<string[]> {
    console.log(`[Email] STUB: Parsing thread for message ${messageId}`);

    // STUB: In production, this would:
    // 1. Extract In-Reply-To and References headers
    // 2. Build thread tree
    // 3. Return ordered list of message IDs in thread

    return [];
  }

  /**
   * Handle incoming email webhook (stub implementation)
   * Some email providers like SendGrid support webhooks
   */
  public async handleIncomingEmail(webhookData: Record<string, unknown>): Promise<Message | null> {
    console.log('[Email] STUB: Processing incoming email webhook');

    try {
      // STUB: In production, this would parse webhook payload
      // and create a Message object

      const stubMessage: Message = {
        id: `EMAIL_IN_${Date.now()}`,
        conversationId: webhookData.subject as string || 'stub-conversation',
        pharmacyId: webhookData.to as string || 'stub-pharmacy',
        channel: MessageChannel.EMAIL,
        direction: MessageDirection.INBOUND,
        status: MessageStatus.DELIVERED,
        from: {
          id: webhookData.from as string || 'stub-sender',
          email: webhookData.from as string,
        },
        to: [
          {
            id: webhookData.to as string || 'stub-recipient',
            email: webhookData.to as string,
          },
        ],
        subject: webhookData.subject as string || '',
        body: webhookData.text as string || '',
        bodyHtml: webhookData.html as string,
        threadId: webhookData.messageId as string,
        createdAt: new Date(),
        metadata: webhookData,
      };

      return stubMessage;
    } catch (error) {
      console.error('[Email] Error processing incoming email:', error);
      return null;
    }
  }

  /**
   * Extract email threading information
   */
  public extractThreadingInfo(
    inReplyTo?: string,
    references?: string[]
  ): { threadId: string; parentMessageId?: string } {
    // Use In-Reply-To as parent message
    const parentMessageId = inReplyTo;

    // Use first reference as thread ID, or In-Reply-To if no references
    const threadId = references && references.length > 0 ? references[0] : inReplyTo || '';

    return { threadId, parentMessageId };
  }

  /**
   * Verify SMTP configuration
   */
  public async verifyConfiguration(): Promise<boolean> {
    try {
      if (!this.initialized) {
        this.initialize();
      }

      console.log('[Email] STUB: Verifying SMTP configuration');

      // STUB: In production, this would test SMTP connection
      // await this.smtpTransporter!.verify();

      return true;
    } catch (error) {
      console.error('[Email] Configuration verification failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailClient = new EmailClient();

// Initialize on module load if environment variables are present
if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
  try {
    emailClient.initialize();
  } catch (error) {
    console.warn('[Email] Failed to auto-initialize:', error);
  }
}
