/**
 * useProducts Hook Tests
 * Task: T8-038 - Patient E-Commerce Product Catalog
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useProducts } from '../hooks/useProducts';
import * as ecommerceService from '../services/ecommerceService';

// Mock the ecommerce service
jest.mock('../services/ecommerceService');

const mockProducts = [
  {
    id: '1',
    name: 'Product 1',
    price: 10.99,
    stock: 5,
    category_id: 'cat1',
  } as any,
  {
    id: '2',
    name: 'Product 2',
    price: 20.99,
    stock: 0,
    category_id: 'cat2',
  } as any,
];

describe('useProducts Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load products on mount', async () => {
    const mockResponse = {
      data: mockProducts,
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        total_pages: 1,
      },
    };

    (ecommerceService.getProducts as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useProducts());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual(mockProducts);
    expect(result.current.pagination).toEqual(mockResponse.pagination);
  });

  it('should handle errors', async () => {
    const error = new Error('Failed to fetch');
    (ecommerceService.getProducts as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.products).toEqual([]);
  });

  it('should update filters', async () => {
    const mockResponse = {
      data: [mockProducts[0]],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        total_pages: 1,
      },
    };

    (ecommerceService.getProducts as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setFilters({ category_id: 'cat1' });
    });

    await waitFor(() => {
      expect(ecommerceService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ category_id: 'cat1' })
      );
    });
  });

  it('should reset page when filters change', async () => {
    (ecommerceService.getProducts as jest.Mock).mockResolvedValue({
      data: mockProducts,
      pagination: { page: 1, limit: 20, total: 2, total_pages: 1 },
    });

    const { result } = renderHook(() => useProducts({ page: 2 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setFilters({ category_id: 'cat1' });
    });

    await waitFor(() => {
      expect(ecommerceService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 })
      );
    });
  });

  it('should refetch products', async () => {
    (ecommerceService.getProducts as jest.Mock).mockResolvedValue({
      data: mockProducts,
      pagination: { page: 1, limit: 20, total: 2, total_pages: 1 },
    });

    const { result } = renderHook(() => useProducts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const callCount = (ecommerceService.getProducts as jest.Mock).mock.calls
      .length;

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(
        (ecommerceService.getProducts as jest.Mock).mock.calls.length
      ).toBeGreaterThan(callCount);
    });
  });
});
