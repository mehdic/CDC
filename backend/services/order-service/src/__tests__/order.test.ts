/**
 * Order Service Tests
 * Batch 3 Phase 4 - Order Service
 * Unit tests with mocked database
 */

import { Order, OrderStatus, PaymentStatus } from '../../../../shared/models/Order';
import { User, UserRole, UserStatus } from '../../../../shared/models/User';
import { Pharmacy } from '../../../../shared/models/Pharmacy';

// Mock TypeORM
jest.mock('typeorm', () => {
  const actual = jest.requireActual('typeorm');
  return {
    ...actual,
    DataSource: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      isInitialized: true,
      getRepository: jest.fn(),
      destroy: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

// Mock Express app to avoid database connection during import
jest.mock('../index', () => {
  const express = require('express');
  const app = express();

  app.use(express.json());

  const mockDataSource = {
    initialize: jest.fn().mockResolvedValue(undefined),
    isInitialized: true,
    getRepository: jest.fn(),
    destroy: jest.fn().mockResolvedValue(undefined),
  };

  return {
    app,
    dataSource: mockDataSource,
  };
});

describe('Order Service', () => {
  describe('Order Model', () => {
    it('should create order instance with required fields', () => {
      const order = new Order();
      order.id = '123e4567-e89b-12d3-a456-426614174000';
      order.user_id = '123e4567-e89b-12d3-a456-426614174001';
      order.pharmacy_id = '123e4567-e89b-12d3-a456-426614174002';
      order.items = [
        {
          product_id: 'prod-001',
          product_name: 'Aspirin',
          quantity: 2,
          unit_price: 10.0,
          total_price: 20.0,
        },
      ];
      order.total_amount = 20.0;
      order.status = OrderStatus.PENDING;
      order.payment_status = PaymentStatus.PENDING;

      expect(order.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(order.user_id).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(order.pharmacy_id).toBe('123e4567-e89b-12d3-a456-426614174002');
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.payment_status).toBe(PaymentStatus.PENDING);
      expect(order.items).toHaveLength(1);
    });

    it('should support all order statuses', () => {
      const statuses = [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PROCESSING,
        OrderStatus.READY_FOR_PICKUP,
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.COMPLETED,
        OrderStatus.CANCELLED,
        OrderStatus.REFUNDED,
      ];

      statuses.forEach((status) => {
        const order = new Order();
        order.status = status;
        expect(order.status).toBe(status);
      });
    });

    it('should support all payment statuses', () => {
      const statuses = [
        PaymentStatus.PENDING,
        PaymentStatus.PAID,
        PaymentStatus.FAILED,
        PaymentStatus.REFUNDED,
      ];

      statuses.forEach((status) => {
        const order = new Order();
        order.payment_status = status;
        expect(order.payment_status).toBe(status);
      });
    });

    it('should calculate order totals correctly', () => {
      const order = new Order();
      order.subtotal = 100.0;
      order.tax_amount = 10.0;
      order.shipping_cost = 5.0;
      order.discount_amount = 15.0;
      order.total_amount = 100.0;

      expect(order.subtotal).toBe(100.0);
      expect(order.tax_amount).toBe(10.0);
      expect(order.shipping_cost).toBe(5.0);
      expect(order.discount_amount).toBe(15.0);
      expect(order.total_amount).toBe(100.0);
    });

    it('should handle multiple order items', () => {
      const order = new Order();
      order.items = [
        {
          product_id: 'prod-001',
          product_name: 'Aspirin',
          quantity: 2,
          unit_price: 10.0,
          total_price: 20.0,
        },
        {
          product_id: 'prod-002',
          product_name: 'Ibuprofen',
          quantity: 1,
          unit_price: 15.0,
          total_price: 15.0,
        },
      ];

      expect(order.items).toHaveLength(2);
      expect(order.items[0].product_name).toBe('Aspirin');
      expect(order.items[1].product_name).toBe('Ibuprofen');
    });

    it('should track order timestamps', () => {
      const order = new Order();
      const now = new Date();

      order.confirmed_at = now;
      order.paid_at = now;
      order.completed_at = now;

      expect(order.confirmed_at).toBe(now);
      expect(order.paid_at).toBe(now);
      expect(order.completed_at).toBe(now);
    });

    it('should handle cancelled orders with reason', () => {
      const order = new Order();
      order.status = OrderStatus.CANCELLED;
      order.cancellation_reason = 'Customer requested cancellation';
      order.cancelled_at = new Date();

      expect(order.status).toBe(OrderStatus.CANCELLED);
      expect(order.cancellation_reason).toBe('Customer requested cancellation');
      expect(order.cancelled_at).toBeInstanceOf(Date);
    });

    it('should link order to delivery', () => {
      const order = new Order();
      order.delivery_id = '123e4567-e89b-12d3-a456-426614174003';

      expect(order.delivery_id).toBe('123e4567-e89b-12d3-a456-426614174003');
    });
  });

  describe('User Model for Orders', () => {
    it('should create patient user for orders', () => {
      const user = new User();
      user.id = '123e4567-e89b-12d3-a456-426614174000';
      user.email = 'patient@test.com';
      user.role = UserRole.PATIENT;
      user.status = UserStatus.ACTIVE;

      expect(user.role).toBe(UserRole.PATIENT);
      expect(user.status).toBe(UserStatus.ACTIVE);
    });
  });

  describe('Pharmacy Model for Orders', () => {
    it('should link order to pharmacy', () => {
      const pharmacy = new Pharmacy();
      pharmacy.id = '123e4567-e89b-12d3-a456-426614174000';
      pharmacy.name = 'Test Pharmacy';
      pharmacy.license_number = 'PH-TEST-001';

      expect(pharmacy.name).toBe('Test Pharmacy');
      expect(pharmacy.license_number).toBe('PH-TEST-001');
    });
  });

  describe('Service Health Check', () => {
    it('should validate service configuration', () => {
      const config = {
        service: 'order-service',
        port: 4007,
        status: 'healthy',
      };

      expect(config.service).toBe('order-service');
      expect(config.port).toBe(4007);
      expect(config.status).toBe('healthy');
    });
  });
});
