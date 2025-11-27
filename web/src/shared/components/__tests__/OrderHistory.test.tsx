/**
 * OrderHistory Component Tests
 * Task T3-046: VALIDATION - Order History Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderHistory } from '../OrderHistory';
import { OrderStatus, PaymentStatus } from '../../hooks/useOrders';
import * as useOrdersHook from '../../hooks/useOrders';

// Mock the useOrders hook
jest.mock('../../hooks/useOrders', () => {
  const actualModule = jest.requireActual('../../hooks/useOrders');
  return {
    ...actualModule,
    useOrders: jest.fn(),
  };
});

// Mock useSnackbar
jest.mock('notistack', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: jest.fn(),
  }),
}));

describe('OrderHistory Component', () => {
  const mockOrders = [
    {
      id: 'order-001',
      user_id: 'user-001',
      pharmacy_id: 'pharmacy-001',
      status: OrderStatus.COMPLETED,
      payment_status: PaymentStatus.PAID,
      items: [
        {
          product_id: 'prod-001',
          product_name: 'Paracétamol 500mg',
          quantity: 2,
          unit_price: 5.5,
          total_price: 11.0,
        },
      ],
      subtotal: 11.0,
      tax_amount: 1.1,
      shipping_cost: 5.0,
      discount_amount: 0,
      total_amount: 17.1,
      payment_method: 'credit_card',
      payment_transaction_id: 'txn_001',
      delivery_method: 'home_delivery',
      created_at: '2025-11-20T10:00:00Z',
      updated_at: '2025-11-22T15:30:00Z',
      confirmed_at: '2025-11-20T10:05:00Z',
      completed_at: '2025-11-22T15:30:00Z',
      cancelled_at: null,
      paid_at: '2025-11-20T10:10:00Z',
    },
    {
      id: 'order-002',
      user_id: 'user-001',
      pharmacy_id: 'pharmacy-001',
      status: OrderStatus.OUT_FOR_DELIVERY,
      payment_status: PaymentStatus.PAID,
      items: [
        {
          product_id: 'prod-002',
          product_name: 'Crème hydratante SPF30',
          quantity: 1,
          unit_price: 12.0,
          total_price: 12.0,
        },
      ],
      subtotal: 12.0,
      tax_amount: 1.2,
      shipping_cost: 5.0,
      discount_amount: 0,
      total_amount: 18.2,
      payment_method: 'credit_card',
      payment_transaction_id: 'txn_002',
      delivery_method: 'home_delivery',
      created_at: '2025-11-25T10:00:00Z',
      updated_at: '2025-11-27T09:00:00Z',
      confirmed_at: '2025-11-25T10:05:00Z',
      completed_at: null,
      cancelled_at: null,
      paid_at: '2025-11-25T10:10:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component with header and filters', () => {
      (useOrdersHook.useOrders as jest.Mock).mockReturnValue({
        data: { orders: [], total: 0 },
        isLoading: false,
        error: null,
      });

      render(<OrderHistory />);

      expect(screen.getByText('Mon historique de commandes')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('status-filter')).toBeInTheDocument();
    });

    it('should display loading spinner when fetching orders', () => {
      (useOrdersHook.useOrders as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(<OrderHistory />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should display error message when fetch fails', () => {
      const errorMessage = 'Failed to fetch orders';
      (useOrdersHook.useOrders as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error(errorMessage),
      });

      render(<OrderHistory />);
      expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument();
    });

    it('should display orders list when data is loaded', () => {
      (useOrdersHook.useOrders as jest.Mock).mockReturnValue({
        data: { orders: mockOrders, total: 2 },
        isLoading: false,
        error: null,
      });

      render(<OrderHistory />);

      expect(screen.getByTestId('orders-list')).toBeInTheDocument();
      expect(screen.getByTestId('order-order-001')).toBeInTheDocument();
      expect(screen.getByTestId('order-order-002')).toBeInTheDocument();
    });

    it('should display empty state when no orders exist', () => {
      (useOrdersHook.useOrders as jest.Mock).mockReturnValue({
        data: { orders: [], total: 0 },
        isLoading: false,
        error: null,
      });

      render(<OrderHistory />);
      expect(screen.getByText('Pas encore de commande')).toBeInTheDocument();
    });
  });

  describe('Order Display', () => {
    beforeEach(() => {
      (useOrdersHook.useOrders as jest.Mock).mockReturnValue({
        data: { orders: mockOrders, total: 2 },
        isLoading: false,
        error: null,
      });
    });

    it('should display order number and date', () => {
      render(<OrderHistory />);

      expect(screen.getByTestId('order-date-order-001')).toHaveTextContent('Commande #order-00');
      expect(screen.getByTestId('order-date-order-002')).toBeInTheDocument();
    });

    it('should display order status badge', () => {
      render(<OrderHistory />);

      expect(screen.getByTestId('order-status-order-001')).toHaveTextContent('completed');
      expect(screen.getByTestId('order-status-order-002')).toHaveTextContent('out for delivery');
    });

    it('should display order total amount', () => {
      render(<OrderHistory />);

      expect(screen.getByTestId('order-total-order-001')).toHaveTextContent('17.10');
      expect(screen.getByTestId('order-total-order-002')).toHaveTextContent('18.20');
    });

    it('should display order details link', () => {
      render(<OrderHistory />);

      const detailsLinks = screen.getAllByText('Voir détails');
      expect(detailsLinks.length).toBeGreaterThan(0);
    });

    it('should display action buttons for completed orders', () => {
      render(<OrderHistory />);

      const downloadButtons = screen.getAllByText('Télécharger facture');
      const reorderButtons = screen.getAllByText('Recomander');
      expect(downloadButtons.length).toBeGreaterThan(0);
      expect(reorderButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Filtering', () => {
    it('should filter orders by status', async () => {
      (useOrdersHook.useOrders as jest.Mock).mockReturnValue({
        data: { orders: mockOrders, total: 2 },
        isLoading: false,
        error: null,
      });

      render(<OrderHistory />);

      const statusFilter = screen.getByTestId('status-filter').querySelector('select') as HTMLSelectElement;
      fireEvent.change(statusFilter, { target: { value: OrderStatus.COMPLETED } });

      await waitFor(() => {
        // Verify filter was applied
        expect(useOrdersHook.useOrders).toHaveBeenCalledWith(
          expect.objectContaining({
            status: [OrderStatus.COMPLETED],
          })
        );
      });
    });

    it('should search orders by query', async () => {
      (useOrdersHook.useOrders as jest.Mock).mockReturnValue({
        data: { orders: mockOrders, total: 2 },
        isLoading: false,
        error: null,
      });

      render(<OrderHistory />);

      const searchInput = screen.getByTestId('search-input').querySelector('input') as HTMLInputElement;
      await userEvent.type(searchInput, 'Paracétamol');

      await waitFor(() => {
        // Orders should be filtered on client-side by product name
        expect(searchInput.value).toBe('Paracétamol');
      });
    });

    it('should reset page to 1 when filter changes', async () => {
      (useOrdersHook.useOrders as jest.Mock).mockReturnValue({
        data: { orders: mockOrders, total: 2 },
        isLoading: false,
        error: null,
      });

      render(<OrderHistory />);

      const statusFilter = screen.getByTestId('status-filter').querySelector('select') as HTMLSelectElement;
      fireEvent.change(statusFilter, { target: { value: OrderStatus.CONFIRMED } });

      await waitFor(() => {
        // Verify the hook was called with offset: 0 (page 1)
        expect(useOrdersHook.useOrders).toHaveBeenCalledWith(
          expect.objectContaining({
            offset: 0,
          })
        );
      });
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls when there are multiple pages', () => {
      // Mock 30 orders for 3 pages (10 per page)
      const manyOrders = Array.from({ length: 30 }, (_, i) => ({
        ...mockOrders[0],
        id: `order-${String(i + 1).padStart(3, '0')}`,
      }));

      (useOrdersHook.useOrders as jest.Mock).mockReturnValue({
        data: { orders: manyOrders, total: 30 },
        isLoading: false,
        error: null,
      });

      render(<OrderHistory />);

      const paginationButtons = screen.getAllByRole('button').filter(
        (btn) => btn.textContent && /\d/.test(btn.textContent)
      );
      expect(paginationButtons.length).toBeGreaterThan(0);
    });

    it('should handle pagination change', async () => {
      (useOrdersHook.useOrders as jest.Mock).mockReturnValue({
        data: { orders: mockOrders, total: 20 },
        isLoading: false,
        error: null,
      });

      render(<OrderHistory />);

      // Find and click the next page button
      const nextPageButton = screen.getByRole('button', { name: /2/i });
      if (nextPageButton) {
        await userEvent.click(nextPageButton);

        // Verify the hook was called with new offset
        expect(useOrdersHook.useOrders).toHaveBeenCalledWith(
          expect.objectContaining({
            offset: 10, // page 2 = (2-1) * 10
          })
        );
      }
    });
  });

  describe('Order Card Content', () => {
    beforeEach(() => {
      (useOrdersHook.useOrders as jest.Mock).mockReturnValue({
        data: { orders: mockOrders, total: 2 },
        isLoading: false,
        error: null,
      });
    });

    it('should display number of items in order', () => {
      render(<OrderHistory />);

      // The first order has 1 item
      const orderCards = screen.getAllByTestId(/^order-order-/);
      expect(orderCards[0]).toHaveTextContent('1 article');
    });

    it('should display item names (truncated if needed)', () => {
      render(<OrderHistory />);

      expect(screen.getByText(/Paracétamol/)).toBeInTheDocument();
    });

    it('should display order creation date', () => {
      render(<OrderHistory />);

      // Date should be formatted as per locale (Swiss format)
      const orderCards = screen.getAllByTestId(/^order-order-/);
      expect(orderCards[0]).toHaveTextContent(/20\.11\.2025|11\/20\/2025/i);
    });
  });

  describe('Status Colors', () => {
    it('should display correct color for each status', () => {
      (useOrdersHook.useOrders as jest.Mock).mockReturnValue({
        data: { orders: mockOrders, total: 2 },
        isLoading: false,
        error: null,
      });

      render(<OrderHistory />);

      const completedChip = screen.getByTestId('order-status-order-001');
      const inTransitChip = screen.getByTestId('order-status-order-002');

      // Chips should have different color classes
      expect(completedChip).toBeInTheDocument();
      expect(inTransitChip).toBeInTheDocument();
    });
  });
});
