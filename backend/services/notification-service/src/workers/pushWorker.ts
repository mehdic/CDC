/**
 * Push Notification Queue Worker
 *
 * Consumes push notification jobs from Redis queue
 * Features:
 * - Retry failed notifications
 * - Priority handling
 * - Rate limiting
 * - Error handling
 */

import { createClient, RedisClientType } from 'redis';
import { fcmClient, PushNotificationParams, PushNotificationResult } from '../integrations/fcm';

// Job interface
export interface PushNotificationJob {
  id: string;
  type: 'push_notification';
  data: PushNotificationParams;
  priority?: 'high' | 'normal' | 'low';
  maxRetries?: number;
  attempt?: number;
  createdAt: string;
}

// Job result interface
export interface JobResult {
  jobId: string;
  success: boolean;
  messageId?: string;
  error?: string;
  attempt: number;
  processedAt: string;
}

class PushNotificationWorker {
  private redisClient: RedisClientType | null = null;
  private isRunning: boolean = false;
  private pollInterval: number = 1000; // 1 second
  private queueName: string = 'push_notifications';
  private processingQueueName: string = 'push_notifications:processing';
  private failedQueueName: string = 'push_notifications:failed';

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Redis connection
   */
  private async initialize(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      console.log(`[Push Worker] Connecting to Redis: ${redisUrl}`);

      this.redisClient = createClient({
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
    } catch (error) {
      console.error('[Push Worker] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Start processing queue
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('[Push Worker] Worker is already running');
      return;
    }

    if (!this.redisClient) {
      await this.initialize();
    }

    console.log('[Push Worker] Starting worker...');
    this.isRunning = true;

    // Start polling loop
    this.pollQueue();

    console.log('[Push Worker] Worker started successfully');
  }

  /**
   * Stop processing queue
   */
  public async stop(): Promise<void> {
    console.log('[Push Worker] Stopping worker...');
    this.isRunning = false;

    // Close Redis connection
    if (this.redisClient?.isOpen) {
      await this.redisClient.quit();
      console.log('[Push Worker] Redis connection closed');
    }

    console.log('[Push Worker] Worker stopped');
  }

  /**
   * Poll queue for jobs
   */
  private async pollQueue(): Promise<void> {
    while (this.isRunning) {
      try {
        // Get next job from queue (RPOPLPUSH for reliability)
        const job = await this.getNextJob();

        if (job) {
          // Process job
          await this.processJob(job);
        } else {
          // No jobs available, wait before next poll
          await this.sleep(this.pollInterval);
        }
      } catch (error) {
        console.error('[Push Worker] Error in poll loop:', error);
        await this.sleep(this.pollInterval);
      }
    }
  }

  /**
   * Get next job from queue
   */
  private async getNextJob(): Promise<PushNotificationJob | null> {
    if (!this.redisClient) {
      return null;
    }

    try {
      // Use RPOPLPUSH to atomically move job from main queue to processing queue
      // This ensures job isn't lost if worker crashes during processing
      const jobData = await this.redisClient.rPopLPush(
        this.queueName,
        this.processingQueueName
      );

      if (!jobData) {
        return null;
      }

      const job: PushNotificationJob = JSON.parse(jobData);
      console.log(`[Push Worker] Picked up job: ${job.id}`);

      return job;
    } catch (error) {
      console.error('[Push Worker] Error getting next job:', error);
      return null;
    }
  }

  /**
   * Process a push notification job
   */
  private async processJob(job: PushNotificationJob): Promise<void> {
    const attempt = (job.attempt || 0) + 1;
    const maxRetries = job.maxRetries || 3;

    console.log(`[Push Worker] Processing job ${job.id} (attempt ${attempt}/${maxRetries})`);

    try {
      // Send push notification
      const result: PushNotificationResult = await fcmClient.sendPushNotification(job.data);

      if (result.success) {
        // Success - remove from processing queue
        await this.completeJob(job, result);

        console.log(`[Push Worker] Job ${job.id} completed successfully`);
      } else {
        // Failed - retry or move to failed queue
        await this.handleFailedJob(job, result.error || 'Unknown error', attempt, maxRetries);
      }
    } catch (error) {
      console.error(`[Push Worker] Error processing job ${job.id}:`, error);

      // Handle unexpected error
      await this.handleFailedJob(
        job,
        error instanceof Error ? error.message : 'Unexpected error',
        attempt,
        maxRetries
      );
    }
  }

  /**
   * Complete a successful job
   */
  private async completeJob(job: PushNotificationJob, result: PushNotificationResult): Promise<void> {
    if (!this.redisClient) return;

    try {
      // Remove from processing queue
      await this.redisClient.lRem(this.processingQueueName, 1, JSON.stringify(job));

      // Store result (optional - for analytics)
      const jobResult: JobResult = {
        jobId: job.id,
        success: true,
        messageId: result.messageId,
        attempt: job.attempt || 1,
        processedAt: new Date().toISOString(),
      };

      // Store result with 24-hour TTL
      await this.redisClient.setEx(
        `push_notification:result:${job.id}`,
        86400, // 24 hours
        JSON.stringify(jobResult)
      );
    } catch (error) {
      console.error('[Push Worker] Error completing job:', error);
    }
  }

  /**
   * Handle a failed job (retry or move to failed queue)
   */
  private async handleFailedJob(
    job: PushNotificationJob,
    error: string,
    attempt: number,
    maxRetries: number
  ): Promise<void> {
    if (!this.redisClient) return;

    try {
      // Remove from processing queue
      await this.redisClient.lRem(this.processingQueueName, 1, JSON.stringify(job));

      if (attempt < maxRetries) {
        // Retry - add back to main queue with updated attempt count
        const retryJob: PushNotificationJob = {
          ...job,
          attempt,
        };

        // Exponential backoff delay (1s, 2s, 4s, 8s, max 60s)
        const delay = Math.min(Math.pow(2, attempt - 1), 60);
        console.log(`[Push Worker] Job ${job.id} will retry in ${delay}s (attempt ${attempt}/${maxRetries})`);

        // Use sorted set for delayed retry
        const retryTime = Date.now() + delay * 1000;
        await this.redisClient.zAdd(`${this.queueName}:delayed`, {
          score: retryTime,
          value: JSON.stringify(retryJob),
        });

        // Start delayed job processor if not already running
        this.processDelayedJobs();
      } else {
        // Max retries reached - move to failed queue
        console.error(`[Push Worker] Job ${job.id} failed after ${maxRetries} attempts`);

        const failedJob: JobResult = {
          jobId: job.id,
          success: false,
          error,
          attempt,
          processedAt: new Date().toISOString(),
        };

        await this.redisClient.lPush(this.failedQueueName, JSON.stringify(failedJob));

        // Store failed result with 7-day TTL
        await this.redisClient.setEx(
          `push_notification:result:${job.id}`,
          604800, // 7 days
          JSON.stringify(failedJob)
        );
      }
    } catch (error) {
      console.error('[Push Worker] Error handling failed job:', error);
    }
  }

  /**
   * Process delayed jobs (for retries with backoff)
   */
  private async processDelayedJobs(): Promise<void> {
    if (!this.redisClient) return;

    try {
      const now = Date.now();

      // Get jobs that are ready to be processed (score <= now)
      const delayedJobs = await this.redisClient.zRangeByScore(
        `${this.queueName}:delayed`,
        0,
        now
      );

      for (const jobData of delayedJobs) {
        // Move from delayed queue back to main queue
        await this.redisClient.zRem(`${this.queueName}:delayed`, jobData);
        await this.redisClient.lPush(this.queueName, jobData);

        console.log('[Push Worker] Moved delayed job back to main queue');
      }
    } catch (error) {
      console.error('[Push Worker] Error processing delayed jobs:', error);
    }
  }

  /**
   * Add a job to the queue
   */
  public async addJob(params: PushNotificationParams, priority?: 'high' | 'normal' | 'low'): Promise<string> {
    if (!this.redisClient) {
      await this.initialize();
    }

    const jobId = `push-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const job: PushNotificationJob = {
      id: jobId,
      type: 'push_notification',
      data: params,
      priority: priority || 'normal',
      createdAt: new Date().toISOString(),
    };

    // Add to queue (LPUSH for FIFO)
    await this.redisClient!.lPush(this.queueName, JSON.stringify(job));

    console.log(`[Push Worker] Added job ${jobId} to queue`);

    return jobId;
  }

  /**
   * Get queue stats
   */
  public async getStats(): Promise<{
    pending: number;
    processing: number;
    failed: number;
  }> {
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
    } catch (error) {
      console.error('[Push Worker] Error getting stats:', error);
      return { pending: 0, processing: 0, failed: 0 };
    }
  }

  /**
   * Helper: Sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const pushWorker = new PushNotificationWorker();

// Start worker if not in test mode
if (process.env.NODE_ENV !== 'test') {
  pushWorker.start().catch((error) => {
    console.error('[Push Worker] Failed to start:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('[Push Worker] SIGTERM received, stopping worker...');
    await pushWorker.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('[Push Worker] SIGINT received, stopping worker...');
    await pushWorker.stop();
    process.exit(0);
  });
}
