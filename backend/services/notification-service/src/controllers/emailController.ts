/**
 * Email Controller
 *
 * Handles email notification requests with:
 * - Template support
 * - Retry logic
 * - Error handling
 * - Validation
 */

import { Request, Response } from 'express';
import { sendGridClient, EmailParams, EmailResult } from '../integrations/email';

// Request body interfaces
export interface SendEmailRequest {
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
  retryCount?: number;
}

export interface SendBulkEmailRequest {
  emails: SendEmailRequest[];
}

// Response interfaces
export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Send a single email
 *
 * POST /notifications/email
 * Body: SendEmailRequest
 */
export async function sendEmail(req: Request, res: Response): Promise<void> {
  try {
    const emailRequest: SendEmailRequest = req.body;

    // Validate request
    const validation = validateEmailRequest(emailRequest);
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: validation.error,
      });
      return;
    }

    // Prepare email params
    const emailParams: EmailParams = {
      to: emailRequest.to,
      subject: emailRequest.subject,
      text: emailRequest.text,
      html: emailRequest.html,
      templateId: emailRequest.templateId,
      dynamicTemplateData: emailRequest.dynamicTemplateData,
      attachments: emailRequest.attachments,
      replyTo: emailRequest.replyTo,
      cc: emailRequest.cc,
      bcc: emailRequest.bcc,
    };

    // Send email with retry logic
    const maxRetries = emailRequest.retryCount || 3;
    let result: EmailResult = { success: false, error: 'Not attempted' };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[Email Controller] Attempt ${attempt}/${maxRetries}`);

      result = await sendGridClient.sendEmail(emailParams);

      if (result.success) {
        console.log(`[Email Controller] Email sent successfully on attempt ${attempt}`);
        break;
      }

      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
        console.log(`[Email Controller] Retry in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Return result
    if (result.success) {
      res.status(200).json({
        success: true,
        messageId: result.messageId,
        statusCode: result.statusCode,
      } as EmailResponse);
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        statusCode: result.statusCode,
      } as EmailResponse);
    }
  } catch (error) {
    console.error('[Email Controller] Unexpected error:', error);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    } as EmailResponse);
  }
}

/**
 * Send multiple emails in bulk
 *
 * POST /notifications/email/bulk
 * Body: SendBulkEmailRequest
 */
export async function sendBulkEmail(req: Request, res: Response): Promise<void> {
  try {
    const bulkRequest: SendBulkEmailRequest = req.body;

    // Validate request
    if (!bulkRequest.emails || !Array.isArray(bulkRequest.emails)) {
      res.status(400).json({
        success: false,
        error: 'emails array is required',
      });
      return;
    }

    if (bulkRequest.emails.length === 0) {
      res.status(400).json({
        success: false,
        error: 'emails array cannot be empty',
      });
      return;
    }

    // Limit bulk size to prevent abuse
    if (bulkRequest.emails.length > 100) {
      res.status(400).json({
        success: false,
        error: 'Bulk email limit is 100 recipients per request',
      });
      return;
    }

    // Validate each email
    for (let i = 0; i < bulkRequest.emails.length; i++) {
      const validation = validateEmailRequest(bulkRequest.emails[i]);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: `Email ${i}: ${validation.error}`,
        });
        return;
      }
    }

    // Convert to EmailParams array
    const emailParams: EmailParams[] = bulkRequest.emails.map((email) => ({
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
      templateId: email.templateId,
      dynamicTemplateData: email.dynamicTemplateData,
      attachments: email.attachments,
      replyTo: email.replyTo,
      cc: email.cc,
      bcc: email.bcc,
    }));

    // Send bulk emails
    console.log(`[Email Controller] Sending ${emailParams.length} emails in bulk`);
    const results = await sendGridClient.sendBulkEmails(emailParams);

    // Count successes and failures
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`[Email Controller] Bulk send complete: ${successful} successful, ${failed} failed`);

    res.status(200).json({
      success: true,
      total: results.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error('[Email Controller] Unexpected error in bulk send:', error);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get email service health/status
 *
 * GET /notifications/email/status
 */
export async function getEmailStatus(req: Request, res: Response): Promise<void> {
  try {
    const isConfigured = await sendGridClient.verifyConfiguration();

    res.status(200).json({
      service: 'email',
      provider: 'SendGrid',
      configured: isConfigured,
      status: isConfigured ? 'operational' : 'misconfigured',
    });
  } catch (error) {
    console.error('[Email Controller] Error checking status:', error);

    res.status(500).json({
      service: 'email',
      provider: 'SendGrid',
      configured: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Validate email request
 */
function validateEmailRequest(request: SendEmailRequest): {
  valid: boolean;
  error?: string;
} {
  if (!request.to) {
    return { valid: false, error: 'to field is required' };
  }

  if (!request.subject) {
    return { valid: false, error: 'subject field is required' };
  }

  // Must have at least one content type
  if (!request.text && !request.html && !request.templateId) {
    return {
      valid: false,
      error: 'Must provide text, html, or templateId',
    };
  }

  // If using template, check for template data
  if (request.templateId && !request.dynamicTemplateData) {
    console.warn('[Email Validation] Template ID provided without dynamic data');
  }

  // Validate email format
  const emails = Array.isArray(request.to) ? request.to : [request.to];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const email of emails) {
    if (!emailRegex.test(email)) {
      return {
        valid: false,
        error: `Invalid email format: ${email}`,
      };
    }
  }

  return { valid: true };
}

// Export validation function for testing
export { validateEmailRequest };
