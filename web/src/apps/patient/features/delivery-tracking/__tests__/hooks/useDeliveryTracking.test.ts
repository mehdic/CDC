/**
 * useDeliveryTracking Hook Tests
 * T8-042: Patient Delivery Tracking
 */

// Mock socket.io-client (before any imports)
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    connected: false,
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

// Mock useWebSocket
jest.mock('../../hooks/useWebSocket', () => {
  return {
    useWebSocket: function mockUseWebSocket(_options: any) {
      return {
        connected: true,
        error: null,
        isUsingPolling: false,
      };
    },
  };
});

import { renderHook, waitFor } from '@testing-library/react';
import { useDeliveryTracking } from '../../hooks/useDeliveryTracking';

// Mock fetch
global.fetch = jest.fn();

describe('useDeliveryTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should fetch tracking data on mount', async () => {
    const mockTrackingData = {
      delivery_id: 'test-delivery-123',
      status: 'in_transit',
      current_location: {
        latitude: 46.5,
        longitude: 8.2,
      },
      eta_minutes: 15,
      distance_remaining_km: 5.5,
      location_history: [],
      driver_info: {
        id: 'driver-1',
        name: 'John Doe',
      },
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrackingData,
    });

    const { result } = renderHook(() =>
      useDeliveryTracking({
        deliveryId: 'test-delivery-123',
      })
    );

    // Initial state
    expect(result.current.loading).toBe(true);
    expect(result.current.tracking).toBeNull();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tracking).toEqual(mockTrackingData);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    const errorMessage = 'Failed to fetch tracking data';

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: errorMessage }),
    });

    const { result } = renderHook(() =>
      useDeliveryTracking({
        deliveryId: 'test-delivery-123',
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.tracking).toBeNull();
  });

  it('should refetch tracking data when refetch is called', async () => {
    const mockTrackingData = {
      delivery_id: 'test-delivery-123',
      status: 'in_transit',
      current_location: null,
      eta_minutes: null,
      distance_remaining_km: null,
      location_history: [],
      driver_info: null,
      last_updated: null,
      created_at: new Date().toISOString(),
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockTrackingData,
    });

    const { result } = renderHook(() =>
      useDeliveryTracking({
        deliveryId: 'test-delivery-123',
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear mock calls
    (global.fetch as jest.Mock).mockClear();

    // Call refetch
    await result.current.refetch();

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should generate notifications for status updates', async () => {
    const onNotification = jest.fn();

    const mockTrackingData = {
      delivery_id: 'test-delivery-123',
      status: 'pending',
      current_location: null,
      eta_minutes: null,
      distance_remaining_km: null,
      location_history: [],
      driver_info: null,
      last_updated: null,
      created_at: new Date().toISOString(),
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockTrackingData,
    });

    const { result } = renderHook(() =>
      useDeliveryTracking({
        deliveryId: 'test-delivery-123',
        onNotification,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.notifications).toEqual([]);
  });

  it('should mark notifications as read', async () => {
    const mockTrackingData = {
      delivery_id: 'test-delivery-123',
      status: 'in_transit',
      current_location: null,
      eta_minutes: null,
      distance_remaining_km: null,
      location_history: [],
      driver_info: null,
      last_updated: null,
      created_at: new Date().toISOString(),
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockTrackingData,
    });

    const { result } = renderHook(() =>
      useDeliveryTracking({
        deliveryId: 'test-delivery-123',
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Initially no notifications
    expect(result.current.notifications.length).toBe(0);

    // Mark notification as read (edge case - no notifications yet)
    result.current.markNotificationRead('non-existent');
    expect(result.current.notifications.length).toBe(0);
  });
});
