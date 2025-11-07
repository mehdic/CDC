"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.twilioSMSClient = void 0;
const twilio_1 = __importDefault(require("twilio"));
class TwilioSMSClient {
    client = null;
    initialized = false;
    fromNumber;
    constructor() {
        this.fromNumber = process.env.TWILIO_SMS_FROM || '';
    }
    initialize(config) {
        const accountSid = config?.accountSid || process.env.TWILIO_ACCOUNT_SID;
        const authToken = config?.authToken || process.env.TWILIO_AUTH_TOKEN;
        if (!accountSid || !authToken) {
            throw new Error('Twilio credentials are required. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.');
        }
        this.client = (0, twilio_1.default)(accountSid, authToken);
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
    formatPhoneNumber(phone) {
        let formatted = phone.replace(/[\s\-()]/g, '');
        if (formatted.startsWith('0') && !formatted.startsWith('+')) {
            formatted = '+41' + formatted.substring(1);
        }
        if (!formatted.startsWith('+')) {
            formatted = '+41' + formatted;
        }
        return formatted;
    }
    validatePhoneNumber(phone) {
        const formatted = this.formatPhoneNumber(phone);
        const e164Regex = /^\+[1-9]\d{1,14}$/;
        if (!e164Regex.test(formatted)) {
            return {
                valid: false,
                error: `Invalid phone number format: ${phone}. Must be in E.164 format (e.g., +41791234567)`,
            };
        }
        return { valid: true };
    }
    async sendSMS(params) {
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
            const validation = this.validatePhoneNumber(params.to);
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error,
                };
            }
            const formattedTo = this.formatPhoneNumber(params.to);
            const fromNumber = params.from || this.fromNumber;
            if (params.body.length > 1600) {
                console.warn(`[Twilio SMS] Message length (${params.body.length}) exceeds 1600 characters. Will be sent as multiple segments.`);
            }
            const messageOptions = {
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
            console.log(`[Twilio SMS] Sending SMS to: ${formattedTo}`);
            const message = await this.client.messages.create(messageOptions);
            console.log(`[Twilio SMS] SMS sent successfully. SID: ${message.sid}, Status: ${message.status}`);
            return {
                success: true,
                messageId: message.sid,
                status: message.status,
                to: formattedTo,
            };
        }
        catch (error) {
            console.error('[Twilio SMS] Error sending SMS:', error);
            if (error && typeof error === 'object' && 'code' in error) {
                const twilioError = error;
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
    async sendBulkSMS(messages) {
        if (!this.initialized) {
            this.initialize();
        }
        console.log(`[Twilio SMS] Sending bulk SMS: ${messages.length} messages`);
        const results = await Promise.allSettled(messages.map((message) => this.sendSMS(message)));
        return results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            }
            else {
                console.error(`[Twilio SMS] Bulk SMS ${index} failed:`, result.reason);
                return {
                    success: false,
                    error: result.reason?.message || 'Unknown error',
                };
            }
        });
    }
    async getMessageStatus(messageSid) {
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
        }
        catch (error) {
            console.error('[Twilio SMS] Error fetching message status:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async verifyConfiguration() {
        try {
            if (!this.initialized) {
                this.initialize();
            }
            if (!this.client) {
                return false;
            }
            await this.client.api.accounts.list({ limit: 1 });
            console.log('[Twilio SMS] Configuration verified successfully');
            return true;
        }
        catch (error) {
            console.error('[Twilio SMS] Configuration verification failed:', error);
            return false;
        }
    }
}
exports.twilioSMSClient = new TwilioSMSClient();
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
        exports.twilioSMSClient.initialize();
    }
    catch (error) {
        console.warn('[Twilio SMS] Failed to auto-initialize:', error);
    }
}
//# sourceMappingURL=sms.js.map