/**
 * Order Service Unit Tests
 * Tests for order API service layer
 * Task: T8-040 - Patient E-Commerce Order History
 */

import { apiClient } from '@/shared/api/client';
import {
  getOrders,
  getOrderById,
  reorderItems,
  downloadInvoice,
  cancelOrder,
} from '../services/orderService';
import { Order, OrderListResponse } from '../types';

jest.mock('@/shared/api/client');

describe('orderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrders', () => {
    it('should fetch orders without filters', async () => {
      const mockResponse: OrderListResponse = {
        data: [
          {
            id: 'order_001',
            order_number: 'ORD-001',
            patient_id: 'patient_123',
            status: 'delivered',
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

      jest.mocked(apiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await getOrders();

      expect(apiClient.get).toHaveBeenCalledWith('/orders');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch orders with filters', async () => {
      const mockResponse: OrderListResponse = {
        data: [],
        pagination: {
          page: 2,
          limit: 20,
          total: 50,
          total_pages: 3,
        },
      };

      jest.mocked(apiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await getOrders({
        page: 2,
        limit: 20,
        status: 'delivered',
        search: 'ORD-001',
        start_date: '2025-11-01',
        end_date: '2025-11-30',
        sort_by: 'created_at',
        sort_order: 'DESC',
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/orders?page=2&limit=20&status=delivered&start_date=2025-11-01&end_date=2025-11-30&search=ORD-001&sort_by=created_at&sort_order=DESC'
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors when fetching orders', async () => {
      const error = new Error('Network error');
      jest.mocked(apiClient.get).mockRejectedValue(error);

      await expect(getOrders()).rejects.toThrow('Network error');
    });
  });

  describe('getOrderById', () => {
    it('should fetch order by ID', async () => {
      const mockOrder: Order = {
        id: 'order_001',
        order_number: 'ORD-001',
        patient_id: 'patient_123',
        status: 'delivered',
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
      };

      jest.mocked(apiClient.get).mockResolvedValue({ data: { data: mockOrder } });

      const result = await getOrderById('order_001');

      expect(apiClient.get).toHaveBeenCalledWith('/orders/order_001');
      expect(result).toEqual(mockOrder);
    });

    it('should handle errors when fetching order by ID', async () => {
      const error = new Error('Order not found');
      jest.mocked(apiClient.get).mockRejectedValue(error);

      await expect(getOrderById('invalid_id')).rejects.toThrow('Order not found');
    });
  });

  describe('reorderItems', () => {
    it('should reorder items from an order', async () => {
      jest.mocked(apiClient.post).mockResolvedValue({ data: { success: true } });

      await reorderItems('order_001');

      expect(apiClient.post).toHaveBeenCalledWith('/orders/order_001/reorder');
    });

    it('should handle errors when reordering', async () => {
      const error = new Error('Reorder failed');
      jest.mocked(apiClient.post).mockRejectedValue(error);

      await expect(reorderItems('order_001')).rejects.toThrow('Reorder failed');
    });
  });

  describe('downloadInvoice', () => {
    it('should download invoice as blob', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      jest.mocked(apiClient.get).mockResolvedValue({ data: mockBlob });

      const result = await downloadInvoice('order_001');

      expect(apiClient.get).toHaveBeenCalledWith('/orders/order_001/invoice', {
        responseType: 'blob',
      });
      expect(result).toEqual(mockBlob);
    });

    it('should handle errors when downloading invoice', async () => {
      const error = new Error('Download failed');
      jest.mocked(apiClient.get).mockRejectedValue(error);

      await expect(downloadInvoice('order_001')).rejects.toThrow('Download failed');
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order', async () => {
      jest.mocked(apiClient.post).mockResolvedValue({ data: { success: true } });

      await cancelOrder('order_001');

      expect(apiClient.post).toHaveBeenCalledWith('/orders/order_001/cancel');
    });

    it('should handle errors when cancelling order', async () => {
      const error = new Error('Cancel failed');
      jest.mocked(apiClient.post).mockRejectedValue(error);

      await expect(cancelOrder('order_001')).rejects.toThrow('Cancel failed');
    });
  });
});
