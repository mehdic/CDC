/**
 * Cart Slice Unit Tests
 * Tests for cart state management
 * Task: T8-039 - Patient E-Commerce Cart and Checkout
 */

import { configureStore } from '@reduxjs/toolkit';
import cartReducer, {
  addItemLocally,
  updateQuantityLocally,
  removeItemLocally,
  loadCartFromStorage,
  clearError,
  fetchCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  applyDiscountCode,
  clearCart,
  Cart,
  CartItem,
  AddToCartPayload,
} from '../src/store/cartSlice';
import * as cartApi from '../src/services/cartService';

// Mock the cart service
jest.mock('../src/services/cartService');
const mockedCartApi = cartApi as jest.Mocked<typeof cartApi>;

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Cart Slice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        cart: cartReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe('Reducers', () => {
    test('should handle initial state', () => {
      expect(store.getState().cart).toEqual({
        cart: null,
        loading: false,
        syncing: false,
        error: null,
        lastSyncedAt: null,
      });
    });

    test('should handle addItemLocally - new item', () => {
      const payload: AddToCartPayload = {
        productId: 'prod-1',
        quantity: 2,
        product: {
          id: 'prod-1',
          name: 'Test Product',
          description: 'Test description',
          category: 'OTC',
          price: 10.99,
          imageUrl: 'https://example.com/image.jpg',
          requiresPrescription: false,
          availableStock: 50,
        },
      };

      store.dispatch(addItemLocally(payload));

      const state = store.getState().cart;
      expect(state.cart).not.toBeNull();
      expect(state.cart?.items).toHaveLength(1);
      expect(state.cart?.items[0].productId).toBe('prod-1');
      expect(state.cart?.items[0].quantity).toBe(2);
      expect(state.cart?.items[0].subtotal).toBe(21.98);
      expect(state.cart?.subtotal).toBe(21.98);
      expect(state.cart?.tax).toBeCloseTo(1.54);
      expect(state.cart?.total).toBeCloseTo(23.52);
    });

    test('should handle addItemLocally - existing item', () => {
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

      // Add first time
      store.dispatch(addItemLocally(payload));

      // Add again (should increment quantity)
      store.dispatch(addItemLocally({ ...payload, quantity: 1 }));

      const state = store.getState().cart;
      expect(state.cart?.items).toHaveLength(1);
      expect(state.cart?.items[0].quantity).toBe(3);
      expect(state.cart?.items[0].subtotal).toBe(32.97);
    });

    test('should handle updateQuantityLocally', () => {
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

      store.dispatch(addItemLocally(payload));
      store.dispatch(updateQuantityLocally({ productId: 'prod-1', quantity: 5 }));

      const state = store.getState().cart;
      expect(state.cart?.items[0].quantity).toBe(5);
      expect(state.cart?.items[0].subtotal).toBe(54.95);
    });

    test('should handle removeItemLocally', () => {
      const payload1: AddToCartPayload = {
        productId: 'prod-1',
        quantity: 2,
        product: {
          id: 'prod-1',
          name: 'Product 1',
          category: 'OTC',
          price: 10.99,
          requiresPrescription: false,
          availableStock: 50,
        },
      };

      const payload2: AddToCartPayload = {
        productId: 'prod-2',
        quantity: 1,
        product: {
          id: 'prod-2',
          name: 'Product 2',
          category: 'OTC',
          price: 5.99,
          requiresPrescription: false,
          availableStock: 30,
        },
      };

      store.dispatch(addItemLocally(payload1));
      store.dispatch(addItemLocally(payload2));

      expect(store.getState().cart.cart?.items).toHaveLength(2);

      store.dispatch(removeItemLocally('prod-1'));

      const state = store.getState().cart;
      expect(state.cart?.items).toHaveLength(1);
      expect(state.cart?.items[0].productId).toBe('prod-2');
    });

    test('should handle loadCartFromStorage', () => {
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

      store.dispatch(loadCartFromStorage(mockCart));

      const state = store.getState().cart;
      expect(state.cart).toEqual(mockCart);
    });

    test('should handle clearError', () => {
      // Manually set an error
      store.dispatch({ type: 'cart/fetchCart/rejected', payload: 'Test error' });
      expect(store.getState().cart.error).toBe('Test error');

      store.dispatch(clearError());
      expect(store.getState().cart.error).toBeNull();
    });
  });

  describe('Async Thunks', () => {
    test('fetchCart - success', async () => {
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

      mockedCartApi.getCart.mockResolvedValue({
        success: true,
        cart: mockCart,
      });

      await store.dispatch(fetchCart());

      const state = store.getState().cart;
      expect(state.loading).toBe(false);
      expect(state.cart).toEqual(mockCart);
      expect(state.error).toBeNull();
    });

    test('fetchCart - failure', async () => {
      mockedCartApi.getCart.mockRejectedValue(new Error('Network error'));

      await store.dispatch(fetchCart());

      const state = store.getState().cart;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');
    });

    test('addToCart - success', async () => {
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

      mockedCartApi.addToCart.mockResolvedValue({
        success: true,
        cart: mockCart,
      });

      await store.dispatch(addToCart(payload));

      const state = store.getState().cart;
      expect(state.syncing).toBe(false);
      expect(state.cart).toEqual(mockCart);
    });

    test('updateQuantity - success', async () => {
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

      mockedCartApi.updateQuantity.mockResolvedValue({
        success: true,
        cart: mockCart,
      });

      await store.dispatch(updateQuantity({ productId: 'prod-1', quantity: 5 }));

      const state = store.getState().cart;
      expect(state.cart?.items[0].quantity).toBe(5);
    });

    test('removeFromCart - success', async () => {
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

      mockedCartApi.removeFromCart.mockResolvedValue({
        success: true,
        cart: mockCart,
      });

      await store.dispatch(removeFromCart('prod-1'));

      const state = store.getState().cart;
      expect(state.cart?.items).toHaveLength(0);
    });

    test('applyDiscountCode - success', async () => {
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

      mockedCartApi.applyDiscountCode.mockResolvedValue({
        success: true,
        cart: mockCart,
      });

      await store.dispatch(applyDiscountCode('SAVE10'));

      const state = store.getState().cart;
      expect(state.cart?.discount).toBe(10);
      expect(state.cart?.discountCode).toBe('SAVE10');
    });

    test('applyDiscountCode - failure', async () => {
      mockedCartApi.applyDiscountCode.mockRejectedValue(
        new Error('Invalid discount code')
      );

      await store.dispatch(applyDiscountCode('INVALID'));

      const state = store.getState().cart;
      expect(state.error).toBe('Invalid discount code');
    });

    test('clearCart - success', async () => {
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

      mockedCartApi.clearCart.mockResolvedValue({
        success: true,
        cart: mockCart,
      });

      await store.dispatch(clearCart());

      const state = store.getState().cart;
      expect(state.cart?.items).toHaveLength(0);
    });
  });

  describe('Selectors', () => {
    test('should calculate totals correctly', () => {
      const payload1: AddToCartPayload = {
        productId: 'prod-1',
        quantity: 2,
        product: {
          id: 'prod-1',
          name: 'Product 1',
          category: 'OTC',
          price: 10.0,
          requiresPrescription: false,
          availableStock: 50,
        },
      };

      const payload2: AddToCartPayload = {
        productId: 'prod-2',
        quantity: 3,
        product: {
          id: 'prod-2',
          name: 'Product 2',
          category: 'OTC',
          price: 5.0,
          requiresPrescription: false,
          availableStock: 30,
        },
      };

      store.dispatch(addItemLocally(payload1));
      store.dispatch(addItemLocally(payload2));

      const state = store.getState().cart;
      expect(state.cart?.itemCount).toBe(2);
      expect(state.cart?.totalQuantity).toBe(5);
      expect(state.cart?.subtotal).toBe(35.0);
      expect(state.cart?.tax).toBe(2.45);
      expect(state.cart?.total).toBe(37.45);
    });
  });
});
