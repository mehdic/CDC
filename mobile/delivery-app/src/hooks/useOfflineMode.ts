/**
 * Offline Mode Hook
 * React hook for offline mode state and sync control
 */

import { useState, useEffect, useCallback } from 'react';

import { networkMonitor, NetworkStatus } from '../services/networkMonitor';
import { offlineQueueService, QueuedAction } from '../services/offlineQueueService';

/**
 * Offline Mode State
 */
export interface OfflineModeState {
  isOffline: boolean;
  queuedCount: number;
  isProcessing: boolean;
  networkStatus: NetworkStatus | null;
  queue: QueuedAction[];
}

/**
 * Offline Mode Actions
 */
export interface OfflineModeActions {
  forceSync: () => Promise<void>;
  clearQueue: () => Promise<void>;
  removeAction: (actionId: string) => Promise<boolean>;
  checkNetwork: () => Promise<NetworkStatus>;
}

/**
 * Hook Return Type
 */
export interface UseOfflineModeReturn extends OfflineModeState, OfflineModeActions {}

/**
 * Offline Mode Hook
 */
export const useOfflineMode = (): UseOfflineModeReturn => {
  const [isOffline, setIsOffline] = useState(!networkMonitor.isCurrentlyOnline());
  const [queuedCount, setQueuedCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [queue, setQueue] = useState<QueuedAction[]>([]);

  /**
   * Update queue state
   */
  const updateQueueState = useCallback((newQueue: QueuedAction[]) => {
    setQueue(newQueue);
    setQueuedCount(newQueue.length);
  }, []);

  /**
   * Initialize services on mount
   */
  useEffect(() => {
    let mounted = true;

    const initServices = async () => {
      // Initialize offline queue service
      await offlineQueueService.initialize();

      if (!mounted) {return;}

      // Set initial queue state
      const initialQueue = offlineQueueService.getQueue();
      updateQueueState(initialQueue);

      // Initialize network monitor
      await networkMonitor.initialize({
        autoSync: true,
        syncOnReconnect: true,
      });

      if (!mounted) {return;}

      // Set initial network status
      setIsOffline(!networkMonitor.isCurrentlyOnline());
      const status = await networkMonitor.checkNetworkStatus();
      setNetworkStatus(status);
    };

    initServices();

    return () => {
      mounted = false;
    };
  }, [updateQueueState]);

  /**
   * Subscribe to network changes
   */
  useEffect(() => {
    const unsubscribe = networkMonitor.subscribe((event, status) => {
      setNetworkStatus(status);
      setIsOffline(!status.isConnected);

      if (event === 'reconnected') {
        console.log('[useOfflineMode] Network reconnected');
      }
    });

    return unsubscribe;
  }, []);

  /**
   * Subscribe to queue changes
   */
  useEffect(() => {
    const unsubscribe = offlineQueueService.subscribe((newQueue) => {
      updateQueueState(newQueue);
      setIsProcessing(offlineQueueService.isProcessingQueue());
    });

    return unsubscribe;
  }, [updateQueueState]);

  /**
   * Force sync now
   */
  const forceSync = useCallback(async (): Promise<void> => {
    if (isOffline) {
      throw new Error('Cannot sync while offline');
    }

    setIsProcessing(true);
    try {
      await networkMonitor.forceSync();
    } finally {
      setIsProcessing(false);
    }
  }, [isOffline]);

  /**
   * Clear all queued actions
   */
  const clearQueue = useCallback(async (): Promise<void> => {
    await offlineQueueService.clearQueue();
  }, []);

  /**
   * Remove specific action from queue
   */
  const removeAction = useCallback(
    async (actionId: string): Promise<boolean> => {
      return await offlineQueueService.removeAction(actionId);
    },
    []
  );

  /**
   * Check current network status
   */
  const checkNetwork = useCallback(async (): Promise<NetworkStatus> => {
    const status = await networkMonitor.checkNetworkStatus();
    setNetworkStatus(status);
    setIsOffline(!status.isConnected);
    return status;
  }, []);

  return {
    // State
    isOffline,
    queuedCount,
    isProcessing,
    networkStatus,
    queue,

    // Actions
    forceSync,
    clearQueue,
    removeAction,
    checkNetwork,
  };
};

export default useOfflineMode;
