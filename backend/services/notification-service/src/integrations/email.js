"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendGridClient = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
class SendGridEmailClient {
    initialized = false;
    fromEmail;
    fromName;
    constructor() {
        this.fromEmail = process.env.SENDGRID_FROM_EMAIL || '';
        this.fromName = process.env.SENDGRID_FROM_NAME || 'MetaPharm Connect';
    }
    initialize(config) {
        const apiKey = config?.apiKey || process.env.SENDGRID_API_KEY;
        if (!apiKey) {
            throw new Error('SendGrid API key is required. Set SENDGRID_API_KEY environment variable.');
        }
        mail_1.default.setApiKey(apiKey);
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
    async sendEmail(params) {
        if (!this.initialized) {
            this.initialize();
        }
        try {
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
            const msg = {
                to: params.to,
                from: {
                    email: this.fromEmail,
                    name: this.fromName,
                },
                subject: params.subject,
            };
            if (params.text) {
                msg.text = params.text;
            }
            if (params.html) {
                msg.html = params.html;
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
            console.log(`[SendGrid] Sending email to: ${params.to}`);
            const [response] = await mail_1.default.send(msg);
            console.log(`[SendGrid] Email sent successfully. Status: ${response.statusCode}`);
            return {
                success: true,
                messageId: response.headers['x-message-id'],
                statusCode: response.statusCode,
            };
        }
        catch (error) {
            console.error('[SendGrid] Error sending email:', error);
            if (error && typeof error === 'object' && 'response' in error) {
                const sgError = error;
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
    async sendBulkEmails(emails) {
        if (!this.initialized) {
            this.initialize();
        }
        console.log(`[SendGrid] Sending bulk emails: ${emails.length} recipients`);
        const results = await Promise.allSettled(emails.map((email) => this.sendEmail(email)));
        return results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            }
            else {
                console.error(`[SendGrid] Bulk email ${index} failed:`, result.reason);
                return {
                    success: false,
                    error: result.reason?.message || 'Unknown error',
                };
            }
        });
    }
    async verifyConfiguration() {
        try {
            if (!this.initialized) {
                this.initialize();
            }
            return this.initialized;
        }
        catch (error) {
            console.error('[SendGrid] Configuration verification failed:', error);
            return false;
        }
    }
}
exports.sendGridClient = new SendGridEmailClient();
if (process.env.SENDGRID_API_KEY) {
    try {
        exports.sendGridClient.initialize();
    }
    catch (error) {
        console.warn('[SendGrid] Failed to auto-initialize:', error);
    }
}
//# sourceMappingURL=email.js.map