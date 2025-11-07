import { Request, Response } from 'express';
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
export interface SMSResponse {
    success: boolean;
    messageId?: string;
    error?: string;
    status?: string;
    to?: string;
}
export declare function sendSMS(req: Request, res: Response): Promise<void>;
export declare function sendBulkSMS(req: Request, res: Response): Promise<void>;
export declare function getSMSStatus(req: Request, res: Response): Promise<void>;
export declare function getSMSHealth(req: Request, res: Response): Promise<void>;
declare function validateSMSRequest(request: SendSMSRequest): {
    valid: boolean;
    error?: string;
};
export { validateSMSRequest };
//# sourceMappingURL=smsController.d.ts.map