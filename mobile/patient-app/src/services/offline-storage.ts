/**
 * Offline Storage Service
 * Manages caching of data using AsyncStorage for offline-first architecture
 * Syncs with backend when connection is restored
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

/**
 * Cached data interface
 */
export interface CachedData<T> {
  key: string;
  data: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

/**
 * Offline sync queue item
 */
export interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  resource: string;
  data: Record<string, any>;
  timestamp: number;
  retryCount: number;
}

/**
 * Offline Storage Service
 * Provides offline-first data caching and synchronization
 */
export class OfflineStorageService {
  private static instance: OfflineStorageService;
  private isOnline = true;
  private syncQueue: SyncQueueItem[] = [];
  private syncListeners: ((status: boolean) => void)[] = [];

  private constructor() {
    this.initializeNetworkMonitoring();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): OfflineStorageService {
    if (!OfflineStorageService.instance) {
      OfflineStorageService.instance = new OfflineStorageService();
    }
    return OfflineStorageService.instance;
  }

  /**
   * Initialize network state monitoring
   */
  private initializeNetworkMonitoring(): void {
    try {
      NetInfo.addEventListener((state) => {
        const wasOnline = this.isOnline;
        this.isOnline = state.isConnected ?? false;

        if (!wasOnline && this.isOnline) {
          // Connection restored - trigger sync
          this.syncOfflineQueue();
        }

        // Notify all listeners of connection status change
        this.syncListeners.forEach((listener) => listener(this.isOnline));
      });
    } catch (error) {
      console.error('Error initializing network monitoring:', error);
    }
  }

  /**
   * Subscribe to connection status changes
   */
  onConnectionStatusChanged(listener: (isOnline: boolean) => void): () => void {
    this.syncListeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.syncListeners = this.syncListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Get current connection status
   */
  isConnected(): boolean {
    return this.isOnline;
  }

  /**
   * Save data to cache
   */
  async cache<T>(
    key: string,
    data: T,
    ttl?: number
  ): Promise<void> {
    try {
      const cacheEntry: CachedData<T> = {
        key,
        data,
        timestamp: Date.now(),
        ttl,
      };
      await AsyncStorage.setItem(
        `cache:${key}`,
        JSON.stringify(cacheEntry)
      );
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  /**
   * Get cached data
   */
  async getCache<T>(key: string): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(`cache:${key}`);
      if (!data) {
        return null;
      }

      const cached: CachedData<T> = JSON.parse(data);

      // Check if cache has expired
      if (cached.ttl && Date.now() - cached.timestamp > cached.ttl) {
        await AsyncStorage.removeItem(`cache:${key}`);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  /**
   * Clear specific cache entry
   */
  async clearCache(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`cache:${key}`);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith('cache:'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }

  /**
   * Add item to sync queue for later synchronization
   */
  async queueSync(
    action: 'create' | 'update' | 'delete',
    resource: string,
    data: Record<string, any>
  ): Promise<string> {
    try {
      const id = `${Date.now()}-${Math.random()}`;
      const item: SyncQueueItem = {
        id,
        action,
        resource,
        data,
        timestamp: Date.now(),
        retryCount: 0,
      };

      const queue = await this.getSyncQueue();
      queue.push(item);
      await AsyncStorage.setItem('sync_queue', JSON.stringify(queue));

      return id;
    } catch (error) {
      console.error('Error queueing sync:', error);
      throw error;
    }
  }

  /**
   * Get sync queue
   */
  private async getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      const data = await AsyncStorage.getItem('sync_queue');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting sync queue:', error);
      return [];
    }
  }

  /**
   * Sync offline queue (to be called when connection is restored)
   */
  async syncOfflineQueue(): Promise<void> {
    if (!this.isOnline) {
      console.log('Not connected - skipping sync');
      return;
    }

    try {
      const queue = await this.getSyncQueue();
      if (queue.length === 0) {
        return;
      }

      console.log(`Syncing ${queue.length} offline changes`);

      // In production, this would call your API endpoints
      // For now, we simulate processing the queue
      for (const item of queue) {
        await this.processQueueItem(item);
      }

      // Clear sync queue after successful sync
      await AsyncStorage.removeItem('sync_queue');
    } catch (error) {
      console.error('Error syncing offline queue:', error);
    }
  }

  /**
   * Process individual queue item
   * In production, this would make API calls
   */
  private async processQueueItem(item: SyncQueueItem): Promise<void> {
    try {
      // Simulate API call
      console.log(`Processing sync: ${item.action} ${item.resource}`);

      // In production:
      // switch (item.action) {
      //   case 'create':
      //     await apiClient.post(`/${item.resource}`, item.data);
      //     break;
      //   case 'update':
      //     await apiClient.patch(`/${item.resource}/${item.data.id}`, item.data);
      //     break;
      //   case 'delete':
      //     await apiClient.delete(`/${item.resource}/${item.data.id}`);
      //     break;
      // }
    } catch (error) {
      console.error('Error processing queue item:', error);
      // Don't throw - let sync continue with other items
    }
  }

  /**
   * Remove item from sync queue
   */
  async removeSyncQueueItem(itemId: string): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      const updated = queue.filter((item) => item.id !== itemId);
      await AsyncStorage.setItem('sync_queue', JSON.stringify(updated));
    } catch (error) {
      console.error('Error removing queue item:', error);
    }
  }

  /**
   * Get sync queue status
   */
  async getSyncQueueStatus(): Promise<{
    pending: number;
    isOnline: boolean;
  }> {
    try {
      const queue = await this.getSyncQueue();
      return {
        pending: queue.length,
        isOnline: this.isOnline,
      };
    } catch (error) {
      console.error('Error getting sync queue status:', error);
      return { pending: 0, isOnline: this.isOnline };
    }
  }
}

export default OfflineStorageService.getInstance();
