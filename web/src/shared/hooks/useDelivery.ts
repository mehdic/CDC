/**
 * useDelivery Hook
 * Custom hook for delivery CRUD operations
 * Integrates with backend delivery-service
 */

import { useState, useCallback } from 'react';

export enum DeliveryStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface Delivery {
  id: string;
  user_id: string;
  order_id: string | null;
  delivery_personnel_id: string | null;
  status: DeliveryStatus;
  tracking_info: Record<string, unknown> | null;
  tracking_number: string | null;
  scheduled_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliveryListResponse {
  deliveries: Delivery[];
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
}

export interface CreateDeliveryPayload {
  user_id: string;
  order_id?: string;
  delivery_address_encrypted: string; // Base64 encoded
  delivery_notes_encrypted?: string; // Base64 encoded
  scheduled_at?: string; // ISO timestamp
}

export interface UpdateDeliveryPayload {
  status?: DeliveryStatus;
  delivery_personnel_id?: string;
  tracking_info?: Record<string, unknown>;
  tracking_number?: string;
  failure_reason?: string;
}

export interface DeliveryFilters {
  status?: DeliveryStatus;
  user_id?: string;
  order_id?: string;
  delivery_personnel_id?: string;
  page?: number;
  limit?: number;
}

const API_BASE_URL = import.meta.env.VITE_DELIVERY_SERVICE_URL || 'http://localhost:3004';

export function useDeliveryData() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [pagination, setPagination] = useState<DeliveryListResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch deliveries with optional filters
   */
  const fetchDeliveries = useCallback(async (filters: DeliveryFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.user_id) queryParams.append('user_id', filters.user_id);
      if (filters.order_id) queryParams.append('order_id', filters.order_id);
      if (filters.delivery_personnel_id) queryParams.append('delivery_personnel_id', filters.delivery_personnel_id);
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());

      const response = await fetch(`${API_BASE_URL}/deliveries?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authentication headers when auth is implemented
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch deliveries: ${response.statusText}`);
      }

      const data: DeliveryListResponse = await response.json();
      setDeliveries(data.deliveries);
      setPagination(data.pagination);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to fetch deliveries');
      console.error('[useDelivery] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch a single delivery by ID
   */
  const fetchDelivery = useCallback(async (id: string): Promise<Delivery | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/deliveries/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch delivery: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to fetch delivery');
      console.error('[useDelivery] Fetch single error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new delivery
   */
  const createDelivery = useCallback(async (payload: CreateDeliveryPayload): Promise<Delivery | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/deliveries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create delivery');
      }

      const newDelivery: Delivery = await response.json();
      setDeliveries((prev) => [newDelivery, ...prev]);
      return newDelivery;
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to create delivery');
      console.error('[useDelivery] Create error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update an existing delivery
   */
  const updateDelivery = useCallback(async (id: string, payload: UpdateDeliveryPayload): Promise<Delivery | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/deliveries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update delivery');
      }

      const updatedDelivery: Delivery = await response.json();
      setDeliveries((prev) => prev.map((d) => (d.id === id ? updatedDelivery : d)));
      return updatedDelivery;
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to update delivery');
      console.error('[useDelivery] Update error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a delivery (only pending or cancelled)
   */
  const deleteDelivery = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/deliveries/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete delivery');
      }

      setDeliveries((prev) => prev.filter((d) => d.id !== id));
      return true;
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to delete delivery');
      console.error('[useDelivery] Delete error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Assign delivery to personnel
   */
  const assignDelivery = useCallback(async (id: string, deliveryPersonnelId: string): Promise<Delivery | null> => {
    return updateDelivery(id, {
      delivery_personnel_id: deliveryPersonnelId,
      status: DeliveryStatus.ASSIGNED,
    });
  }, [updateDelivery]);

  return {
    deliveries,
    pagination,
    loading,
    error,
    fetchDeliveries,
    fetchDelivery,
    createDelivery,
    updateDelivery,
    deleteDelivery,
    assignDelivery,
  };
}
