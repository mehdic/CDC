/**
 * useOrderDetail Hook
 * React hook for managing single order detail state
 * Task: T8-040 - Patient E-Commerce Order History
 */

import { useState, useEffect } from 'react';
import { Order } from '../types';
import { getOrderById } from '../services/orderService';

interface UseOrderDetailResult {
  order: Order | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useOrderDetail(orderId: string): UseOrderDetailResult {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrder = async (): Promise<void> => {
    if (!orderId) {
      setError(new Error('Order ID is required'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getOrderById(orderId);
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch order'));
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  return {
    order,
    loading,
    error,
    refetch: fetchOrder,
  };
}
