export interface FCMConfig {
    serverKey: string;
    projectId: string;
}
export interface PushNotificationParams {
    token?: string;
    tokens?: string[];
    topic?: string;
    notification: {
        title: string;
        body: string;
        imageUrl?: string;
    };
    data?: Record<string, string>;
    priority?: 'high' | 'normal';
    badge?: number;
    sound?: string;
    clickAction?: string;
    ttl?: number;
}
export interface PushNotificationResult {
    success: boolean;
    messageId?: string;
    error?: string;
    failedTokens?: string[];
}
declare class FirebaseCloudMessagingClient {
    private initialized;
    private serverKey;
    private projectId;
    constructor();
    initialize(config?: FCMConfig): void;
    sendPushNotification(params: PushNotificationParams): Promise<PushNotificationResult>;
    sendMulticastNotification(tokens: string[], params: Omit<PushNotificationParams, 'token' | 'tokens'>): Promise<PushNotificationResult>;
    sendToTopic(topic: string, params: Omit<PushNotificationParams, 'token' | 'tokens' | 'topic'>): Promise<PushNotificationResult>;
    private buildFCMPayload;
    private sendViaHTTP;
    private chunkArray;
    verifyConfiguration(): Promise<boolean>;
}
export declare const fcmClient: FirebaseCloudMessagingClient;
export {};
//# sourceMappingURL=fcm.d.ts.map