/**
 * Offline Queue Service
 * Manages action queue for offline mode with retry logic and persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  Coordinates,
  DeliveryStatus,
  ProofOfDelivery,
} from '../types/delivery';

import deliveryApi from './deliveryApi';

/**
 * Action Types
 */
export type QueuedActionType =
  | 'status_update'
  | 'proof_submit'
  | 'location_update'
  | 'accept_delivery'
  | 'reject_delivery';

/**
 * Queued Action Interface
 */
export interface QueuedAction {
  id: string;
  idempotencyKey: string;
  type: QueuedActionType;
  payload: unknown;
  timestamp: number;
  retryCount: number;
  lastRetryAt?: number;
  error?: string;
}

/**
 * Specific Payload Types
 */
export interface StatusUpdatePayload {
  deliveryId: string;
  status: DeliveryStatus;
  location?: Coordinates;
  notes?: string;
}

export interface ProofSubmitPayload {
  deliveryId: string;
  proof: ProofOfDelivery;
}

export interface LocationUpdatePayload extends Coordinates {}

export interface AcceptDeliveryPayload {
  deliveryId: string;
}

export interface RejectDeliveryPayload {
  deliveryId: string;
  reason?: string;
}

/**
 * Queue Processing Result
 */
export interface ProcessResult {
  success: number;
  failed: number;
  remaining: number;
}

/**
 * Configuration
 */
const QUEUE_KEY = '@offline_action_queue';
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second base delay for exponential backoff
const MAX_DELAY = 30000; // 30 seconds maximum delay
const MAX_QUEUE_SIZE = 1000;

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateRetryDelay(retryCount: number): number {
  const exponential = BASE_DELAY * Math.pow(2, retryCount);
  const capped = Math.min(exponential, MAX_DELAY);
  const jitter = Math.random() * 0.3 * capped;
  return capped + jitter;
}

/**
 * Offline Queue Service Class
 */
class OfflineQueueService {
  private queue: QueuedAction[] = [];
  private isProcessing = false;
  private listeners: Array<(queue: QueuedAction[]) => void> = [];

  /**
   * Initialize service and load persisted queue
   */
  async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`[OfflineQueue] Loaded ${this.queue.length} actions from storage`);
      }

      // CRITICAL: Reset processing flag on init to prevent race condition
      this.isProcessing = false;
    } catch (error) {
      console.error('[OfflineQueue] Failed to load queue:', error);
      this.queue = [];
      this.isProcessing = false;
    }
  }

  /**
   * Add action to queue
   */
  async queueAction(
    action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount' | 'idempotencyKey'>
  ): Promise<string> {
    // Check queue size limit
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      throw new Error('Queue is full. Please retry when online.');
    }

    const queuedAction: QueuedAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      idempotencyKey: `idem-${Date.now()}-${Math.random().toString(36).substr(2, 16)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(queuedAction);
    await this.persist();
    this.notifyListeners();

    console.log(`[OfflineQueue] Queued action: ${queuedAction.type} (${queuedAction.id})`);

    return queuedAction.id;
  }

  /**
   * Process queue - attempt to sync all actions
   */
  async processQueue(): Promise<ProcessResult> {
    if (this.isProcessing) {
      console.log('[OfflineQueue] Processing already in progress');
      return {
        success: 0,
        failed: 0,
        remaining: this.queue.length,
      };
    }

    this.isProcessing = true;
    let successCount = 0;
    let failedCount = 0;

    console.log(`[OfflineQueue] Processing ${this.queue.length} actions...`);

    // Create a copy to iterate over
    const itemsToProcess = [...this.queue];

    for (const action of itemsToProcess) {
      // Check if enough time has passed since last retry (exponential backoff)
      const requiredDelay = calculateRetryDelay(action.retryCount);
      if (action.lastRetryAt && Date.now() - action.lastRetryAt < requiredDelay) {
        continue;
      }

      try {
        await this.executeAction(action);

        // CRITICAL: Atomic persistence - remove from queue ONLY after successful persist
        const previousQueue = [...this.queue];
        this.queue = this.queue.filter((item) => item.id !== action.id);

        try {
          // Persist MUST succeed before considering action complete
          await this.persistOrThrow();
          successCount++;
          console.log(`[OfflineQueue] Success: ${action.type} (${action.id})`);
        } catch (persistError) {
          // Rollback: restore action if persist failed
          this.queue = previousQueue;
          console.error(
            `[OfflineQueue] Persist failed for ${action.type} (${action.id}), rolled back:`,
            persistError
          );
          // Continue to next action without incrementing success
        }
      } catch (error) {
        // Failure - update retry count
        const actionInQueue = this.queue.find((item) => item.id === action.id);
        if (actionInQueue) {
          actionInQueue.retryCount++;
          actionInQueue.lastRetryAt = Date.now();
          actionInQueue.error = error instanceof Error ? error.message : 'Unknown error';

          // Remove if max retries reached
          if (actionInQueue.retryCount >= MAX_RETRIES) {
            this.queue = this.queue.filter((item) => item.id !== action.id);
            failedCount++;
            console.error(
              `[OfflineQueue] Max retries reached for ${action.type} (${action.id}):`,
              error
            );
          } else {
            console.warn(
              `[OfflineQueue] Retry ${actionInQueue.retryCount}/${MAX_RETRIES} for ${action.type} (${action.id})`
            );
          }
        }
      }
    }

    await this.persist();
    this.notifyListeners();
    this.isProcessing = false;

    const result = {
      success: successCount,
      failed: failedCount,
      remaining: this.queue.length,
    };

    console.log('[OfflineQueue] Processing complete:', result);

    return result;
  }

  /**
   * Execute a single action
   */
  private async executeAction(action: QueuedAction): Promise<void> {
    switch (action.type) {
      case 'status_update': {
        const payload = action.payload as StatusUpdatePayload;
        await deliveryApi.updateDeliveryStatus(
          payload.deliveryId,
          payload.status,
          payload.location,
          payload.notes
        );
        break;
      }

      case 'proof_submit': {
        const payload = action.payload as ProofSubmitPayload;
        await deliveryApi.submitProofOfDelivery(payload.deliveryId, payload.proof);
        break;
      }

      case 'location_update': {
        const payload = action.payload as LocationUpdatePayload;
        await deliveryApi.updateLocation(payload);
        break;
      }

      case 'accept_delivery': {
        const payload = action.payload as AcceptDeliveryPayload;
        await deliveryApi.acceptDelivery(payload.deliveryId);
        break;
      }

      case 'reject_delivery': {
        const payload = action.payload as RejectDeliveryPayload;
        await deliveryApi.rejectDelivery(payload.deliveryId, payload.reason);
        break;
      }

      default:
        throw new Error(`Unknown action type: ${(action as QueuedAction).type}`);
    }
  }

  /**
   * Get current queue
   */
  getQueue(): QueuedAction[] {
    return [...this.queue];
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Clear all actions from queue
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.persist();
    this.notifyListeners();
    console.log('[OfflineQueue] Queue cleared');
  }

  /**
   * Remove specific action from queue
   */
  async removeAction(actionId: string): Promise<boolean> {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter((item) => item.id !== actionId);

    if (this.queue.length < initialLength) {
      await this.persist();
      this.notifyListeners();
      console.log(`[OfflineQueue] Removed action: ${actionId}`);
      return true;
    }

    return false;
  }

  /**
   * Subscribe to queue changes
   */
  subscribe(listener: (queue: QueuedAction[]) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all listeners of queue changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener([...this.queue]);
      } catch (error) {
        console.error('[OfflineQueue] Listener error:', error);
      }
    });
  }

  /**
   * Persist queue to storage
   */
  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[OfflineQueue] Failed to persist queue:', error);
    }
  }

  /**
   * Persist queue to storage - throws on failure (for atomic operations)
   */
  private async persistOrThrow(): Promise<void> {
    // Let errors propagate - no try-catch here
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
  }

  /**
   * Get actions by type
   */
  getActionsByType(type: QueuedActionType): QueuedAction[] {
    return this.queue.filter((action) => action.type === type);
  }

  /**
   * Get failed actions (reached max retries)
   */
  getFailedActions(): QueuedAction[] {
    return this.queue.filter((action) => action.retryCount >= MAX_RETRIES);
  }

  /**
   * Check if processing
   */
  isProcessingQueue(): boolean {
    return this.isProcessing;
  }
}

/**
 * Export singleton instance
 */
export const offlineQueueService = new OfflineQueueService();
export default offlineQueueService;
