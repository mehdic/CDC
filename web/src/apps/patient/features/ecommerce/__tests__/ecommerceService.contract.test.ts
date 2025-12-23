/**
 * E-Commerce Service Contract Tests
 * Validates API contracts and response shapes
 * Task: T8-038 - Patient E-Commerce Product Catalog
 */

import {
  getProducts,
  getProductById,
  searchProducts,
  getCategories,
  getCategoryById,
} from '../services/ecommerceService';
import { apiClient } from '@/shared/api/client';

// Mock the API client
jest.mock('@/shared/api/client');

describe('E-Commerce Service Contract Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Product Endpoints Contract', () => {
    it('should have correct getProducts response contract', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: '1',
              name: 'Product 1',
              sku: 'SKU001',
              price: 10.99,
              stock: 5,
              category_id: 'cat1',
              category: { id: 'cat1', name: 'Category 1' },
              description: 'Description',
              manufacturer: 'Manufacturer',
              original_price: 12.99,
              low_stock_threshold: 10,
              requires_prescription: false,
              image_url: 'https://example.com/image.jpg',
              expiry_date: '2026-12-31',
              rating: 4.5,
              review_count: 10,
              is_active: true,
              is_featured: false,
              created_at: '2025-01-01T00:00:00Z',
              updated_at: '2025-01-01T00:00:00Z',
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            total_pages: 1,
          },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getProducts({ page: 1, limit: 20 });

      // Validate response contract
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toHaveProperty('page');
      expect(result.pagination).toHaveProperty('limit');
      expect(result.pagination).toHaveProperty('total');
      expect(result.pagination).toHaveProperty('total_pages');

      // Validate product object contract
      const product = result.data[0];
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('stock');
      expect(product).toHaveProperty('category_id');
      expect(typeof product.id).toBe('string');
      expect(typeof product.price).toBe('number');
      expect(typeof product.stock).toBe('number');
    });

    it('should have correct getProductById response contract', async () => {
      const mockResponse = {
        data: {
          data: {
            id: '1',
            name: 'Product 1',
            sku: 'SKU001',
            price: 10.99,
            stock: 5,
            category_id: 'cat1',
            description: 'Description',
            manufacturer: 'Manufacturer',
            original_price: 12.99,
            low_stock_threshold: 10,
            requires_prescription: false,
            image_url: 'https://example.com/image.jpg',
            expiry_date: '2026-12-31',
            rating: 4.5,
            review_count: 10,
            is_active: true,
            is_featured: false,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getProductById('1');

      // Validate product contract
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('price');
      expect(result).toHaveProperty('stock');
      expect(result).toHaveProperty('category_id');
    });

    it('should have correct searchProducts response contract', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: '1',
              name: 'Product 1',
              price: 10.99,
              stock: 5,
              category_id: 'cat1',
              sku: 'SKU001',
              description: 'Description',
              manufacturer: 'Manufacturer',
              original_price: null,
              low_stock_threshold: 10,
              requires_prescription: false,
              image_url: null,
              expiry_date: null,
              rating: 4.5,
              review_count: 10,
              is_active: true,
              is_featured: false,
              created_at: '2025-01-01T00:00:00Z',
              updated_at: '2025-01-01T00:00:00Z',
            },
          ],
          query: 'test',
          count: 1,
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await searchProducts('test', 10);

      // Validate search response contract
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('query');
      expect(result).toHaveProperty('count');
      expect(result.query).toBe('test');
      expect(result.count).toBe(1);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Category Endpoints Contract', () => {
    it('should have correct getCategories response contract', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 'cat1',
              name: 'Category 1',
              slug: 'category-1',
              description: 'Category description',
              icon_url: 'https://example.com/icon.png',
              display_order: 1,
              children: [],
              parent_id: null,
              is_active: true,
              created_at: '2025-01-01T00:00:00Z',
              updated_at: '2025-01-01T00:00:00Z',
            },
          ],
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getCategories();

      // Validate response contract
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);

      // Validate category contract
      const category = result.data[0];
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('slug');
      expect(category).toHaveProperty('children');
      expect(Array.isArray(category.children)).toBe(true);
    });

    it('should have correct getCategoryById response contract', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 'cat1',
            name: 'Category 1',
            slug: 'category-1',
            description: 'Category description',
            icon_url: 'https://example.com/icon.png',
            display_order: 1,
            children: [],
            parent_id: null,
            is_active: true,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getCategoryById('cat1');

      // Validate category contract
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('slug');
      expect(result).toHaveProperty('children');
    });
  });

  describe('Validation of Required Fields', () => {
    it('should validate required fields in product response', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: '1',
              name: 'Product',
              price: 10.99,
              stock: 5,
              category_id: 'cat1',
              sku: 'SKU001',
              description: null,
              manufacturer: null,
              original_price: null,
              low_stock_threshold: 10,
              requires_prescription: false,
              image_url: null,
              expiry_date: null,
              rating: 0,
              review_count: 0,
              is_active: true,
              is_featured: false,
              created_at: '2025-01-01T00:00:00Z',
              updated_at: '2025-01-01T00:00:00Z',
            },
          ],
          pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getProducts();

      const product = result.data[0];

      // Required fields
      expect(product.id).toBeDefined();
      expect(product.name).toBeDefined();
      expect(product.price).toBeDefined();
      expect(product.stock).toBeDefined();
      expect(typeof product.stock).toBe('number');
    });

    it('should validate stock availability field types', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: '1',
              name: 'Product',
              price: 10.99,
              stock: 0,
              category_id: 'cat1',
              sku: 'SKU001',
              description: null,
              manufacturer: null,
              original_price: null,
              low_stock_threshold: 10,
              requires_prescription: false,
              image_url: null,
              expiry_date: null,
              rating: 0,
              review_count: 0,
              is_active: true,
              is_featured: false,
              created_at: '2025-01-01T00:00:00Z',
              updated_at: '2025-01-01T00:00:00Z',
            },
          ],
          pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getProducts();

      const product = result.data[0];

      // Stock should be numeric
      expect(typeof product.stock).toBe('number');
      expect(product.stock).toBe(0);

      // Can determine out of stock
      const isOutOfStock = product.stock === 0;
      expect(isOutOfStock).toBe(true);
    });
  });

  describe('Error Handling Contract', () => {
    it('should throw error on API failure', async () => {
      const error = new Error('API Error');
      (apiClient.get as jest.Mock).mockRejectedValue(error);

      await expect(getProducts()).rejects.toThrow('API Error');
    });

    it('should preserve error information', async () => {
      const error = new Error('Not Found');
      (apiClient.get as jest.Mock).mockRejectedValue(error);

      try {
        await getProductById('nonexistent');
        fail('Should have thrown');
      } catch (err) {
        expect((err as Error).message).toBe('Not Found');
      }
    });
  });
});
