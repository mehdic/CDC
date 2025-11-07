import { Request, Response } from 'express';
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
export interface EmailResponse {
    success: boolean;
    messageId?: string;
    error?: string;
    statusCode?: number;
}
export declare function sendEmail(req: Request, res: Response): Promise<void>;
export declare function sendBulkEmail(req: Request, res: Response): Promise<void>;
export declare function getEmailStatus(req: Request, res: Response): Promise<void>;
declare function validateEmailRequest(request: SendEmailRequest): {
    valid: boolean;
    error?: string;
};
export { validateEmailRequest };
//# sourceMappingURL=emailController.d.ts.map