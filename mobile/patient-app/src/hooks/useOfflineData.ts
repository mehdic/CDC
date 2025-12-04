/**
 * useOfflineData Hook
 * Custom hook for managing offline data and sync status
 */

import { useEffect, useState, useCallback } from 'react';

import OfflineStorageService from '../services/offline-storage';

interface UseOfflineDataReturn<T> {
  data: T | null;
  isOnline: boolean;
  isSyncing: boolean;
  pendingChanges: number;
  error: string | null;
  cacheData: (key: string, data: T, ttl?: number) => Promise<void>;
  getCachedData: (key: string) => Promise<T | null>;
  queueChange: (
    action: 'create' | 'update' | 'delete',
    resource: string,
    data: Record<string, any>
  ) => Promise<string>;
  syncNow: () => Promise<void>;
}

/**
 * Hook for managing offline data and caching
 */
export const useOfflineData = <T>(): UseOfflineDataReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to connection status changes
  useEffect(() => {
    const unsubscribe = OfflineStorageService.onConnectionStatusChanged(
      (online) => {
        setIsOnline(online);
      }
    );

    // Get initial status
    setIsOnline(OfflineStorageService.isConnected());

    return () => {
      unsubscribe();
    };
  }, []);

  // Update pending changes count
  useEffect(() => {
    const updatePendingCount = async () => {
      const status = await OfflineStorageService.getSyncQueueStatus();
      setPendingChanges(status.pending);
    };

    updatePendingCount();

    // Check pending changes every 5 seconds
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Cache data
  const cacheData = useCallback(
    async (key: string, dataToCache: T, ttl?: number) => {
      try {
        await OfflineStorageService.cache(key, dataToCache, ttl);
        setData(dataToCache);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    },
    []
  );

  // Get cached data
  const getCachedData = useCallback(async (key: string): Promise<T | null> => {
    try {
      const cachedData = await OfflineStorageService.getCache<T>(key);
      if (cachedData) {
        setData(cachedData);
      }
      return cachedData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, []);

  // Queue a change for later synchronization
  const queueChange = useCallback(
    async (
      action: 'create' | 'update' | 'delete',
      resource: string,
      dataToQueue: Record<string, any>
    ): Promise<string> => {
      try {
        const id = await OfflineStorageService.queueSync(
          action,
          resource,
          dataToQueue
        );

        // Update pending changes count
        const status = await OfflineStorageService.getSyncQueueStatus();
        setPendingChanges(status.pending);

        return id;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    []
  );

  // Sync offline queue
  const syncNow = useCallback(async () => {
    try {
      setIsSyncing(true);
      await OfflineStorageService.syncOfflineQueue();

      // Update pending changes count
      const status = await OfflineStorageService.getSyncQueueStatus();
      setPendingChanges(status.pending);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    data,
    isOnline,
    isSyncing,
    pendingChanges,
    error,
    cacheData,
    getCachedData,
    queueChange,
    syncNow,
  };
};
