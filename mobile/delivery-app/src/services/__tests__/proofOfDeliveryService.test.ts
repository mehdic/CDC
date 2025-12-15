/**
 * Proof of Delivery Service Tests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { ProofOfDelivery, Coordinates } from '../../types/delivery';
import deliveryApi from '../deliveryApi';
import proofOfDeliveryService, { QueuedProof } from '../proofOfDeliveryService';

jest.mock('../deliveryApi');
jest.mock('@react-native-async-storage/async-storage');

describe('ProofOfDeliveryService', () => {
  const mockDeliveryId = 'delivery-123';
  const mockLocation: Coordinates = {
    latitude: 46.2044,
    longitude: 6.1432,
    accuracy: 10,
    timestamp: '2024-01-15T10:00:00Z',
  };

  const mockProof: ProofOfDelivery = {
    deliveryId: mockDeliveryId,
    photoImage: 'file:///photo.jpg',
    signatureImage: 'data:image/png;base64,abc',
    recipientName: 'John Doe',
    timestamp: '2024-01-15T10:00:00Z',
    location: mockLocation,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    // Clear the queue by calling clearAll - then reset mocks after
    await proofOfDeliveryService.clearAll();
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('submitProof', () => {
    it('should submit proof immediately when online', async () => {
      (deliveryApi.submitProofOfDelivery as jest.Mock).mockResolvedValue({ success: true });

      const result = await proofOfDeliveryService.submitProof(mockDeliveryId, mockProof, true);

      expect(result).toEqual({ success: true, queued: false });
      expect(deliveryApi.submitProofOfDelivery).toHaveBeenCalledWith(mockDeliveryId, mockProof);
    });

    it('should queue proof when offline', async () => {
      const result = await proofOfDeliveryService.submitProof(mockDeliveryId, mockProof, false);

      expect(result).toEqual({ success: true, queued: true });
      expect(deliveryApi.submitProofOfDelivery).not.toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should queue proof on network error when online', async () => {
      const networkError = new Error('Network request failed');
      (networkError as any).code = 'ENOTFOUND';
      (deliveryApi.submitProofOfDelivery as jest.Mock).mockRejectedValue(networkError);

      const result = await proofOfDeliveryService.submitProof(mockDeliveryId, mockProof, true);

      expect(result).toEqual({ success: true, queued: true });
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should return error on validation failure', async () => {
      const validationError = new Error('Invalid proof data');
      (deliveryApi.submitProofOfDelivery as jest.Mock).mockRejectedValue(validationError);

      const result = await proofOfDeliveryService.submitProof(mockDeliveryId, mockProof, true);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid proof data');
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('processQueue', () => {
    it('should not process when offline', async () => {
      const result = await proofOfDeliveryService.processQueue(false);

      expect(result).toEqual({ processed: 0, succeeded: 0, failed: 0 });
      expect(deliveryApi.submitProofOfDelivery).not.toHaveBeenCalled();
    });

    it('should process queued items when online', async () => {
      // Setup queue with one item
      const queuedProof: QueuedProof = {
        id: 'queue-1',
        deliveryId: mockDeliveryId,
        proof: mockProof,
        timestamp: '2024-01-15T10:00:00Z',
        retryCount: 0,
        status: 'pending',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([queuedProof]));
      (deliveryApi.submitProofOfDelivery as jest.Mock).mockResolvedValue({ success: true });

      // Load queue first
      await (proofOfDeliveryService as any).loadQueue();

      const result = await proofOfDeliveryService.processQueue(true);

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(0);
      expect(deliveryApi.submitProofOfDelivery).toHaveBeenCalledWith(mockDeliveryId, mockProof);
    });

    it('should retry failed items up to max count', async () => {
      const queuedProof: QueuedProof = {
        id: 'queue-1',
        deliveryId: mockDeliveryId,
        proof: mockProof,
        timestamp: '2024-01-15T10:00:00Z',
        retryCount: 2,
        status: 'pending',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([queuedProof]));
      (deliveryApi.submitProofOfDelivery as jest.Mock).mockRejectedValue(new Error('Server error'));

      await (proofOfDeliveryService as any).loadQueue();

      const result = await proofOfDeliveryService.processQueue(true);

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(0);
      expect(result.failed).toBe(1); // Max retries reached
    });

    it('should not process items already processing', async () => {
      const queuedProof: QueuedProof = {
        id: 'queue-1',
        deliveryId: mockDeliveryId,
        proof: mockProof,
        timestamp: '2024-01-15T10:00:00Z',
        retryCount: 0,
        status: 'processing',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([queuedProof]));

      await (proofOfDeliveryService as any).loadQueue();

      const result = await proofOfDeliveryService.processQueue(true);

      expect(result.processed).toBe(0);
      expect(deliveryApi.submitProofOfDelivery).not.toHaveBeenCalled();
    });
  });

  describe('getQueueStatus', () => {
    it('should return empty status when queue is empty', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const status = await proofOfDeliveryService.getQueueStatus();

      expect(status).toEqual({
        total: 0,
        pending: 0,
        processing: 0,
        failed: 0,
        items: [],
      });
    });

    it('should return correct status counts', async () => {
      const queue: QueuedProof[] = [
        {
          id: 'queue-1',
          deliveryId: 'del-1',
          proof: mockProof,
          timestamp: '2024-01-15T10:00:00Z',
          retryCount: 0,
          status: 'pending',
        },
        {
          id: 'queue-2',
          deliveryId: 'del-2',
          proof: mockProof,
          timestamp: '2024-01-15T10:01:00Z',
          retryCount: 1,
          status: 'processing',
        },
        {
          id: 'queue-3',
          deliveryId: 'del-3',
          proof: mockProof,
          timestamp: '2024-01-15T10:02:00Z',
          retryCount: 3,
          status: 'failed',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(queue));

      const status = await proofOfDeliveryService.getQueueStatus();

      expect(status.total).toBe(3);
      expect(status.pending).toBe(1);
      expect(status.processing).toBe(1);
      expect(status.failed).toBe(1);
      expect(status.items).toHaveLength(3);
    });
  });

  describe('clearFailed', () => {
    it('should remove all failed items', async () => {
      const queue: QueuedProof[] = [
        {
          id: 'queue-1',
          deliveryId: 'del-1',
          proof: mockProof,
          timestamp: '2024-01-15T10:00:00Z',
          retryCount: 0,
          status: 'pending',
        },
        {
          id: 'queue-2',
          deliveryId: 'del-2',
          proof: mockProof,
          timestamp: '2024-01-15T10:01:00Z',
          retryCount: 3,
          status: 'failed',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(queue));
      await (proofOfDeliveryService as any).loadQueue();

      await proofOfDeliveryService.clearFailed();

      // Get the last call to setItem (most recent save)
      const setItemCalls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      const lastCall = setItemCalls[setItemCalls.length - 1];
      const savedQueue = JSON.parse(lastCall[1]) as QueuedProof[];
      expect(savedQueue).toHaveLength(1);
      expect(savedQueue[0].status).toBe('pending');
    });
  });

  describe('retryFailed', () => {
    it('should reset failed item to pending', async () => {
      const queue: QueuedProof[] = [
        {
          id: 'queue-1',
          deliveryId: 'del-1',
          proof: mockProof,
          timestamp: '2024-01-15T10:00:00Z',
          retryCount: 3,
          status: 'failed',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(queue));
      await (proofOfDeliveryService as any).loadQueue();

      await proofOfDeliveryService.retryFailed('queue-1');

      // Get the last call to setItem (most recent save)
      const setItemCalls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      const lastCall = setItemCalls[setItemCalls.length - 1];
      const savedQueue = JSON.parse(lastCall[1]) as QueuedProof[];
      expect(savedQueue[0].status).toBe('pending');
      expect(savedQueue[0].retryCount).toBe(0);
    });

    it('should not modify non-failed items', async () => {
      const queue: QueuedProof[] = [
        {
          id: 'queue-1',
          deliveryId: 'del-1',
          proof: mockProof,
          timestamp: '2024-01-15T10:00:00Z',
          retryCount: 0,
          status: 'pending',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(queue));
      await (proofOfDeliveryService as any).loadQueue();

      const initialSetItemCalls = (AsyncStorage.setItem as jest.Mock).mock.calls.length;

      await proofOfDeliveryService.retryFailed('queue-1');

      // retryFailed should not call setItem for non-failed items
      expect((AsyncStorage.setItem as jest.Mock).mock.calls.length).toBe(initialSetItemCalls);
    });
  });

  describe('clearAll', () => {
    it('should remove all items from queue', async () => {
      await proofOfDeliveryService.clearAll();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@proof_of_delivery_queue',
        JSON.stringify([])
      );
    });
  });

  describe('createProof', () => {
    it('should create proof with all data', () => {
      const proof = proofOfDeliveryService.createProof(mockDeliveryId, mockLocation, {
        signatureImage: 'data:image/png;base64,abc',
        photoImage: 'file:///photo.jpg',
        idVerificationImage: 'file:///id.jpg',
        recipientName: 'John Doe',
        notes: 'Left at door',
      });

      expect(proof.deliveryId).toBe(mockDeliveryId);
      expect(proof.location).toEqual(mockLocation);
      expect(proof.signatureImage).toBe('data:image/png;base64,abc');
      expect(proof.photoImage).toBe('file:///photo.jpg');
      expect(proof.idVerificationImage).toBe('file:///id.jpg');
      expect(proof.recipientName).toBe('John Doe');
      expect(proof.notes).toBe('Left at door');
      expect(proof.timestamp).toBeDefined();
    });

    it('should create proof with minimal data', () => {
      const proof = proofOfDeliveryService.createProof(mockDeliveryId, mockLocation, {
        photoImage: 'file:///photo.jpg',
      });

      expect(proof.deliveryId).toBe(mockDeliveryId);
      expect(proof.location).toEqual(mockLocation);
      expect(proof.photoImage).toBe('file:///photo.jpg');
      expect(proof.signatureImage).toBeUndefined();
      expect(proof.idVerificationImage).toBeUndefined();
      expect(proof.recipientName).toBeUndefined();
      expect(proof.notes).toBeUndefined();
    });
  });

  describe('Network Error Detection', () => {
    it('should detect network timeout error', async () => {
      const timeoutError = new Error('timeout');
      (deliveryApi.submitProofOfDelivery as jest.Mock).mockRejectedValue(timeoutError);

      const result = await proofOfDeliveryService.submitProof(mockDeliveryId, mockProof, true);

      expect(result.queued).toBe(true);
    });

    it('should detect connection refused error', async () => {
      const connError = new Error('connection refused');
      (deliveryApi.submitProofOfDelivery as jest.Mock).mockRejectedValue(connError);

      const result = await proofOfDeliveryService.submitProof(mockDeliveryId, mockProof, true);

      expect(result.queued).toBe(true);
    });

    it('should not queue non-network errors', async () => {
      const validationError = new Error('Invalid data');
      (deliveryApi.submitProofOfDelivery as jest.Mock).mockRejectedValue(validationError);

      const result = await proofOfDeliveryService.submitProof(mockDeliveryId, mockProof, true);

      expect(result.success).toBe(false);
      expect(result.queued).toBe(false);
    });
  });
});
