/**
 * Twilio SendGrid Email Integration
 *
 * Handles email delivery using SendGrid API
 * Supports:
 * - Transactional emails
 * - Template-based emails
 * - Attachments
 * - HTML and plain text
 */

import sgMail, { MailDataRequired, ClientResponse } from '@sendgrid/mail';

// Configuration interface
export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

// Email parameters interface
export interface EmailParams {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, unknown>;
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: 'attachment' | 'inline';
  }>;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

// Email result interface
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  statusCode?: number;
}

class SendGridEmailClient {
  private initialized: boolean = false;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || '';
    this.fromName = process.env.SENDGRID_FROM_NAME || 'MetaPharm Connect';
  }

  /**
   * Initialize SendGrid client with API key
   */
  public initialize(config?: EmailConfig): void {
    const apiKey = config?.apiKey || process.env.SENDGRID_API_KEY;

    if (!apiKey) {
      throw new Error('SendGrid API key is required. Set SENDGRID_API_KEY environment variable.');
    }

    sgMail.setApiKey(apiKey);

    if (config?.fromEmail) {
      this.fromEmail = config.fromEmail;
    }

    if (config?.fromName) {
      this.fromName = config.fromName;
    }

    if (!this.fromEmail) {
      throw new Error('From email is required. Set SENDGRID_FROM_EMAIL environment variable.');
    }

    this.initialized = true;
    console.log('[SendGrid] Email client initialized');
    console.log(`[SendGrid] From: ${this.fromName} <${this.fromEmail}>`);
  }

  /**
   * Send a single email
   */
  public async sendEmail(params: EmailParams): Promise<EmailResult> {
    if (!this.initialized) {
      this.initialize();
    }

    try {
      // Validate required parameters
      if (!params.to) {
        return {
          success: false,
          error: 'Recipient email address is required',
        };
      }

      if (!params.subject) {
        return {
          success: false,
          error: 'Email subject is required',
        };
      }

      if (!params.text && !params.html && !params.templateId) {
        return {
          success: false,
          error: 'Email must have text, html content, or a template ID',
        };
      }

      // Build email message
      // SendGrid requires either 'content' array or 'text'/'html' properties
      const msg: MailDataRequired = {
        to: params.to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: params.subject,
        // Provide default content if neither text nor html is provided (template-only emails)
        content: [
          {
            type: 'text/plain',
            value: params.text || ' ',
          },
        ],
      };

      // Add optional fields
      if (params.text) {
        msg.text = params.text;
      }

      if (params.html) {
        msg.html = params.html;
        // Update content array to include HTML
        msg.content = [
          {
            type: 'text/plain',
            value: params.text || ' ',
          },
          {
            type: 'text/html',
            value: params.html,
          },
        ];
      }

      if (params.templateId) {
        msg.templateId = params.templateId;
      }

      if (params.dynamicTemplateData) {
        msg.dynamicTemplateData = params.dynamicTemplateData;
      }

      if (params.attachments) {
        msg.attachments = params.attachments;
      }

      if (params.replyTo) {
        msg.replyTo = params.replyTo;
      }

      if (params.cc) {
        msg.cc = params.cc;
      }

      if (params.bcc) {
        msg.bcc = params.bcc;
      }

      // Send email
      console.log(`[SendGrid] Sending email to: ${params.to}`);
      const [response]: [ClientResponse, {}] = await sgMail.send(msg);

      console.log(`[SendGrid] Email sent successfully. Status: ${response.statusCode}`);

      return {
        success: true,
        messageId: response.headers['x-message-id'] as string,
        statusCode: response.statusCode,
      };
    } catch (error: unknown) {
      console.error('[SendGrid] Error sending email:', error);

      if (error && typeof error === 'object' && 'response' in error) {
        const sgError = error as { response: { body: unknown; statusCode: number } };
        return {
          success: false,
          error: JSON.stringify(sgError.response.body),
          statusCode: sgError.response.statusCode,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send multiple emails in batch
   */
  public async sendBulkEmails(emails: EmailParams[]): Promise<EmailResult[]> {
    if (!this.initialized) {
      this.initialize();
    }

    console.log(`[SendGrid] Sending bulk emails: ${emails.length} recipients`);

    const results = await Promise.allSettled(
      emails.map((email) => this.sendEmail(email))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`[SendGrid] Bulk email ${index} failed:`, result.reason);
        return {
          success: false,
          error: result.reason?.message || 'Unknown error',
        };
      }
    });
  }

  /**
   * Verify configuration
   */
  public async verifyConfiguration(): Promise<boolean> {
    try {
      if (!this.initialized) {
        this.initialize();
      }

      // SendGrid doesn't have a dedicated test endpoint
      // Just verify credentials are set
      return this.initialized;
    } catch (error) {
      console.error('[SendGrid] Configuration verification failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const sendGridClient = new SendGridEmailClient();

// Initialize on module load if environment variables are present
if (process.env.SENDGRID_API_KEY) {
  try {
    sendGridClient.initialize();
  } catch (error) {
    console.warn('[SendGrid] Failed to auto-initialize:', error);
  }
}
