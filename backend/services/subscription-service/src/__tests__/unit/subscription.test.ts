/**
 * Unit Tests - Subscription Logic
 * Task T6-016 - Subscription Service Implementation
 */

import { Subscription, SubscriptionFrequency, SubscriptionStatus } from '../../../../../shared/models/Subscription';

describe('Subscription Model', () => {
  let subscription: Subscription;

  beforeEach(() => {
    subscription = new Subscription();
    subscription.id = 'test-sub-001';
    subscription.patient_id = 'patient-001';
    subscription.pharmacy_id = 'pharmacy-001';
    subscription.name = 'Monthly Blood Pressure Medication';
    subscription.frequency = SubscriptionFrequency.MONTHLY;
    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.next_delivery_date = new Date('2025-01-15');
    subscription.discount_percentage = 10;
    subscription.total_orders = 0;
    subscription.total_savings = 0;
  });

  describe('Status Checks', () => {
    test('isActive() returns true for active subscription', () => {
      expect(subscription.isActive()).toBe(true);
    });

    test('isPaused() returns true for paused subscription', () => {
      subscription.status = SubscriptionStatus.PAUSED;
      expect(subscription.isPaused()).toBe(true);
    });

    test('isCancelled() returns true for cancelled subscription', () => {
      subscription.status = SubscriptionStatus.CANCELLED;
      expect(subscription.isCancelled()).toBe(true);
    });
  });

  describe('State Transitions', () => {
    test('pause() sets status to paused', () => {
      subscription.pause();
      expect(subscription.status).toBe(SubscriptionStatus.PAUSED);
      expect(subscription.paused_at).toBeDefined();
    });

    test('resume() sets status to active', () => {
      subscription.status = SubscriptionStatus.PAUSED;
      subscription.paused_at = new Date();
      subscription.resume();
      expect(subscription.status).toBe(SubscriptionStatus.ACTIVE);
      expect(subscription.paused_at).toBeNull();
    });

    test('cancel() sets status to cancelled with reason', () => {
      const reason = 'No longer needed';
      subscription.cancel(reason);
      expect(subscription.status).toBe(SubscriptionStatus.CANCELLED);
      expect(subscription.cancelled_at).toBeDefined();
      expect(subscription.cancellation_reason).toBe(reason);
    });
  });

  describe('Interval Calculations', () => {
    test('getIntervalDays() returns 7 for weekly', () => {
      subscription.frequency = SubscriptionFrequency.WEEKLY;
      expect(subscription.getIntervalDays()).toBe(7);
    });

    test('getIntervalDays() returns 14 for biweekly', () => {
      subscription.frequency = SubscriptionFrequency.BIWEEKLY;
      expect(subscription.getIntervalDays()).toBe(14);
    });

    test('getIntervalDays() returns 30 for monthly', () => {
      subscription.frequency = SubscriptionFrequency.MONTHLY;
      expect(subscription.getIntervalDays()).toBe(30);
    });

    test('getIntervalDays() returns custom interval for custom frequency', () => {
      subscription.frequency = SubscriptionFrequency.CUSTOM;
      subscription.custom_interval_days = 21;
      expect(subscription.getIntervalDays()).toBe(21);
    });
  });

  describe('Discount Calculations', () => {
    test('calculateDiscountPercentage() returns 0% for weekly', () => {
      subscription.frequency = SubscriptionFrequency.WEEKLY;
      expect(subscription.calculateDiscountPercentage()).toBe(0);
    });

    test('calculateDiscountPercentage() returns 5% for biweekly', () => {
      subscription.frequency = SubscriptionFrequency.BIWEEKLY;
      expect(subscription.calculateDiscountPercentage()).toBe(5);
    });

    test('calculateDiscountPercentage() returns 10% for monthly', () => {
      subscription.frequency = SubscriptionFrequency.MONTHLY;
      expect(subscription.calculateDiscountPercentage()).toBe(10);
    });

    test('calculateDiscountPercentage() returns 10% for custom >= 28 days', () => {
      subscription.frequency = SubscriptionFrequency.CUSTOM;
      subscription.custom_interval_days = 28;
      expect(subscription.calculateDiscountPercentage()).toBe(10);
    });

    test('calculateDiscountPercentage() returns 5% for custom < 28 days', () => {
      subscription.frequency = SubscriptionFrequency.CUSTOM;
      subscription.custom_interval_days = 20;
      expect(subscription.calculateDiscountPercentage()).toBe(5);
    });
  });

  describe('Next Delivery Date', () => {
    test('setNextDeliveryDate() sets date based on frequency', () => {
      const baseDate = new Date('2025-01-01');
      subscription.frequency = SubscriptionFrequency.MONTHLY;
      subscription.setNextDeliveryDate(baseDate);
      const expected = new Date('2025-01-31');
      expect(subscription.next_delivery_date.getDate()).toBe(expected.getDate());
    });

    test('skipNextDelivery() pushes date forward by interval', () => {
      subscription.frequency = SubscriptionFrequency.MONTHLY;
      subscription.next_delivery_date = new Date('2025-01-15');
      subscription.skipNextDelivery();
      const expected = new Date('2025-02-14'); // 30 days later
      expect(subscription.next_delivery_date.getDate()).toBe(expected.getDate());
    });
  });

  describe('Order Processing', () => {
    test('isDueForOrder() returns true when date is past', () => {
      subscription.next_delivery_date = new Date('2020-01-01'); // Past date
      subscription.status = SubscriptionStatus.ACTIVE;
      expect(subscription.isDueForOrder()).toBe(true);
    });

    test('isDueForOrder() returns false when date is future', () => {
      subscription.next_delivery_date = new Date('2099-01-01'); // Future date
      subscription.status = SubscriptionStatus.ACTIVE;
      expect(subscription.isDueForOrder()).toBe(false);
    });

    test('isDueForOrder() returns false when not active', () => {
      subscription.next_delivery_date = new Date('2020-01-01'); // Past date
      subscription.status = SubscriptionStatus.PAUSED;
      expect(subscription.isDueForOrder()).toBe(false);
    });

    test('incrementOrderCount() updates stats correctly', () => {
      const orderTotal = 100;
      subscription.discount_percentage = 10;
      subscription.incrementOrderCount(orderTotal);
      expect(subscription.total_orders).toBe(1);
      expect(subscription.total_savings).toBe(10); // 10% of 100
    });
  });
});

describe('SubscriptionItem Model', () => {
  test('getTotalPrice() calculates correctly', () => {
    const { SubscriptionItem } = require('../../../../../shared/models/SubscriptionItem');
    const item = new SubscriptionItem();
    item.quantity = 3;
    item.unit_price = 15.50;
    expect(item.getTotalPrice()).toBe(46.50);
  });

  test('requiresPrescription() returns true when prescription_id exists', () => {
    const { SubscriptionItem } = require('../../../../../shared/models/SubscriptionItem');
    const item = new SubscriptionItem();
    item.prescription_id = 'prescription-001';
    expect(item.requiresPrescription()).toBe(true);
  });

  test('requiresPrescription() returns false when prescription_id is null', () => {
    const { SubscriptionItem } = require('../../../../../shared/models/SubscriptionItem');
    const item = new SubscriptionItem();
    item.prescription_id = null;
    expect(item.requiresPrescription()).toBe(false);
  });
});

describe('SubscriptionOrder Model', () => {
  test('markAsCompleted() sets correct status and order_id', () => {
    const { SubscriptionOrder } = require('../../../../../shared/models/SubscriptionOrder');
    const order = new SubscriptionOrder();
    const orderId = 'order-001';
    order.markAsCompleted(orderId);
    expect(order.status).toBe('completed');
    expect(order.order_id).toBe(orderId);
    expect(order.processed_at).toBeDefined();
  });

  test('markAsFailed() sets error message', () => {
    const { SubscriptionOrder } = require('../../../../../shared/models/SubscriptionOrder');
    const order = new SubscriptionOrder();
    const error = 'Payment failed';
    order.markAsFailed(error);
    expect(order.status).toBe('failed');
    expect(order.error_message).toBe(error);
    expect(order.processed_at).toBeDefined();
  });
});
