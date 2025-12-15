/**
 * Offline Queue Service Tests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import deliveryApi from '../deliveryApi';
import {
  offlineQueueService,
  QueuedActionType,
  StatusUpdatePayload,
  ProofSubmitPayload,
} from '../offlineQueueService';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../deliveryApi');

describe('OfflineQueueService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    // Reset service state
    await offlineQueueService.initialize();
    await offlineQueueService.clearQueue();
  });

  describe('initialize', () => {
    it('should load queue from storage on initialize', async () => {
      const storedQueue = JSON.stringify([
        {
          id: 'test-1',
          idempotencyKey: 'idem-test-1',
          type: 'status_update',
          payload: { deliveryId: 'del-1', status: 'delivered' },
          timestamp: Date.now(),
          retryCount: 0,
        },
      ]);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(storedQueue);

      await offlineQueueService.initialize();

      const queue = offlineQueueService.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe('test-1');
      expect(queue[0].idempotencyKey).toBe('idem-test-1');
    });

    it('should handle empty storage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await offlineQueueService.initialize();

      const queue = offlineQueueService.getQueue();
      expect(queue).toHaveLength(0);
    });

    it('should handle corrupted storage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid-json');

      await offlineQueueService.initialize();

      const queue = offlineQueueService.getQueue();
      expect(queue).toHaveLength(0);
    });

    it('should reset isProcessing flag on initialize', async () => {
      // Simulate a stuck processing state from a previous session
      const storedQueue = JSON.stringify([
        {
          id: 'test-1',
          idempotencyKey: 'idem-test-1',
          type: 'status_update',
          payload: { deliveryId: 'del-1', status: 'delivered' },
          timestamp: Date.now(),
          retryCount: 0,
        },
      ]);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(storedQueue);

      await offlineQueueService.initialize();

      // Should be able to process immediately (not stuck)
      expect(offlineQueueService.isProcessingQueue()).toBe(false);
    });
  });

  describe('queueAction', () => {
    it('should add action to queue', async () => {
      const payload: StatusUpdatePayload = {
        deliveryId: 'del-1',
        status: 'delivered',
      };

      const actionId = await offlineQueueService.queueAction({
        type: 'status_update',
        payload,
      });

      expect(actionId).toBeDefined();
      const queue = offlineQueueService.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].type).toBe('status_update');
      expect(queue[0].retryCount).toBe(0);
      expect(queue[0].idempotencyKey).toBeDefined();
      expect(queue[0].idempotencyKey).toMatch(/^idem-/);
    });

    it('should persist queue to storage', async () => {
      const payload: StatusUpdatePayload = {
        deliveryId: 'del-1',
        status: 'delivered',
      };

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload,
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@offline_action_queue',
        expect.any(String)
      );
    });

    it('should reject when queue is full', async () => {
      // Mock full queue
      const fullQueue = Array(1000)
        .fill(null)
        .map((_, i) => ({
          id: `test-${i}`,
          idempotencyKey: `idem-test-${i}`,
          type: 'status_update' as QueuedActionType,
          payload: {},
          timestamp: Date.now(),
          retryCount: 0,
        }));

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(fullQueue));
      await offlineQueueService.initialize();

      await expect(
        offlineQueueService.queueAction({
          type: 'status_update',
          payload: {},
        })
      ).rejects.toThrow('Queue is full');
    });

    it('should notify listeners when action is queued', async () => {
      const listener = jest.fn();
      offlineQueueService.subscribe(listener);

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload: {},
      });

      expect(listener).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('processQueue', () => {
    it('should process all actions successfully', async () => {
      (deliveryApi.updateDeliveryStatus as jest.Mock).mockResolvedValue({ success: true });

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload: { deliveryId: 'del-1', status: 'delivered' },
      });

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload: { deliveryId: 'del-2', status: 'in_transit' },
      });

      const result = await offlineQueueService.processQueue();

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.remaining).toBe(0);
      expect(offlineQueueService.getQueueSize()).toBe(0);
    });

    it('should retry failed actions', async () => {
      jest.useFakeTimers();

      (deliveryApi.updateDeliveryStatus as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ success: true });

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload: { deliveryId: 'del-1', status: 'delivered' },
      });

      // First attempt - should fail and increment retry count
      const result1 = await offlineQueueService.processQueue();
      expect(result1.success).toBe(0);
      expect(result1.remaining).toBe(1);

      const queue = offlineQueueService.getQueue();
      expect(queue[0].retryCount).toBe(1);

      // Wait for retry delay
      jest.advanceTimersByTime(6000);

      // Second attempt - should succeed
      const result2 = await offlineQueueService.processQueue();
      expect(result2.success).toBe(1);
      expect(result2.remaining).toBe(0);

      jest.useRealTimers();
    });

    it('should remove action after max retries', async () => {
      jest.useFakeTimers();

      (deliveryApi.updateDeliveryStatus as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload: { deliveryId: 'del-1', status: 'delivered' },
      });

      // Attempt 1
      await offlineQueueService.processQueue();
      expect(offlineQueueService.getQueueSize()).toBe(1);

      // Wait for retry delay
      jest.advanceTimersByTime(6000);

      // Attempt 2
      await offlineQueueService.processQueue();
      expect(offlineQueueService.getQueueSize()).toBe(1);

      // Wait for retry delay
      jest.advanceTimersByTime(6000);

      // Attempt 3 (max retries)
      const result = await offlineQueueService.processQueue();
      expect(result.failed).toBe(1);
      expect(offlineQueueService.getQueueSize()).toBe(0);

      jest.useRealTimers();
    });

    it('should handle different action types', async () => {
      (deliveryApi.updateDeliveryStatus as jest.Mock).mockResolvedValue({ success: true });
      (deliveryApi.updateLocation as jest.Mock).mockResolvedValue({ success: true });
      (deliveryApi.acceptDelivery as jest.Mock).mockResolvedValue({ success: true });

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload: { deliveryId: 'del-1', status: 'delivered' },
      });

      await offlineQueueService.queueAction({
        type: 'location_update',
        payload: { latitude: 46.5, longitude: 6.5, timestamp: new Date().toISOString() },
      });

      await offlineQueueService.queueAction({
        type: 'accept_delivery',
        payload: { deliveryId: 'del-2' },
      });

      const result = await offlineQueueService.processQueue();

      expect(result.success).toBe(3);
      expect(deliveryApi.updateDeliveryStatus).toHaveBeenCalledTimes(1);
      expect(deliveryApi.updateLocation).toHaveBeenCalledTimes(1);
      expect(deliveryApi.acceptDelivery).toHaveBeenCalledTimes(1);
    });

    it('should not process if already processing', async () => {
      (deliveryApi.updateDeliveryStatus as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload: { deliveryId: 'del-1', status: 'delivered' },
      });

      // Start processing
      const promise1 = offlineQueueService.processQueue();

      // Try to process again immediately
      const result2 = await offlineQueueService.processQueue();

      expect(result2.success).toBe(0);
      expect(result2.remaining).toBeGreaterThan(0);

      await promise1;
    });

    it('should rollback queue if persist fails after successful action', async () => {
      (deliveryApi.updateDeliveryStatus as jest.Mock).mockResolvedValue({ success: true });

      // Mock persist to fail on first call (during processQueue atomic operation)
      let persistCallCount = 0;
      (AsyncStorage.setItem as jest.Mock).mockImplementation(() => {
        persistCallCount++;
        // First call during queueAction succeeds
        if (persistCallCount === 1) {
          return Promise.resolve();
        }
        // Second call during processQueue (atomic persist) fails
        if (persistCallCount === 2) {
          return Promise.reject(new Error('Storage full'));
        }
        // Subsequent calls succeed
        return Promise.resolve();
      });

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload: { deliveryId: 'del-1', status: 'delivered' },
      });

      expect(offlineQueueService.getQueueSize()).toBe(1);

      const result = await offlineQueueService.processQueue();

      // Action executed successfully but persist failed, so it should NOT be counted as success
      expect(result.success).toBe(0);
      // Action should still be in queue (rolled back)
      expect(offlineQueueService.getQueueSize()).toBe(1);
    });

    it('should use exponential backoff for retries', async () => {
      jest.useFakeTimers();

      (deliveryApi.updateDeliveryStatus as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ success: true });

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload: { deliveryId: 'del-1', status: 'delivered' },
      });

      // First attempt - should fail
      const result1 = await offlineQueueService.processQueue();
      expect(result1.success).toBe(0);
      const queue1 = offlineQueueService.getQueue();
      expect(queue1[0].retryCount).toBe(1);

      // Try immediately - should skip (backoff delay not elapsed)
      // Backoff for retry 1: 1000 * 2^1 = 2000ms (+ jitter)
      jest.advanceTimersByTime(1000);
      const result2 = await offlineQueueService.processQueue();
      expect(result2.success).toBe(0);
      expect(result2.remaining).toBe(1);

      // Wait for backoff period (2000ms + margin)
      jest.advanceTimersByTime(2000);

      // Second attempt - should fail again with higher retry count
      const result3 = await offlineQueueService.processQueue();
      expect(result3.success).toBe(0);
      const queue2 = offlineQueueService.getQueue();
      expect(queue2[0].retryCount).toBe(2);

      // Backoff for retry 2: 1000 * 2^2 = 4000ms (+ jitter)
      jest.advanceTimersByTime(5000);

      // Third attempt - should succeed
      const result4 = await offlineQueueService.processQueue();
      expect(result4.success).toBe(1);
      expect(result4.remaining).toBe(0);

      jest.useRealTimers();
    });
  });

  describe('queue management', () => {
    it('should get queue size', async () => {
      expect(offlineQueueService.getQueueSize()).toBe(0);

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload: {},
      });

      expect(offlineQueueService.getQueueSize()).toBe(1);
    });

    it('should clear queue', async () => {
      await offlineQueueService.queueAction({
        type: 'status_update',
        payload: {},
      });

      await offlineQueueService.queueAction({
        type: 'location_update',
        payload: {},
      });

      expect(offlineQueueService.getQueueSize()).toBe(2);

      await offlineQueueService.clearQueue();

      expect(offlineQueueService.getQueueSize()).toBe(0);
    });

    it('should remove specific action', async () => {
      const id1 = await offlineQueueService.queueAction({
        type: 'status_update',
        payload: {},
      });

      const id2 = await offlineQueueService.queueAction({
        type: 'location_update',
        payload: {},
      });

      expect(offlineQueueService.getQueueSize()).toBe(2);

      const removed = await offlineQueueService.removeAction(id1);

      expect(removed).toBe(true);
      expect(offlineQueueService.getQueueSize()).toBe(1);

      const queue = offlineQueueService.getQueue();
      expect(queue[0].id).toBe(id2);
    });

    it('should return false when removing non-existent action', async () => {
      const removed = await offlineQueueService.removeAction('non-existent');
      expect(removed).toBe(false);
    });

    it('should get actions by type', async () => {
      await offlineQueueService.queueAction({
        type: 'status_update',
        payload: {},
      });

      await offlineQueueService.queueAction({
        type: 'location_update',
        payload: {},
      });

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload: {},
      });

      const statusActions = offlineQueueService.getActionsByType('status_update');
      expect(statusActions).toHaveLength(2);

      const locationActions = offlineQueueService.getActionsByType('location_update');
      expect(locationActions).toHaveLength(1);
    });
  });

  describe('listeners', () => {
    it('should notify listeners on queue changes', async () => {
      const listener = jest.fn();
      const unsubscribe = offlineQueueService.subscribe(listener);

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload: {},
      });

      expect(listener).toHaveBeenCalled();

      unsubscribe();

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload: {},
      });

      // Should not be called after unsubscribe
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should handle listener errors', async () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      offlineQueueService.subscribe(errorListener);

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload: {},
      });

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
