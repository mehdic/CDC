/**
 * OrderDetail Component Tests
 * Task T3-046: VALIDATION - Order History Tests
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderDetail } from '../OrderDetail';
import { OrderStatus, PaymentStatus } from '../../hooks/useOrders';
import * as useOrdersHook from '../../hooks/useOrders';

// Mock the useOrder hook
jest.mock('../../hooks/useOrders', () => {
  const actualModule = jest.requireActual('../../hooks/useOrders');
  return {
    ...actualModule,
    useOrder: jest.fn(),
    useOrders: jest.fn(),
  };
});

describe.skip('OrderDetail Component', () => {
  const mockOrder = {
    id: 'order-001-full-uuid',
    user_id: 'user-001',
    pharmacy_id: 'pharmacy-001',
    status: OrderStatus.OUT_FOR_DELIVERY,
    payment_status: PaymentStatus.PAID,
    items: [
      {
        product_id: 'prod-001',
        product_name: 'Paracétamol 500mg',
        quantity: 2,
        unit_price: 5.5,
        total_price: 11.0,
      },
      {
        product_id: 'prod-002',
        product_name: 'Crème hydratante SPF30',
        quantity: 1,
        unit_price: 12.0,
        total_price: 12.0,
      },
    ],
    subtotal: 23.0,
    tax_amount: 2.3,
    shipping_cost: 5.0,
    discount_amount: 2.0,
    total_amount: 28.3,
    payment_method: 'credit_card',
    payment_transaction_id: 'txn_001',
    delivery_method: 'home_delivery',
    delivery_id: 'deliv_001',
    notes: 'Please ring doorbell twice',
    created_at: '2025-11-20T10:00:00Z',
    updated_at: '2025-11-27T09:00:00Z',
    confirmed_at: '2025-11-20T10:05:00Z',
    completed_at: null,
    cancelled_at: null,
    paid_at: '2025-11-20T10:10:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render loading spinner initially', () => {
      (useOrdersHook.useOrder as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(<OrderDetail orderId="order-001" />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should display error message when order fails to load', () => {
      const errorMessage = 'Failed to load order';
      (useOrdersHook.useOrder as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error(errorMessage),
      });

      render(<OrderDetail orderId="order-001" />);
      expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument();
    });

    it('should display order not found message', () => {
      (useOrdersHook.useOrder as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      render(<OrderDetail orderId="order-invalid" />);
      expect(screen.getByText('Commande introuvable')).toBeInTheDocument();
    });

    it('should render order details when loaded successfully', () => {
      (useOrdersHook.useOrder as jest.Mock).mockReturnValue({
        data: { order: mockOrder },
        isLoading: false,
        error: null,
      });

      render(<OrderDetail orderId="order-001" />);

      expect(screen.getByTestId('order-number')).toBeInTheDocument();
      expect(screen.getByTestId('order-status')).toBeInTheDocument();
    });
  });

  describe('Order Header', () => {
    beforeEach(() => {
      (useOrdersHook.useOrder as jest.Mock).mockReturnValue({
        data: { order: mockOrder },
        isLoading: false,
        error: null,
      });
    });

    it('should display order number', () => {
      render(<OrderDetail orderId="order-001" />);
      expect(screen.getByTestId('order-number')).toHaveTextContent('Commande #order-00');
    });

    it('should display order creation date', () => {
      render(<OrderDetail orderId="order-001" />);
      expect(screen.getByText(/Créée le/)).toBeInTheDocument();
    });

    it('should display current order status', () => {
      render(<OrderDetail orderId="order-001" />);
      const statusChip = screen.getByTestId('order-status');
      expect(statusChip).toHaveTextContent('out for delivery');
    });
  });

  describe('Order Items', () => {
    beforeEach(() => {
      (useOrdersHook.useOrder as jest.Mock).mockReturnValue({
        data: { order: mockOrder },
        isLoading: false,
        error: null,
      });
    });

    it('should display all order items', () => {
      render(<OrderDetail orderId="order-001" />);

      expect(screen.getByTestId('order-item-prod-001')).toBeInTheDocument();
      expect(screen.getByTestId('order-item-prod-002')).toBeInTheDocument();
    });

    it('should display item name, quantity, and price', () => {
      render(<OrderDetail orderId="order-001" />);

      expect(screen.getByTestId('item-name-prod-001')).toHaveTextContent('Paracétamol 500mg');
      expect(screen.getByText(/Quantité: 2 × 5.50/)).toBeInTheDocument();
      expect(screen.getByText('11.00 CHF')).toBeInTheDocument();
    });
  });

  describe('Order Summary', () => {
    beforeEach(() => {
      (useOrdersHook.useOrder as jest.Mock).mockReturnValue({
        data: { order: mockOrder },
        isLoading: false,
        error: null,
      });
    });

    it('should display subtotal', () => {
      render(<OrderDetail orderId="order-001" />);
      expect(screen.getByTestId('order-subtotal')).toHaveTextContent('23.00 CHF');
    });

    it('should display tax amount', () => {
      render(<OrderDetail orderId="order-001" />);
      expect(screen.getByTestId('order-tax')).toHaveTextContent('2.30 CHF');
    });

    it('should display shipping cost', () => {
      render(<OrderDetail orderId="order-001" />);
      expect(screen.getByTestId('order-shipping')).toHaveTextContent('5.00 CHF');
    });

    it('should display discount if applied', () => {
      render(<OrderDetail orderId="order-001" />);
      // Discount should show with negative sign and success color
      expect(screen.getByText(/-2.00 CHF/)).toBeInTheDocument();
    });

    it('should display total amount', () => {
      render(<OrderDetail orderId="order-001" />);
      expect(screen.getByTestId('order-total')).toHaveTextContent('28.30 CHF');
    });
  });

  describe('Order Status Timeline', () => {
    beforeEach(() => {
      (useOrdersHook.useOrder as jest.Mock).mockReturnValue({
        data: { order: mockOrder },
        isLoading: false,
        error: null,
      });
    });

    it('should display status timeline', () => {
      render(<OrderDetail orderId="order-001" />);
      expect(screen.getByTestId('status-timeline')).toBeInTheDocument();
    });

    it('should display all timeline steps', () => {
      render(<OrderDetail orderId="order-001" />);
      expect(screen.getByText('Commande créée')).toBeInTheDocument();
      expect(screen.getByText('Confirmée')).toBeInTheDocument();
      expect(screen.getByText('En traitement')).toBeInTheDocument();
      expect(screen.getByText('Prête à retirer')).toBeInTheDocument();
      expect(screen.getByText('En livraison')).toBeInTheDocument();
      expect(screen.getByText('Livrée')).toBeInTheDocument();
    });
  });

  describe('Payment Information', () => {
    beforeEach(() => {
      (useOrdersHook.useOrder as jest.Mock).mockReturnValue({
        data: { order: mockOrder },
        isLoading: false,
        error: null,
      });
    });

    it('should display payment status', () => {
      render(<OrderDetail orderId="order-001" />);
      expect(screen.getByText('Paiement')).toBeInTheDocument();
    });

    it('should display payment method', () => {
      render(<OrderDetail orderId="order-001" />);
      expect(screen.getByText(/Méthode: credit_card/)).toBeInTheDocument();
    });

    it('should display paid date if payment completed', () => {
      render(<OrderDetail orderId="order-001" />);
      // Payment date should be displayed
      expect(screen.getByText(/Payé le/)).toBeInTheDocument();
    });
  });

  describe('Delivery Information', () => {
    beforeEach(() => {
      (useOrdersHook.useOrder as jest.Mock).mockReturnValue({
        data: { order: mockOrder },
        isLoading: false,
        error: null,
      });
    });

    it('should display delivery method', () => {
      render(<OrderDetail orderId="order-001" />);
      expect(screen.getByText(/Méthode: home_delivery/)).toBeInTheDocument();
    });

    it('should display delivery address info', () => {
      render(<OrderDetail orderId="order-001" />);
      expect(screen.getByTestId('delivery-address')).toBeInTheDocument();
    });

    it('should display delivery ID if available', () => {
      render(<OrderDetail orderId="order-001" />);
      expect(screen.getByText('deliv_001')).toBeInTheDocument();
    });
  });

  describe('Order Actions', () => {
    it('should show download invoice button for completed orders', () => {
      const completedOrder = {
        ...mockOrder,
        status: OrderStatus.COMPLETED,
        completed_at: '2025-11-27T10:00:00Z',
      };

      (useOrdersHook.useOrder as jest.Mock).mockReturnValue({
        data: { order: completedOrder },
        isLoading: false,
        error: null,
      });

      render(<OrderDetail orderId="order-001" />);
      expect(screen.getByTestId('download-invoice-btn')).toBeInTheDocument();
    });

    it('should show reorder button for completed orders', () => {
      const completedOrder = {
        ...mockOrder,
        status: OrderStatus.COMPLETED,
        completed_at: '2025-11-27T10:00:00Z',
      };

      (useOrdersHook.useOrder as jest.Mock).mockReturnValue({
        data: { order: completedOrder },
        isLoading: false,
        error: null,
      });

      render(<OrderDetail orderId="order-001" />);
      expect(screen.getByTestId('reorder-btn')).toBeInTheDocument();
    });

    it('should show cancel button for pending or confirmed orders', () => {
      const pendingOrder = {
        ...mockOrder,
        status: OrderStatus.PENDING,
      };

      (useOrdersHook.useOrder as jest.Mock).mockReturnValue({
        data: { order: pendingOrder },
        isLoading: false,
        error: null,
      });

      render(<OrderDetail orderId="order-001" />);
      expect(screen.getByTestId('cancel-btn')).toBeInTheDocument();
    });

    it('should show return button for in-transit or completed orders', () => {
      (useOrdersHook.useOrder as jest.Mock).mockReturnValue({
        data: { order: mockOrder },
        isLoading: false,
        error: null,
      });

      render(<OrderDetail orderId="order-001" />);
      expect(screen.getByTestId('return-btn')).toBeInTheDocument();
    });
  });

  describe('Order Notes and Cancellation Reason', () => {
    it('should display order notes if present', () => {
      (useOrdersHook.useOrder as jest.Mock).mockReturnValue({
        data: { order: mockOrder },
        isLoading: false,
        error: null,
      });

      render(<OrderDetail orderId="order-001" />);
      expect(screen.getByText('Please ring doorbell twice')).toBeInTheDocument();
    });

    it('should display cancellation reason for cancelled orders', () => {
      const cancelledOrder = {
        ...mockOrder,
        status: OrderStatus.CANCELLED,
        cancelled_at: '2025-11-21T10:00:00Z',
        cancellation_reason: 'Customer requested cancellation',
      };

      (useOrdersHook.useOrder as jest.Mock).mockReturnValue({
        data: { order: cancelledOrder },
        isLoading: false,
        error: null,
      });

      render(<OrderDetail orderId="order-001" />);
      expect(screen.getByText('Customer requested cancellation')).toBeInTheDocument();
    });
  });

  describe('Reorder Dialog', () => {
    beforeEach(() => {
      const completedOrder = {
        ...mockOrder,
        status: OrderStatus.COMPLETED,
        completed_at: '2025-11-27T10:00:00Z',
      };

      (useOrdersHook.useOrder as jest.Mock).mockReturnValue({
        data: { order: completedOrder },
        isLoading: false,
        error: null,
      });
    });

    it('should open reorder dialog when reorder button clicked', async () => {
      render(<OrderDetail orderId="order-001" />);

      const reorderButton = screen.getByTestId('reorder-btn');
      await userEvent.click(reorderButton);

      await waitFor(() => {
        expect(screen.getByText(/seront ajoutés à votre panier/)).toBeInTheDocument();
      });
    });

    it('should display number of items in reorder dialog', async () => {
      render(<OrderDetail orderId="order-001" />);

      const reorderButton = screen.getByTestId('reorder-btn');
      await userEvent.click(reorderButton);

      await waitFor(() => {
        expect(screen.getByText(/3 article\(s\)/)).toBeInTheDocument();
      });
    });
  });
});
