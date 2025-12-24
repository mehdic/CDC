/**
 * Delivery Tracking Hook
 * T8-042: Patient Delivery Tracking
 * Main hook for managing delivery tracking state and real-time updates
 */

import { useState, useCallback, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';
import type {
  DeliveryTracking,
  WebSocketMessage,
  DeliveryNotification,
  NotificationType,
} from '../types/tracking';

export interface UseDeliveryTrackingOptions {
  deliveryId: string;
  onNotification?: (notification: DeliveryNotification) => void;
}

export interface UseDeliveryTrackingResult {
  tracking: DeliveryTracking | null;
  loading: boolean;
  error: Error | null;
  connected: boolean;
  isUsingPolling: boolean;
  notifications: DeliveryNotification[];
  refetch: () => Promise<void>;
  markNotificationRead: (id: string) => void;
}

/**
 * Delivery Tracking Hook
 */
export function useDeliveryTracking({
  deliveryId,
  onNotification,
}: UseDeliveryTrackingOptions): UseDeliveryTrackingResult {
  const [tracking, setTracking] = useState<DeliveryTracking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [notifications, setNotifications] = useState<DeliveryNotification[]>([]);

  /**
   * Handle WebSocket Messages
   */
  const handleWebSocketMessage = useCallback(
    (message: WebSocketMessage) => {
      console.log('[useDeliveryTracking] Received update:', message);

      // Update tracking data
      setTracking((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          ...message.data,
          last_updated: message.timestamp,
        };
      });

      // Generate notification for status updates
      if (message.type === 'status_update' && message.data.status) {
        const notificationType = message.data.status as NotificationType;
        const notification = createNotification(
          notificationType,
          deliveryId,
          message.timestamp
        );

        if (notification) {
          setNotifications((prev) => [notification, ...prev]);
          onNotification?.(notification);
        }
      }
    },
    [deliveryId, onNotification]
  );

  /**
   * Fetch Tracking Data
   */
  const fetchTracking = useCallback(async () => {
    if (!deliveryId) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:4005/tracking/${deliveryId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tracking data');
      }

      const data: DeliveryTracking = await response.json();
      setTracking(data);
      setError(null);
    } catch (err: any) {
      console.error('[useDeliveryTracking] Fetch error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [deliveryId]);

  /**
   * WebSocket Connection
   */
  const { connected, isUsingPolling } = useWebSocket({
    deliveryId,
    enabled: !!deliveryId,
    onMessage: handleWebSocketMessage,
    onError: (err) => setError(err),
    pollingFallback: true,
    pollingInterval: 10000,
  });

  /**
   * Mark Notification as Read
   */
  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  /**
   * Initial Data Fetch
   */
  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  return {
    tracking,
    loading,
    error,
    connected,
    isUsingPolling,
    notifications,
    refetch: fetchTracking,
    markNotificationRead,
  };
}

/**
 * Create Notification Based on Status
 */
function createNotification(
  type: NotificationType,
  deliveryId: string,
  timestamp: string
): DeliveryNotification | null {
  const notificationMap: Record<
    NotificationType,
    { title: string; message: string }
  > = {
    assigned: {
      title: 'Driver Assigned',
      message: 'A driver has been assigned to your delivery',
    },
    picked_up: {
      title: 'Package Picked Up',
      message: 'Your package has been picked up by the driver',
    },
    in_transit: {
      title: 'Out for Delivery',
      message: 'Your package is on its way!',
    },
    arrived: {
      title: 'Driver Arriving Soon',
      message: 'Your driver is arriving at your location',
    },
    delivered: {
      title: 'Delivered',
      message: 'Your package has been delivered successfully',
    },
  };

  const config = notificationMap[type];
  if (!config) return null;

  return {
    id: `${deliveryId}-${type}-${timestamp}`,
    type,
    title: config.title,
    message: config.message,
    timestamp,
    delivery_id: deliveryId,
    read: false,
  };
}
