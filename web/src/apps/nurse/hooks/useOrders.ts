/**
 * useOrders Hook
 * Manages medication order data fetching and state
 */

import { useState, useEffect } from 'react';
import { getOrders, getOrderById } from '../services/nurseApi';
import type { MedicationOrder } from '../types/nurse';

export const useOrders = (filters?: {
  status?: string;
  patientId?: string;
  urgency?: string;
}) => {
  const [orders, setOrders] = useState<MedicationOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrders(filters);
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.status, filters?.patientId, filters?.urgency]);

  return { orders, loading, error, refetch: fetchOrders };
};

export const useOrder = (orderId: string | undefined) => {
  const [order, setOrder] = useState<MedicationOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await getOrderById(orderId);
        setOrder(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  return { order, loading, error };
};
