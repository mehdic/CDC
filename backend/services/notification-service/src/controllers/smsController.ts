/**
 * SMS Controller
 *
 * Handles SMS notification requests with:
 * - Phone validation
 * - Retry logic
 * - Error handling
 * - Swiss phone number support
 */

import { Request, Response } from 'express';
import { twilioSMSClient, SMSParams, SMSResult } from '../integrations/sms';

// Request body interfaces
export interface SendSMSRequest {
  to: string;
  body: string;
  from?: string;
  statusCallback?: string;
  maxPrice?: string;
  validityPeriod?: number;
  retryCount?: number;
}

export interface SendBulkSMSRequest {
  messages: SendSMSRequest[];
}

// Response interfaces
export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  status?: string;
  to?: string;
}

/**
 * Send a single SMS
 *
 * POST /notifications/sms
 * Body: SendSMSRequest
 */
export async function sendSMS(req: Request, res: Response): Promise<void> {
  try {
    const smsRequest: SendSMSRequest = req.body;

    // Validate request
    const validation = validateSMSRequest(smsRequest);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: validation.error,
      });
      return;
    }

    // Prepare SMS params
    const smsParams: SMSParams = {
      to: smsRequest.to,
      body: smsRequest.body,
      from: smsRequest.from,
      statusCallback: smsRequest.statusCallback,
      maxPrice: smsRequest.maxPrice,
      validityPeriod: smsRequest.validityPeriod,
    };

    // Send SMS with retry logic
    const maxRetries = smsRequest.retryCount || 3;
    let result: SMSResult = { success: false, error: 'Not attempted' };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[SMS Controller] Attempt ${attempt}/${maxRetries}`);

      result = await twilioSMSClient.sendSMS(smsParams);

      if (result.success) {
        console.log(`[SMS Controller] SMS sent successfully on attempt ${attempt}`);
        break;
      }

      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
        console.log(`[SMS Controller] Retry in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Return result
    if (result.success) {
      res.status(200).json({
        success: true,
        messageId: result.messageId,
        status: result.status,
        to: result.to,
      } as SMSResponse);
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      } as SMSResponse);
    }
  } catch (error) {
    console.error('[SMS Controller] Unexpected error:', error);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    } as SMSResponse);
  }
}

/**
 * Send multiple SMS messages in bulk
 *
 * POST /notifications/sms/bulk
 * Body: SendBulkSMSRequest
 */
export async function sendBulkSMS(req: Request, res: Response): Promise<void> {
  try {
    const bulkRequest: SendBulkSMSRequest = req.body;

    // Validate request
    if (!bulkRequest.messages || !Array.isArray(bulkRequest.messages)) {
      res.status(400).json({
        success: false,
        error: 'messages array is required',
      });
      return;
    }

    if (bulkRequest.messages.length === 0) {
      res.status(400).json({
        success: false,
        error: 'messages array cannot be empty',
      });
      return;
    }

    // Limit bulk size to prevent abuse and costs
    if (bulkRequest.messages.length > 50) {
      res.status(400).json({
        success: false,
        error: 'Bulk SMS limit is 50 messages per request',
      });
      return;
    }

    // Validate each message
    for (let i = 0; i < bulkRequest.messages.length; i++) {
      const validation = validateSMSRequest(bulkRequest.messages[i]);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: `Message ${i}: ${validation.error}`,
        });
        return;
      }
    }

    // Convert to SMSParams array
    const smsParams: SMSParams[] = bulkRequest.messages.map((msg) => ({
      to: msg.to,
      body: msg.body,
      from: msg.from,
      statusCallback: msg.statusCallback,
      maxPrice: msg.maxPrice,
      validityPeriod: msg.validityPeriod,
    }));

    // Send bulk SMS
    console.log(`[SMS Controller] Sending ${smsParams.length} SMS messages in bulk`);
    const results = await twilioSMSClient.sendBulkSMS(smsParams);

    // Count successes and failures
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`[SMS Controller] Bulk send complete: ${successful} successful, ${failed} failed`);

    res.status(200).json({
      success: true,
      total: results.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error('[SMS Controller] Unexpected error in bulk send:', error);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get SMS message status
 *
 * GET /notifications/sms/status/:messageId
 */
export async function getSMSStatus(req: Request, res: Response): Promise<void> {
  try {
    const { messageId } = req.params;

    if (!messageId) {
      res.status(400).json({
        success: false,
        error: 'messageId parameter is required',
      });
      return;
    }

    const result = await twilioSMSClient.getMessageStatus(messageId);

    if (result.success) {
      res.status(200).json({
        success: true,
        messageId,
        status: result.status,
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('[SMS Controller] Error fetching status:', error);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get SMS service health/status
 *
 * GET /notifications/sms/health
 */
export async function getSMSHealth(req: Request, res: Response): Promise<void> {
  try {
    const isConfigured = await twilioSMSClient.verifyConfiguration();

    res.status(200).json({
      service: 'sms',
      provider: 'Twilio',
      configured: isConfigured,
      status: isConfigured ? 'operational' : 'misconfigured',
    });
  } catch (error) {
    console.error('[SMS Controller] Error checking health:', error);

    res.status(500).json({
      service: 'sms',
      provider: 'Twilio',
      configured: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Validate SMS request
 */
function validateSMSRequest(request: SendSMSRequest): {
  valid: boolean;
  error?: string;
} {
  if (!request.to) {
    return { valid: false, error: 'to field is required' };
  }

  if (!request.body) {
    return { valid: false, error: 'body field is required' };
  }

  // Validate message body length
  if (request.body.length === 0) {
    return { valid: false, error: 'body cannot be empty' };
  }

  // Warn if message is very long (will be sent as multiple segments)
  if (request.body.length > 1600) {
    console.warn(`[SMS Validation] Message length ${request.body.length} exceeds 1600 characters`);
  }

  // Basic phone number validation (more detailed validation in sms.ts)
  const phoneRegex = /^[\d\s\-+()]+$/;
  if (!phoneRegex.test(request.to)) {
    return {
      valid: false,
      error: `Invalid phone number format: ${request.to}`,
    };
  }

  return { valid: true };
}

// Export validation function for testing
export { validateSMSRequest };
