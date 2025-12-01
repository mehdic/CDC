/**
 * Notification Service
 * Manages real-time notifications for order events
 */

import { NurseOrder, OrderStatus } from '../models/NurseOrder';

export interface OrderNotification {
  type: 'order_created' | 'status_updated' | 'delivery_notification' | 'patient_assigned';
  orderId: string;
  nurseId: string;
  patientId: string;
  status?: OrderStatus;
  message: string;
  timestamp: Date;
  data?: any;
}

export class NotificationService {
  private socketIO: any; // Socket.IO instance (to be injected)

  constructor(socketIO?: any) {
    this.socketIO = socketIO;
  }

  /**
   * Set Socket.IO instance
   */
  setSocketIO(socketIO: any): void {
    this.socketIO = socketIO;
  }

  /**
   * Notify about order creation
   */
  async notifyOrderCreated(order: NurseOrder): Promise<void> {
    const notification: OrderNotification = {
      type: 'order_created',
      orderId: order.id,
      nurseId: order.nurseId,
      patientId: order.patientId,
      status: order.status,
      message: `New medication order created for patient ${order.patientId}`,
      timestamp: new Date(),
      data: {
        medication: order.medication,
        dosage: order.dosage,
        quantity: order.quantity,
        urgency: order.urgency,
      },
    };

    await this.emit('order:created', notification);
  }

  /**
   * Notify about status update
   */
  async notifyStatusUpdate(order: NurseOrder, previousStatus: OrderStatus): Promise<void> {
    const notification: OrderNotification = {
      type: 'status_updated',
      orderId: order.id,
      nurseId: order.nurseId,
      patientId: order.patientId,
      status: order.status,
      message: `Order status changed from ${previousStatus} to ${order.status}`,
      timestamp: new Date(),
      data: {
        previousStatus,
        newStatus: order.status,
      },
    };

    await this.emit('order:status_updated', notification);
  }

  /**
   * Notify about delivery
   */
  async notifyDelivery(order: NurseOrder, deliveryId: string, trackingNumber: string): Promise<void> {
    const notification: OrderNotification = {
      type: 'delivery_notification',
      orderId: order.id,
      nurseId: order.nurseId,
      patientId: order.patientId,
      message: `Delivery created for order ${order.id}`,
      timestamp: new Date(),
      data: {
        deliveryId,
        trackingNumber,
      },
    };

    await this.emit('order:delivery', notification);
  }

  /**
   * Notify about patient assignment
   */
  async notifyPatientAssignment(nurseId: string, patientId: string): Promise<void> {
    const notification: OrderNotification = {
      type: 'patient_assigned',
      orderId: '', // No specific order
      nurseId,
      patientId,
      message: `Patient ${patientId} assigned to nurse ${nurseId}`,
      timestamp: new Date(),
    };

    await this.emit('patient:assigned', notification);
  }

  /**
   * Emit event to Socket.IO
   */
  private async emit(event: string, data: OrderNotification): Promise<void> {
    if (!this.socketIO) {
      console.warn('Socket.IO not configured, notification not sent:', event);
      return;
    }

    try {
      // Emit to nurse room
      this.socketIO.to(`nurse:${data.nurseId}`).emit(event, data);

      // Emit to patient room
      this.socketIO.to(`patient:${data.patientId}`).emit(event, data);

      console.log(`[Notification] Emitted ${event} to nurse:${data.nurseId} and patient:${data.patientId}`);
    } catch (error) {
      console.error('Failed to emit notification:', error);
    }
  }

  /**
   * Broadcast to all nurses
   */
  async broadcast(event: string, data: any): Promise<void> {
    if (!this.socketIO) {
      console.warn('Socket.IO not configured, broadcast not sent:', event);
      return;
    }

    try {
      this.socketIO.to('nurses').emit(event, data);
      console.log(`[Notification] Broadcast ${event} to all nurses`);
    } catch (error) {
      console.error('Failed to broadcast:', error);
    }
  }
}
