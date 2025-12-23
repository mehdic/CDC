/**
 * useProducts Hook
 * Manages product fetching with filtering and pagination
 * Task: T8-038 - Patient E-Commerce Product Catalog
 */

import { useState, useEffect, useCallback } from 'react';
import { getProducts } from '../services/ecommerceService';
import { Product, ProductFilters } from '../types';

interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: Error | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  } | null;
  setFilters: (filters: ProductFilters) => void;
  refetch: () => Promise<void>;
}

export function useProducts(
  initialFilters: ProductFilters = {}
): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  } | null>(null);
  const [filters, setFiltersState] = useState<ProductFilters>(initialFilters);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProducts(filters);
      setProducts(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setProducts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const setFilters = useCallback((newFilters: ProductFilters) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1, // Reset to page 1 when filters change
    }));
  }, []);

  const refetch = useCallback(async () => {
    await fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    pagination,
    setFilters,
    refetch,
  };
}
