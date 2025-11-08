"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.sendBulkEmail = sendBulkEmail;
exports.getEmailStatus = getEmailStatus;
exports.validateEmailRequest = validateEmailRequest;
const email_1 = require("../integrations/email");
async function sendEmail(req, res) {
    try {
        const emailRequest = req.body;
        const validation = validateEmailRequest(emailRequest);
        if (!validation.valid) {
            res.status(400).json({
                success: false,
                error: validation.error,
            });
            return;
        }
        const emailParams = {
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
        const maxRetries = emailRequest.retryCount || 3;
        let result = { success: false, error: 'Not attempted' };
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            console.log(`[Email Controller] Attempt ${attempt}/${maxRetries}`);
            result = await email_1.sendGridClient.sendEmail(emailParams);
            if (result.success) {
                console.log(`[Email Controller] Email sent successfully on attempt ${attempt}`);
                break;
            }
            if (attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                console.log(`[Email Controller] Retry in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        if (result.success) {
            res.status(200).json({
                success: true,
                messageId: result.messageId,
                statusCode: result.statusCode,
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: result.error,
                statusCode: result.statusCode,
            });
        }
    }
    catch (error) {
        console.error('[Email Controller] Unexpected error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
async function sendBulkEmail(req, res) {
    try {
        const bulkRequest = req.body;
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
        if (bulkRequest.emails.length > 100) {
            res.status(400).json({
                success: false,
                error: 'Bulk email limit is 100 recipients per request',
            });
            return;
        }
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
        const emailParams = bulkRequest.emails.map((email) => ({
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
        console.log(`[Email Controller] Sending ${emailParams.length} emails in bulk`);
        const results = await email_1.sendGridClient.sendBulkEmails(emailParams);
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
    }
    catch (error) {
        console.error('[Email Controller] Unexpected error in bulk send:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
async function getEmailStatus(req, res) {
    try {
        const isConfigured = await email_1.sendGridClient.verifyConfiguration();
        res.status(200).json({
            service: 'email',
            provider: 'SendGrid',
            configured: isConfigured,
            status: isConfigured ? 'operational' : 'misconfigured',
        });
    }
    catch (error) {
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
function validateEmailRequest(request) {
    if (!request.to) {
        return { valid: false, error: 'to field is required' };
    }
    if (!request.subject) {
        return { valid: false, error: 'subject field is required' };
    }
    if (!request.text && !request.html && !request.templateId) {
        return {
            valid: false,
            error: 'Must provide text, html, or templateId',
        };
    }
    if (request.templateId && !request.dynamicTemplateData) {
        console.warn('[Email Validation] Template ID provided without dynamic data');
    }
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
//# sourceMappingURL=emailController.js.map