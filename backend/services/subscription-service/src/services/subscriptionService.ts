/**
 * Subscription Service
 * Business logic for subscription operations
 * Task T6-016 - Subscription Service Implementation
 */

import { DataSource } from 'typeorm';
import {
  SubscriptionRepository,
  CreateSubscriptionDTO,
  UpdateSubscriptionDTO,
} from './subscriptionRepository';
import { Subscription } from '../../../../shared/models/Subscription';
import { SubscriptionItem } from '../../../../shared/models/SubscriptionItem';

export class SubscriptionService {
  private subscriptionRepo: SubscriptionRepository;

  constructor(dataSource: DataSource) {
    this.subscriptionRepo = new SubscriptionRepository(dataSource);
  }

  /**
   * Create a new subscription
   */
  async createSubscription(dto: CreateSubscriptionDTO): Promise<Subscription> {
    // Validation
    if (!dto.patient_id || !dto.pharmacy_id) {
      throw new Error('Patient ID and Pharmacy ID are required');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new Error('At least one item is required');
    }

    if (dto.frequency === 'custom' && !dto.custom_interval_days) {
      throw new Error('Custom interval days required for custom frequency');
    }

    return this.subscriptionRepo.create(dto);
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(id: string, userId: string, userRole: string): Promise<Subscription | null> {
    const subscription = await this.subscriptionRepo.findById(id);

    if (!subscription) {
      return null;
    }

    // Authorization check
    if (userRole === 'patient' && subscription.patient_id !== userId) {
      throw new Error('Unauthorized: You can only access your own subscriptions');
    }

    if (userRole === 'pharmacist' && subscription.pharmacy_id !== userId) {
      throw new Error('Unauthorized: You can only access subscriptions for your pharmacy');
    }

    return subscription;
  }

  /**
   * List subscriptions by patient
   */
  async listPatientSubscriptions(
    patientId: string,
    includeInactive = false
  ): Promise<Subscription[]> {
    return this.subscriptionRepo.findByPatientId(patientId, includeInactive);
  }

  /**
   * List subscriptions by pharmacy
   */
  async listPharmacySubscriptions(
    pharmacyId: string,
    status?: any
  ): Promise<Subscription[]> {
    return this.subscriptionRepo.findByPharmacyId(pharmacyId, status);
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    id: string,
    dto: UpdateSubscriptionDTO,
    userId: string,
    userRole: string
  ): Promise<Subscription | null> {
    const subscription = await this.getSubscription(id, userId, userRole);

    if (!subscription) {
      return null;
    }

    if (!subscription.isActive()) {
      throw new Error('Cannot update inactive subscription');
    }

    return this.subscriptionRepo.update(id, dto);
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(
    id: string,
    userId: string,
    userRole: string
  ): Promise<Subscription | null> {
    const subscription = await this.getSubscription(id, userId, userRole);

    if (!subscription) {
      return null;
    }

    if (!subscription.isActive()) {
      throw new Error('Subscription is not active');
    }

    return this.subscriptionRepo.pause(id);
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(
    id: string,
    userId: string,
    userRole: string
  ): Promise<Subscription | null> {
    const subscription = await this.getSubscription(id, userId, userRole);

    if (!subscription) {
      return null;
    }

    if (!subscription.isPaused()) {
      throw new Error('Subscription is not paused');
    }

    return this.subscriptionRepo.resume(id);
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    id: string,
    reason: string | undefined,
    userId: string,
    userRole: string
  ): Promise<Subscription | null> {
    const subscription = await this.getSubscription(id, userId, userRole);

    if (!subscription) {
      return null;
    }

    if (subscription.isCancelled()) {
      throw new Error('Subscription is already cancelled');
    }

    return this.subscriptionRepo.cancel(id, reason);
  }

  /**
   * Skip next delivery
   */
  async skipNextDelivery(
    id: string,
    userId: string,
    userRole: string
  ): Promise<Subscription | null> {
    const subscription = await this.getSubscription(id, userId, userRole);

    if (!subscription) {
      return null;
    }

    if (!subscription.isActive()) {
      throw new Error('Can only skip delivery for active subscriptions');
    }

    return this.subscriptionRepo.skipNextDelivery(id);
  }

  /**
   * Delete subscription
   */
  async deleteSubscription(
    id: string,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    const subscription = await this.getSubscription(id, userId, userRole);

    if (!subscription) {
      return false;
    }

    // Only allow deletion if subscription is cancelled
    if (!subscription.isCancelled()) {
      throw new Error('Can only delete cancelled subscriptions');
    }

    return this.subscriptionRepo.delete(id);
  }

  /**
   * Get next delivery preview
   */
  async getNextDeliveryPreview(
    id: string,
    userId: string,
    userRole: string
  ): Promise<{
    subscription_id: string;
    next_delivery_date: Date;
    items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
    }>;
    subtotal: number;
    discount: number;
    estimated_total: number;
  } | null> {
    const subscription = await this.getSubscription(id, userId, userRole);

    if (!subscription) {
      return null;
    }

    const activeItems = subscription.items.filter((item) => item.isItemActive());

    const subtotal = activeItems.reduce((sum, item) => sum + item.getTotalPrice(), 0);

    const discount = (subtotal * Number(subscription.discount_percentage)) / 100;

    const estimated_total = subtotal - discount;

    return {
      subscription_id: subscription.id,
      next_delivery_date: subscription.next_delivery_date,
      items: activeItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
      })),
      subtotal,
      discount,
      estimated_total,
    };
  }

  /**
   * Add item to subscription
   */
  async addItemToSubscription(
    subscriptionId: string,
    item: {
      product_id: string;
      quantity: number;
      unit_price: number;
      prescription_id?: string;
    },
    userId: string,
    userRole: string
  ): Promise<SubscriptionItem> {
    const subscription = await this.getSubscription(subscriptionId, userId, userRole);

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (!subscription.isActive()) {
      throw new Error('Can only add items to active subscriptions');
    }

    return this.subscriptionRepo.addItem(subscriptionId, item);
  }

  /**
   * Update subscription item
   */
  async updateSubscriptionItem(
    subscriptionId: string,
    itemId: string,
    updates: {
      quantity?: number;
      unit_price?: number;
      is_active?: boolean;
    },
    userId: string,
    userRole: string
  ): Promise<SubscriptionItem | null> {
    const subscription = await this.getSubscription(subscriptionId, userId, userRole);

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    return this.subscriptionRepo.updateItem(itemId, updates);
  }

  /**
   * Remove item from subscription
   */
  async removeSubscriptionItem(
    subscriptionId: string,
    itemId: string,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    const subscription = await this.getSubscription(subscriptionId, userId, userRole);

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Check if this is the last item
    if (subscription.items.length <= 1) {
      throw new Error('Cannot remove the last item from a subscription');
    }

    return this.subscriptionRepo.removeItem(itemId);
  }

  /**
   * Get subscription statistics
   */
  async getSubscriptionStatistics(
    id: string,
    userId: string,
    userRole: string
  ): Promise<{
    total_orders: number;
    total_savings: number;
    average_order_value: number;
    next_delivery_date: Date;
  } | null> {
    const subscription = await this.getSubscription(id, userId, userRole);

    if (!subscription) {
      return null;
    }

    return this.subscriptionRepo.getStatistics(id);
  }

  /**
   * Get subscription order history
   */
  async getSubscriptionOrderHistory(
    id: string,
    userId: string,
    userRole: string
  ): Promise<any[]> {
    const subscription = await this.getSubscription(id, userId, userRole);

    if (!subscription) {
      return [];
    }

    return this.subscriptionRepo.getSubscriptionOrders(id);
  }
}
