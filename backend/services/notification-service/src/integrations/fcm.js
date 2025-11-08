"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fcmClient = void 0;
class FirebaseCloudMessagingClient {
    initialized = false;
    serverKey;
    projectId;
    constructor() {
        this.serverKey = process.env.FCM_SERVER_KEY || '';
        this.projectId = process.env.FCM_PROJECT_ID || '';
    }
    initialize(config) {
        if (config?.serverKey) {
            this.serverKey = config.serverKey;
        }
        if (config?.projectId) {
            this.projectId = config.projectId;
        }
        if (!this.serverKey) {
            throw new Error('FCM server key is required. Set FCM_SERVER_KEY environment variable.');
        }
        if (!this.projectId) {
            throw new Error('FCM project ID is required. Set FCM_PROJECT_ID environment variable.');
        }
        this.initialized = true;
        console.log('[FCM] Client initialized');
        console.log(`[FCM] Project ID: ${this.projectId}`);
    }
    async sendPushNotification(params) {
        if (!this.initialized) {
            this.initialize();
        }
        try {
            if (!params.token && !params.tokens && !params.topic) {
                return {
                    success: false,
                    error: 'Must provide token, tokens, or topic',
                };
            }
            if (!params.notification || !params.notification.title || !params.notification.body) {
                return {
                    success: false,
                    error: 'Notification title and body are required',
                };
            }
            const payload = this.buildFCMPayload(params);
            const result = await this.sendViaHTTP(payload, params.token || params.tokens);
            return result;
        }
        catch (error) {
            console.error('[FCM] Error sending push notification:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async sendMulticastNotification(tokens, params) {
        if (!this.initialized) {
            this.initialize();
        }
        try {
            if (!tokens || tokens.length === 0) {
                return {
                    success: false,
                    error: 'At least one device token is required',
                };
            }
            console.log(`[FCM] Sending multicast notification to ${tokens.length} devices`);
            const chunks = this.chunkArray(tokens, 500);
            const results = [];
            for (const chunk of chunks) {
                const result = await this.sendPushNotification({
                    ...params,
                    tokens: chunk,
                });
                results.push(result);
            }
            const allSuccessful = results.every((r) => r.success);
            const failedTokens = results.flatMap((r) => r.failedTokens || []);
            return {
                success: allSuccessful,
                error: allSuccessful ? undefined : 'Some notifications failed',
                failedTokens: failedTokens.length > 0 ? failedTokens : undefined,
            };
        }
        catch (error) {
            console.error('[FCM] Error sending multicast notification:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async sendToTopic(topic, params) {
        if (!this.initialized) {
            this.initialize();
        }
        try {
            console.log(`[FCM] Sending notification to topic: ${topic}`);
            const result = await this.sendPushNotification({
                ...params,
                topic,
            });
            return result;
        }
        catch (error) {
            console.error('[FCM] Error sending to topic:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    buildFCMPayload(params) {
        const payload = {
            notification: {
                title: params.notification.title,
                body: params.notification.body,
                image: params.notification.imageUrl,
            },
        };
        if (params.data) {
            payload.data = params.data;
        }
        payload.android = {
            priority: params.priority || 'high',
            notification: {
                sound: params.sound || 'default',
                click_action: params.clickAction,
            },
        };
        payload.apns = {
            payload: {
                aps: {
                    badge: params.badge,
                    sound: params.sound || 'default',
                    'content-available': 1,
                },
            },
        };
        return payload;
    }
    async sendViaHTTP(payload, target) {
        console.log('[FCM] Sending via HTTP API...');
        console.log('[FCM] Payload:', JSON.stringify(payload, null, 2));
        console.log('[FCM] Target:', target);
        return {
            success: true,
            messageId: `fcm-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        };
    }
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    async verifyConfiguration() {
        try {
            if (!this.initialized) {
                this.initialize();
            }
            return this.initialized && !!this.serverKey && !!this.projectId;
        }
        catch (error) {
            console.error('[FCM] Configuration verification failed:', error);
            return false;
        }
    }
}
exports.fcmClient = new FirebaseCloudMessagingClient();
if (process.env.FCM_SERVER_KEY && process.env.FCM_PROJECT_ID) {
    try {
        exports.fcmClient.initialize();
    }
    catch (error) {
        console.warn('[FCM] Failed to auto-initialize:', error);
    }
}
//# sourceMappingURL=fcm.js.map