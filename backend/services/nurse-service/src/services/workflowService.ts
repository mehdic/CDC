/**
 * Workflow Service
 * Integrates nurse orders with inventory, prescription, and delivery services
 */

import axios from 'axios';
import { NurseOrder } from '../models/NurseOrder';

export interface StockCheckResult {
  available: boolean;
  currentStock: number;
  medication: string;
}

export interface PrescriptionValidationResult {
  valid: boolean;
  prescriptionId?: string;
  message?: string;
}

export interface DeliveryCreationResult {
  deliveryId: string;
  trackingNumber: string;
  estimatedDelivery?: Date;
}

export class WorkflowService {
  private inventoryServiceUrl: string;
  private prescriptionServiceUrl: string;
  private deliveryServiceUrl: string;

  constructor() {
    this.inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || 'http://localhost:4008';
    this.prescriptionServiceUrl = process.env.PRESCRIPTION_SERVICE_URL || 'http://localhost:4003';
    this.deliveryServiceUrl = process.env.DELIVERY_SERVICE_URL || 'http://localhost:4005';
  }

  /**
   * Check if medication is in stock
   */
  async checkStock(medication: string, quantity: number, pharmacyId?: string): Promise<StockCheckResult> {
    try {
      const response = await axios.post(
        `${this.inventoryServiceUrl}/api/inventory/check`,
        {
          medication,
          quantity,
          pharmacyId,
        },
        {
          timeout: 5000,
        }
      );

      return {
        available: response.data.available || false,
        currentStock: response.data.currentStock || 0,
        medication,
      };
    } catch (error) {
      console.error('Stock check failed:', error);
      // Return unavailable on error (conservative approach)
      return {
        available: false,
        currentStock: 0,
        medication,
      };
    }
  }

  /**
   * Validate prescription for medication order
   */
  async validatePrescription(
    patientId: string,
    medication: string,
    dosage: string
  ): Promise<PrescriptionValidationResult> {
    try {
      const response = await axios.post(
        `${this.prescriptionServiceUrl}/api/prescriptions/validate`,
        {
          patientId,
          medication,
          dosage,
        },
        {
          timeout: 5000,
        }
      );

      return {
        valid: response.data.valid || false,
        prescriptionId: response.data.prescriptionId,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Prescription validation failed:', error);
      // Return invalid on error (conservative approach)
      return {
        valid: false,
        message: 'Validation service unavailable',
      };
    }
  }

  /**
   * Create delivery for order
   */
  async createDelivery(order: NurseOrder): Promise<DeliveryCreationResult> {
    try {
      const response = await axios.post(
        `${this.deliveryServiceUrl}/deliveries`,
        {
          user_id: order.patientId,
          order_id: order.id,
          delivery_address_encrypted: 'encrypted_address', // TODO: Implement encryption
          delivery_notes_encrypted: order.instructions ? 'encrypted_notes' : null,
          scheduled_at: null, // Immediate delivery
        },
        {
          timeout: 5000,
        }
      );

      return {
        deliveryId: response.data.id,
        trackingNumber: response.data.tracking_number || response.data.id,
        estimatedDelivery: response.data.scheduled_at
          ? new Date(response.data.scheduled_at)
          : undefined,
      };
    } catch (error) {
      console.error('Delivery creation failed:', error);
      throw new Error('Failed to create delivery');
    }
  }

  /**
   * Publish order event (for event-driven architecture)
   * In a real system, this would publish to a message queue (RabbitMQ, Kafka, etc.)
   */
  async publishOrderEvent(eventType: string, order: NurseOrder): Promise<void> {
    console.log(`[Event] ${eventType}:`, {
      orderId: order.id,
      status: order.status,
      patientId: order.patientId,
      medication: order.medication,
    });

    // TODO: Implement actual message queue publishing
    // Example:
    // await messageQueue.publish('nurse.orders', {
    //   type: eventType,
    //   data: order,
    //   timestamp: new Date(),
    // });
  }

  /**
   * Complete order workflow
   * Performs all necessary checks and integrations
   */
  async processOrderWorkflow(order: NurseOrder): Promise<{
    stockCheck: StockCheckResult;
    prescriptionValidation: PrescriptionValidationResult;
    canProceed: boolean;
  }> {
    // Check stock availability
    const stockCheck = await this.checkStock(
      order.medication,
      order.quantity,
      order.pharmacyId
    );

    // Validate prescription
    const prescriptionValidation = await this.validatePrescription(
      order.patientId,
      order.medication,
      order.dosage
    );

    // Determine if order can proceed
    const canProceed = stockCheck.available && prescriptionValidation.valid;

    // Publish event
    await this.publishOrderEvent('order.workflow.completed', order);

    return {
      stockCheck,
      prescriptionValidation,
      canProceed,
    };
  }
}
