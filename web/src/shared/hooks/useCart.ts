/**
 * Cart Hook
 * Custom hook for managing shopping cart
 * T3-035: Cart Frontend Components
 */

import { useApiMutation, useFetchList } from './useApi';
import { Product } from './useProducts';

// ============================================================================
// Types
// ============================================================================

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  quantity: number;
  subtotal: number;
  imageUrl?: string;
  requiresPrescription: boolean;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  discountCode?: string;
  total: number;
  itemCount: number;
  totalQuantity: number;
  status: 'active' | 'abandoned' | 'completed';
}

export interface CartResponse {
  success: boolean;
  cart: Cart;
}

export interface AddToCartRequest {
  productId: string;
  quantity?: number;
  product: Product;
}

export interface UpdateQuantityRequest {
  quantity: number;
  availableStock: number;
}

export interface ApplyDiscountRequest {
  discountCode: string;
  discountAmount: number;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Get user's active cart
 */
export function useCart() {
  return useFetchList<CartResponse>('cart', undefined, {
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true,
  });
}

/**
 * Add product to cart
 */
export function useAddToCart() {
  return useApiMutation<CartResponse, AddToCartRequest>('/cart/add', {
    method: 'POST',
  });
}

/**
 * Remove product from cart
 */
export function useRemoveFromCart() {
  return useApiMutation<CartResponse, { productId: string }>('/cart/items/{productId}', {
    method: 'DELETE',
  });
}

/**
 * Update product quantity in cart
 */
export function useUpdateCartQuantity() {
  return useApiMutation<CartResponse, UpdateQuantityRequest>(
    '/cart/items/{productId}/quantity',
    {
      method: 'PUT',
    },
  );
}

/**
 * Apply discount code to cart
 */
export function useApplyDiscountCode() {
  return useApiMutation<CartResponse, ApplyDiscountRequest>('/cart/apply-discount', {
    method: 'POST',
  });
}

/**
 * Clear cart
 */
export function useClearCart() {
  return useApiMutation<CartResponse, Record<string, never>>('/cart/clear', {
    method: 'DELETE',
  });
}

/**
 * Custom hook to manage cart operations with refetch
 */
export function useCartOperations() {
  const cart = useCart();
  const addToCart = useAddToCart();
  const removeFromCart = useRemoveFromCart();
  const updateQuantity = useUpdateCartQuantity();
  const applyDiscount = useApplyDiscountCode();
  const clearCart = useClearCart();

  return {
    cart,
    operations: {
      addToCart,
      removeFromCart,
      updateQuantity,
      applyDiscount,
      clearCart,
    },
  };
}
