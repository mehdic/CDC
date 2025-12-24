/**
 * WebSocket Hook for Real-Time Delivery Tracking
 * T8-042: Patient Delivery Tracking
 * Manages WebSocket connection with automatic reconnection and fallback to polling
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { WebSocketMessage } from '../types/tracking';

export interface UseWebSocketOptions {
  deliveryId: string;
  enabled: boolean;
  onMessage: (message: WebSocketMessage) => void;
  onError?: (error: Error) => void;
  pollingFallback?: boolean;
  pollingInterval?: number;
}

export interface UseWebSocketResult {
  connected: boolean;
  error: Error | null;
  isUsingPolling: boolean;
}

/**
 * WebSocket Hook with Polling Fallback
 */
export function useWebSocket({
  deliveryId,
  enabled,
  onMessage,
  onError,
  pollingFallback = true,
  pollingInterval = 10000,
}: UseWebSocketOptions): UseWebSocketResult {
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isUsingPolling, setIsUsingPolling] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 5;

  /**
   * Fetch tracking data via polling
   */
  const fetchTrackingData = useCallback(async () => {
    if (!deliveryId) return;

    try {
      const response = await fetch(`http://localhost:4005/tracking/${deliveryId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tracking data');
      }

      const data = await response.json();

      // Convert to WebSocket message format
      const message: WebSocketMessage = {
        type: 'location_update',
        delivery_id: deliveryId,
        data: data,
        timestamp: new Date().toISOString(),
      };

      onMessage(message);
    } catch (err: any) {
      console.error('[useWebSocket] Polling error:', err);
      setError(err);
      onError?.(err);
    }
  }, [deliveryId, onMessage, onError]);

  /**
   * Start Polling Fallback
   */
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    setIsUsingPolling(true);
    console.log(`[useWebSocket] Starting polling fallback (${pollingInterval}ms)`);

    // Initial fetch
    fetchTrackingData();

    // Set up interval
    pollingIntervalRef.current = setInterval(fetchTrackingData, pollingInterval);
  }, [fetchTrackingData, pollingInterval]);

  /**
   * Stop Polling
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsUsingPolling(false);
  }, []);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('[useWebSocket] Already connected');
      return;
    }

    console.log('[useWebSocket] Attempting to connect...');

    try {
      // Initialize Socket.IO client
      const socket = io('http://localhost:4005', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      // Connection established
      socket.on('connect', () => {
        console.log('[useWebSocket] Connected');
        setConnected(true);
        setError(null);
        reconnectAttempts.current = 0;

        // Stop polling if using it
        stopPolling();

        // Join delivery room for updates
        socket.emit('join_delivery', deliveryId);
      });

      // Listen for delivery updates
      socket.on('delivery_update', (message: WebSocketMessage) => {
        console.log('[useWebSocket] Received delivery update', message);
        onMessage(message);
      });

      // Connection error
      socket.on('connect_error', (err: Error) => {
        console.error('[useWebSocket] Connection error:', err);
        setError(err);
        onError?.(err);

        reconnectAttempts.current++;

        // If max attempts reached and polling enabled, fallback to polling
        if (reconnectAttempts.current >= maxReconnectAttempts && pollingFallback) {
          console.log('[useWebSocket] Max reconnect attempts reached, falling back to polling');
          socket.disconnect();
          startPolling();
        }
      });

      // Disconnection
      socket.on('disconnect', (reason: string) => {
        console.log('[useWebSocket] Disconnected:', reason);
        setConnected(false);

        // If server initiated disconnect and polling enabled, fallback to polling
        if (reason === 'io server disconnect' && pollingFallback) {
          startPolling();
        }
      });

      socketRef.current = socket;
    } catch (err: any) {
      console.error('[useWebSocket] Setup error:', err);
      setError(err);
      onError?.(err);

      // Fallback to polling
      if (pollingFallback) {
        startPolling();
      }
    }
  }, [deliveryId, onMessage, onError, pollingFallback, startPolling, stopPolling]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('[useWebSocket] Disconnecting');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    stopPolling();
    setConnected(false);
  }, [stopPolling]);

  /**
   * Effect: Connect/Disconnect based on enabled state
   */
  useEffect(() => {
    if (!enabled || !deliveryId) {
      disconnect();
      return;
    }

    connect();

    return () => {
      disconnect();
    };
  }, [enabled, deliveryId, connect, disconnect]);

  return {
    connected,
    error,
    isUsingPolling,
  };
}
