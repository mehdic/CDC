/**
 * useWebSocket Hook
 * Manages WebSocket connection for real-time messaging updates
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { Message, WebSocketMessage } from '../types/messaging.types';

export interface UseWebSocketResult {
  isConnected: boolean;
  error: string | null;
  on: (event: string, callback: (data: unknown) => void) => void;
  off: (event: string, callback?: (data: unknown) => void) => void;
  emit: (event: string, data: unknown) => void;
  disconnect: () => void;
}

/**
 * Hook for WebSocket connection management
 */
export const useWebSocket = (userId: string, enabled: boolean = true): UseWebSocketResult => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    try {
      // Get WebSocket URL from environment or default
      const wsUrl = (import.meta.env.VITE_WS_URL as string | undefined) || 'http://localhost:4000';

      // Create socket connection
      const socket = io(wsUrl, {
        query: {
          userId,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socketRef.current = socket;

      // Connection handlers
      socket.on('connect', () => {
        setIsConnected(true);
        setError(null);
        console.log('WebSocket connected');
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');
      });

      socket.on('connect_error', (err) => {
        setError(err.message || 'WebSocket connection error');
        console.error('WebSocket connection error:', err);
      });

      socket.on('error', (err) => {
        setError(typeof err === 'string' ? err : 'WebSocket error');
        console.error('WebSocket error:', err);
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize WebSocket');
    }
  }, [userId, enabled]);

  // Register event listener
  const handleOn = useCallback((event: string, callback: (data: unknown) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  // Unregister event listener
  const handleOff = useCallback((event: string, callback?: (data: unknown) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback);
      } else {
        socketRef.current.off(event);
      }
    }
  }, []);

  // Emit event
  const handleEmit = useCallback((event: string, data: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  // Disconnect
  const handleDisconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  return {
    isConnected,
    error,
    on: handleOn,
    off: handleOff,
    emit: handleEmit,
    disconnect: handleDisconnect,
  };
};

/**
 * Hook for listening to message events
 */
export const useMessageUpdates = (
  conversationId: string,
  onNewMessage?: (message: Message) => void,
  onStatusUpdate?: (messageId: string, status: string) => void
) => {
  const { on, off, isConnected } = useWebSocket('');

  useEffect(() => {
    if (!isConnected || !conversationId) {
      return;
    }

    const messageHandler = (data: unknown) => {
      const wsMessage = data as WebSocketMessage;
      if (wsMessage.type === 'message' && onNewMessage) {
        const message = wsMessage.payload as Message;
        if (message.conversationId === conversationId) {
          onNewMessage(message);
        }
      }
    };

    const statusHandler = (data: unknown) => {
      const wsMessage = data as WebSocketMessage;
      if (wsMessage.type === 'status' && onStatusUpdate) {
        const { messageId, status } = wsMessage.payload as {
          messageId: string;
          status: string;
        };
        onStatusUpdate(messageId, status);
      }
    };

    on('message', messageHandler);
    on('status_update', statusHandler);

    return () => {
      off('message', messageHandler);
      off('status_update', statusHandler);
    };
  }, [conversationId, isConnected, on, off, onNewMessage, onStatusUpdate]);
};
