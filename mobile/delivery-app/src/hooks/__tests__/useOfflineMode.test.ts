/**
 * useOfflineMode Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';

import { networkMonitor } from '../../services/networkMonitor';
import { offlineQueueService } from '../../services/offlineQueueService';
import { useOfflineMode } from '../useOfflineMode';

// Mock dependencies
jest.mock('../../services/offlineQueueService');
jest.mock('../../services/networkMonitor');

describe('useOfflineMode', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    (offlineQueueService.initialize as jest.Mock).mockResolvedValue(undefined);
    (offlineQueueService.getQueue as jest.Mock).mockReturnValue([]);
    (offlineQueueService.subscribe as jest.Mock).mockReturnValue(jest.fn());
    (offlineQueueService.clearQueue as jest.Mock).mockResolvedValue(undefined);
    (offlineQueueService.removeAction as jest.Mock).mockResolvedValue(true);
    (offlineQueueService.isProcessingQueue as jest.Mock).mockReturnValue(false);

    (networkMonitor.initialize as jest.Mock).mockResolvedValue(undefined);
    (networkMonitor.isCurrentlyOnline as jest.Mock).mockReturnValue(true);
    (networkMonitor.subscribe as jest.Mock).mockReturnValue(jest.fn());
    (networkMonitor.checkNetworkStatus as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    });
    (networkMonitor.forceSync as jest.Mock).mockResolvedValue(undefined);
  });

  describe('initialization', () => {
    it('should initialize services on mount', async () => {
      renderHook(() => useOfflineMode());

      await waitFor(() => {
        expect(offlineQueueService.initialize).toHaveBeenCalled();
        expect(networkMonitor.initialize).toHaveBeenCalledWith({
          autoSync: true,
          syncOnReconnect: true,
        });
      });
    });

    it('should set initial state', async () => {
      (networkMonitor.isCurrentlyOnline as jest.Mock).mockReturnValue(false);
      (offlineQueueService.getQueue as jest.Mock).mockReturnValue([
        { id: '1', type: 'status_update', payload: {}, timestamp: Date.now(), retryCount: 0 },
        { id: '2', type: 'location_update', payload: {}, timestamp: Date.now(), retryCount: 0 },
      ]);

      const { result } = renderHook(() => useOfflineMode());

      await waitFor(() => {
        expect(result.current.isOffline).toBe(true);
        expect(result.current.queuedCount).toBe(2);
      });
    });

    it('should subscribe to network monitor', async () => {
      renderHook(() => useOfflineMode());

      await waitFor(() => {
        expect(networkMonitor.subscribe).toHaveBeenCalled();
      });
    });

    it('should subscribe to offline queue service', async () => {
      renderHook(() => useOfflineMode());

      await waitFor(() => {
        expect(offlineQueueService.subscribe).toHaveBeenCalled();
      });
    });
  });

  describe('network status updates', () => {
    it('should update when network status changes', async () => {
      let networkCallback: any;
      (networkMonitor.subscribe as jest.Mock).mockImplementation((cb) => {
        networkCallback = cb;
        return jest.fn();
      });

      const { result } = renderHook(() => useOfflineMode());

      await waitFor(() => {
        expect(result.current.isOffline).toBe(false);
      });

      // Simulate going offline
      act(() => {
        networkCallback('offline', {
          isConnected: false,
          isInternetReachable: false,
          type: 'none',
        });
      });

      await waitFor(() => {
        expect(result.current.isOffline).toBe(true);
      });
    });

    it('should update network status', async () => {
      let networkCallback: any;
      (networkMonitor.subscribe as jest.Mock).mockImplementation((cb) => {
        networkCallback = cb;
        return jest.fn();
      });

      const { result } = renderHook(() => useOfflineMode());

      act(() => {
        networkCallback('online', {
          isConnected: true,
          isInternetReachable: true,
          type: 'wifi',
          effectiveType: '4g',
        });
      });

      await waitFor(() => {
        expect(result.current.networkStatus).toEqual({
          isConnected: true,
          isInternetReachable: true,
          type: 'wifi',
          effectiveType: '4g',
        });
      });
    });
  });

  describe('queue updates', () => {
    it('should update when queue changes', async () => {
      let queueCallback: any;
      (offlineQueueService.subscribe as jest.Mock).mockImplementation((cb) => {
        queueCallback = cb;
        return jest.fn();
      });

      const { result } = renderHook(() => useOfflineMode());

      await waitFor(() => {
        expect(result.current.queuedCount).toBe(0);
      });

      // Simulate queue update
      act(() => {
        queueCallback([
          { id: '1', type: 'status_update', payload: {}, timestamp: Date.now(), retryCount: 0 },
        ]);
      });

      await waitFor(() => {
        expect(result.current.queuedCount).toBe(1);
        expect(result.current.queue).toHaveLength(1);
      });
    });

    it('should update processing status', async () => {
      let queueCallback: any;
      (offlineQueueService.subscribe as jest.Mock).mockImplementation((cb) => {
        queueCallback = cb;
        return jest.fn();
      });

      (offlineQueueService.isProcessingQueue as jest.Mock).mockReturnValue(true);

      const { result } = renderHook(() => useOfflineMode());

      act(() => {
        queueCallback([]);
      });

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(true);
      });
    });
  });

  describe('forceSync', () => {
    it('should call networkMonitor.forceSync when online', async () => {
      (networkMonitor.isCurrentlyOnline as jest.Mock).mockReturnValue(true);

      const { result } = renderHook(() => useOfflineMode());

      await waitFor(() => {
        expect(result.current.isOffline).toBe(false);
      });

      await act(async () => {
        await result.current.forceSync();
      });

      expect(networkMonitor.forceSync).toHaveBeenCalled();
    });

    it('should throw error when offline', async () => {
      (networkMonitor.isCurrentlyOnline as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() => useOfflineMode());

      await waitFor(() => {
        expect(result.current.isOffline).toBe(true);
      });

      await expect(result.current.forceSync()).rejects.toThrow(
        'Cannot sync while offline'
      );
    });

    it('should update processing state during sync', async () => {
      (networkMonitor.isCurrentlyOnline as jest.Mock).mockReturnValue(true);
      (networkMonitor.forceSync as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() => useOfflineMode());

      await waitFor(() => {
        expect(result.current.isOffline).toBe(false);
      });

      let syncPromise: Promise<void>;
      act(() => {
        syncPromise = result.current.forceSync();
      });

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(true);
      });

      await act(async () => {
        await syncPromise!;
      });

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false);
      });
    });
  });

  describe('clearQueue', () => {
    it('should call offlineQueueService.clearQueue', async () => {
      const { result } = renderHook(() => useOfflineMode());

      await act(async () => {
        await result.current.clearQueue();
      });

      expect(offlineQueueService.clearQueue).toHaveBeenCalled();
    });
  });

  describe('removeAction', () => {
    it('should call offlineQueueService.removeAction', async () => {
      const { result } = renderHook(() => useOfflineMode());

      let removed: boolean = false;
      await act(async () => {
        removed = await result.current.removeAction('test-id');
      });

      expect(offlineQueueService.removeAction).toHaveBeenCalledWith('test-id');
      expect(removed).toBe(true);
    });
  });

  describe('checkNetwork', () => {
    it('should check network status and update state', async () => {
      const mockStatus = {
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      };

      (networkMonitor.checkNetworkStatus as jest.Mock).mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useOfflineMode());

      let returnedStatus: any;
      await act(async () => {
        returnedStatus = await result.current.checkNetwork();
      });

      expect(networkMonitor.checkNetworkStatus).toHaveBeenCalled();
      expect(returnedStatus).toEqual(mockStatus);
    });

    it('should return network status', async () => {
      const mockStatus = {
        isConnected: true,
        isInternetReachable: true,
        type: 'cellular',
        effectiveType: '3g',
      };

      (networkMonitor.checkNetworkStatus as jest.Mock).mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useOfflineMode());

      let status: any;
      await act(async () => {
        status = await result.current.checkNetwork();
      });

      expect(status).toEqual(mockStatus);
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe from network monitor on unmount', async () => {
      const unsubscribe = jest.fn();
      (networkMonitor.subscribe as jest.Mock).mockReturnValue(unsubscribe);

      const { unmount } = renderHook(() => useOfflineMode());

      await waitFor(() => {
        expect(networkMonitor.subscribe).toHaveBeenCalled();
      });

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });

    it('should unsubscribe from queue service on unmount', async () => {
      const unsubscribe = jest.fn();
      (offlineQueueService.subscribe as jest.Mock).mockReturnValue(unsubscribe);

      const { unmount } = renderHook(() => useOfflineMode());

      await waitFor(() => {
        expect(offlineQueueService.subscribe).toHaveBeenCalled();
      });

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
