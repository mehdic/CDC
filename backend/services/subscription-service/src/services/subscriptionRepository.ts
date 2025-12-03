/**
 * Subscription Repository
 * Data access layer for subscription operations
 * Task T6-016 - Subscription Service Implementation
 */

import { DataSource, Repository, Between, LessThanOrEqual } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
  SubscriptionFrequency,
} from '../../../../shared/models/Subscription';
import { SubscriptionItem } from '../../../../shared/models/SubscriptionItem';
import { SubscriptionOrder } from '../../../../shared/models/SubscriptionOrder';

export interface CreateSubscriptionDTO {
  patient_id: string;
  pharmacy_id: string;
  name: string;
  frequency: SubscriptionFrequency;
  custom_interval_days?: number;
  next_delivery_date?: Date;
  payment_method_id?: string;
  delivery_address_id?: string;
  notes?: string;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    prescription_id?: string;
  }>;
}

export interface UpdateSubscriptionDTO {
  name?: string;
  frequency?: SubscriptionFrequency;
  custom_interval_days?: number;
  next_delivery_date?: Date;
  payment_method_id?: string;
  delivery_address_id?: string;
  notes?: string;
}

export class SubscriptionRepository {
  private subscriptionRepo: Repository<Subscription>;
  private subscriptionItemRepo: Repository<SubscriptionItem>;
  private subscriptionOrderRepo: Repository<SubscriptionOrder>;

  constructor(dataSource: DataSource) {
    this.subscriptionRepo = dataSource.getRepository(Subscription);
    this.subscriptionItemRepo = dataSource.getRepository(SubscriptionItem);
    this.subscriptionOrderRepo = dataSource.getRepository(SubscriptionOrder);
  }

  /**
   * Create a new subscription with items
   */
  async create(dto: CreateSubscriptionDTO): Promise<Subscription> {
    const subscription = this.subscriptionRepo.create({
      patient_id: dto.patient_id,
      pharmacy_id: dto.pharmacy_id,
      name: dto.name,
      frequency: dto.frequency,
      custom_interval_days: dto.custom_interval_days,
      payment_method_id: dto.payment_method_id,
      delivery_address_id: dto.delivery_address_id,
      notes: dto.notes,
      status: SubscriptionStatus.ACTIVE,
    });

    // Set next delivery date
    if (dto.next_delivery_date) {
      subscription.next_delivery_date = dto.next_delivery_date;
    } else {
      subscription.setNextDeliveryDate();
    }

    // Calculate and set discount percentage
    subscription.discount_percentage = subscription.calculateDiscountPercentage();

    // Save subscription
    const savedSubscription = await this.subscriptionRepo.save(subscription);

    // Create subscription items
    const items = dto.items.map((item) =>
      this.subscriptionItemRepo.create({
        subscription_id: savedSubscription.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        prescription_id: item.prescription_id,
        is_active: true,
      })
    );

    await this.subscriptionItemRepo.save(items);

    // Reload with items
    return this.findById(savedSubscription.id)!;
  }

  /**
   * Find subscription by ID with items
   */
  async findById(id: string): Promise<Subscription | null> {
    return this.subscriptionRepo.findOne({
      where: { id },
      relations: ['items', 'orders'],
    });
  }

  /**
   * Find subscriptions by patient ID
   */
  async findByPatientId(
    patientId: string,
    includeInactive = false
  ): Promise<Subscription[]> {
    const where: any = { patient_id: patientId };

    if (!includeInactive) {
      where.status = SubscriptionStatus.ACTIVE;
    }

    return this.subscriptionRepo.find({
      where,
      relations: ['items'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Find subscriptions by pharmacy ID
   */
  async findByPharmacyId(
    pharmacyId: string,
    status?: SubscriptionStatus
  ): Promise<Subscription[]> {
    const where: any = { pharmacy_id: pharmacyId };

    if (status) {
      where.status = status;
    }

    return this.subscriptionRepo.find({
      where,
      relations: ['items', 'patient'],
      order: { next_delivery_date: 'ASC' },
    });
  }

  /**
   * Find subscriptions due for processing
   */
  async findDueSubscriptions(): Promise<Subscription[]> {
    const now = new Date();

    return this.subscriptionRepo.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        next_delivery_date: LessThanOrEqual(now),
      },
      relations: ['items', 'patient', 'pharmacy'],
    });
  }

  /**
   * Update subscription
   */
  async update(id: string, dto: UpdateSubscriptionDTO): Promise<Subscription | null> {
    const subscription = await this.findById(id);

    if (!subscription) {
      return null;
    }

    Object.assign(subscription, dto);

    // Recalculate discount if frequency changed
    if (dto.frequency) {
      subscription.discount_percentage = subscription.calculateDiscountPercentage();
    }

    await this.subscriptionRepo.save(subscription);

    return this.findById(id);
  }

  /**
   * Pause subscription
   */
  async pause(id: string): Promise<Subscription | null> {
    const subscription = await this.findById(id);

    if (!subscription) {
      return null;
    }

    subscription.pause();
    await this.subscriptionRepo.save(subscription);

    return subscription;
  }

  /**
   * Resume subscription
   */
  async resume(id: string): Promise<Subscription | null> {
    const subscription = await this.findById(id);

    if (!subscription) {
      return null;
    }

    subscription.resume();
    await this.subscriptionRepo.save(subscription);

    return subscription;
  }

  /**
   * Cancel subscription
   */
  async cancel(id: string, reason?: string): Promise<Subscription | null> {
    const subscription = await this.findById(id);

    if (!subscription) {
      return null;
    }

    subscription.cancel(reason);
    await this.subscriptionRepo.save(subscription);

    return subscription;
  }

  /**
   * Skip next delivery
   */
  async skipNextDelivery(id: string): Promise<Subscription | null> {
    const subscription = await this.findById(id);

    if (!subscription) {
      return null;
    }

    subscription.skipNextDelivery();
    await this.subscriptionRepo.save(subscription);

    return subscription;
  }

  /**
   * Delete subscription (hard delete)
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.subscriptionRepo.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Add item to subscription
   */
  async addItem(
    subscriptionId: string,
    item: {
      product_id: string;
      quantity: number;
      unit_price: number;
      prescription_id?: string;
    }
  ): Promise<SubscriptionItem> {
    const subscriptionItem = this.subscriptionItemRepo.create({
      subscription_id: subscriptionId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      prescription_id: item.prescription_id,
      is_active: true,
    });

    return this.subscriptionItemRepo.save(subscriptionItem);
  }

  /**
   * Update subscription item
   */
  async updateItem(
    itemId: string,
    updates: {
      quantity?: number;
      unit_price?: number;
      is_active?: boolean;
    }
  ): Promise<SubscriptionItem | null> {
    const item = await this.subscriptionItemRepo.findOne({ where: { id: itemId } });

    if (!item) {
      return null;
    }

    Object.assign(item, updates);
    return this.subscriptionItemRepo.save(item);
  }

  /**
   * Remove item from subscription
   */
  async removeItem(itemId: string): Promise<boolean> {
    const result = await this.subscriptionItemRepo.delete(itemId);
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Get subscription orders
   */
  async getSubscriptionOrders(subscriptionId: string): Promise<SubscriptionOrder[]> {
    return this.subscriptionOrderRepo.find({
      where: { subscription_id: subscriptionId },
      order: { scheduled_date: 'DESC' },
    });
  }

  /**
   * Update subscription after order generation
   */
  async updateAfterOrderGeneration(
    subscriptionId: string,
    orderTotal: number
  ): Promise<Subscription | null> {
    const subscription = await this.findById(subscriptionId);

    if (!subscription) {
      return null;
    }

    subscription.incrementOrderCount(orderTotal);
    subscription.setNextDeliveryDate(subscription.next_delivery_date);
    await this.subscriptionRepo.save(subscription);

    return subscription;
  }

  /**
   * Get subscription statistics
   */
  async getStatistics(subscriptionId: string): Promise<{
    total_orders: number;
    total_savings: number;
    average_order_value: number;
    next_delivery_date: Date;
  } | null> {
    const subscription = await this.findById(subscriptionId);

    if (!subscription) {
      return null;
    }

    const orders = await this.getSubscriptionOrders(subscriptionId);
    const completedOrders = orders.filter((o) => o.isCompleted());

    // Calculate average order value (simplified, would need Order data)
    const averageOrderValue =
      subscription.total_orders > 0
        ? Number(subscription.total_savings) / subscription.total_orders
        : 0;

    return {
      total_orders: subscription.total_orders,
      total_savings: Number(subscription.total_savings),
      average_order_value: averageOrderValue,
      next_delivery_date: subscription.next_delivery_date,
    };
  }
}
