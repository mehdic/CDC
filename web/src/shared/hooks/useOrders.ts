/**
 * Orders Hook
 * Custom hook for managing order data from order-service
 */

import { useFetchList, useFetchItem, useApiMutation, ApiError } from './useApi';

// ============================================================================
// Types
// ============================================================================

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: string;
  pharmacy_id: string;
  user_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  items: OrderItem[];
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  discount_amount: number;
  total_amount: number;
  payment_method?: string;
  payment_transaction_id?: string;
  delivery_method?: string;
  delivery_id?: string;
  notes?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  paid_at?: string;
}

export interface OrderFilters {
  status?: OrderStatus[];
  payment_status?: PaymentStatus[];
  limit?: number;
  offset?: number;
}

export interface OrdersResponse {
  success: boolean;
  orders: Order[];
  total: number;
}

export interface OrderResponse {
  success: boolean;
  order: Order;
}

export interface SalesReport {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    name: string;
    revenue: number;
  }>;
}

export interface SalesReportResponse {
  success: boolean;
  report: SalesReport;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fetch list of orders with optional filters
 */
export function useOrders(filters?: OrderFilters) {
  return useFetchList<OrdersResponse>('ecommerce/orders', filters, {
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true,
  });
}

/**
 * Fetch single order by ID
 */
export function useOrder(orderId: string) {
  return useFetchItem<OrderResponse>('ecommerce/orders', orderId, {
    enabled: !!orderId,
    staleTime: 1000 * 60,
  });
}

/**
 * Process order (mark as processing)
 */
export function useProcessOrder() {
  return useApiMutation<{ success: boolean }, { orderId: string }>(
    '/ecommerce/orders/process',
    {
      method: 'POST',
    }
  );
}

/**
 * Handle order return
 */
export function useReturnOrder() {
  return useApiMutation<
    { success: boolean },
    { orderId: string; reason: string }
  >('/ecommerce/orders/return', {
    method: 'POST',
  });
}

/**
 * Process refund for returned order
 */
export function useRefundOrder() {
  return useApiMutation<{ success: boolean }, { orderId: string }>(
    '/ecommerce/orders/refund',
    {
      method: 'POST',
    }
  );
}

/**
 * Generate sales report
 */
export function useSalesReport(dateRange?: { start: string; end: string }) {
  return useFetchList<SalesReportResponse>(
    'ecommerce/reports/sales',
    dateRange,
    {
      enabled: !!dateRange,
      staleTime: 1000 * 60 * 10, // 10 minutes
    }
  );
}
