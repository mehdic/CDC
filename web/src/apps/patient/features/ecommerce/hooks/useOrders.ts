/**
 * useOrders Hook
 * React hook for managing order list state with filters and pagination
 * Task: T8-040 - Patient E-Commerce Order History
 */

import { useState, useEffect } from 'react';
import { Order, OrderFilters } from '../types';
import { getOrders } from '../services/orderService';

interface UseOrdersResult {
  orders: Order[];
  loading: boolean;
  error: Error | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => Promise<void>;
}

export function useOrders(filters: OrderFilters = {}): UseOrdersResult {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const fetchOrders = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await getOrders(filters);
      setOrders(response.data);
      setPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        totalPages: response.pagination.total_pages,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch orders'));
      setOrders([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [
    filters.page,
    filters.limit,
    filters.status,
    filters.start_date,
    filters.end_date,
    filters.search,
    filters.sort_by,
    filters.sort_order,
  ]);

  return {
    orders,
    loading,
    error,
    pagination,
    refetch: fetchOrders,
  };
}
