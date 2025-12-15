/**
 * Socket.IO Real-Time Service
 * T8-021: GPS Tracking & Route Display
 * Provides real-time location broadcasting and delivery updates via Socket.IO
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';

import { Coordinates, DeliveryRoute, DeliveryRequest } from '../types/delivery';

/**
 * Socket Events
 */
export enum SocketEvent {
  // Emit Events
  LOCATION_UPDATE = 'location:update',
  DELIVERY_START = 'delivery:start',
  DELIVERY_COMPLETE = 'delivery:complete',
  DELIVERY_ACCEPT = 'delivery:accept',
  PERSONNEL_ONLINE = 'personnel:online',
  PERSONNEL_OFFLINE = 'personnel:offline',

  // Listen Events
  ROUTE_UPDATED = 'route:updated',
  DELIVERY_ASSIGNED = 'delivery:assigned',
  DELIVERY_CANCELLED = 'delivery:cancelled',
}

/**
 * Socket Connection State
 */
export type SocketState =
  | { type: 'disconnected' }
  | { type: 'connecting' }
  | { type: 'connected'; socketId: string }
  | { type: 'reconnecting'; attempt: number }
  | { type: 'error'; error: Error };

/**
 * Location Broadcast Queue Item
 */
interface LocationBroadcast {
  personnelId: string;
  deliveryId: string | null;
  location: Coordinates;
  timestamp: string;
}

/**
 * Socket Service Configuration
 */
interface SocketConfig {
  url: string;
  reconnectionAttempts: number;
  reconnectionDelay: number;
  throttleInterval: number; // ms
  maxQueueSize: number;
}

const DEFAULT_CONFIG: SocketConfig = {
  url: 'http://localhost:4005', // Backend delivery service
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  throttleInterval: 15000, // 15 seconds
  maxQueueSize: 50,
};

/**
 * Socket Service Class
 */
class SocketService {
  private socket: Socket | null = null;
  private config: SocketConfig;
  private state: SocketState = { type: 'disconnected' };
  private personnelId: string | null = null;
  private currentDeliveryId: string | null = null;
  private lastBroadcastTime: number = 0;
  private broadcastQueue: LocationBroadcast[] = [];
  private eventHandlers: Map<string, Function[]> = new Map();
  private isInitialized: boolean = false;

  // Storage keys
  private readonly QUEUE_KEY = '@socket_broadcast_queue';

  constructor(config: Partial<SocketConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize Socket Connection
   */
  async initialize(personnelId: string, token: string): Promise<void> {
    if (this.socket?.connected) {
      console.log('[SocketService] Already connected');
      return;
    }

    if (this.isInitialized) {
      console.log('[SocketService] Already initialized');
      return;
    }

    this.personnelId = personnelId;
    this.state = { type: 'connecting' };

    // Load queued broadcasts
    await this.loadBroadcastQueue();

    // Create socket connection
    this.socket = io(this.config.url, {
      auth: {
        token,
        personnelId,
      },
      reconnectionAttempts: this.config.reconnectionAttempts,
      reconnectionDelay: this.config.reconnectionDelay,
      transports: ['websocket', 'polling'],
    });

    // Setup event listeners
    this.setupSocketListeners();

    this.isInitialized = true;
    console.log('[SocketService] Initialized');
  }

  /**
   * Setup Socket Event Listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) {return;}

    // Connection events
    this.socket.on('connect', () => {
      console.log('[SocketService] Connected:', this.socket?.id);
      this.state = { type: 'connected', socketId: this.socket?.id || '' };

      // Emit personnel online
      this.emit(SocketEvent.PERSONNEL_ONLINE, {
        personnelId: this.personnelId,
        timestamp: new Date().toISOString(),
      });

      // Process queued broadcasts
      this.processQueue();
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('[SocketService] Disconnected:', reason);
      this.state = { type: 'disconnected' };
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('[SocketService] Connection error:', error);
      this.state = { type: 'error', error };
    });

    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log('[SocketService] Reconnect attempt:', attemptNumber);
      this.state = { type: 'reconnecting', attempt: attemptNumber };
    });

    // Listen for route updates
    this.socket.on(SocketEvent.ROUTE_UPDATED, (data: DeliveryRoute) => {
      console.log('[SocketService] Route updated:', data);
      this.triggerHandlers(SocketEvent.ROUTE_UPDATED, data);
    });

    // Listen for delivery assignments
    this.socket.on(SocketEvent.DELIVERY_ASSIGNED, (data: DeliveryRequest) => {
      console.log('[SocketService] Delivery assigned:', data);
      this.triggerHandlers(SocketEvent.DELIVERY_ASSIGNED, data);
    });

    // Listen for cancellations
    this.socket.on(SocketEvent.DELIVERY_CANCELLED, (data: { deliveryId: string }) => {
      console.log('[SocketService] Delivery cancelled:', data);
      this.triggerHandlers(SocketEvent.DELIVERY_CANCELLED, data);
    });
  }

  /**
   * Broadcast Location Update (with throttling)
   */
  async broadcastLocation(location: Coordinates, deliveryId: string | null = null): Promise<void> {
    if (!this.personnelId) {
      console.error('[SocketService] Personnel ID not set');
      return;
    }

    const broadcast: LocationBroadcast = {
      personnelId: this.personnelId,
      deliveryId: deliveryId || this.currentDeliveryId,
      location,
      timestamp: new Date().toISOString(),
    };

    // If connected, emit immediately (with throttling)
    if (this.socket?.connected) {
      const now = Date.now();
      const timeSinceLastBroadcast = now - this.lastBroadcastTime;

      // Throttle: Only broadcast if enough time has passed
      if (timeSinceLastBroadcast < this.config.throttleInterval) {
        console.log('[SocketService] Location broadcast throttled');
        return;
      }

      try {
        this.socket.emit(SocketEvent.LOCATION_UPDATE, broadcast);
        this.lastBroadcastTime = now;
        console.log('[SocketService] Location broadcasted:', location);
      } catch (error) {
        console.error('[SocketService] Broadcast failed:', error);
        await this.queueBroadcast(broadcast);
      }
    } else {
      // Queue for later (no throttling when offline)
      await this.queueBroadcast(broadcast);
    }
  }

  /**
   * Queue Broadcast for Offline Sync
   */
  private async queueBroadcast(broadcast: LocationBroadcast): Promise<void> {
    this.broadcastQueue.push(broadcast);

    // Trim queue if too large
    if (this.broadcastQueue.length > this.config.maxQueueSize) {
      this.broadcastQueue = this.broadcastQueue.slice(-this.config.maxQueueSize);
    }

    try {
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.broadcastQueue));
      console.log('[SocketService] Broadcast queued');
    } catch (error) {
      console.error('[SocketService] Failed to queue broadcast:', error);
    }
  }

  /**
   * Load Broadcast Queue from Storage
   */
  private async loadBroadcastQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(this.QUEUE_KEY);
      if (queueData) {
        this.broadcastQueue = JSON.parse(queueData);
        console.log(`[SocketService] Loaded ${this.broadcastQueue.length} queued broadcasts`);
      }
    } catch (error) {
      console.error('[SocketService] Failed to load broadcast queue:', error);
    }
  }

  /**
   * Process Queued Broadcasts
   */
  private async processQueue(): Promise<void> {
    if (this.broadcastQueue.length === 0 || !this.socket?.connected) {
      return;
    }

    console.log(`[SocketService] Processing ${this.broadcastQueue.length} queued broadcasts`);

    const queue = [...this.broadcastQueue];
    this.broadcastQueue = [];

    for (const broadcast of queue) {
      try {
        this.socket.emit(SocketEvent.LOCATION_UPDATE, broadcast);
      } catch (error) {
        console.error('[SocketService] Failed to process queued broadcast:', error);
        // Re-queue failed broadcasts
        this.broadcastQueue.push(broadcast);
      }
    }

    // Save remaining queue
    try {
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.broadcastQueue));
    } catch (error) {
      console.error('[SocketService] Failed to save queue:', error);
    }
  }

  /**
   * Emit Socket Event
   */
  emit(event: SocketEvent, data: any): void {
    if (!this.socket?.connected) {
      console.warn('[SocketService] Socket not connected, event not emitted:', event);
      return;
    }

    this.socket.emit(event, data);
    console.log('[SocketService] Emitted event:', event, data);
  }

  /**
   * Register Event Handler
   */
  on(event: SocketEvent, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }

    const handlers = this.eventHandlers.get(event);
    if (handlers && !handlers.includes(handler)) {
      handlers.push(handler);
    }
  }

  /**
   * Unregister Event Handler
   */
  off(event: SocketEvent, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Trigger Registered Handlers
   */
  private triggerHandlers(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error('[SocketService] Handler error:', error);
        }
      });
    }
  }

  /**
   * Set Current Delivery ID
   */
  setCurrentDeliveryId(deliveryId: string | null): void {
    this.currentDeliveryId = deliveryId;
  }

  /**
   * Get Connection State
   */
  getState(): SocketState {
    return this.state;
  }

  /**
   * Check if Connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get Socket ID
   */
  getSocketId(): string | null {
    return this.socket?.connected ? this.socket.id ?? null : null;
  }

  /**
   * Disconnect
   */
  async disconnect(): Promise<void> {
    if (!this.socket) {return;}

    // Emit personnel offline
    if (this.socket.connected) {
      this.emit(SocketEvent.PERSONNEL_OFFLINE, {
        personnelId: this.personnelId,
        timestamp: new Date().toISOString(),
      });
    }

    this.socket.disconnect();
    this.socket = null;
    this.state = { type: 'disconnected' };
    this.isInitialized = false;

    console.log('[SocketService] Disconnected');
  }

  /**
   * Clear Broadcast Queue
   */
  async clearQueue(): Promise<void> {
    this.broadcastQueue = [];
    try {
      await AsyncStorage.removeItem(this.QUEUE_KEY);
      console.log('[SocketService] Queue cleared');
    } catch (error) {
      console.error('[SocketService] Failed to clear queue:', error);
    }
  }

  /**
   * Get Queue Size
   */
  getQueueSize(): number {
    return this.broadcastQueue.length;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
