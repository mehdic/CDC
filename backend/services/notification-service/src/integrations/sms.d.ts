export interface SMSConfig {
    accountSid: string;
    authToken: string;
    fromNumber: string;
}
export interface SMSParams {
    to: string;
    body: string;
    from?: string;
    statusCallback?: string;
    maxPrice?: string;
    validityPeriod?: number;
}
export interface SMSResult {
    success: boolean;
    messageId?: string;
    error?: string;
    status?: string;
    to?: string;
}
declare class TwilioSMSClient {
    private client;
    private initialized;
    private fromNumber;
    constructor();
    initialize(config?: SMSConfig): void;
    private formatPhoneNumber;
    private validatePhoneNumber;
    sendSMS(params: SMSParams): Promise<SMSResult>;
    sendBulkSMS(messages: SMSParams[]): Promise<SMSResult[]>;
    getMessageStatus(messageSid: string): Promise<{
        success: boolean;
        status?: string;
        error?: string;
    }>;
    verifyConfiguration(): Promise<boolean>;
}
export declare const twilioSMSClient: TwilioSMSClient;
export {};
//# sourceMappingURL=sms.d.ts.map