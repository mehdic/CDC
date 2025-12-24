/**
 * Cart Service Unit Tests
 * Tests for cart service API integration
 * Task: T8-039 - Patient E-Commerce Cart and Checkout
 */

import * as cartService from '../src/services/cartService';
import apiClient from '../src/services/apiClient';
import { Cart, AddToCartPayload } from '../src/store/cartSlice';

// Mock the API client
jest.mock('../src/services/apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('Cart Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    test('should fetch cart successfully', async () => {
      const mockCart: Cart = {
        id: 'cart-1',
        items: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        itemCount: 0,
        totalQuantity: 0,
        status: 'active',
      };

      mockedApiClient.get.mockResolvedValue({
        data: {
          success: true,
          cart: mockCart,
        },
      } as any);

      const result = await cartService.getCart();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/cart');
      expect(result.success).toBe(true);
      expect(result.cart).toEqual(mockCart);
    });
  });

  describe('addToCart', () => {
    test('should add item to cart successfully', async () => {
      const payload: AddToCartPayload = {
        productId: 'prod-1',
        quantity: 2,
        product: {
          id: 'prod-1',
          name: 'Test Product',
          category: 'OTC',
          price: 10.99,
          requiresPrescription: false,
          availableStock: 50,
        },
      };

      const mockCart: Cart = {
        id: 'cart-1',
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            name: 'Test Product',
            category: 'OTC',
            price: 10.99,
            quantity: 2,
            subtotal: 21.98,
            requiresPrescription: false,
            availableStock: 50,
          },
        ],
        subtotal: 21.98,
        tax: 1.54,
        discount: 0,
        total: 23.52,
        itemCount: 1,
        totalQuantity: 2,
        status: 'active',
      };

      mockedApiClient.post.mockResolvedValue({
        data: {
          success: true,
          cart: mockCart,
        },
      } as any);

      const result = await cartService.addToCart(payload);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/cart/add', {
        productId: payload.productId,
        quantity: payload.quantity,
        product: payload.product,
      });
      expect(result.success).toBe(true);
      expect(result.cart.items).toHaveLength(1);
    });
  });

  describe('updateQuantity', () => {
    test('should update item quantity successfully', async () => {
      const productId = 'prod-1';
      const quantity = 5;

      const mockCart: Cart = {
        id: 'cart-1',
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            name: 'Test Product',
            category: 'OTC',
            price: 10.99,
            quantity: 5,
            subtotal: 54.95,
            requiresPrescription: false,
            availableStock: 50,
          },
        ],
        subtotal: 54.95,
        tax: 3.85,
        discount: 0,
        total: 58.8,
        itemCount: 1,
        totalQuantity: 5,
        status: 'active',
      };

      mockedApiClient.put.mockResolvedValue({
        data: {
          success: true,
          cart: mockCart,
        },
      } as any);

      const result = await cartService.updateQuantity(productId, quantity);

      expect(mockedApiClient.put).toHaveBeenCalledWith(
        `/cart/items/${productId}/quantity`,
        { quantity }
      );
      expect(result.cart.items[0].quantity).toBe(5);
    });
  });

  describe('removeFromCart', () => {
    test('should remove item from cart successfully', async () => {
      const productId = 'prod-1';

      const mockCart: Cart = {
        id: 'cart-1',
        items: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        itemCount: 0,
        totalQuantity: 0,
        status: 'active',
      };

      mockedApiClient.delete.mockResolvedValue({
        data: {
          success: true,
          cart: mockCart,
        },
      } as any);

      const result = await cartService.removeFromCart(productId);

      expect(mockedApiClient.delete).toHaveBeenCalledWith(
        `/cart/items/${productId}`
      );
      expect(result.cart.items).toHaveLength(0);
    });
  });

  describe('applyDiscountCode', () => {
    test('should apply discount code successfully', async () => {
      const discountCode = 'SAVE10';

      const mockCart: Cart = {
        id: 'cart-1',
        items: [],
        subtotal: 100,
        tax: 7,
        discount: 10,
        discountCode: 'SAVE10',
        total: 97,
        itemCount: 0,
        totalQuantity: 0,
        status: 'active',
      };

      mockedApiClient.post.mockResolvedValue({
        data: {
          success: true,
          cart: mockCart,
        },
      } as any);

      const result = await cartService.applyDiscountCode(discountCode);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/cart/apply-discount', {
        discountCode,
      });
      expect(result.cart.discount).toBe(10);
      expect(result.cart.discountCode).toBe('SAVE10');
    });
  });

  describe('clearCart', () => {
    test('should clear cart successfully', async () => {
      const mockCart: Cart = {
        id: 'cart-1',
        items: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        itemCount: 0,
        totalQuantity: 0,
        status: 'active',
      };

      mockedApiClient.delete.mockResolvedValue({
        data: {
          success: true,
          cart: mockCart,
        },
      } as any);

      const result = await cartService.clearCart();

      expect(mockedApiClient.delete).toHaveBeenCalledWith('/cart/clear');
      expect(result.cart.items).toHaveLength(0);
    });
  });

  describe('syncCart', () => {
    test('should sync local cart with server successfully', async () => {
      const localCart: Cart = {
        id: null,
        items: [
          {
            id: 'temp-1',
            productId: 'prod-1',
            name: 'Test Product',
            category: 'OTC',
            price: 10.99,
            quantity: 2,
            subtotal: 21.98,
            requiresPrescription: false,
            availableStock: 50,
          },
        ],
        subtotal: 21.98,
        tax: 1.54,
        discount: 0,
        total: 23.52,
        itemCount: 1,
        totalQuantity: 2,
        status: 'active',
      };

      const syncedCart: Cart = {
        ...localCart,
        id: 'cart-1',
        items: [
          {
            ...localCart.items[0],
            id: 'item-1',
          },
        ],
      };

      mockedApiClient.post.mockResolvedValue({
        data: {
          success: true,
          cart: syncedCart,
        },
      } as any);

      const result = await cartService.syncCart(localCart);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/cart/sync', {
        cart: localCart,
      });
      expect(result.cart.id).toBe('cart-1');
    });
  });

  describe('Checkout Operations', () => {
    test('should create order successfully', async () => {
      const orderData: cartService.OrderRequest = {
        deliveryAddressId: 'addr-1',
        paymentMethodId: 'pay-1',
        deliveryInstructions: 'Leave at door',
        useInsurance: false,
      };

      const mockOrder: cartService.Order = {
        id: 'order-1',
        orderNumber: 'ORD-123456',
        userId: 'user-1',
        items: [],
        subtotal: 100,
        tax: 7,
        discount: 0,
        total: 107,
        status: 'pending',
        deliveryAddress: {
          id: 'addr-1',
          street: '123 Main St',
          city: 'Geneva',
          postalCode: '1200',
          country: 'Switzerland',
        },
        paymentMethod: {
          id: 'pay-1',
          type: 'card',
          lastFourDigits: '1234',
        },
        deliveryInstructions: 'Leave at door',
        createdAt: new Date().toISOString(),
      };

      mockedApiClient.post.mockResolvedValue({
        data: {
          success: true,
          order: mockOrder,
        },
      } as any);

      const result = await cartService.createOrder(orderData);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/orders/create', orderData);
      expect(result.success).toBe(true);
      expect(result.order.id).toBe('order-1');
    });

    test('should fetch order details successfully', async () => {
      const orderId = 'order-1';

      const mockOrder: cartService.Order = {
        id: 'order-1',
        orderNumber: 'ORD-123456',
        userId: 'user-1',
        items: [],
        subtotal: 100,
        tax: 7,
        discount: 0,
        total: 107,
        status: 'pending',
        deliveryAddress: {
          id: 'addr-1',
          street: '123 Main St',
          city: 'Geneva',
          postalCode: '1200',
          country: 'Switzerland',
        },
        paymentMethod: {
          id: 'pay-1',
          type: 'card',
          lastFourDigits: '1234',
        },
        createdAt: new Date().toISOString(),
      };

      mockedApiClient.get.mockResolvedValue({
        data: {
          success: true,
          order: mockOrder,
        },
      } as any);

      const result = await cartService.getOrder(orderId);

      expect(mockedApiClient.get).toHaveBeenCalledWith(`/orders/${orderId}`);
      expect(result.order.id).toBe('order-1');
    });

    test('should fetch delivery addresses successfully', async () => {
      const mockAddresses = [
        {
          id: 'addr-1',
          name: 'Home',
          street: '123 Main St',
          city: 'Geneva',
          postalCode: '1200',
          country: 'Switzerland',
          isDefault: true,
        },
      ];

      mockedApiClient.get.mockResolvedValue({
        data: {
          success: true,
          addresses: mockAddresses,
        },
      } as any);

      const result = await cartService.getDeliveryAddresses();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/user/addresses');
      expect(result.addresses).toHaveLength(1);
    });

    test('should fetch payment methods successfully', async () => {
      const mockMethods = [
        {
          id: 'pay-1',
          type: 'card' as const,
          lastFourDigits: '1234',
          cardBrand: 'Visa',
          isDefault: true,
        },
      ];

      mockedApiClient.get.mockResolvedValue({
        data: {
          success: true,
          methods: mockMethods,
        },
      } as any);

      const result = await cartService.getPaymentMethods();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/user/payment-methods');
      expect(result.methods).toHaveLength(1);
    });
  });
});
