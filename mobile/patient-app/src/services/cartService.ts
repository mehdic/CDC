/**
 * Cart Service
 * API integration for shopping cart operations
 * Task: T8-039 - Patient E-Commerce Cart and Checkout
 */

import apiClient from './apiClient';
import { Cart, AddToCartPayload } from '../store/cartSlice';

// ============================================================================
// Types
// ============================================================================

export interface CartResponse {
  success: boolean;
  cart: Cart;
  message?: string;
}

export interface OrderRequest {
  deliveryAddressId: string;
  paymentMethodId: string;
  deliveryInstructions?: string;
  useInsurance: boolean;
  insuranceCardNumber?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: Cart['items'];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  deliveryAddress: {
    id: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: {
    id: string;
    type: 'card' | 'insurance' | 'cash';
    lastFourDigits?: string;
  };
  deliveryInstructions?: string;
  estimatedDeliveryDate?: string;
  createdAt: string;
}

export interface OrderResponse {
  success: boolean;
  order: Order;
  message?: string;
}

// ============================================================================
// Cart Operations
// ============================================================================

/**
 * Get current cart
 */
export async function getCart(): Promise<CartResponse> {
  const response = await apiClient.get<CartResponse>('/cart');
  return response.data;
}

/**
 * Add item to cart
 */
export async function addToCart(payload: AddToCartPayload): Promise<CartResponse> {
  const response = await apiClient.post<CartResponse>('/cart/add', {
    productId: payload.productId,
    quantity: payload.quantity,
    product: payload.product,
  });
  return response.data;
}

/**
 * Update item quantity
 */
export async function updateQuantity(
  productId: string,
  quantity: number
): Promise<CartResponse> {
  const response = await apiClient.put<CartResponse>(
    `/cart/items/${productId}/quantity`,
    {
      quantity,
    }
  );
  return response.data;
}

/**
 * Remove item from cart
 */
export async function removeFromCart(productId: string): Promise<CartResponse> {
  const response = await apiClient.delete<CartResponse>(`/cart/items/${productId}`);
  return response.data;
}

/**
 * Apply discount code
 */
export async function applyDiscountCode(discountCode: string): Promise<CartResponse> {
  const response = await apiClient.post<CartResponse>('/cart/apply-discount', {
    discountCode,
  });
  return response.data;
}

/**
 * Clear cart
 */
export async function clearCart(): Promise<CartResponse> {
  const response = await apiClient.delete<CartResponse>('/cart/clear');
  return response.data;
}

/**
 * Sync local cart with server
 */
export async function syncCart(localCart: Cart): Promise<CartResponse> {
  const response = await apiClient.post<CartResponse>('/cart/sync', {
    cart: localCart,
  });
  return response.data;
}

// ============================================================================
// Checkout Operations
// ============================================================================

/**
 * Create order from cart
 */
export async function createOrder(orderData: OrderRequest): Promise<OrderResponse> {
  const response = await apiClient.post<OrderResponse>('/orders/create', orderData);
  return response.data;
}

/**
 * Get order details
 */
export async function getOrder(orderId: string): Promise<OrderResponse> {
  const response = await apiClient.get<OrderResponse>(`/orders/${orderId}`);
  return response.data;
}

/**
 * Get user's delivery addresses
 */
export async function getDeliveryAddresses(): Promise<{
  success: boolean;
  addresses: Array<{
    id: string;
    name: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }>;
}> {
  const response = await apiClient.get('/user/addresses');
  return response.data;
}

/**
 * Get user's payment methods
 */
export async function getPaymentMethods(): Promise<{
  success: boolean;
  methods: Array<{
    id: string;
    type: 'card' | 'insurance' | 'cash';
    lastFourDigits?: string;
    cardBrand?: string;
    isDefault: boolean;
  }>;
}> {
  const response = await apiClient.get('/user/payment-methods');
  return response.data;
}
