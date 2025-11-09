/**
 * Offline Queue Service
 * Queues failed API requests when offline and retries them when connection is restored
 * Uses AsyncStorage for persistence across app restarts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { AxiosRequestConfig } from 'axios';
import { apiClient } from './apiClient';

/**
 * Storage key for offline queue
 */
const OFFLINE_QUEUE_KEY = '@metapharm/offlineQueue';

/**
 * Queue item structure
 */
export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  data?: any;
  config?: AxiosRequestConfig;
  timestamp: number;
  retryCount: number;
  priority: 'high' | 'normal' | 'low';
}

/**
 * Maximum retry attempts per request
 */
const MAX_RETRY_ATTEMPTS = 5;

/**
 * Maximum queue size (prevent memory issues)
 */
const MAX_QUEUE_SIZE = 100;

/**
 * Offline queue class
 */
class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private isOnline = false;
  private unsubscribeNetInfo?: () => void;

  /**
   * Initialize offline queue
   * - Load persisted queue from AsyncStorage
   * - Setup network listener
   */
  async initialize(): Promise<void> {
    try {
      // Load persisted queue
      await this.loadQueue();

      // Setup network listener
      this.unsubscribeNetInfo = NetInfo.addEventListener(this.handleConnectivityChange);

      // Check initial connection state
      const state = await NetInfo.fetch();
      this.isOnline = state.isConnected ?? false;

      // Process queue if online
      if (this.isOnline) {
        await this.processQueue();
      }

      console.log('Offline queue initialized:', {
        queueSize: this.queue.length,
        isOnline: this.isOnline,
      });
    } catch (error) {
      console.error('Error initializing offline queue:', error);
    }
  }

  /**
   * Cleanup and unsubscribe from network listener
   */
  cleanup(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
    }
  }

  /**
   * Handle connectivity change events
   */
  private handleConnectivityChange = async (state: NetInfoState): Promise<void> => {
    const wasOffline = !this.isOnline;
    this.isOnline = state.isConnected ?? false;

    console.log('Network connectivity changed:', {
      isOnline: this.isOnline,
      wasOffline,
    });

    // If just came back online, process queue
    if (this.isOnline && wasOffline && this.queue.length > 0) {
      console.log('Connection restored - processing offline queue');
      await this.processQueue();
    }
  };

  /**
   * Add request to queue
   */
  async addToQueue(
    url: string,
    method: string,
    data?: any,
    config?: AxiosRequestConfig,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<string> {
    try {
      // Check queue size limit
      if (this.queue.length >= MAX_QUEUE_SIZE) {
        // Remove oldest low-priority item
        const oldestLowPriorityIndex = this.queue.findIndex(
          item => item.priority === 'low'
        );

        if (oldestLowPriorityIndex !== -1) {
          this.queue.splice(oldestLowPriorityIndex, 1);
        } else {
          throw new Error('Queue is full - cannot add more requests');
        }
      }

      const queuedRequest: QueuedRequest = {
        id: this.generateId(),
        url,
        method,
        data,
        config,
        timestamp: Date.now(),
        retryCount: 0,
        priority,
      };

      this.queue.push(queuedRequest);

      // Sort queue by priority (high > normal > low) and timestamp
      this.queue.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];

        if (priorityDiff !== 0) {
          return priorityDiff;
        }

        return a.timestamp - b.timestamp;
      });

      // Persist queue
      await this.saveQueue();

      console.log('Request added to offline queue:', {
        id: queuedRequest.id,
        url,
        method,
        priority,
        queueSize: this.queue.length,
      });

      return queuedRequest.id;
    } catch (error) {
      console.error('Error adding request to queue:', error);
      throw error;
    }
  }

  /**
   * Process queue - retry all queued requests
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    console.log('Processing offline queue:', {
      queueSize: this.queue.length,
    });

    try {
      // Process each request in order
      while (this.queue.length > 0 && this.isOnline) {
        const request = this.queue[0];

        try {
          await this.retryRequest(request);

          // Success - remove from queue
          this.queue.shift();
          await this.saveQueue();

          console.log('Request processed successfully:', {
            id: request.id,
            url: request.url,
            remainingInQueue: this.queue.length,
          });
        } catch (error) {
          console.error('Error processing queued request:', error);

          // Increment retry count
          request.retryCount++;

          // If max retries reached, remove from queue
          if (request.retryCount >= MAX_RETRY_ATTEMPTS) {
            console.warn('Max retries reached - removing request:', {
              id: request.id,
              url: request.url,
              retryCount: request.retryCount,
            });

            this.queue.shift();
          }

          await this.saveQueue();

          // If network error, stop processing
          if (!this.isOnline) {
            break;
          }
        }
      }

      console.log('Offline queue processing complete:', {
        remainingInQueue: this.queue.length,
      });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Retry a single request
   */
  private async retryRequest(request: QueuedRequest): Promise<any> {
    const { url, method, data, config } = request;

    switch (method.toUpperCase()) {
      case 'GET':
        return apiClient.get(url, config);
      case 'POST':
        return apiClient.post(url, data, config);
      case 'PUT':
        return apiClient.put(url, data, config);
      case 'PATCH':
        return apiClient.patch(url, data, config);
      case 'DELETE':
        return apiClient.delete(url, config);
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }

  /**
   * Load queue from AsyncStorage
   */
  private async loadQueue(): Promise<void> {
    try {
      const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);

      if (queueJson) {
        this.queue = JSON.parse(queueJson);
        console.log('Loaded offline queue from storage:', this.queue.length);
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
      this.queue = [];
    }
  }

  /**
   * Save queue to AsyncStorage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  /**
   * Clear entire queue
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
    console.log('Offline queue cleared');
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Get all queued requests
   */
  getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  /**
   * Check if queue is being processed
   */
  isProcessingQueue(): boolean {
    return this.isProcessing;
  }

  /**
   * Generate unique ID for queued request
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Singleton instance
 */
export const offlineQueue = new OfflineQueue();

/**
 * Export class and instance
 */
export default offlineQueue;
