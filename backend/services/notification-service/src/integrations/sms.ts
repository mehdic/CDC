/**
 * Twilio SMS Integration
 *
 * Handles SMS delivery using Twilio API
 * Supports:
 * - International phone numbers
 * - Message status tracking
 * - Swiss phone number formatting
 */

import twilio, { Twilio } from 'twilio';

// Configuration interface
export interface SMSConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

// SMS parameters interface
export interface SMSParams {
  to: string;
  body: string;
  from?: string;
  statusCallback?: string;
  maxPrice?: number;
  validityPeriod?: number;
}

// SMS result interface
export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  status?: string;
  to?: string;
}

class TwilioSMSClient {
  private client: Twilio | null = null;
  private initialized: boolean = false;
  private fromNumber: string;

  constructor() {
    this.fromNumber = process.env.TWILIO_SMS_FROM || '';
  }

  /**
   * Initialize Twilio client with credentials
   */
  public initialize(config?: SMSConfig): void {
    const accountSid = config?.accountSid || process.env.TWILIO_ACCOUNT_SID;
    const authToken = config?.authToken || process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error(
        'Twilio credentials are required. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.'
      );
    }

    this.client = twilio(accountSid, authToken);

    if (config?.fromNumber) {
      this.fromNumber = config.fromNumber;
    }

    if (!this.fromNumber) {
      throw new Error('From phone number is required. Set TWILIO_SMS_FROM environment variable.');
    }

    this.initialized = true;
    console.log('[Twilio SMS] Client initialized');
    console.log(`[Twilio SMS] From: ${this.fromNumber}`);
  }

  /**
   * Format phone number to E.164 format
   * Handles Swiss phone numbers (+41)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove spaces, dashes, parentheses
    let formatted = phone.replace(/[\s\-()]/g, '');

    // If starts with 0 and not +, assume Swiss number
    if (formatted.startsWith('0') && !formatted.startsWith('+')) {
      formatted = '+41' + formatted.substring(1);
    }

    // If doesn't start with +, add + for E.164
    if (!formatted.startsWith('+')) {
      // Assume Swiss if no country code
      formatted = '+41' + formatted;
    }

    return formatted;
  }

  /**
   * Validate phone number format
   */
  private validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
    const formatted = this.formatPhoneNumber(phone);

    // E.164 format: + followed by 1-15 digits
    const e164Regex = /^\+[1-9]\d{1,14}$/;

    if (!e164Regex.test(formatted)) {
      return {
        valid: false,
        error: `Invalid phone number format: ${phone}. Must be in E.164 format (e.g., +41791234567)`,
      };
    }

    return { valid: true };
  }

  /**
   * Send a single SMS
   */
  public async sendSMS(params: SMSParams): Promise<SMSResult> {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.client) {
      return {
        success: false,
        error: 'Twilio client not initialized',
      };
    }

    try {
      // Validate required parameters
      if (!params.to) {
        return {
          success: false,
          error: 'Recipient phone number is required',
        };
      }

      if (!params.body) {
        return {
          success: false,
          error: 'Message body is required',
        };
      }

      // Validate and format phone number
      const validation = this.validatePhoneNumber(params.to);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      const formattedTo = this.formatPhoneNumber(params.to);
      const fromNumber = params.from || this.fromNumber;

      // Check message length (Twilio SMS limit is 1600 characters)
      if (params.body.length > 1600) {
        console.warn(
          `[Twilio SMS] Message length (${params.body.length}) exceeds 1600 characters. Will be sent as multiple segments.`
        );
      }

      // Build message options
      const messageOptions: {
        body: string;
        from: string;
        to: string;
        statusCallback?: string;
        maxPrice?: number;
        validityPeriod?: number;
      } = {
        body: params.body,
        from: fromNumber,
        to: formattedTo,
      };

      if (params.statusCallback) {
        messageOptions.statusCallback = params.statusCallback;
      }

      if (params.maxPrice) {
        messageOptions.maxPrice = params.maxPrice;
      }

      if (params.validityPeriod) {
        messageOptions.validityPeriod = params.validityPeriod;
      }

      // Send SMS
      console.log(`[Twilio SMS] Sending SMS to: ${formattedTo}`);
      const message = await this.client.messages.create(messageOptions);

      console.log(`[Twilio SMS] SMS sent successfully. SID: ${message.sid}, Status: ${message.status}`);

      return {
        success: true,
        messageId: message.sid,
        status: message.status,
        to: formattedTo,
      };
    } catch (error: unknown) {
      console.error('[Twilio SMS] Error sending SMS:', error);

      if (error && typeof error === 'object' && 'code' in error) {
        const twilioError = error as { code: number; message: string };
        return {
          success: false,
          error: `Twilio Error ${twilioError.code}: ${twilioError.message}`,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send multiple SMS messages in batch
   */
  public async sendBulkSMS(messages: SMSParams[]): Promise<SMSResult[]> {
    if (!this.initialized) {
      this.initialize();
    }

    console.log(`[Twilio SMS] Sending bulk SMS: ${messages.length} messages`);

    const results = await Promise.allSettled(
      messages.map((message) => this.sendSMS(message))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`[Twilio SMS] Bulk SMS ${index} failed:`, result.reason);
        return {
          success: false,
          error: result.reason?.message || 'Unknown error',
        };
      }
    });
  }

  /**
   * Get message status
   */
  public async getMessageStatus(messageSid: string): Promise<{
    success: boolean;
    status?: string;
    error?: string;
  }> {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.client) {
      return {
        success: false,
        error: 'Twilio client not initialized',
      };
    }

    try {
      const message = await this.client.messages(messageSid).fetch();

      return {
        success: true,
        status: message.status,
      };
    } catch (error: unknown) {
      console.error('[Twilio SMS] Error fetching message status:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify configuration
   */
  public async verifyConfiguration(): Promise<boolean> {
    try {
      if (!this.initialized) {
        this.initialize();
      }

      if (!this.client) {
        return false;
      }

      // Test by fetching account info
      await this.client.api.accounts.list({ limit: 1 });

      console.log('[Twilio SMS] Configuration verified successfully');
      return true;
    } catch (error) {
      console.error('[Twilio SMS] Configuration verification failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const twilioSMSClient = new TwilioSMSClient();

// Initialize on module load if environment variables are present
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioSMSClient.initialize();
  } catch (error) {
    console.warn('[Twilio SMS] Failed to auto-initialize:', error);
  }
}
