export interface EmailConfig {
    apiKey: string;
    fromEmail: string;
    fromName: string;
}
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
export interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
    statusCode?: number;
}
declare class SendGridEmailClient {
    private initialized;
    private fromEmail;
    private fromName;
    constructor();
    initialize(config?: EmailConfig): void;
    sendEmail(params: EmailParams): Promise<EmailResult>;
    sendBulkEmails(emails: EmailParams[]): Promise<EmailResult[]>;
    verifyConfiguration(): Promise<boolean>;
}
export declare const sendGridClient: SendGridEmailClient;
export {};
//# sourceMappingURL=email.d.ts.map