import { PushNotificationParams } from '../integrations/fcm';
export interface PushNotificationJob {
    id: string;
    type: 'push_notification';
    data: PushNotificationParams;
    priority?: 'high' | 'normal' | 'low';
    maxRetries?: number;
    attempt?: number;
    createdAt: string;
}
export interface JobResult {
    jobId: string;
    success: boolean;
    messageId?: string;
    error?: string;
    attempt: number;
    processedAt: string;
}
declare class PushNotificationWorker {
    private redisClient;
    private isRunning;
    private pollInterval;
    private queueName;
    private processingQueueName;
    private failedQueueName;
    constructor();
    private initialize;
    start(): Promise<void>;
    stop(): Promise<void>;
    private pollQueue;
    private getNextJob;
    private processJob;
    private completeJob;
    private handleFailedJob;
    private processDelayedJobs;
    addJob(params: PushNotificationParams, priority?: 'high' | 'normal' | 'low'): Promise<string>;
    getStats(): Promise<{
        pending: number;
        processing: number;
        failed: number;
    }>;
    private sleep;
}
export declare const pushWorker: PushNotificationWorker;
export {};
//# sourceMappingURL=pushWorker.d.ts.map