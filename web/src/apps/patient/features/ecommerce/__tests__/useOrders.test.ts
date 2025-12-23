/**
 * useOrders Hook Unit Tests
 * Tests for useOrders hook
 * Task: T8-040 - Patient E-Commerce Order History
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useOrders } from '../hooks/useOrders';
import * as orderService from '../services/orderService';

jest.mock('../services/orderService');

describe('useOrders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch orders on mount', async () => {
    const mockResponse = {
      data: [
        {
          id: 'order_001',
          order_number: 'ORD-001',
          patient_id: 'patient_123',
          status: 'delivered' as const,
          items: [],
          subtotal: 100,
          tax: 10,
          shipping: 5,
          total: 115,
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

    const { result } = renderHook(() => useOrders());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toEqual(mockResponse.data);
    expect(result.current.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
    expect(result.current.error).toBeNull();
  });

  it('should handle errors when fetching orders', async () => {
    const error = new Error('Failed to fetch orders');
    jest.mocked(orderService.getOrders).mockRejectedValue(error);

    const { result } = renderHook(() => useOrders());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toEqual([]);
    expect(result.current.error).toEqual(error);
    expect(result.current.pagination).toBeNull();
  });

  it('should refetch orders when refetch is called', async () => {
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

    const { result } = renderHook(() => useOrders());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(orderService.getOrders).toHaveBeenCalledTimes(1);

    await result.current.refetch();

    expect(orderService.getOrders).toHaveBeenCalledTimes(2);
  });

  it('should fetch orders with filters', async () => {
    const mockResponse = {
      data: [],
      pagination: {
        page: 2,
        limit: 20,
        total: 50,
        total_pages: 3,
      },
    };

    jest.mocked(orderService.getOrders).mockResolvedValue(mockResponse);

    const filters = {
      page: 2,
      limit: 20,
      status: 'delivered' as const,
    };

    const { result } = renderHook(() => useOrders(filters));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(orderService.getOrders).toHaveBeenCalledWith(filters);
  });
});
