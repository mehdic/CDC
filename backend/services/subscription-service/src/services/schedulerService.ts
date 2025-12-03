/**
 * Scheduler Service
 * Handles automated subscription order generation
 * Task T6-016 - Subscription Service Implementation
 */

import { DataSource } from 'typeorm';
import { SubscriptionRepository } from './subscriptionRepository';
import { Subscription } from '../../../../shared/models/Subscription';
import { SubscriptionOrder, SubscriptionOrderStatus } from '../../../../shared/models/SubscriptionOrder';

export interface OrderGenerationResult {
  subscriptionId: string;
  success: boolean;
  orderId?: string;
  error?: string;
}

export class SchedulerService {
  private subscriptionRepo: SubscriptionRepository;
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.subscriptionRepo = new SubscriptionRepository(dataSource);
  }

  /**
   * Process all due subscriptions (run daily via cron)
   */
  async processScheduledOrders(): Promise<OrderGenerationResult[]> {
    const dueSubscriptions = await this.subscriptionRepo.findDueSubscriptions();

    console.log(`[SchedulerService] Found ${dueSubscriptions.length} subscriptions due for processing`);

    const results: OrderGenerationResult[] = [];

    for (const subscription of dueSubscriptions) {
      try {
        const result = await this.generateOrderForSubscription(subscription);
        results.push(result);
      } catch (error: any) {
        console.error(
          `[SchedulerService] Error processing subscription ${subscription.id}:`,
          error
        );
        results.push({
          subscriptionId: subscription.id,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Generate order for a single subscription
   */
  async generateOrderForSubscription(
    subscription: Subscription
  ): Promise<OrderGenerationResult> {
    try {
      // 1. Validate prescription validity (if required)
      const hasValidPrescriptions = await this.validatePrescriptions(subscription);
      if (!hasValidPrescriptions) {
        await this.createFailedSubscriptionOrder(
          subscription.id,
          'Invalid or expired prescriptions'
        );
        return {
          subscriptionId: subscription.id,
          success: false,
          error: 'Invalid or expired prescriptions',
        };
      }

      // 2. Check stock availability
      const hasStock = await this.checkStockAvailability(subscription);
      if (!hasStock) {
        await this.createFailedSubscriptionOrder(
          subscription.id,
          'Insufficient stock for one or more items'
        );
        // Notify patient about delay
        await this.notifyPatientStockDelay(subscription);
        return {
          subscriptionId: subscription.id,
          success: false,
          error: 'Insufficient stock',
        };
      }

      // 3. Process payment
      const paymentResult = await this.processPayment(subscription);
      if (!paymentResult.success) {
        await this.createFailedSubscriptionOrder(
          subscription.id,
          `Payment failed: ${paymentResult.error}`
        );
        // Notify patient about payment failure
        await this.notifyPatientPaymentFailed(subscription);
        return {
          subscriptionId: subscription.id,
          success: false,
          error: `Payment failed: ${paymentResult.error}`,
        };
      }

      // 4. Create order
      const orderId = await this.createOrder(subscription, paymentResult.transactionId);

      // 5. Create successful subscription order record
      await this.createSuccessfulSubscriptionOrder(subscription.id, orderId);

      // 6. Update subscription stats
      const orderTotal = await this.calculateOrderTotal(subscription);
      await this.subscriptionRepo.updateAfterOrderGeneration(subscription.id, orderTotal);

      // 7. Notify patient
      await this.notifyPatientOrderGenerated(subscription, orderId);

      console.log(
        `[SchedulerService] Successfully generated order ${orderId} for subscription ${subscription.id}`
      );

      return {
        subscriptionId: subscription.id,
        success: true,
        orderId,
      };
    } catch (error: any) {
      console.error(
        `[SchedulerService] Unexpected error for subscription ${subscription.id}:`,
        error
      );
      return {
        subscriptionId: subscription.id,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Validate prescriptions for subscription items
   */
  private async validatePrescriptions(subscription: Subscription): Promise<boolean> {
    // Check if any items require prescriptions
    const prescriptionItems = subscription.items.filter(
      (item) => item.requiresPrescription()
    );

    if (prescriptionItems.length === 0) {
      return true; // No prescriptions needed
    }

    // TODO: Implement prescription validation logic
    // - Check prescription expiration date
    // - Check prescription is for correct product
    // - Check refills remaining
    // For now, assume valid
    return true;
  }

  /**
   * Check stock availability for all items
   */
  private async checkStockAvailability(subscription: Subscription): Promise<boolean> {
    // TODO: Integrate with inventory service
    // - Check if all items are in stock
    // - Check if quantities are sufficient
    // For now, assume available
    return true;
  }

  /**
   * Process payment for subscription order
   */
  private async processPayment(
    subscription: Subscription
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // TODO: Integrate with payment service
      // - Use stored payment method
      // - Apply subscription discount
      // - Process payment
      // For now, simulate success

      const mockTransactionId = `txn_${Date.now()}_${subscription.id}`;

      return {
        success: true,
        transactionId: mockTransactionId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create order from subscription
   */
  private async createOrder(
    subscription: Subscription,
    transactionId?: string
  ): Promise<string> {
    // TODO: Integrate with order service
    // - Create order with subscription items
    // - Apply subscription discount
    // - Set delivery address from subscription
    // - Link to payment transaction
    // For now, generate mock order ID

    const mockOrderId = `ord_${Date.now()}_${subscription.id}`;

    return mockOrderId;
  }

  /**
   * Calculate order total with subscription discount
   */
  private async calculateOrderTotal(subscription: Subscription): Promise<number> {
    const subtotal = subscription.items
      .filter((item) => item.isItemActive())
      .reduce((sum, item) => sum + item.getTotalPrice(), 0);

    const discount = (subtotal * Number(subscription.discount_percentage)) / 100;
    const total = subtotal - discount;

    return total;
  }

  /**
   * Create successful subscription order record
   */
  private async createSuccessfulSubscriptionOrder(
    subscriptionId: string,
    orderId: string
  ): Promise<void> {
    const subscriptionOrderRepo = this.dataSource.getRepository(SubscriptionOrder);

    const subscriptionOrder = subscriptionOrderRepo.create({
      subscription_id: subscriptionId,
      order_id: orderId,
      scheduled_date: new Date(),
      status: SubscriptionOrderStatus.COMPLETED,
      processed_at: new Date(),
    });

    await subscriptionOrderRepo.save(subscriptionOrder);
  }

  /**
   * Create failed subscription order record
   */
  private async createFailedSubscriptionOrder(
    subscriptionId: string,
    errorMessage: string
  ): Promise<void> {
    const subscriptionOrderRepo = this.dataSource.getRepository(SubscriptionOrder);

    const subscriptionOrder = subscriptionOrderRepo.create({
      subscription_id: subscriptionId,
      scheduled_date: new Date(),
      status: SubscriptionOrderStatus.FAILED,
      error_message: errorMessage,
      processed_at: new Date(),
    });

    await subscriptionOrderRepo.save(subscriptionOrder);
  }

  /**
   * Notify patient of successful order generation
   */
  private async notifyPatientOrderGenerated(
    subscription: Subscription,
    orderId: string
  ): Promise<void> {
    // TODO: Integrate with notification service
    console.log(
      `[SchedulerService] NOTIFY: Order ${orderId} generated for patient ${subscription.patient_id}`
    );
  }

  /**
   * Notify patient of stock delay
   */
  private async notifyPatientStockDelay(subscription: Subscription): Promise<void> {
    // TODO: Integrate with notification service
    console.log(
      `[SchedulerService] NOTIFY: Stock delay for subscription ${subscription.id}, patient ${subscription.patient_id}`
    );
  }

  /**
   * Notify patient of payment failure
   */
  private async notifyPatientPaymentFailed(subscription: Subscription): Promise<void> {
    // TODO: Integrate with notification service
    console.log(
      `[SchedulerService] NOTIFY: Payment failed for subscription ${subscription.id}, patient ${subscription.patient_id}`
    );
  }

  /**
   * Get processing summary for admin/monitoring
   */
  async getProcessingSummary(): Promise<{
    total_due: number;
    processed: number;
    failed: number;
    pending: number;
  }> {
    const dueSubscriptions = await this.subscriptionRepo.findDueSubscriptions();

    // TODO: Get actual processing stats from subscription_orders table
    return {
      total_due: dueSubscriptions.length,
      processed: 0,
      failed: 0,
      pending: dueSubscriptions.length,
    };
  }
}
