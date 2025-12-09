/**
 * Audit Service Client
 * Logs PHI access events for compliance (HIPAA, GDPR, Swiss regulations)
 * Tasks: T8-009 - Audit Service Integration
 *
 * Features:
 * - Log audit events to audit service
 * - Queue events when service unavailable
 * - Retry logic with exponential backoff
 * - Environment-based configuration
 */

import axios, { AxiosInstance } from 'axios';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface AuditEventParams {
  userId: string;
  pharmacyId?: string | null;
  eventType: string;
  action: 'create' | 'read' | 'update' | 'delete';
  resourceType: string;
  resourceId: string;
  changes?: Record<string, { old: any; new: any }> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditEventResponse {
  id: string;
  userId: string;
  eventType: string;
  resourceType: string;
  resourceId: string;
  createdAt: string;
  queued?: boolean;
}

export interface AuditClientConfig {
  auditServiceUrl: string;
  timeout?: number;
  maxRetries?: number;
  backoffMultiplier?: number;
  queueStoragePath?: string;
  enabled?: boolean;
}

// ============================================================================
// Queue Storage (In-Memory for now, can be persisted to disk)
// ============================================================================

class AuditEventQueue {
  private queue: AuditEventParams[] = [];

  enqueue(event: AuditEventParams): void {
    this.queue.push(event);
    console.log(`[AuditClient] Event queued (queue size: ${this.queue.length})`);
  }

  dequeue(): AuditEventParams | undefined {
    return this.queue.shift();
  }

  size(): number {
    return this.queue.length;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  clear(): void {
    this.queue = [];
  }
}

// ============================================================================
// Audit Service Client
// ============================================================================

export class AuditClient {
  private client: AxiosInstance;
  private config: Required<AuditClientConfig>;
  private queue: AuditEventQueue;
  private processingQueue: boolean = false;
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: AuditClientConfig) {
    // Set defaults
    this.config = {
      auditServiceUrl: config.auditServiceUrl,
      timeout: config.timeout || 5000,
      maxRetries: config.maxRetries || 3,
      backoffMultiplier: config.backoffMultiplier || 2,
      queueStoragePath: config.queueStoragePath || '/tmp/audit-queue',
      enabled: config.enabled !== false,
    };

    // Initialize axios client
    this.client = axios.create({
      baseURL: this.config.auditServiceUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AuditClient/1.0',
      },
    });

    // Initialize queue
    this.queue = new AuditEventQueue();

    // Start health check and queue processing
    if (this.config.enabled) {
      this.startHealthCheck();
    }
  }

  /**
   * Log an audit event
   * @param event - The audit event to log
   * @returns Promise with audit event response
   */
  async logEvent(event: AuditEventParams): Promise<AuditEventResponse> {
    if (!this.config.enabled) {
      console.log('[AuditClient] Audit logging disabled');
      return {
        id: 'disabled',
        userId: event.userId,
        eventType: event.eventType,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        createdAt: new Date().toISOString(),
      };
    }

    try {
      console.log(`[AuditClient] Logging audit event: ${event.eventType} on ${event.resourceType}/${event.resourceId}`);

      const response = await this.sendWithRetry(event);
      return response;
    } catch (error) {
      console.error(`[AuditClient] Failed to log event after retries, queueing:`, error instanceof Error ? error.message : error);

      // Queue event for later processing
      this.queue.enqueue(event);

      // Return response indicating event was queued
      return {
        id: `queued-${Date.now()}`,
        userId: event.userId,
        eventType: event.eventType,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        createdAt: new Date().toISOString(),
        queued: true,
      };
    }
  }

  /**
   * Send event with retry logic and exponential backoff
   * @param event - The audit event to send
   * @param attempt - Current retry attempt (internal)
   * @returns Promise with audit event response
   */
  private async sendWithRetry(event: AuditEventParams, attempt: number = 1): Promise<AuditEventResponse> {
    try {
      const response = await this.client.post<AuditEventResponse>('/api/audit-events', event);
      console.log(`[AuditClient] ✓ Event logged successfully: ${response.data.id}`);
      return response.data;
    } catch (error) {
      const isNetworkError = axios.isAxiosError(error) && !error.response;
      const isServerError = axios.isAxiosError(error) && error.response && error.response.status >= 500;
      const shouldRetry = isNetworkError || isServerError;

      if (shouldRetry && attempt < this.config.maxRetries) {
        const delay = this.calculateBackoff(attempt);
        console.log(`[AuditClient] Retry attempt ${attempt + 1}/${this.config.maxRetries} after ${delay}ms`);

        await this.sleep(delay);
        return this.sendWithRetry(event, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Calculate exponential backoff delay
   * @param attempt - The current retry attempt
   * @returns Delay in milliseconds
   */
  private calculateBackoff(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    const baseDelay = 1000; // 1 second
    return baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
  }

  /**
   * Sleep for specified milliseconds
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Start periodic health check and queue processing
   */
  private startHealthCheck(): void {
    // Check every 10 seconds
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.client.get('/health');
        // Service is healthy, process queued events
        this.processQueue();
      } catch (error) {
        // Service is down, stop processing
        console.warn('[AuditClient] Audit service health check failed');
      }
    }, 10000);
  }

  /**
   * Process queued audit events
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.queue.isEmpty()) {
      return;
    }

    this.processingQueue = true;

    try {
      while (!this.queue.isEmpty()) {
        const event = this.queue.dequeue();
        if (!event) break;

        try {
          await this.sendWithRetry(event);
          console.log(`[AuditClient] ✓ Processed queued event: ${event.eventType}`);
        } catch (error) {
          console.error(`[AuditClient] Failed to process queued event:`, error instanceof Error ? error.message : error);
          // Re-queue the event and stop processing
          this.queue.enqueue(event);
          break;
        }
      }
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Get the current queue size
   * @returns Number of events in queue
   */
  getQueueSize(): number {
    return this.queue.size();
  }

  /**
   * Clear the event queue (use with caution)
   */
  clearQueue(): void {
    this.queue.clear();
    console.log('[AuditClient] Queue cleared');
  }

  /**
   * Gracefully shutdown the client
   */
  async shutdown(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      console.log('[AuditClient] Health check stopped');
    }

    // Process remaining queued events
    if (!this.queue.isEmpty()) {
      console.log(`[AuditClient] Processing ${this.queue.size()} remaining queued events...`);
      await this.processQueue();
    }

    console.log('[AuditClient] Shutdown complete');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let auditClientInstance: AuditClient | null = null;

/**
 * Initialize the audit client (should be called once at app startup)
 * @param config - Configuration for the audit client
 * @returns The AuditClient instance
 */
export function initializeAuditClient(config: AuditClientConfig): AuditClient {
  if (auditClientInstance) {
    console.warn('[AuditClient] Already initialized, returning existing instance');
    return auditClientInstance;
  }

  auditClientInstance = new AuditClient(config);
  console.log(`[AuditClient] Initialized with URL: ${config.auditServiceUrl}`);

  return auditClientInstance;
}

/**
 * Get the audit client instance
 * @returns The AuditClient instance or null if not initialized
 */
export function getAuditClient(): AuditClient | null {
  if (!auditClientInstance) {
    console.warn('[AuditClient] Client not initialized. Call initializeAuditClient first.');
  }
  return auditClientInstance;
}
