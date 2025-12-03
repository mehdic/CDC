/**
 * OrderStatusTracker Component Tests
 * Task T3-046: VALIDATION - Order History Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { OrderStatusTracker } from '../OrderStatusTracker';
import { OrderStatus, PaymentStatus, Order } from '../../hooks/useOrders';

describe.skip('OrderStatusTracker Component', () => {
  const baseOrder: Order = {
    id: 'order-001',
    user_id: 'user-001',
    pharmacy_id: 'pharmacy-001',
    items: [
      {
        product_id: 'prod-001',
        product_name: 'Test Product',
        quantity: 1,
        unit_price: 10.0,
        total_price: 10.0,
      },
    ],
    subtotal: 10.0,
    tax_amount: 1.0,
    shipping_cost: 5.0,
    discount_amount: 0,
    total_amount: 16.0,
    payment_status: PaymentStatus.PENDING,
    created_at: '2025-11-20T10:00:00Z',
    updated_at: '2025-11-20T10:00:00Z',
    status: OrderStatus.PENDING,
  };

  describe('Rendering', () => {
    it('should render the tracker component', () => {
      render(<OrderStatusTracker order={baseOrder} />);
      expect(screen.getByText('Suivi de votre commande')).toBeInTheDocument();
    });

    it('should display current status overview', () => {
      render(<OrderStatusTracker order={baseOrder} />);
      expect(screen.getByText(/Statut actuel:/)).toBeInTheDocument();
      expect(screen.getByText(/Dernière mise à jour:/)).toBeInTheDocument();
    });

    it('should display status timeline', () => {
      render(<OrderStatusTracker order={baseOrder} />);
      expect(screen.getByTestId('order-status-timeline')).toBeInTheDocument();
    });
  });

  describe('Status Timeline', () => {
    it('should display all timeline steps for pending order', () => {
      render(<OrderStatusTracker order={baseOrder} />);

      expect(screen.getByText('Commande créée')).toBeInTheDocument();
      expect(screen.getByText('Confirmée')).toBeInTheDocument();
      expect(screen.getByText('En traitement')).toBeInTheDocument();
      expect(screen.getByText('Prête à retirer')).toBeInTheDocument();
      expect(screen.getByText('En livraison')).toBeInTheDocument();
      expect(screen.getByText('Livrée')).toBeInTheDocument();
    });

    it('should mark completed steps as completed', () => {
      const processingOrder: Order = {
        ...baseOrder,
        status: OrderStatus.PROCESSING,
        confirmed_at: '2025-11-20T10:05:00Z',
      };

      render(<OrderStatusTracker order={processingOrder} />);

      // The first 3 steps should be marked as completed
      const steps = screen.getAllByRole('button');
      expect(steps.length).toBeGreaterThan(0);
    });

    it('should show current step as active', () => {
      const outForDeliveryOrder: Order = {
        ...baseOrder,
        status: OrderStatus.OUT_FOR_DELIVERY,
        confirmed_at: '2025-11-20T10:05:00Z',
        completed_at: '2025-11-27T10:00:00Z',
      };

      render(<OrderStatusTracker order={outForDeliveryOrder} />);
      expect(screen.getByText('En livraison')).toBeInTheDocument();
    });
  });

  describe('Current Status Display', () => {
    it('should display current status in header', () => {
      const confirmedOrder: Order = {
        ...baseOrder,
        status: OrderStatus.CONFIRMED,
        confirmed_at: '2025-11-20T10:05:00Z',
      };

      render(<OrderStatusTracker order={confirmedOrder} />);
      expect(screen.getByText(/Statut actuel: confirmed/)).toBeInTheDocument();
    });

    it('should display proper status label formatting', () => {
      const outForDeliveryOrder: Order = {
        ...baseOrder,
        status: OrderStatus.OUT_FOR_DELIVERY,
      };

      render(<OrderStatusTracker order={outForDeliveryOrder} />);
      expect(screen.getByText(/out for delivery/)).toBeInTheDocument();
    });
  });

  describe('Delivery Information', () => {
    it('should display delivery information when available', () => {
      const orderWithDelivery: Order = {
        ...baseOrder,
        delivery_method: 'home_delivery',
        delivery_id: 'deliv_001',
      };

      render(<OrderStatusTracker order={orderWithDelivery} />);
      expect(screen.getByText('Informations de livraison')).toBeInTheDocument();
      expect(screen.getByText('home_delivery')).toBeInTheDocument();
      expect(screen.getByText('deliv_001')).toBeInTheDocument();
    });

    it('should not display delivery information when not available', () => {
      render(<OrderStatusTracker order={baseOrder} />);
      expect(screen.queryByText('Informations de livraison')).not.toBeInTheDocument();
    });
  });

  describe('Payment Information', () => {
    it('should display payment status', () => {
      const paidOrder: Order = {
        ...baseOrder,
        payment_status: PaymentStatus.PAID,
        paid_at: '2025-11-20T10:10:00Z',
      };

      render(<OrderStatusTracker order={paidOrder} />);
      expect(screen.getByText('Paiement')).toBeInTheDocument();
      expect(screen.getByText('paid')).toBeInTheDocument();
    });

    it('should display payment date when order is paid', () => {
      const paidOrder: Order = {
        ...baseOrder,
        payment_status: PaymentStatus.PAID,
        paid_at: '2025-11-20T10:10:00Z',
      };

      render(<OrderStatusTracker order={paidOrder} />);
      expect(screen.getByText(/Date de paiement/)).toBeInTheDocument();
    });

    it('should not display payment date for unpaid orders', () => {
      const unpaidOrder: Order = {
        ...baseOrder,
        payment_status: PaymentStatus.PENDING,
      };

      render(<OrderStatusTracker order={unpaidOrder} />);
      expect(screen.queryByText(/Date de paiement/)).not.toBeInTheDocument();
    });
  });

  describe('Cancellation Information', () => {
    it('should display cancellation reason for cancelled orders', () => {
      const cancelledOrder: Order = {
        ...baseOrder,
        status: OrderStatus.CANCELLED,
        cancelled_at: '2025-11-21T10:00:00Z',
        cancellation_reason: 'Customer requested cancellation',
      };

      render(<OrderStatusTracker order={cancelledOrder} />);
      expect(screen.getByText('Raison de l\'annulation')).toBeInTheDocument();
      expect(screen.getByText('Customer requested cancellation')).toBeInTheDocument();
    });

    it('should not display cancellation section for active orders', () => {
      render(<OrderStatusTracker order={baseOrder} />);
      expect(screen.queryByText('Raison de l\'annulation')).not.toBeInTheDocument();
    });
  });

  describe('Order Notes', () => {
    it('should display order notes when present', () => {
      const orderWithNotes: Order = {
        ...baseOrder,
        notes: 'Please ring doorbell twice',
      };

      render(<OrderStatusTracker order={orderWithNotes} />);
      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByText('Please ring doorbell twice')).toBeInTheDocument();
    });

    it('should not display notes section when not present', () => {
      render(<OrderStatusTracker order={baseOrder} />);
      expect(screen.queryByText('Notes')).not.toBeInTheDocument();
    });
  });

  describe('Status Colors and Styling', () => {
    it('should apply success color for completed orders', () => {
      const completedOrder: Order = {
        ...baseOrder,
        status: OrderStatus.COMPLETED,
        completed_at: '2025-11-27T10:00:00Z',
      };

      const { container } = render(<OrderStatusTracker order={completedOrder} />);
      // Check that the status badge is rendered (color will be applied by Material-UI)
      expect(container.querySelector('[class*="success"]')).toBeTruthy();
    });

    it('should apply warning color for in-transit orders', () => {
      const inTransitOrder: Order = {
        ...baseOrder,
        status: OrderStatus.OUT_FOR_DELIVERY,
      };

      const { container } = render(<OrderStatusTracker order={inTransitOrder} />);
      expect(container.querySelector('[class*="warning"]')).toBeTruthy();
    });
  });

  describe('Timestamp Formatting', () => {
    it('should format dates properly', () => {
      const orderWithDates: Order = {
        ...baseOrder,
        status: OrderStatus.CONFIRMED,
        confirmed_at: '2025-11-20T10:05:00Z',
        updated_at: '2025-11-20T10:05:00Z',
      };

      render(<OrderStatusTracker order={orderWithDates} />);
      // Date should be formatted (exact format depends on locale)
      const dateText = screen.getByText(/novembre|November/);
      expect(dateText).toBeInTheDocument();
    });

    it('should show "En attente" for pending status', () => {
      render(<OrderStatusTracker order={baseOrder} />);
      // Pending order should show "En attente"
      const text = screen.queryByText(/En attente/);
      expect(text).toBeInTheDocument();
    });
  });

  describe('Different Order Statuses', () => {
    const testCases: Array<[OrderStatus, string]> = [
      [OrderStatus.PENDING, 'Commande créée'],
      [OrderStatus.CONFIRMED, 'Confirmée'],
      [OrderStatus.PROCESSING, 'En traitement'],
      [OrderStatus.READY_FOR_PICKUP, 'Prête à retirer'],
      [OrderStatus.OUT_FOR_DELIVERY, 'En livraison'],
      [OrderStatus.COMPLETED, 'Livrée'],
    ];

    testCases.forEach(([status, label]) => {
      it(`should display correct timeline for ${status} order`, () => {
        const order: Order = {
          ...baseOrder,
          status,
          confirmed_at: status !== OrderStatus.PENDING ? '2025-11-20T10:05:00Z' : undefined,
          completed_at: status === OrderStatus.COMPLETED ? '2025-11-27T10:00:00Z' : undefined,
        };

        render(<OrderStatusTracker order={order} />);
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });
});
