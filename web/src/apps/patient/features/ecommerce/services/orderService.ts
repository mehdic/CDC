/**
 * Order Service
 * API calls for order history, order details, and invoice download
 * Task: T8-040 - Patient E-Commerce Order History
 */

import { apiClient } from '@/shared/api/client';
import {
  Order,
  OrderListResponse,
  OrderFilters,
} from '../types';

const ORDERS_ENDPOINT = '/orders';

/**
 * Get list of orders with filters and pagination
 */
export async function getOrders(
  filters: OrderFilters = {}
): Promise<OrderListResponse> {
  try {
    const params = new URLSearchParams();

    if (filters.page !== undefined) {
      params.append('page', filters.page.toString());
    }
    if (filters.limit !== undefined) {
      params.append('limit', filters.limit.toString());
    }
    if (filters.status) {
      params.append('status', filters.status);
    }
    if (filters.start_date) {
      params.append('start_date', filters.start_date);
    }
    if (filters.end_date) {
      params.append('end_date', filters.end_date);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.sort_by) {
      params.append('sort_by', filters.sort_by);
    }
    if (filters.sort_order) {
      params.append('sort_order', filters.sort_order);
    }

    const queryString = params.toString();
    const url = queryString
      ? `${ORDERS_ENDPOINT}?${queryString}`
      : ORDERS_ENDPOINT;

    const response = await apiClient.get<OrderListResponse>(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}

/**
 * Get order details by ID
 */
export async function getOrderById(id: string): Promise<Order> {
  try {
    const response = await apiClient.get<{ data: Order }>(
      `${ORDERS_ENDPOINT}/${id}`
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
}

/**
 * Reorder items from a previous order (add to cart)
 */
export async function reorderItems(orderId: string): Promise<void> {
  try {
    await apiClient.post(`${ORDERS_ENDPOINT}/${orderId}/reorder`);
  } catch (error) {
    console.error('Error reordering items:', error);
    throw error;
  }
}

/**
 * Download invoice PDF for an order
 */
export async function downloadInvoice(orderId: string): Promise<Blob> {
  try {
    const response = await apiClient.get(
      `${ORDERS_ENDPOINT}/${orderId}/invoice`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error downloading invoice:', error);
    throw error;
  }
}

/**
 * Cancel a pending order
 */
export async function cancelOrder(orderId: string): Promise<void> {
  try {
    await apiClient.post(`${ORDERS_ENDPOINT}/${orderId}/cancel`);
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }
}
