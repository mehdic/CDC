/**
 * Catalog Integration Tests
 * Tests catalog functionality including product display, search, categories, and pagination
 * Task: T8-038 - Patient E-Commerce Product Catalog
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Catalog } from '../pages/Catalog';
import * as ecommerceService from '../services/ecommerceService';

// Mock API service
jest.mock('../services/ecommerceService');

// Mock data
const mockProducts = [
  {
    id: '1',
    name: 'Aspirin 500mg',
    description: 'Pain relief medication',
    sku: 'ASP001',
    manufacturer: 'PharmaCorp',
    category_id: 'cat1',
    category: { id: 'cat1', name: 'Pain Relief' },
    price: 5.99,
    original_price: 7.99,
    stock: 100,
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
    name: 'Vitamin C 1000mg',
    description: 'Immune support supplement',
    sku: 'VIT001',
    manufacturer: 'HealthPlus',
    category_id: 'cat2',
    category: { id: 'cat2', name: 'Vitamins' },
    price: 12.99,
    original_price: null,
    stock: 0,
    low_stock_threshold: 10,
    requires_prescription: false,
    image_url: 'https://example.com/vitaminc.jpg',
    expiry_date: '2026-06-30',
    rating: 4.8,
    review_count: 250,
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
    description: 'Pain relief medications',
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
    description: 'Vitamins and supplement products',
    icon_url: null,
    display_order: 2,
    children: [],
    parent_id: null,
    is_active: true,
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
  },
];

describe('Catalog Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ecommerceService.getProducts as jest.Mock).mockResolvedValue({
      data: mockProducts,
      pagination: { page: 1, limit: 20, total: 2, total_pages: 1 },
    });
    (ecommerceService.getCategories as jest.Mock).mockResolvedValue({
      data: mockCategories,
    });
    (ecommerceService.searchProducts as jest.Mock).mockResolvedValue({
      data: [mockProducts[0]],
      query: 'aspirin',
      count: 1,
    });
  });

  it('should render catalog page with products', async () => {
    render(<Catalog />);

    expect(screen.getByText('Product Catalog')).toBeInTheDocument();
    expect(screen.getByTestId('catalog-page')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Aspirin 500mg')).toBeInTheDocument();
      expect(screen.getByText('Vitamin C 1000mg')).toBeInTheDocument();
    });
  });

  it('should display product cards with correct information', async () => {
    render(<Catalog />);

    await waitFor(() => {
      const aspirinCard = screen.getByTestId('product-card-1');
      expect(within(aspirinCard).getByText('Aspirin 500mg')).toBeInTheDocument();
      expect(within(aspirinCard).getByText('Pain Relief')).toBeInTheDocument();
      expect(within(aspirinCard).getByText('$5.99')).toBeInTheDocument();
    });
  });

  it('should show out of stock indicator', async () => {
    render(<Catalog />);

    await waitFor(() => {
      const vitaminCard = screen.getByTestId('product-card-2');
      expect(within(vitaminCard).getByText('Out of Stock')).toBeInTheDocument();
    });
  });

  it('should show discount badge for sale items', async () => {
    render(<Catalog />);

    await waitFor(() => {
      const aspirinCard = screen.getByTestId('product-card-1');
      expect(within(aspirinCard).getByText('25% OFF')).toBeInTheDocument();
    });
  });

  it('should display categories', async () => {
    render(<Catalog />);

    await waitFor(() => {
      expect(screen.getByTestId('category-browser')).toBeInTheDocument();
      expect(screen.getByTestId('category-cat1')).toBeInTheDocument();
      expect(screen.getByTestId('category-cat2')).toBeInTheDocument();
    });
  });

  it('should filter products by category', async () => {
    render(<Catalog />);

    await waitFor(() => {
      expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
    });

    const categoryButton = screen.getByTestId('category-cat1');
    fireEvent.click(categoryButton);

    await waitFor(() => {
      expect(ecommerceService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ category_id: 'cat1', page: 1 })
      );
    });
  });

  it('should show search bar', async () => {
    render(<Catalog />);

    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });
  });

  it('should search products with debouncing', async () => {
    jest.useFakeTimers();

    render(<Catalog />);

    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-input') as HTMLInputElement;
    await userEvent.type(searchInput, 'aspirin');

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(ecommerceService.searchProducts).toHaveBeenCalledWith('aspirin', 20);
    });

    jest.useRealTimers();
  });

  it('should show filters', async () => {
    render(<Catalog />);

    await waitFor(() => {
      expect(screen.getByTestId('filter-in-stock')).toBeInTheDocument();
      expect(screen.getByTestId('filter-min-price')).toBeInTheDocument();
      expect(screen.getByTestId('filter-max-price')).toBeInTheDocument();
    });
  });

  it('should filter by in-stock only', async () => {
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

  it('should display pagination', async () => {
    (ecommerceService.getProducts as jest.Mock).mockResolvedValue({
      data: mockProducts,
      pagination: { page: 1, limit: 5, total: 15, total_pages: 3 },
    });

    render(<Catalog />);

    await waitFor(() => {
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });

    expect(screen.getByText('Showing 1 to 5 of 15 results')).toBeInTheDocument();
  });

  it('should navigate pages', async () => {
    (ecommerceService.getProducts as jest.Mock).mockResolvedValue({
      data: mockProducts,
      pagination: { page: 1, limit: 5, total: 15, total_pages: 3 },
    });

    render(<Catalog />);

    await waitFor(() => {
      expect(screen.getByTestId('pagination-next')).toBeInTheDocument();
    });

    const nextButton = screen.getByTestId('pagination-next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(ecommerceService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });

  it('should open product detail modal', async () => {
    render(<Catalog />);

    await waitFor(() => {
      expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
    });

    const viewDetailsButton = screen.getByTestId('view-details-1');
    fireEvent.click(viewDetailsButton);

    await waitFor(() => {
      expect(screen.getByTestId('product-detail-1')).toBeInTheDocument();
      expect(screen.getByText('Aspirin 500mg')).toBeInTheDocument();
    });
  });

  it('should close product detail modal', async () => {
    render(<Catalog />);

    await waitFor(() => {
      expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
    });

    const viewDetailsButton = screen.getByTestId('view-details-1');
    fireEvent.click(viewDetailsButton);

    await waitFor(() => {
      expect(screen.getByTestId('product-detail-1')).toBeInTheDocument();
    });

    const closeButton = screen.getByTestId('close-product-detail');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('product-detail-1')).not.toBeInTheDocument();
    });
  });

  it('should handle add to cart', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

    render(<Catalog />);

    await waitFor(() => {
      expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
    });

    const addToCartButton = screen.getByTestId('add-to-cart-1');
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('Added "Aspirin 500mg" to cart')
      );
    });

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('should disable add to cart for out of stock items', async () => {
    render(<Catalog />);

    await waitFor(() => {
      expect(screen.getByTestId('product-card-2')).toBeInTheDocument();
    });

    const vitaminCard = screen.getByTestId('product-card-2');
    const addToCartButton = within(vitaminCard).queryByTestId('add-to-cart-2');

    expect(addToCartButton).not.toBeInTheDocument();
  });

  it('should clear search', async () => {
    jest.useFakeTimers();

    render(<Catalog />);

    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-input') as HTMLInputElement;
    await userEvent.type(searchInput, 'aspirin');

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByTestId('clear-search')).toBeInTheDocument();
    });

    const clearButton = screen.getByTestId('clear-search');
    fireEvent.click(clearButton);

    expect(searchInput.value).toBe('');

    jest.useRealTimers();
  });
});
