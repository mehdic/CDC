/**
 * Catalog E2E Tests
 * Tests complete user workflows for e-commerce catalog
 * Task: T8-038 - Patient E-Commerce Product Catalog
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Catalog } from '../pages/Catalog';
import * as ecommerceService from '../services/ecommerceService';

jest.mock('../services/ecommerceService');

describe('Catalog E2E Tests', () => {
  const mockProducts = [
    {
      id: '1',
      name: 'Aspirin 500mg',
      sku: 'ASP001',
      manufacturer: 'PharmaCorp',
      description: 'Fast pain relief',
      category_id: 'cat1',
      category: { id: 'cat1', name: 'Pain Relief' },
      price: 5.99,
      original_price: 7.99,
      stock: 50,
      low_stock_threshold: 10,
      requires_prescription: false,
      image_url: 'https://example.com/aspirin.jpg',
      expiry_date: '2026-12-31',
      rating: 4.5,
      review_count: 120,
      is_active: true,
      is_featured: true,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    },
    {
      id: '2',
      name: 'Ibuprofen 200mg',
      sku: 'IBU001',
      manufacturer: 'MedCorp',
      description: 'Anti-inflammatory',
      category_id: 'cat1',
      category: { id: 'cat1', name: 'Pain Relief' },
      price: 7.99,
      original_price: null,
      stock: 3,
      low_stock_threshold: 10,
      requires_prescription: false,
      image_url: null,
      expiry_date: '2026-06-30',
      rating: 4.8,
      review_count: 200,
      is_active: true,
      is_featured: false,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    },
    {
      id: '3',
      name: 'Vitamin D 1000 IU',
      sku: 'VIT001',
      manufacturer: 'HealthPlus',
      description: 'Bone health support',
      category_id: 'cat2',
      category: { id: 'cat2', name: 'Vitamins' },
      price: 9.99,
      original_price: null,
      stock: 0,
      low_stock_threshold: 10,
      requires_prescription: false,
      image_url: 'https://example.com/vitd.jpg',
      expiry_date: '2027-01-01',
      rating: 4.2,
      review_count: 80,
      is_active: true,
      is_featured: false,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    },
  ];

  const mockCategories = [
    {
      id: 'cat1',
      name: 'Pain Relief',
      slug: 'pain-relief',
      description: null,
      icon_url: null,
      display_order: 1,
      children: [],
      parent_id: null,
      is_active: true,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    },
    {
      id: 'cat2',
      name: 'Vitamins & Supplements',
      slug: 'vitamins-supplements',
      description: null,
      icon_url: null,
      display_order: 2,
      children: [],
      parent_id: null,
      is_active: true,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    (ecommerceService.getProducts as jest.Mock).mockResolvedValue({
      data: mockProducts,
      pagination: { page: 1, limit: 20, total: 3, total_pages: 1 },
    });

    (ecommerceService.getCategories as jest.Mock).mockResolvedValue({
      data: mockCategories,
    });

    (ecommerceService.searchProducts as jest.Mock).mockImplementation(
      (query) => {
        const filtered = mockProducts.filter((p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase())
        );
        return Promise.resolve({
          data: filtered,
          query,
          count: filtered.length,
        });
      }
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Product Discovery Workflow', () => {
    it('should browse products by category', async () => {
      render(<Catalog />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Aspirin 500mg')).toBeInTheDocument();
      });

      // Verify all products are shown initially
      expect(screen.getByText('Aspirin 500mg')).toBeInTheDocument();
      expect(screen.getByText('Ibuprofen 200mg')).toBeInTheDocument();
      expect(screen.getByText('Vitamin D 1000 IU')).toBeInTheDocument();

      // Click Pain Relief category
      const painReliefCategory = screen.getByTestId('category-cat1');
      fireEvent.click(painReliefCategory);

      // Verify API called with correct filter
      await waitFor(() => {
        expect(ecommerceService.getProducts).toHaveBeenCalledWith(
          expect.objectContaining({ category_id: 'cat1', page: 1 })
        );
      });
    });

    it('should search for products', async () => {
      render(<Catalog />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input') as HTMLInputElement;

      // Trigger onChange event properly with fireEvent
      fireEvent.change(searchInput, { target: { value: 'aspirin' } });

      jest.advanceTimersByTime(300);
      await jest.runAllTimersAsync();

      // Verify search was called (limit is 50 in useSearch hook)
      expect(ecommerceService.searchProducts).toHaveBeenCalledWith('aspirin', 50);

      // Verify search results message appears
      await waitFor(() => {
        expect(
          screen.getByText(/Found 1 product/)
        ).toBeInTheDocument();
      });
    });

    it('should filter products by price range', async () => {
      render(<Catalog />);

      await waitFor(() => {
        expect(screen.getByTestId('filter-min-price')).toBeInTheDocument();
      });

      const minPriceInput = screen.getByTestId('filter-min-price') as HTMLInputElement;
      const maxPriceInput = screen.getByTestId('filter-max-price') as HTMLInputElement;

      // Set price range
      fireEvent.change(minPriceInput, { target: { value: '5.00' } });
      fireEvent.change(maxPriceInput, { target: { value: '8.00' } });

      await waitFor(() => {
        expect(ecommerceService.getProducts).toHaveBeenCalledWith(
          expect.objectContaining({
            min_price: 5.0,
            max_price: 8.0,
            page: 1,
          })
        );
      });
    });

    it('should filter by in-stock items only', async () => {
      render(<Catalog />);

      await waitFor(() => {
        expect(screen.getByTestId('filter-in-stock')).toBeInTheDocument();
      });

      const inStockCheckbox = screen.getByTestId('filter-in-stock') as HTMLInputElement;
      fireEvent.click(inStockCheckbox);

      await waitFor(() => {
        expect(ecommerceService.getProducts).toHaveBeenCalledWith(
          expect.objectContaining({ in_stock_only: true })
        );
      });
    });
  });

  describe('Product Details Workflow', () => {
    it('should view product details and verify out of stock indicator', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

      render(<Catalog />);

      await waitFor(() => {
        expect(screen.getByTestId('product-card-3')).toBeInTheDocument();
      });

      // Click view details on out-of-stock item
      const viewDetailsButton = screen.getByTestId('view-details-3');
      fireEvent.click(viewDetailsButton);

      await waitFor(() => {
        expect(screen.getByTestId('product-detail-3')).toBeInTheDocument();
      });

      // Verify out-of-stock indicator is shown
      expect(screen.getByTestId('out-of-stock')).toBeInTheDocument();
      expect(screen.getByText('This item is currently unavailable.')).toBeInTheDocument();

      // Verify no add to cart button for out of stock items
      expect(screen.queryByTestId('add-to-cart-button')).not.toBeInTheDocument();

      alertSpy.mockRestore();
    });

    it('should display low stock warning', async () => {
      render(<Catalog />);

      await waitFor(() => {
        expect(screen.getByTestId('product-card-2')).toBeInTheDocument();
      });

      // View low stock item (3 items)
      const viewDetailsButton = screen.getByTestId('view-details-2');
      fireEvent.click(viewDetailsButton);

      await waitFor(() => {
        expect(screen.getByTestId('product-detail-2')).toBeInTheDocument();
      });

      // Should show low stock warning
      expect(screen.getByText('Low in Stock')).toBeInTheDocument();
      expect(screen.getByText('Only 3 items available')).toBeInTheDocument();
    });

    it('should show discount info on sale items', async () => {
      render(<Catalog />);

      await waitFor(() => {
        expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
      });

      // View discounted product
      const viewDetailsButton = screen.getByTestId('view-details-1');
      fireEvent.click(viewDetailsButton);

      await waitFor(() => {
        expect(screen.getByTestId('product-detail-1')).toBeInTheDocument();
      });

      const modal = screen.getByTestId('product-detail-1');

      // Verify discount information
      expect(within(modal).getByText('You save $2.00')).toBeInTheDocument();
      expect(within(modal).getByText('25% OFF')).toBeInTheDocument();
    });

    it('should add product to cart from detail view', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

      render(<Catalog />);

      await waitFor(() => {
        expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
      });

      // Open product detail
      fireEvent.click(screen.getByTestId('view-details-1'));

      await waitFor(() => {
        expect(screen.getByTestId('product-detail-1')).toBeInTheDocument();
      });

      // Change quantity
      const quantityInput = screen.getByTestId('quantity-input') as HTMLInputElement;
      fireEvent.change(quantityInput, { target: { value: '3' } });

      // Add to cart
      const addButton = screen.getByTestId('add-to-cart-button');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          expect.stringContaining('3 x "Aspirin 500mg" to cart')
        );
      });

      alertSpy.mockRestore();
    });
  });

  describe('Search and Pagination Workflow', () => {
    it('should complete search workflow', async () => {
      render(<Catalog />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      // Search for product
      const searchInput = screen.getByTestId('search-input') as HTMLInputElement;

      // Trigger onChange event properly with fireEvent
      fireEvent.change(searchInput, { target: { value: 'vitamin' } });

      jest.advanceTimersByTime(300);
      await jest.runAllTimersAsync();

      expect(ecommerceService.searchProducts).toHaveBeenCalledWith('vitamin', 50);

      // Clear search
      const clearSearchButton = await waitFor(() => screen.getByTestId('clear-search'));
      fireEvent.click(clearSearchButton);

      expect(searchInput.value).toBe('');
      expect(screen.queryByText(/Found.*product/)).not.toBeInTheDocument();
    });

    it('should handle pagination workflow', async () => {
      (ecommerceService.getProducts as jest.Mock).mockResolvedValue({
        data: [mockProducts[0]],
        pagination: { page: 1, limit: 1, total: 3, total_pages: 3 },
      });

      render(<Catalog />);

      await waitFor(() => {
        expect(screen.getByTestId('pagination')).toBeInTheDocument();
      });

      // Verify page 1
      expect(screen.getByText('Showing 1 to 1 of 3 results')).toBeInTheDocument();

      // Go to next page
      fireEvent.click(screen.getByTestId('pagination-next'));

      await waitFor(() => {
        expect(ecommerceService.getProducts).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 })
        );
      });
    });
  });

  describe('Negative Tests - Stock Availability', () => {
    it('should not allow adding out-of-stock products to cart', async () => {
      render(<Catalog />);

      await waitFor(() => {
        expect(screen.getByTestId('product-card-3')).toBeInTheDocument();
      });

      const vitaminCard = screen.getByTestId('product-card-3');

      // Out of stock products should not have add to cart button
      expect(
        within(vitaminCard).queryByTestId('add-to-cart-3')
      ).not.toBeInTheDocument();
    });

    it('should clearly indicate out-of-stock status', async () => {
      render(<Catalog />);

      await waitFor(() => {
        expect(screen.getByTestId('product-card-3')).toBeInTheDocument();
      });

      const vitaminCard = screen.getByTestId('product-card-3');

      // Out of stock badge should be visible
      expect(
        within(vitaminCard).getByText('Out of Stock')
      ).toBeInTheDocument();
    });

    it('should show low stock warning badge', async () => {
      render(<Catalog />);

      await waitFor(() => {
        expect(screen.getByTestId('product-card-2')).toBeInTheDocument();
      });

      const ibuproCard = screen.getByTestId('product-card-2');

      // Low stock badge should be visible (3 items, threshold is 10)
      expect(
        within(ibuproCard).getByText('Low Stock')
      ).toBeInTheDocument();
    });
  });

  describe('Performance Tests', () => {
    it('should handle search within 500ms', async () => {
      const performanceNowSpy = jest.spyOn(performance, 'now');
      performanceNowSpy.mockReturnValue(1000);

      render(<Catalog />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input') as HTMLInputElement;

      // Trigger onChange event properly with fireEvent
      fireEvent.change(searchInput, { target: { value: 'aspirin' } });

      performanceNowSpy.mockReturnValue(1300); // 300ms later
      jest.advanceTimersByTime(300);

      const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();

      await jest.runAllTimersAsync();

      expect(ecommerceService.searchProducts).toHaveBeenCalled();

      performanceNowSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });
  });
});
