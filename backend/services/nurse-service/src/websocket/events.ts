/**
 * WebSocket Event Handlers
 * Socket.io event handlers for real-time nurse order updates
 */

import { Server as SocketIOServer, Socket } from 'socket.io';

export interface SocketData {
  userId: string;
  role: string;
}

/**
 * Initialize Socket.IO event handlers
 */
export function initializeSocketEvents(io: SocketIOServer): void {
  io.on('connection', (socket: Socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Handle nurse authentication
    socket.on('auth:nurse', async (data: { nurseId: string; token: string }) => {
      try {
      // TODO: Validate token
      console.log(`[WebSocket] Nurse authenticated: ${data.nurseId}`);

      // Join nurse room
      await socket.join(`nurse:${data.nurseId}`);
      await socket.join('nurses'); // Global nurses room

      // Store user data in socket
      socket.data = {
        userId: data.nurseId,
        role: 'nurse',
      } as SocketData;

      socket.emit('auth:success', {
        message: 'Authenticated successfully',
        nurseId: data.nurseId,
      });
      } catch (error) {
        console.error(`[WebSocket] Auth error: ${socket.id}`, error);
        socket.emit('auth:error', {
          message: 'Authentication failed',
        });
      }
    });

    // Handle patient room join
    socket.on('patient:join', async (data: { patientId: string }) => {
      try{
      console.log(`[WebSocket] Joining patient room: ${data.patientId}`);
      await socket.join(`patient:${data.patientId}`);

      socket.emit('patient:joined', {
        patientId: data.patientId,
      });
      } catch (error) {
        console.error(`[WebSocket] Patient join error: ${socket.id}`, error);
        socket.emit('patient:join_error', {
          message: 'Failed to join patient room',
        });
      }
    });

    // Handle order subscription
    socket.on('order:subscribe', async (data: { orderId: string }) => {
      try {
      console.log(`[WebSocket] Subscribing to order: ${data.orderId}`);
      await socket.join(`order:${data.orderId}`);

      socket.emit('order:subscribed', {
        orderId: data.orderId,
      });
      } catch (error) {
        console.error(`[WebSocket] Order subscribe error: ${socket.id}`, error);
        socket.emit('order:subscribe_error', {
          message: 'Failed to subscribe to order',
        });
      }
    });

    // Handle order unsubscribe
    socket.on('order:unsubscribe', async (data: { orderId: string }) => {
      try {
      console.log(`[WebSocket] Unsubscribing from order: ${data.orderId}`);
      await socket.leave(`order:${data.orderId}`);

      socket.emit('order:unsubscribed', {
        orderId: data.orderId,
      });
      } catch (error) {
        console.error(`[WebSocket] Order unsubscribe error: ${socket.id}`, error);
      }
    });

    // Handle delivery tracking subscription
    socket.on('delivery:subscribe', async (data: { deliveryId: string }) => {
      try {
      console.log(`[WebSocket] Subscribing to delivery: ${data.deliveryId}`);
      await socket.join(`delivery:${data.deliveryId}`);

      socket.emit('delivery:subscribed', {
        deliveryId: data.deliveryId,
      });
      } catch (error) {
        console.error(`[WebSocket] Delivery subscribe error: ${socket.id}`, error);
        socket.emit('delivery:subscribe_error', {
          message: 'Failed to subscribe to delivery',
        });
      }
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', {
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);

      // Clean up rooms (Socket.IO handles this automatically)
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`[WebSocket] Socket error: ${socket.id}`, error);
    });
  });

  console.log('[WebSocket] Event handlers initialized');
}

/**
 * Emit order created event
 */
export function emitOrderCreated(
  io: SocketIOServer,
  orderId: string,
  nurseId: string,
  patientId: string,
  data: any
): void {
  io.to(`nurse:${nurseId}`).emit('order:created', {
    orderId,
    nurseId,
    patientId,
    ...data,
    timestamp: new Date().toISOString(),
  });

  io.to(`patient:${patientId}`).emit('order:created', {
    orderId,
    nurseId,
    patientId,
    ...data,
    timestamp: new Date().toISOString(),
  });

  console.log(`[WebSocket] Emitted order:created for order ${orderId}`);
}

/**
 * Emit order status update event
 */
export function emitOrderStatusUpdate(
  io: SocketIOServer,
  orderId: string,
  nurseId: string,
  patientId: string,
  status: string,
  previousStatus: string
): void {
  const eventData = {
    orderId,
    nurseId,
    patientId,
    status,
    previousStatus,
    timestamp: new Date().toISOString(),
  };

  io.to(`order:${orderId}`).emit('order:status_updated', eventData);
  io.to(`nurse:${nurseId}`).emit('order:status_updated', eventData);
  io.to(`patient:${patientId}`).emit('order:status_updated', eventData);

  console.log(`[WebSocket] Emitted order:status_updated for order ${orderId}: ${previousStatus} → ${status}`);
}

/**
 * Emit delivery notification event
 */
export function emitDeliveryNotification(
  io: SocketIOServer,
  orderId: string,
  deliveryId: string,
  trackingNumber: string,
  nurseId: string,
  patientId: string
): void {
  const eventData = {
    orderId,
    deliveryId,
    trackingNumber,
    timestamp: new Date().toISOString(),
  };

  io.to(`nurse:${nurseId}`).emit('delivery:notification', eventData);
  io.to(`patient:${patientId}`).emit('delivery:notification', eventData);

  console.log(`[WebSocket] Emitted delivery:notification for order ${orderId}`);
}

/**
 * Emit patient assignment event
 */
export function emitPatientAssignment(
  io: SocketIOServer,
  nurseId: string,
  patientId: string
): void {
  const eventData = {
    nurseId,
    patientId,
    timestamp: new Date().toISOString(),
  };

  io.to(`nurse:${nurseId}`).emit('patient:assigned', eventData);
  io.to(`patient:${patientId}`).emit('patient:assigned', eventData);

  console.log(`[WebSocket] Emitted patient:assigned: nurse ${nurseId} → patient ${patientId}`);
}
