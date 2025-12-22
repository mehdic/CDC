/**
 * useDeliveryTracking Hook
 * Manages real-time delivery tracking via WebSocket or polling
 */

import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  updateDeliveryTracking,
  markEtaNotificationTriggered,
  setWebsocketConnected,
  fetchActiveDeliveries,
} from '../store/deliverySlice';
import { DeliveryTracking } from '../types';

const WS_BASE_URL = process.env.WS_BASE_URL || 'ws://localhost:4005';
const POLLING_INTERVAL = 30000; // 30 seconds fallback polling

interface UseDeliveryTrackingOptions {
  orderId?: string;
  enableWebSocket?: boolean;
  enablePolling?: boolean;
  etaThresholdMinutes?: number;
}

/**
 * Hook for real-time delivery tracking
 * Supports both WebSocket and polling modes
 */
export const useDeliveryTracking = (options: UseDeliveryTrackingOptions = {}) => {
  const {
    orderId,
    enableWebSocket = true,
    enablePolling = true,
    etaThresholdMinutes = 15,
  } = options;

  const dispatch = useDispatch<AppDispatch>();
  const websocketRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 5;

  const activeDeliveries = useSelector((state: RootState) => state.delivery.activeDeliveries);
  const trackingDetails = useSelector((state: RootState) => state.delivery.trackingDetails);
  const websocketConnected = useSelector((state: RootState) => state.delivery.websocketConnected);
  const notificationEta = useSelector((state: RootState) => state.delivery.notificationEta);

  /**
   * Check if delivery is approaching (within ETA threshold)
   */
  const isDeliveryApproaching = useCallback((delivery: DeliveryTracking): boolean => {
    if (!delivery.estimatedArrival) return false;

    const now = new Date().getTime();
    const eta = new Date(delivery.estimatedArrival).getTime();
    const diffMinutes = (eta - now) / (1000 * 60);

    return diffMinutes > 0 && diffMinutes <= etaThresholdMinutes;
  }, [etaThresholdMinutes]);

  /**
   * Connect to WebSocket for real-time updates
   */
  const connectWebSocket = useCallback(() => {
    if (!enableWebSocket) return;

    try {
      const wsUrl = `${WS_BASE_URL}/api/v1/deliveries/ws`;
      websocketRef.current = new WebSocket(wsUrl);

      websocketRef.current.onopen = () => {
        console.log('Delivery WebSocket connected');
        dispatch(setWebsocketConnected(true));
        reconnectAttemptsRef.current = 0;

        // Subscribe to delivery updates
        if (websocketRef.current) {
          const subscription = {
            type: 'subscribe',
            channel: orderId ? `delivery:${orderId}` : 'deliveries:all',
          };
          websocketRef.current.send(JSON.stringify(subscription));
        }
      };

      websocketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'delivery_update') {
            const delivery: DeliveryTracking = data.payload;
            dispatch(updateDeliveryTracking(delivery));

            // Check if delivery is approaching and trigger notification
            if (isDeliveryApproaching(delivery) && !notificationEta[delivery.orderId]) {
              dispatch(markEtaNotificationTriggered(delivery.orderId));
              // In a real app, this would trigger a push notification
              console.log(`Delivery ${delivery.orderId} arriving in approximately ${etaThresholdMinutes} minutes`);
            }
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      websocketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        dispatch(setWebsocketConnected(false));
      };

      websocketRef.current.onclose = () => {
        console.log('Delivery WebSocket disconnected');
        dispatch(setWebsocketConnected(false));

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const backoffMs = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`Reconnecting in ${backoffMs}ms...`);
          reconnectAttemptsRef.current += 1;
          setTimeout(connectWebSocket, backoffMs);
        }
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      dispatch(setWebsocketConnected(false));
    }
  }, [dispatch, orderId, enableWebSocket, isDeliveryApproaching, notificationEta, etaThresholdMinutes]);

  /**
   * Disconnect WebSocket
   */
  const disconnectWebSocket = useCallback(() => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
  }, []);

  /**
   * Start polling for delivery updates (fallback if WebSocket unavailable)
   */
  const startPolling = useCallback(() => {
    if (!enablePolling) return;

    pollingRef.current = setInterval(() => {
      dispatch(fetchActiveDeliveries());
    }, POLLING_INTERVAL);
  }, [dispatch, enablePolling]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  /**
   * Effect: Initialize WebSocket and polling
   */
  useEffect(() => {
    // Start WebSocket connection
    if (enableWebSocket) {
      connectWebSocket();
    } else if (enablePolling) {
      // Use polling as fallback
      startPolling();
    } else {
      // Fetch once
      dispatch(fetchActiveDeliveries());
    }

    return () => {
      disconnectWebSocket();
      stopPolling();
    };
  }, [connectWebSocket, disconnectWebSocket, startPolling, stopPolling, enableWebSocket, enablePolling, dispatch]);

  /**
   * Manually refresh delivery data
   */
  const refreshDeliveries = useCallback(() => {
    dispatch(fetchActiveDeliveries());
  }, [dispatch]);

  /**
   * Get current delivery by order ID
   */
  const getDeliveryByOrderId = useCallback(
    (id: string): DeliveryTracking | undefined => {
      return trackingDetails[id];
    },
    [trackingDetails]
  );

  return {
    activeDeliveries,
    trackingDetails,
    websocketConnected,
    isDeliveryApproaching,
    refreshDeliveries,
    getDeliveryByOrderId,
    disconnectWebSocket,
  };
};
