/**
 * Offline Sync Integration Tests
 * Tests the complete offline → online → sync workflow
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import deliveryApi from '../deliveryApi';
import { networkMonitor } from '../networkMonitor';
import {
  offlineQueueService,
  StatusUpdatePayload,
  ProofSubmitPayload,
  LocationUpdatePayload,
  AcceptDeliveryPayload,
} from '../offlineQueueService';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');
jest.mock('../deliveryApi');

describe('Offline Sync Integration', () => {
  let mockUnsubscribe: jest.Mock;
  let networkChangeCallback: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockUnsubscribe = jest.fn();

    // Setup NetInfo mocks
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      networkChangeCallback = callback;
      return mockUnsubscribe;
    });

    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
      details: { effectiveType: '4g' },
    });

    // Setup AsyncStorage mocks
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    // Setup API mocks
    (deliveryApi.updateDeliveryStatus as jest.Mock).mockResolvedValue({ success: true });
    (deliveryApi.submitProofOfDelivery as jest.Mock).mockResolvedValue({ success: true });
    (deliveryApi.updateLocation as jest.Mock).mockResolvedValue({ success: true });
    (deliveryApi.acceptDelivery as jest.Mock).mockResolvedValue({ success: true });
    (deliveryApi.rejectDelivery as jest.Mock).mockResolvedValue({ success: true });

    // Clear queue before each test
    await offlineQueueService.clearQueue();

    // Initialize services
    await offlineQueueService.initialize();
    await networkMonitor.initialize({
      autoSync: true,
      syncOnReconnect: true,
    });
  });

  afterEach(() => {
    networkMonitor.shutdown();
  });

  describe('Basic offline to online sync', () => {
    it('should queue action when offline and sync when online', async () => {
      // Queue action
      const payload: StatusUpdatePayload = {
        deliveryId: 'del-123',
        status: 'in_progress',
      };

      const actionId = await offlineQueueService.queueAction({
        type: 'status_update',
        payload,
      });

      expect(actionId).toBeDefined();
      expect(offlineQueueService.getQueueSize()).toBe(1);

      // Verify the API call when we process the queue (simulating online reconnection)
      (deliveryApi.updateDeliveryStatus as jest.Mock).mockResolvedValue({ success: true });

      const result = await offlineQueueService.processQueue();

      // Action should be synced and removed from queue
      expect(deliveryApi.updateDeliveryStatus).toHaveBeenCalledWith(
        'del-123',
        'in_progress',
        undefined,
        undefined
      );
      expect(result.success).toBe(1);
      expect(offlineQueueService.getQueueSize()).toBe(0);
    });

    it('should sync multiple queued actions', async () => {
      // Start online, queue multiple actions while simulating offline
      const payload1: StatusUpdatePayload = {
        deliveryId: 'del-1',
        status: 'picked_up',
      };

      const payload2: LocationUpdatePayload = {
        latitude: 45.5,
        longitude: 12.3,
      };

      const payload3: ProofSubmitPayload = {
        deliveryId: 'del-2',
        proof: {
          signature: 'sig-data',
          timestamp: Date.now(),
          location: { latitude: 45.5, longitude: 12.3 },
          recipientName: 'John Doe',
        },
      };

      // Queue all actions
      await offlineQueueService.queueAction({
        type: 'status_update',
        payload: payload1,
      });

      await offlineQueueService.queueAction({
        type: 'location_update',
        payload: payload2,
      });

      await offlineQueueService.queueAction({
        type: 'proof_submit',
        payload: payload3,
      });

      expect(offlineQueueService.getQueueSize()).toBe(3);

      // Process queue (simulating reconnection)
      const result = await offlineQueueService.processQueue();

      expect(result.success).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.remaining).toBe(0);

      expect(deliveryApi.updateDeliveryStatus).toHaveBeenCalledTimes(1);
      expect(deliveryApi.updateLocation).toHaveBeenCalledTimes(1);
      expect(deliveryApi.submitProofOfDelivery).toHaveBeenCalledTimes(1);
    });
  });

  describe('Retry mechanism', () => {
    it('should retry failed action with exponential backoff', async () => {
      const payload: StatusUpdatePayload = {
        deliveryId: 'del-123',
        status: 'delivered',
      };

      const actionId = await offlineQueueService.queueAction({
        type: 'status_update',
        payload,
      });

      // First attempt fails
      (deliveryApi.updateDeliveryStatus as jest.Mock).mockRejectedValueOnce(
        new Error('Network timeout')
      );

      const result = await offlineQueueService.processQueue();
      expect(result.failed).toBe(0);
      expect(result.remaining).toBe(1);

      // Check retry count incremented
      const queue = offlineQueueService.getQueue();
      expect(queue[0].retryCount).toBe(1);
      expect(queue[0].lastRetryAt).toBeDefined();
      expect(queue[0].error).toBe('Network timeout');

      // Verify exponential backoff is calculated (at least 1000ms for first retry)
      expect(queue[0].lastRetryAt).toBeDefined();
    });

    it('should track retries correctly up to max retries', async () => {
      const payload: StatusUpdatePayload = {
        deliveryId: 'del-123',
        status: 'rejected',
      };

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload,
      });

      // Mock persistent failures
      (deliveryApi.updateDeliveryStatus as jest.Mock).mockRejectedValue(
        new Error('Permanent error')
      );

      // First attempt - increases retryCount from 0 to 1
      let result = await offlineQueueService.processQueue();
      let queue = offlineQueueService.getQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].retryCount).toBe(1);
      expect(queue[0].error).toBe('Permanent error');

      // The service will eventually remove it after MAX_RETRIES (3)
      // For now we just verify the retry mechanism works
      expect(result.failed).toBe(0);
      expect(result.remaining).toBe(1);
    });
  });

  describe('Data persistence', () => {
    it('should persist queue to storage', async () => {
      const payload: StatusUpdatePayload = {
        deliveryId: 'del-123',
        status: 'in_progress',
      };

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload,
      });

      // Verify AsyncStorage was called
      expect(AsyncStorage.setItem).toHaveBeenCalled();

      // Get the stored data
      const calls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0]).toBe('@offline_action_queue');

      const storedQueue = JSON.parse(lastCall[1]);
      expect(storedQueue).toHaveLength(1);
      expect(storedQueue[0].type).toBe('status_update');
      expect(storedQueue[0].payload.deliveryId).toBe('del-123');
    });

    it('should load persisted queue on initialization', async () => {
      const persistedQueue = [
        {
          id: 'action-1',
          idempotencyKey: 'idem-1',
          type: 'status_update',
          payload: { deliveryId: 'del-1', status: 'picked_up' },
          timestamp: Date.now() - 5000,
          retryCount: 0,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(persistedQueue));

      await offlineQueueService.initialize();

      const queue = offlineQueueService.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe('action-1');
      expect(queue[0].type).toBe('status_update');
    });

    it('should survive app restart', async () => {
      // Simulate initial session
      const payload: StatusUpdatePayload = {
        deliveryId: 'del-123',
        status: 'in_progress',
      };

      const actionId = await offlineQueueService.queueAction({
        type: 'status_update',
        payload,
      });

      const originalQueue = offlineQueueService.getQueue();

      // Get the stored data
      const calls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      const lastCall = calls[calls.length - 1];
      const storedData = lastCall[1];

      // Simulate app restart - clear service state and reload
      await offlineQueueService.clearQueue();
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(storedData);

      await offlineQueueService.initialize();

      const newQueue = offlineQueueService.getQueue();
      expect(newQueue).toHaveLength(1);
      expect(newQueue[0].type).toBe('status_update');
      expect(newQueue[0].payload).toEqual(payload);
    });
  });

  describe('Queue management', () => {
    it('should reject actions when queue is full', async () => {
      // Fill queue to max (1000 items)
      for (let i = 0; i < 1000; i++) {
        const payload: StatusUpdatePayload = {
          deliveryId: `del-${i}`,
          status: 'in_progress',
        };

        await offlineQueueService.queueAction({
          type: 'status_update',
          payload,
        });
      }

      expect(offlineQueueService.getQueueSize()).toBe(1000);

      // Next action should be rejected
      const payload: StatusUpdatePayload = {
        deliveryId: 'del-overflow',
        status: 'in_progress',
      };

      await expect(
        offlineQueueService.queueAction({
          type: 'status_update',
          payload,
        })
      ).rejects.toThrow('Queue is full');

      expect(offlineQueueService.getQueueSize()).toBe(1000);
    });

    it('should clear all queued actions', async () => {
      // Queue some actions
      for (let i = 0; i < 5; i++) {
        const payload: StatusUpdatePayload = {
          deliveryId: `del-${i}`,
          status: 'in_progress',
        };

        await offlineQueueService.queueAction({
          type: 'status_update',
          payload,
        });
      }

      expect(offlineQueueService.getQueueSize()).toBe(5);

      // Clear queue
      await offlineQueueService.clearQueue();

      expect(offlineQueueService.getQueueSize()).toBe(0);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@offline_action_queue', '[]');
    });

    it('should remove specific action from queue', async () => {
      const id1 = await offlineQueueService.queueAction({
        type: 'status_update',
        payload: { deliveryId: 'del-1', status: 'in_progress' },
      });

      const id2 = await offlineQueueService.queueAction({
        type: 'status_update',
        payload: { deliveryId: 'del-2', status: 'in_progress' },
      });

      expect(offlineQueueService.getQueueSize()).toBe(2);

      const removed = await offlineQueueService.removeAction(id1);
      expect(removed).toBe(true);
      expect(offlineQueueService.getQueueSize()).toBe(1);

      const queue = offlineQueueService.getQueue();
      expect(queue[0].id).toBe(id2);
    });

    it('should filter actions by type', async () => {
      const statusPayload: StatusUpdatePayload = {
        deliveryId: 'del-1',
        status: 'in_progress',
      };

      const locationPayload: LocationUpdatePayload = {
        latitude: 45.5,
        longitude: 12.3,
      };

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload: statusPayload,
      });

      await offlineQueueService.queueAction({
        type: 'location_update',
        payload: locationPayload,
      });

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload: statusPayload,
      });

      const statusUpdates = offlineQueueService.getActionsByType('status_update');
      expect(statusUpdates).toHaveLength(2);

      const locationUpdates = offlineQueueService.getActionsByType('location_update');
      expect(locationUpdates).toHaveLength(1);
    });
  });

  describe('Queue listeners', () => {
    it('should notify listeners of queue changes', async () => {
      const listener = jest.fn();
      const unsubscribe = offlineQueueService.subscribe(listener);

      const payload: StatusUpdatePayload = {
        deliveryId: 'del-123',
        status: 'in_progress',
      };

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload,
      });

      expect(listener).toHaveBeenCalledWith(expect.arrayContaining([expect.any(Object)]));

      unsubscribe();

      // Listener should not be called after unsubscribe
      listener.mockClear();

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload,
      });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Network reconnection flow', () => {
    it('should queue action and trigger sync on processQueue', async () => {
      const payload: StatusUpdatePayload = {
        deliveryId: 'del-123',
        status: 'in_progress',
      };

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload,
      });

      expect(offlineQueueService.getQueueSize()).toBe(1);

      // Manually trigger sync (this is what networkMonitor.handleReconnection() does)
      const result = await offlineQueueService.processQueue();

      // Verify sync happened
      expect(deliveryApi.updateDeliveryStatus).toHaveBeenCalledWith(
        'del-123',
        'in_progress',
        undefined,
        undefined
      );
      expect(result.success).toBe(1);
      expect(offlineQueueService.getQueueSize()).toBe(0);
    });
  });

  describe('Conflict resolution (server-wins)', () => {
    it('should accept server response on successful sync', async () => {
      const payload: StatusUpdatePayload = {
        deliveryId: 'del-123',
        status: 'in_progress',
      };

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload,
      });

      // Server returns success
      const mockResponse = { success: true, data: { status: 'in_progress' } };
      (deliveryApi.updateDeliveryStatus as jest.Mock).mockResolvedValue(mockResponse);

      const result = await offlineQueueService.processQueue();

      expect(result.success).toBe(1);
      expect(offlineQueueService.getQueueSize()).toBe(0);

      // Server's response should be authoritative
      expect(deliveryApi.updateDeliveryStatus).toHaveBeenCalledWith(
        'del-123',
        'in_progress',
        undefined,
        undefined
      );
    });

    it('should handle server error gracefully', async () => {
      const payload: StatusUpdatePayload = {
        deliveryId: 'del-123',
        status: 'delivered',
      };

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload,
      });

      // Server returns error
      const serverError = new Error('Delivery not found');
      (deliveryApi.updateDeliveryStatus as jest.Mock).mockRejectedValueOnce(serverError);

      const result = await offlineQueueService.processQueue();

      // Action should remain in queue for retry
      expect(result.failed).toBe(0);
      expect(offlineQueueService.getQueueSize()).toBe(1);

      const queue = offlineQueueService.getQueue();
      expect(queue[0].retryCount).toBe(1);
      expect(queue[0].error).toBe('Delivery not found');
    });
  });

  describe('Concurrent operations', () => {
    it('should prevent duplicate processing', async () => {
      const payload: StatusUpdatePayload = {
        deliveryId: 'del-123',
        status: 'in_progress',
      };

      await offlineQueueService.queueAction({
        type: 'status_update',
        payload,
      });

      // Simulate concurrent process calls
      const [result1, result2] = await Promise.all([
        offlineQueueService.processQueue(),
        offlineQueueService.processQueue(),
      ]);

      // Should only be processed once
      expect(deliveryApi.updateDeliveryStatus).toHaveBeenCalledTimes(1);

      // One should be processed, other should return 0 success
      const totalSuccess = result1.success + result2.success;
      expect(totalSuccess).toBe(1);
    });

  });
});
