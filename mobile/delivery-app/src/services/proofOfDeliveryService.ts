/**
 * Proof of Delivery Service
 * Handles submission with offline queue and persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { ProofOfDelivery, Coordinates } from '../types/delivery';

import deliveryApi from './deliveryApi';

const QUEUE_STORAGE_KEY = '@proof_of_delivery_queue';
const MAX_RETRY_COUNT = 3;

/**
 * Queued Proof Item
 */
export interface QueuedProof {
  id: string;
  deliveryId: string;
  proof: ProofOfDelivery;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
}

/**
 * Proof of Delivery Service Class
 */
class ProofOfDeliveryService {
  private queue: QueuedProof[] = [];
  private isProcessing = false;

  constructor() {
    this.loadQueue();
  }

  /**
   * Load queue from AsyncStorage
   */
  private async loadQueue(): Promise<void> {
    try {
      const queueJson = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (queueJson) {
        this.queue = JSON.parse(queueJson);
      }
    } catch (error) {
      console.error('Failed to load proof queue:', error);
      this.queue = [];
    }
  }

  /**
   * Save queue to AsyncStorage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save proof queue:', error);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `proof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Submit proof of delivery (online or queue for offline)
   */
  async submitProof(
    deliveryId: string,
    proof: ProofOfDelivery,
    isOnline: boolean
  ): Promise<{ success: boolean; queued: boolean; error?: string }> {
    try {
      if (isOnline) {
        // Try immediate submission
        try {
          await deliveryApi.submitProofOfDelivery(deliveryId, proof);
          return { success: true, queued: false };
        } catch (error: any) {
          // If network error, queue it
          if (this.isNetworkError(error)) {
            return await this.queueProof(deliveryId, proof);
          }
          // Other errors (validation, etc) - don't queue
          throw error;
        }
      } else {
        // Offline - queue immediately
        return await this.queueProof(deliveryId, proof);
      }
    } catch (error: any) {
      console.error('Submit proof failed:', error);
      return {
        success: false,
        queued: false,
        error: error.message || 'Failed to submit proof of delivery',
      };
    }
  }

  /**
   * Queue proof for later submission
   */
  private async queueProof(
    deliveryId: string,
    proof: ProofOfDelivery
  ): Promise<{ success: boolean; queued: boolean }> {
    const queuedProof: QueuedProof = {
      id: this.generateId(),
      deliveryId,
      proof,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
    };

    this.queue.push(queuedProof);
    await this.saveQueue();

    return { success: true, queued: true };
  }

  /**
   * Process queued proofs
   */
  async processQueue(isOnline: boolean): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    if (!isOnline || this.isProcessing || this.queue.length === 0) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    this.isProcessing = true;
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    const pendingProofs = this.queue.filter((p) => p.status === 'pending');

    for (const queuedProof of pendingProofs) {
      processed++;
      queuedProof.status = 'processing';

      try {
        await deliveryApi.submitProofOfDelivery(queuedProof.deliveryId, queuedProof.proof);

        // Success - remove from queue
        this.queue = this.queue.filter((p) => p.id !== queuedProof.id);
        succeeded++;
      } catch (error: any) {
        console.error(`Failed to submit queued proof ${queuedProof.id}:`, error);

        queuedProof.retryCount++;
        queuedProof.status = 'pending';

        if (queuedProof.retryCount >= MAX_RETRY_COUNT) {
          // Max retries reached - mark as failed
          queuedProof.status = 'failed';
          failed++;
        }
      }
    }

    await this.saveQueue();
    this.isProcessing = false;

    return { processed, succeeded, failed };
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<{
    total: number;
    pending: number;
    processing: number;
    failed: number;
    items: QueuedProof[];
  }> {
    await this.loadQueue(); // Ensure fresh data

    const pending = this.queue.filter((p) => p.status === 'pending').length;
    const processing = this.queue.filter((p) => p.status === 'processing').length;
    const failed = this.queue.filter((p) => p.status === 'failed').length;

    return {
      total: this.queue.length,
      pending,
      processing,
      failed,
      items: [...this.queue],
    };
  }

  /**
   * Clear failed items
   */
  async clearFailed(): Promise<void> {
    this.queue = this.queue.filter((p) => p.status !== 'failed');
    await this.saveQueue();
  }

  /**
   * Retry failed item
   */
  async retryFailed(id: string): Promise<void> {
    const item = this.queue.find((p) => p.id === id && p.status === 'failed');
    if (item) {
      item.status = 'pending';
      item.retryCount = 0;
      await this.saveQueue();
    }
  }

  /**
   * Clear all queue
   */
  async clearAll(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }

  /**
   * Check if error is network-related
   */
  private isNetworkError(error: any): boolean {
    if (!error) {return false;}

    const networkCodes = ['ECONNABORTED', 'ENOTFOUND', 'ENETUNREACH', 'ETIMEDOUT'];
    const networkMessages = [
      'network error',
      'network request failed',
      'timeout',
      'connection refused',
      'socket hang up',
    ];

    // Check error code
    if (error.code && networkCodes.includes(error.code)) {
      return true;
    }

    // Check error message
    const message = (error.message || '').toLowerCase();
    return networkMessages.some((msg) => message.includes(msg));
  }

  /**
   * Create proof with metadata
   */
  createProof(
    deliveryId: string,
    location: Coordinates,
    data: {
      signatureImage?: string;
      photoImage?: string;
      idVerificationImage?: string;
      recipientName?: string;
      notes?: string;
    }
  ): ProofOfDelivery {
    return {
      deliveryId,
      timestamp: new Date().toISOString(),
      location,
      signatureImage: data.signatureImage,
      photoImage: data.photoImage,
      idVerificationImage: data.idVerificationImage,
      recipientName: data.recipientName,
      notes: data.notes,
    };
  }
}

/**
 * Export singleton instance
 */
export const proofOfDeliveryService = new ProofOfDeliveryService();
export default proofOfDeliveryService;
