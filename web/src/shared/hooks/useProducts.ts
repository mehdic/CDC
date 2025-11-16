/**
 * Products Hook
 * Custom hook for managing product data from e-commerce service
 */

import { useFetchList, useFetchItem, useApiMutation } from './useApi';

// ============================================================================
// Types
// ============================================================================

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  requiresPrescription: boolean;
  description?: string;
  imageUrl?: string;
}

export interface ProductFilters extends Record<string, unknown> {
  category?: string;
  search?: string;
  requiresPrescription?: boolean;
  limit?: number;
  offset?: number;
}

export interface ProductsResponse {
  success: boolean;
  products: Product[];
  total: number;
}

export interface ProductResponse {
  success: boolean;
  product: Product;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fetch list of products with optional filters
 */
export function useProducts(filters?: ProductFilters) {
  return useFetchList<ProductsResponse>('products', filters, {
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetch single product by ID
 */
export function useProduct(productId: string) {
  return useFetchItem<ProductResponse>('products', productId, {
    enabled: !!productId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Update product inventory
 */
export function useUpdateProductInventory() {
  return useApiMutation<
    { success: boolean },
    { productId: string; quantity: number }
  >('/products/inventory', {
    method: 'PUT',
  });
}

/**
 * Add product to cart
 */
export function useAddToCart() {
  return useApiMutation<
    { success: boolean; cartId: string },
    { productId: string; patientId: string; quantity: number }
  >('/ecommerce/cart/add', {
    method: 'POST',
  });
}
