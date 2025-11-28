/**
 * useProofOfDelivery Hook Tests
 * Tests proof upload, retrieval, and error handling
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useProofOfDelivery } from '../useProofOfDelivery';
import { DeliveryCompletionPayload, SignatureData, PhotoData } from '../../types/proofOfDelivery';

// Mock fetch
global.fetch = jest.fn();

describe('useProofOfDelivery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with null proof', () => {
    const { result } = renderHook(() => useProofOfDelivery());

    expect(result.current.proof).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should upload proof of delivery with signature', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        proofId: 'proof_001',
        deliveryId: 'delivery_001',
        message: 'Proof uploaded',
      }),
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'proof_001',
        deliveryId: 'delivery_001',
        recipientName: 'John Doe',
        signature: {
          base64: 'abc123',
          timestamp: '2025-01-01T00:00:00Z',
          capturedAt: '2025-01-01T00:00:00Z',
          mimeType: 'image/png',
        },
        timestamp: '2025-01-01T00:00:00Z',
        location: {
          latitude: 46.2044,
          longitude: 6.1432,
          accuracy: 10,
        },
        status: 'submitted',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }),
    });

    const { result } = renderHook(() => useProofOfDelivery());

    const payload: DeliveryCompletionPayload = {
      deliveryId: 'delivery_001',
      recipientName: 'John Doe',
      signature: {
        base64: 'abc123',
        timestamp: '2025-01-01T00:00:00Z',
        capturedAt: '2025-01-01T00:00:00Z',
        mimeType: 'image/png',
      },
      location: {
        latitude: 46.2044,
        longitude: 6.1432,
        accuracy: 10,
      },
    };

    await act(async () => {
      await result.current.uploadProof(payload);
    });

    expect(result.current.proof).not.toBeNull();
    expect(result.current.proof?.recipientName).toBe('John Doe');
  });

  it('should upload proof with photo', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        proofId: 'proof_002',
        deliveryId: 'delivery_002',
        message: 'Proof uploaded',
      }),
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'proof_002',
        deliveryId: 'delivery_002',
        recipientName: 'Jane Smith',
        photo: {
          base64: 'def456',
          timestamp: '2025-01-01T00:00:00Z',
          capturedAt: '2025-01-01T00:00:00Z',
          mimeType: 'image/jpeg',
          location: {
            latitude: 46.2050,
            longitude: 6.1440,
            accuracy: 8,
          },
        },
        timestamp: '2025-01-01T00:00:00Z',
        location: {
          latitude: 46.2050,
          longitude: 6.1440,
          accuracy: 8,
        },
        status: 'submitted',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }),
    });

    const { result } = renderHook(() => useProofOfDelivery());

    const payload: DeliveryCompletionPayload = {
      deliveryId: 'delivery_002',
      recipientName: 'Jane Smith',
      photo: {
        base64: 'def456',
        timestamp: '2025-01-01T00:00:00Z',
        capturedAt: '2025-01-01T00:00:00Z',
        mimeType: 'image/jpeg',
        location: {
          latitude: 46.2050,
          longitude: 6.1440,
          accuracy: 8,
        },
      },
      location: {
        latitude: 46.2050,
        longitude: 6.1440,
        accuracy: 8,
      },
    };

    await act(async () => {
      await result.current.uploadProof(payload);
    });

    expect(result.current.proof).not.toBeNull();
    expect(result.current.proof?.photo).toBeDefined();
  });

  it('should handle upload errors', async () => {
    const mockError = new Error('Upload failed');
    (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useProofOfDelivery());

    const payload: DeliveryCompletionPayload = {
      deliveryId: 'delivery_001',
      recipientName: 'John Doe',
      location: {
        latitude: 46.2044,
        longitude: 6.1432,
        accuracy: 10,
      },
    };

    let uploadedProof = null;
    await act(async () => {
      uploadedProof = await result.current.uploadProof(payload);
    });

    expect(uploadedProof).toBeNull();
    expect(result.current.error).toBeTruthy();
  });

  it('should fetch proof by ID', async () => {
    const mockProof = {
      id: 'proof_001',
      deliveryId: 'delivery_001',
      recipientName: 'John Doe',
      signature: {
        base64: 'abc123',
        timestamp: '2025-01-01T00:00:00Z',
        capturedAt: '2025-01-01T00:00:00Z',
        mimeType: 'image/png',
      },
      timestamp: '2025-01-01T00:00:00Z',
      location: {
        latitude: 46.2044,
        longitude: 6.1432,
        accuracy: 10,
      },
      status: 'verified',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProof,
    });

    const { result } = renderHook(() => useProofOfDelivery());

    await act(async () => {
      await result.current.fetchProof('proof_001');
    });

    expect(result.current.proof).toEqual(mockProof);
    expect(result.current.error).toBeNull();
  });

  it('should fetch proof by delivery ID', async () => {
    const mockProof = {
      id: 'proof_002',
      deliveryId: 'delivery_002',
      recipientName: 'Jane Smith',
      photo: {
        base64: 'def456',
        timestamp: '2025-01-01T00:00:00Z',
        capturedAt: '2025-01-01T00:00:00Z',
        mimeType: 'image/jpeg',
      },
      timestamp: '2025-01-01T00:00:00Z',
      location: {
        latitude: 46.2050,
        longitude: 6.1440,
        accuracy: 8,
      },
      status: 'verified',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProof,
    });

    const { result } = renderHook(() => useProofOfDelivery());

    await act(async () => {
      await result.current.fetchProofByDeliveryId('delivery_002');
    });

    expect(result.current.proof).toEqual(mockProof);
  });

  it('should handle 404 when proof not found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' }),
    });

    const { result } = renderHook(() => useProofOfDelivery());

    const proof = await act(async () => {
      return await result.current.fetchProofByDeliveryId('delivery_999');
    });

    expect(proof).toBeNull();
  });

  it('should set loading state during upload', async () => {
    let resolveUpload: any;
    const uploadPromise = new Promise((resolve) => {
      resolveUpload = resolve;
    });

    (global.fetch as jest.Mock).mockReturnValueOnce(uploadPromise);

    const { result } = renderHook(() => useProofOfDelivery());

    const payload: DeliveryCompletionPayload = {
      deliveryId: 'delivery_001',
      recipientName: 'John Doe',
      location: {
        latitude: 46.2044,
        longitude: 6.1432,
        accuracy: 10,
      },
    };

    act(() => {
      result.current.uploadProof(payload);
    });

    expect(result.current.loading).toBe(true);
  });

  it('should handle FormData creation with all fields', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        proofId: 'proof_003',
        deliveryId: 'delivery_003',
      }),
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'proof_003',
        deliveryId: 'delivery_003',
        recipientName: 'Test User',
        timestamp: '2025-01-01T00:00:00Z',
        location: { latitude: 0, longitude: 0, accuracy: 0 },
        status: 'submitted',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }),
    });

    const { result } = renderHook(() => useProofOfDelivery());

    const payload: DeliveryCompletionPayload = {
      deliveryId: 'delivery_003',
      recipientName: 'Test User',
      signature: {
        base64: 'sig123',
        timestamp: '2025-01-01T00:00:00Z',
        capturedAt: '2025-01-01T00:00:00Z',
        mimeType: 'image/png',
      },
      photo: {
        base64: 'photo123',
        timestamp: '2025-01-01T00:00:00Z',
        capturedAt: '2025-01-01T00:00:00Z',
        mimeType: 'image/jpeg',
        location: {
          latitude: 46.2,
          longitude: 6.1,
          accuracy: 5,
        },
      },
      notes: 'Test notes',
      location: {
        latitude: 46.2,
        longitude: 6.1,
        accuracy: 5,
      },
    };

    await act(async () => {
      await result.current.uploadProof(payload);
    });

    // Verify fetch was called with correct endpoint
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/delivery_003/complete'),
      expect.any(Object)
    );
  });
});
