/**
 * E-Commerce Service
 * API calls for product catalog, categories, and search
 * Task: T8-038 - Patient E-Commerce Product Catalog
 */

import { apiClient } from '@/shared/api/client';
import {
  Product,
  ProductListResponse,
  SearchResponse,
  CategoryTreeResponse,
  ProductFilters,
} from '../types';

const PRODUCTS_ENDPOINT = '/products';
const CATEGORIES_ENDPOINT = '/categories';

/**
 * Get list of products with filters and pagination
 */
export async function getProducts(
  filters: ProductFilters = {}
): Promise<ProductListResponse> {
  try {
    const params = new URLSearchParams();

    if (filters.page !== undefined) {
      params.append('page', filters.page.toString());
    }
    if (filters.limit !== undefined) {
      params.append('limit', filters.limit.toString());
    }
    if (filters.category_id) {
      params.append('category_id', filters.category_id);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.requires_prescription !== undefined) {
      params.append('requires_prescription', filters.requires_prescription.toString());
    }
    if (filters.min_price !== undefined) {
      params.append('min_price', filters.min_price.toString());
    }
    if (filters.max_price !== undefined) {
      params.append('max_price', filters.max_price.toString());
    }
    if (filters.in_stock_only !== undefined) {
      params.append('in_stock_only', filters.in_stock_only.toString());
    }
    if (filters.sort_by) {
      params.append('sort_by', filters.sort_by);
    }
    if (filters.sort_order) {
      params.append('sort_order', filters.sort_order);
    }

    const queryString = params.toString();
    const url = queryString
      ? `${PRODUCTS_ENDPOINT}?${queryString}`
      : PRODUCTS_ENDPOINT;

    const response = await apiClient.get<ProductListResponse>(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

/**
 * Get product details by ID
 */
export async function getProductById(id: string): Promise<Product> {
  try {
    const response = await apiClient.get<{ data: Product }>(
      `${PRODUCTS_ENDPOINT}/${id}`
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

/**
 * Search products with full-text search
 */
export async function searchProducts(
  query: string,
  limit: number = 20
): Promise<SearchResponse> {
  try {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });

    const response = await apiClient.get<SearchResponse>(
      `${PRODUCTS_ENDPOINT}/search?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
}

/**
 * Get categories in tree structure
 */
export async function getCategories(): Promise<CategoryTreeResponse> {
  try {
    const response = await apiClient.get<CategoryTreeResponse>(
      CATEGORIES_ENDPOINT
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

/**
 * Get category by ID with its products
 */
export async function getCategoryById(id: string) {
  try {
    const response = await apiClient.get(`${CATEGORIES_ENDPOINT}/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching category:', error);
    throw error;
  }
}
