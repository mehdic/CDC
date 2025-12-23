/**
 * OrderHistory Integration Tests
 * Tests for OrderHistory page with all components
 * Task: T8-040 - Patient E-Commerce Order History
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { OrderHistory } from '../pages/OrderHistory';
import * as orderService from '../services/orderService';

jest.mock('../services/orderService');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('OrderHistory Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render order history page with orders', async () => {
    const mockResponse = {
      data: [
        {
          id: 'order_001',
          order_number: 'ORD-001',
          patient_id: 'patient_123',
          status: 'delivered' as const,
          items: [
            {
              id: 'item_001',
              product_id: 'prod_001',
              product_name: 'Paracetamol',
              product_image_url: null,
              quantity: 2,
              unit_price: 5.5,
              total_price: 11.0,
              sku: 'PARA-500',
            },
          ],
          subtotal: 11.0,
          tax: 1.1,
          shipping: 5.0,
          total: 17.1,
          delivery_address: {
            street: '123 Main St',
            city: 'Geneva',
            postalCode: '1200',
          },
          delivery_date: '2025-11-20',
          estimated_delivery: null,
          tracking_number: 'TRACK123',
          notes: null,
          created_at: '2025-11-15T10:00:00Z',
          updated_at: '2025-11-20T15:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        total_pages: 1,
      },
    };

    jest.mocked(orderService.getOrders).mockResolvedValue(mockResponse);

    render(
      <BrowserRouter>
        <OrderHistory />
      </BrowserRouter>
    );

    expect(screen.getByText('Historique des commandes')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('orders-list')).toBeInTheDocument();
    });

    expect(screen.getByText(/ORD-001/)).toBeInTheDocument();
    expect(screen.getByText(/CHF 17.10/)).toBeInTheDocument();
  });

  it('should display empty state when no orders', async () => {
    const mockResponse = {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 0,
      },
    };

    jest.mocked(orderService.getOrders).mockResolvedValue(mockResponse);

    render(
      <BrowserRouter>
        <OrderHistory />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('no-orders-message')).toBeInTheDocument();
    });

    expect(screen.getByText(/Aucune commande trouvée/)).toBeInTheDocument();
  });

  it('should filter orders by status', async () => {
    const mockResponse = {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 0,
      },
    };

    jest.mocked(orderService.getOrders).mockResolvedValue(mockResponse);

    render(
      <BrowserRouter>
        <OrderHistory />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status-filter')).toBeInTheDocument();
    });

    const statusFilter = screen.getByTestId('status-filter') as HTMLSelectElement;
    fireEvent.change(statusFilter, { target: { value: 'delivered' } });

    await waitFor(() => {
      expect(orderService.getOrders).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'delivered', page: 1 })
      );
    });
  });

  it('should navigate to order detail when clicking on order', async () => {
    const mockResponse = {
      data: [
        {
          id: 'order_001',
          order_number: 'ORD-001',
          patient_id: 'patient_123',
          status: 'delivered' as const,
          items: [],
          subtotal: 11.0,
          tax: 1.1,
          shipping: 5.0,
          total: 17.1,
          delivery_address: {
            street: '123 Main St',
            city: 'Geneva',
            postalCode: '1200',
          },
          delivery_date: '2025-11-20',
          estimated_delivery: null,
          tracking_number: null,
          notes: null,
          created_at: '2025-11-15T10:00:00Z',
          updated_at: '2025-11-20T15:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        total_pages: 1,
      },
    };

    jest.mocked(orderService.getOrders).mockResolvedValue(mockResponse);

    render(
      <BrowserRouter>
        <OrderHistory />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('order-order_001')).toBeInTheDocument();
    });

    const orderCard = screen.getByTestId('order-order_001');
    fireEvent.click(orderCard);

    expect(mockNavigate).toHaveBeenCalledWith('/orders/order_001');
  });

  it('should handle loading state', () => {
    jest.mocked(orderService.getOrders).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <BrowserRouter>
        <OrderHistory />
      </BrowserRouter>
    );

    expect(screen.getByText(/Chargement des commandes.../)).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    const error = new Error('Failed to fetch orders');
    jest.mocked(orderService.getOrders).mockRejectedValue(error);

    render(
      <BrowserRouter>
        <OrderHistory />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Erreur de chargement/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Failed to fetch orders/)).toBeInTheDocument();
  });

  it('should search orders by order number', async () => {
    const mockResponse = {
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 0,
      },
    };

    jest.mocked(orderService.getOrders).mockResolvedValue(mockResponse);

    render(
      <BrowserRouter>
        <OrderHistory />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'ORD-001' } });

    const form = searchInput.closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(orderService.getOrders).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'ORD-001', page: 1 })
      );
    });
  });
});
