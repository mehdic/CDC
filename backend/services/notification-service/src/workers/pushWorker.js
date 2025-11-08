"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushWorker = void 0;
const redis_1 = require("redis");
const fcm_1 = require("../integrations/fcm");
class PushNotificationWorker {
    redisClient = null;
    isRunning = false;
    pollInterval = 1000;
    queueName = 'push_notifications';
    processingQueueName = 'push_notifications:processing';
    failedQueueName = 'push_notifications:failed';
    constructor() {
        this.initialize();
    }
    async initialize() {
        try {
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            console.log(`[Push Worker] Connecting to Redis: ${redisUrl}`);
            this.redisClient = (0, redis_1.createClient)({
                url: redisUrl,
            });
            this.redisClient.on('error', (err) => {
                console.error('[Push Worker] Redis connection error:', err);
            });
            this.redisClient.on('connect', () => {
                console.log('[Push Worker] Redis connected');
            });
            await this.redisClient.connect();
            console.log('[Push Worker] Worker initialized and ready');
        }
        catch (error) {
            console.error('[Push Worker] Failed to initialize:', error);
            throw error;
        }
    }
    async start() {
        if (this.isRunning) {
            console.warn('[Push Worker] Worker is already running');
            return;
        }
        if (!this.redisClient) {
            await this.initialize();
        }
        console.log('[Push Worker] Starting worker...');
        this.isRunning = true;
        this.pollQueue();
        console.log('[Push Worker] Worker started successfully');
    }
    async stop() {
        console.log('[Push Worker] Stopping worker...');
        this.isRunning = false;
        if (this.redisClient?.isOpen) {
            await this.redisClient.quit();
            console.log('[Push Worker] Redis connection closed');
        }
        console.log('[Push Worker] Worker stopped');
    }
    async pollQueue() {
        while (this.isRunning) {
            try {
                const job = await this.getNextJob();
                if (job) {
                    await this.processJob(job);
                }
                else {
                    await this.sleep(this.pollInterval);
                }
            }
            catch (error) {
                console.error('[Push Worker] Error in poll loop:', error);
                await this.sleep(this.pollInterval);
            }
        }
    }
    async getNextJob() {
        if (!this.redisClient) {
            return null;
        }
        try {
            const jobData = await this.redisClient.rPopLPush(this.queueName, this.processingQueueName);
            if (!jobData) {
                return null;
            }
            const job = JSON.parse(jobData);
            console.log(`[Push Worker] Picked up job: ${job.id}`);
            return job;
        }
        catch (error) {
            console.error('[Push Worker] Error getting next job:', error);
            return null;
        }
    }
    async processJob(job) {
        const attempt = (job.attempt || 0) + 1;
        const maxRetries = job.maxRetries || 3;
        console.log(`[Push Worker] Processing job ${job.id} (attempt ${attempt}/${maxRetries})`);
        try {
            const result = await fcm_1.fcmClient.sendPushNotification(job.data);
            if (result.success) {
                await this.completeJob(job, result);
                console.log(`[Push Worker] Job ${job.id} completed successfully`);
            }
            else {
                await this.handleFailedJob(job, result.error || 'Unknown error', attempt, maxRetries);
            }
        }
        catch (error) {
            console.error(`[Push Worker] Error processing job ${job.id}:`, error);
            await this.handleFailedJob(job, error instanceof Error ? error.message : 'Unexpected error', attempt, maxRetries);
        }
    }
    async completeJob(job, result) {
        if (!this.redisClient)
            return;
        try {
            await this.redisClient.lRem(this.processingQueueName, 1, JSON.stringify(job));
            const jobResult = {
                jobId: job.id,
                success: true,
                messageId: result.messageId,
                attempt: job.attempt || 1,
                processedAt: new Date().toISOString(),
            };
            await this.redisClient.setEx(`push_notification:result:${job.id}`, 86400, JSON.stringify(jobResult));
        }
        catch (error) {
            console.error('[Push Worker] Error completing job:', error);
        }
    }
    async handleFailedJob(job, error, attempt, maxRetries) {
        if (!this.redisClient)
            return;
        try {
            await this.redisClient.lRem(this.processingQueueName, 1, JSON.stringify(job));
            if (attempt < maxRetries) {
                const retryJob = {
                    ...job,
                    attempt,
                };
                const delay = Math.min(Math.pow(2, attempt - 1), 60);
                console.log(`[Push Worker] Job ${job.id} will retry in ${delay}s (attempt ${attempt}/${maxRetries})`);
                const retryTime = Date.now() + delay * 1000;
                await this.redisClient.zAdd(`${this.queueName}:delayed`, {
                    score: retryTime,
                    value: JSON.stringify(retryJob),
                });
                this.processDelayedJobs();
            }
            else {
                console.error(`[Push Worker] Job ${job.id} failed after ${maxRetries} attempts`);
                const failedJob = {
                    jobId: job.id,
                    success: false,
                    error,
                    attempt,
                    processedAt: new Date().toISOString(),
                };
                await this.redisClient.lPush(this.failedQueueName, JSON.stringify(failedJob));
                await this.redisClient.setEx(`push_notification:result:${job.id}`, 604800, JSON.stringify(failedJob));
            }
        }
        catch (error) {
            console.error('[Push Worker] Error handling failed job:', error);
        }
    }
    async processDelayedJobs() {
        if (!this.redisClient)
            return;
        try {
            const now = Date.now();
            const delayedJobs = await this.redisClient.zRangeByScore(`${this.queueName}:delayed`, 0, now);
            for (const jobData of delayedJobs) {
                await this.redisClient.zRem(`${this.queueName}:delayed`, jobData);
                await this.redisClient.lPush(this.queueName, jobData);
                console.log('[Push Worker] Moved delayed job back to main queue');
            }
        }
        catch (error) {
            console.error('[Push Worker] Error processing delayed jobs:', error);
        }
    }
    async addJob(params, priority) {
        if (!this.redisClient) {
            await this.initialize();
        }
        const jobId = `push-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const job = {
            id: jobId,
            type: 'push_notification',
            data: params,
            priority: priority || 'normal',
            createdAt: new Date().toISOString(),
        };
        await this.redisClient.lPush(this.queueName, JSON.stringify(job));
        console.log(`[Push Worker] Added job ${jobId} to queue`);
        return jobId;
    }
    async getStats() {
        if (!this.redisClient) {
            return { pending: 0, processing: 0, failed: 0 };
        }
        try {
            const [pending, processing, failed] = await Promise.all([
                this.redisClient.lLen(this.queueName),
                this.redisClient.lLen(this.processingQueueName),
                this.redisClient.lLen(this.failedQueueName),
            ]);
            return { pending, processing, failed };
        }
        catch (error) {
            console.error('[Push Worker] Error getting stats:', error);
            return { pending: 0, processing: 0, failed: 0 };
        }
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.pushWorker = new PushNotificationWorker();
if (process.env.NODE_ENV !== 'test') {
    exports.pushWorker.start().catch((error) => {
        console.error('[Push Worker] Failed to start:', error);
        process.exit(1);
    });
    process.on('SIGTERM', async () => {
        console.log('[Push Worker] SIGTERM received, stopping worker...');
        await exports.pushWorker.stop();
        process.exit(0);
    });
    process.on('SIGINT', async () => {
        console.log('[Push Worker] SIGINT received, stopping worker...');
        await exports.pushWorker.stop();
        process.exit(0);
    });
}
//# sourceMappingURL=pushWorker.js.map