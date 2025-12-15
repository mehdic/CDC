/**
 * Network Monitor Service Tests
 */

import NetInfo from '@react-native-community/netinfo';

import { networkMonitor, NetworkEventType } from '../networkMonitor';
import { offlineQueueService } from '../offlineQueueService';

// Mock dependencies
jest.mock('@react-native-community/netinfo');
jest.mock('../offlineQueueService');

describe('NetworkMonitor', () => {
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUnsubscribe = jest.fn();

    (NetInfo.addEventListener as jest.Mock).mockReturnValue(mockUnsubscribe);
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
      details: { effectiveType: '4g' },
    });

    (offlineQueueService.processQueue as jest.Mock).mockResolvedValue({
      success: 0,
      failed: 0,
      remaining: 0,
    });
  });

  afterEach(() => {
    networkMonitor.shutdown();
  });

  describe('initialize', () => {
    it('should fetch initial network state', async () => {
      await networkMonitor.initialize();

      expect(NetInfo.fetch).toHaveBeenCalled();
      expect(networkMonitor.isCurrentlyOnline()).toBe(true);
    });

    it('should subscribe to network changes', async () => {
      await networkMonitor.initialize();

      expect(NetInfo.addEventListener).toHaveBeenCalled();
    });

    it('should handle null internet reachability as online', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
        isInternetReachable: null,
        type: 'wifi',
      });

      await networkMonitor.initialize();

      expect(networkMonitor.isCurrentlyOnline()).toBe(true);
    });

    it('should consider offline when not connected', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      });

      await networkMonitor.initialize();

      expect(networkMonitor.isCurrentlyOnline()).toBe(false);
    });

    it('should support custom configuration', async () => {
      await networkMonitor.initialize({
        autoSync: false,
        syncOnReconnect: false,
        checkInterval: 5000,
      });

      const config = networkMonitor.getConfig();
      expect(config.autoSync).toBe(false);
      expect(config.syncOnReconnect).toBe(false);
      expect(config.checkInterval).toBe(5000);
    });
  });

  describe('network state changes', () => {
    it('should detect online to offline transition', async () => {
      const listener = jest.fn();

      await networkMonitor.initialize();
      networkMonitor.subscribe(listener);

      // Simulate network change
      const netInfoCallback = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];
      netInfoCallback({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      });

      expect(listener).toHaveBeenCalledWith(
        'offline',
        expect.objectContaining({
          isConnected: false,
          isInternetReachable: false,
          type: 'none',
        })
      );
    });

    it('should detect offline to online transition', async () => {
      // Start offline
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      });

      const listener = jest.fn();

      await networkMonitor.initialize();
      networkMonitor.subscribe(listener);

      // Simulate network reconnection
      const netInfoCallback = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];
      netInfoCallback({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      });

      expect(listener).toHaveBeenCalledWith(
        'reconnected',
        expect.objectContaining({
          isConnected: true,
          isInternetReachable: true,
          type: 'wifi',
        })
      );
    });

    it('should not trigger event if status unchanged', async () => {
      const listener = jest.fn();

      await networkMonitor.initialize();
      networkMonitor.subscribe(listener);

      // Simulate same network state
      const netInfoCallback = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];
      netInfoCallback({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      });

      expect(listener).not.toHaveBeenCalled();
    });

    it('should trigger sync on reconnection', async () => {
      jest.useFakeTimers();

      // Start offline
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      });

      await networkMonitor.initialize({
        syncOnReconnect: true,
      });

      // Simulate reconnection
      const netInfoCallback = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];
      netInfoCallback({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      });

      // Wait for async processing
      await jest.runAllTimersAsync();

      expect(offlineQueueService.processQueue).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should not sync on reconnection if disabled', async () => {
      // Start offline
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      });

      await networkMonitor.initialize({
        syncOnReconnect: false,
      });

      // Simulate reconnection
      const netInfoCallback = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];
      netInfoCallback({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(offlineQueueService.processQueue).not.toHaveBeenCalled();
    });
  });

  describe('checkNetworkStatus', () => {
    it('should return current network status', async () => {
      await networkMonitor.initialize();

      const status = await networkMonitor.checkNetworkStatus();

      expect(status).toEqual({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
        effectiveType: '4g',
      });
    });

    it('should update internal state on check', async () => {
      await networkMonitor.initialize();

      expect(networkMonitor.isCurrentlyOnline()).toBe(true);

      // Change mock to return offline
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      });

      await networkMonitor.checkNetworkStatus();

      expect(networkMonitor.isCurrentlyOnline()).toBe(false);
    });
  });

  describe('forceSync', () => {
    it('should trigger sync when online', async () => {
      await networkMonitor.initialize();

      await networkMonitor.forceSync();

      expect(offlineQueueService.processQueue).toHaveBeenCalled();
    });

    it('should throw error when offline', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      });

      await networkMonitor.initialize();

      await expect(networkMonitor.forceSync()).rejects.toThrow(
        'Cannot sync while offline'
      );
    });
  });

  describe('listeners', () => {
    it('should notify all listeners', async () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      await networkMonitor.initialize();
      networkMonitor.subscribe(listener1);
      networkMonitor.subscribe(listener2);

      // Simulate network change
      const netInfoCallback = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];
      netInfoCallback({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      });

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should unsubscribe correctly', async () => {
      const listener = jest.fn();

      await networkMonitor.initialize();
      const unsubscribe = networkMonitor.subscribe(listener);

      unsubscribe();

      // Simulate network change
      const netInfoCallback = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];
      netInfoCallback({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      });

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors', async () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await networkMonitor.initialize();
      networkMonitor.subscribe(errorListener);

      // Simulate network change
      const netInfoCallback = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];
      netInfoCallback({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      });

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('configuration', () => {
    it('should update configuration', async () => {
      await networkMonitor.initialize({
        autoSync: true,
      });

      networkMonitor.updateConfig({
        autoSync: false,
        checkInterval: 10000,
      });

      const config = networkMonitor.getConfig();
      expect(config.autoSync).toBe(false);
      expect(config.checkInterval).toBe(10000);
    });

    it('should handle check interval updates', async () => {
      jest.useFakeTimers();

      await networkMonitor.initialize({
        checkInterval: 5000,
      });

      const checkSpy = jest.spyOn(networkMonitor, 'checkNetworkStatus');

      jest.advanceTimersByTime(5000);

      expect(checkSpy).toHaveBeenCalled();

      // Update interval
      networkMonitor.updateConfig({
        checkInterval: 0,
      });

      checkSpy.mockClear();

      jest.advanceTimersByTime(5000);

      expect(checkSpy).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('shutdown', () => {
    it('should cleanup on shutdown', async () => {
      await networkMonitor.initialize();

      networkMonitor.shutdown();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should clear intervals on shutdown', async () => {
      jest.useFakeTimers();

      await networkMonitor.initialize({
        checkInterval: 5000,
      });

      const checkSpy = jest.spyOn(networkMonitor, 'checkNetworkStatus');

      networkMonitor.shutdown();

      jest.advanceTimersByTime(5000);

      expect(checkSpy).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should remove all listeners on shutdown', async () => {
      const listener = jest.fn();

      await networkMonitor.initialize();
      networkMonitor.subscribe(listener);

      networkMonitor.shutdown();

      // Try to trigger (won't work but shouldn't crash)
      const netInfoCallback = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];
      netInfoCallback({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      });

      // Listener shouldn't be called after shutdown
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
