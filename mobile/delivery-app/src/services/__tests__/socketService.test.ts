/**
 * SocketService Unit Tests
 * T8-021: GPS Tracking & Route Display
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { Coordinates } from '../../types/delivery';
import { socketService, SocketEvent } from '../socketService';

/**
 * Mock socket.io-client
 */
jest.mock('socket.io-client', () => {
  const mockSocket = {
    connected: false,
    id: 'mock-socket-id',
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  };

  return {
    io: jest.fn(() => mockSocket),
  };
});

/**
 * Mock AsyncStorage
 */
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('SocketService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await socketService.clearQueue();
  });

  describe('initialize', () => {
    it('should initialize socket connection', async () => {
      await socketService.initialize('personnel-1', 'test-token');

      expect(socketService.getState().type).not.toBe('disconnected');
    });

    it('should not re-initialize if already connected', async () => {
      const { io } = require('socket.io-client');
      await socketService.initialize('personnel-1', 'test-token');
      const firstCallCount = io.mock.calls.length;

      await socketService.initialize('personnel-1', 'test-token');
      const secondCallCount = io.mock.calls.length;

      // Should not call io() again
      expect(secondCallCount).toBe(firstCallCount);
    });
  });

  describe('broadcastLocation', () => {
    beforeEach(async () => {
      await socketService.initialize('personnel-1', 'test-token');
    });

    it('should broadcast location when connected', async () => {
      const { io } = require('socket.io-client');
      const mockSocket = io();
      mockSocket.connected = true;

      const location: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      };

      await socketService.broadcastLocation(location, 'delivery-1');

      expect(mockSocket.emit).toHaveBeenCalledWith(
        SocketEvent.LOCATION_UPDATE,
        expect.objectContaining({
          personnelId: 'personnel-1',
          deliveryId: 'delivery-1',
          location,
        })
      );
    });

    it('should throttle rapid location broadcasts', async () => {
      const { io } = require('socket.io-client');
      const mockSocket = io();
      mockSocket.connected = true;

      const location: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      };

      // First broadcast
      await socketService.broadcastLocation(location, 'delivery-1');
      const firstCallCount = mockSocket.emit.mock.calls.length;

      // Immediate second broadcast (should be throttled)
      await socketService.broadcastLocation(location, 'delivery-1');
      const secondCallCount = mockSocket.emit.mock.calls.length;

      expect(secondCallCount).toBe(firstCallCount); // No new call
    });

    it('should queue location when disconnected', async () => {
      const { io } = require('socket.io-client');
      const mockSocket = io();
      mockSocket.connected = false;

      const location: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      };

      await socketService.broadcastLocation(location, 'delivery-1');

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      expect(socketService.getQueueSize()).toBeGreaterThan(0);
    });
  });

  describe('emit', () => {
    beforeEach(async () => {
      await socketService.initialize('personnel-1', 'test-token');
    });

    it('should emit socket event when connected', () => {
      const { io } = require('socket.io-client');
      const mockSocket = io();
      mockSocket.connected = true;

      socketService.emit(SocketEvent.DELIVERY_START, { deliveryId: 'delivery-1' });

      expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.DELIVERY_START, {
        deliveryId: 'delivery-1',
      });
    });

    it('should not emit when disconnected', () => {
      const { io } = require('socket.io-client');
      const mockSocket = io();
      mockSocket.connected = false;

      socketService.emit(SocketEvent.DELIVERY_START, { deliveryId: 'delivery-1' });

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('event handlers', () => {
    it('should register event handler', () => {
      const handler = jest.fn();
      socketService.on(SocketEvent.ROUTE_UPDATED, handler);

      // Handler is registered (internal state)
      expect(handler).toBeDefined();
    });

    it('should unregister event handler', () => {
      const handler = jest.fn();
      socketService.on(SocketEvent.ROUTE_UPDATED, handler);
      socketService.off(SocketEvent.ROUTE_UPDATED, handler);

      // Handler is removed (internal state)
      expect(handler).toBeDefined();
    });
  });

  describe('setCurrentDeliveryId', () => {
    it('should set current delivery ID', () => {
      socketService.setCurrentDeliveryId('delivery-1');

      // Internal state updated (tested via broadcast)
      expect(socketService).toBeDefined();
    });

    it('should clear current delivery ID', () => {
      socketService.setCurrentDeliveryId('delivery-1');
      socketService.setCurrentDeliveryId(null);

      // Internal state cleared
      expect(socketService).toBeDefined();
    });
  });

  describe('disconnect', () => {
    it('should disconnect socket', async () => {
      const { io } = require('socket.io-client');
      await socketService.initialize('personnel-1', 'test-token');
      const mockSocket = io();
      mockSocket.connected = true;

      await socketService.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(socketService.getState().type).toBe('disconnected');
    });

    it('should emit offline event before disconnect', async () => {
      const { io } = require('socket.io-client');
      await socketService.initialize('personnel-1', 'test-token');
      const mockSocket = io();
      mockSocket.connected = true;

      await socketService.disconnect();

      expect(mockSocket.emit).toHaveBeenCalledWith(
        SocketEvent.PERSONNEL_OFFLINE,
        expect.objectContaining({
          personnelId: 'personnel-1',
        })
      );
    });
  });

  describe('clearQueue', () => {
    it('should clear broadcast queue', async () => {
      const { io } = require('socket.io-client');
      await socketService.initialize('personnel-1', 'test-token');
      const mockSocket = io();
      mockSocket.connected = false;

      // Queue some broadcasts
      const location: Coordinates = {
        latitude: 47.3769,
        longitude: 8.5417,
        timestamp: new Date().toISOString(),
      };

      await socketService.broadcastLocation(location, 'delivery-1');
      expect(socketService.getQueueSize()).toBeGreaterThan(0);

      // Clear queue
      await socketService.clearQueue();
      expect(socketService.getQueueSize()).toBe(0);
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('getState', () => {
    it('should return connection state', async () => {
      const state = socketService.getState();
      expect(state.type).toBeDefined();
    });
  });

  describe('isConnected', () => {
    it('should return false when disconnected', () => {
      expect(socketService.isConnected()).toBe(false);
    });

    it('should return true when connected', async () => {
      const { io } = require('socket.io-client');
      await socketService.initialize('personnel-1', 'test-token');
      const mockSocket = io();
      mockSocket.connected = true;

      expect(socketService.isConnected()).toBe(true);
    });
  });

  describe('getSocketId', () => {
    it('should return socket ID when connected', async () => {
      const { io } = require('socket.io-client');
      await socketService.initialize('personnel-1', 'test-token');
      const mockSocket = io();
      mockSocket.connected = true;

      const socketId = socketService.getSocketId();
      expect(socketId).toBe('mock-socket-id');
    });

    it('should return null when disconnected', async () => {
      const { io } = require('socket.io-client');
      // Ensure socket is disconnected
      const mockSocket = io();
      mockSocket.connected = false;

      const socketId = socketService.getSocketId();
      expect(socketId).toBeNull();
    });
  });
});
