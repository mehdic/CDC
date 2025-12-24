/**
 * Cart Slice
 * Redux state management for shopping cart
 * Task: T8-039 - Patient E-Commerce Cart and Checkout
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as cartApi from '../services/cartService';

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
  availableStock: number;
}

export interface Cart {
  id: string | null;
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

export interface AddToCartPayload {
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    description?: string;
    category: string;
    price: number;
    imageUrl?: string;
    requiresPrescription: boolean;
    availableStock: number;
  };
}

interface CartState {
  cart: Cart | null;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  lastSyncedAt: string | null;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: CartState = {
  cart: null,
  loading: false,
  syncing: false,
  error: null,
  lastSyncedAt: null,
};

// ============================================================================
// Async Thunks
// ============================================================================

/**
 * Fetch cart from API
 */
export const fetchCart = createAsyncThunk<Cart, void, { rejectValue: string }>(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartApi.getCart();
      return response.cart;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch cart';
      return rejectWithValue(message);
    }
  }
);

/**
 * Add item to cart (optimistic update)
 */
export const addToCart = createAsyncThunk<
  Cart,
  AddToCartPayload,
  { rejectValue: string }
>('cart/addToCart', async (payload, { rejectWithValue }) => {
  try {
    const response = await cartApi.addToCart(payload);
    return response.cart;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add to cart';
    return rejectWithValue(message);
  }
});

/**
 * Update item quantity in cart
 */
export const updateQuantity = createAsyncThunk<
  Cart,
  { productId: string; quantity: number },
  { rejectValue: string }
>('cart/updateQuantity', async ({ productId, quantity }, { rejectWithValue }) => {
  try {
    const response = await cartApi.updateQuantity(productId, quantity);
    return response.cart;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update quantity';
    return rejectWithValue(message);
  }
});

/**
 * Remove item from cart
 */
export const removeFromCart = createAsyncThunk<
  Cart,
  string,
  { rejectValue: string }
>('cart/removeFromCart', async (productId, { rejectWithValue }) => {
  try {
    const response = await cartApi.removeFromCart(productId);
    return response.cart;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to remove from cart';
    return rejectWithValue(message);
  }
});

/**
 * Apply discount code
 */
export const applyDiscountCode = createAsyncThunk<
  Cart,
  string,
  { rejectValue: string }
>('cart/applyDiscountCode', async (discountCode, { rejectWithValue }) => {
  try {
    const response = await cartApi.applyDiscountCode(discountCode);
    return response.cart;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid discount code';
    return rejectWithValue(message);
  }
});

/**
 * Clear cart
 */
export const clearCart = createAsyncThunk<Cart, void, { rejectValue: string }>(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartApi.clearCart();
      return response.cart;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to clear cart';
      return rejectWithValue(message);
    }
  }
);

/**
 * Sync local cart with API
 */
export const syncCart = createAsyncThunk<Cart, Cart, { rejectValue: string }>(
  'cart/syncCart',
  async (localCart, { rejectWithValue }) => {
    try {
      // Send local cart to API for sync
      const response = await cartApi.syncCart(localCart);
      return response.cart;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sync cart';
      return rejectWithValue(message);
    }
  }
);

// ============================================================================
// Slice
// ============================================================================

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    /**
     * Add item to cart locally (optimistic update)
     */
    addItemLocally: (state, action: PayloadAction<AddToCartPayload>) => {
      const { product, quantity } = action.payload;

      if (!state.cart) {
        // Create new cart
        state.cart = {
          id: null,
          items: [],
          subtotal: 0,
          tax: 0,
          discount: 0,
          total: 0,
          itemCount: 0,
          totalQuantity: 0,
          status: 'active',
        };
      }

      // Check if item exists
      const existingItem = state.cart.items.find(
        (item) => item.productId === product.id
      );

      if (existingItem) {
        // Update quantity
        existingItem.quantity += quantity;
        existingItem.subtotal = existingItem.price * existingItem.quantity;
      } else {
        // Add new item
        const newItem: CartItem = {
          id: `temp-${Date.now()}`,
          productId: product.id,
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
          quantity,
          subtotal: product.price * quantity,
          imageUrl: product.imageUrl,
          requiresPrescription: product.requiresPrescription,
          availableStock: product.availableStock,
        };
        state.cart.items.push(newItem);
      }

      // Recalculate totals
      state.cart.subtotal = state.cart.items.reduce(
        (sum, item) => sum + item.subtotal,
        0
      );
      state.cart.tax = state.cart.subtotal * 0.07; // 7% tax
      state.cart.total = state.cart.subtotal + state.cart.tax - state.cart.discount;
      state.cart.itemCount = state.cart.items.length;
      state.cart.totalQuantity = state.cart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      // Save to AsyncStorage
      AsyncStorage.setItem('cart', JSON.stringify(state.cart));
    },

    /**
     * Update item quantity locally
     */
    updateQuantityLocally: (
      state,
      action: PayloadAction<{ productId: string; quantity: number }>
    ) => {
      if (!state.cart) return;

      const item = state.cart.items.find(
        (item) => item.productId === action.payload.productId
      );

      if (item) {
        item.quantity = action.payload.quantity;
        item.subtotal = item.price * item.quantity;

        // Recalculate totals
        state.cart.subtotal = state.cart.items.reduce(
          (sum, item) => sum + item.subtotal,
          0
        );
        state.cart.tax = state.cart.subtotal * 0.07;
        state.cart.total = state.cart.subtotal + state.cart.tax - state.cart.discount;
        state.cart.totalQuantity = state.cart.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        // Save to AsyncStorage
        AsyncStorage.setItem('cart', JSON.stringify(state.cart));
      }
    },

    /**
     * Remove item from cart locally
     */
    removeItemLocally: (state, action: PayloadAction<string>) => {
      if (!state.cart) return;

      state.cart.items = state.cart.items.filter(
        (item) => item.productId !== action.payload
      );

      // Recalculate totals
      state.cart.subtotal = state.cart.items.reduce(
        (sum, item) => sum + item.subtotal,
        0
      );
      state.cart.tax = state.cart.subtotal * 0.07;
      state.cart.total = state.cart.subtotal + state.cart.tax - state.cart.discount;
      state.cart.itemCount = state.cart.items.length;
      state.cart.totalQuantity = state.cart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      // Save to AsyncStorage
      AsyncStorage.setItem('cart', JSON.stringify(state.cart));
    },

    /**
     * Load cart from AsyncStorage
     */
    loadCartFromStorage: (state, action: PayloadAction<Cart | null>) => {
      state.cart = action.payload;
    },

    /**
     * Clear error
     */
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch cart
    builder.addCase(fetchCart.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCart.fulfilled, (state, action) => {
      state.loading = false;
      state.cart = action.payload;
      state.lastSyncedAt = new Date().toISOString();
      // Save to AsyncStorage
      AsyncStorage.setItem('cart', JSON.stringify(action.payload));
    });
    builder.addCase(fetchCart.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to fetch cart';
    });

    // Add to cart
    builder.addCase(addToCart.pending, (state) => {
      state.syncing = true;
    });
    builder.addCase(addToCart.fulfilled, (state, action) => {
      state.syncing = false;
      state.cart = action.payload;
      state.lastSyncedAt = new Date().toISOString();
      AsyncStorage.setItem('cart', JSON.stringify(action.payload));
    });
    builder.addCase(addToCart.rejected, (state, action) => {
      state.syncing = false;
      state.error = action.payload || 'Failed to add to cart';
    });

    // Update quantity
    builder.addCase(updateQuantity.pending, (state) => {
      state.syncing = true;
    });
    builder.addCase(updateQuantity.fulfilled, (state, action) => {
      state.syncing = false;
      state.cart = action.payload;
      state.lastSyncedAt = new Date().toISOString();
      AsyncStorage.setItem('cart', JSON.stringify(action.payload));
    });
    builder.addCase(updateQuantity.rejected, (state, action) => {
      state.syncing = false;
      state.error = action.payload || 'Failed to update quantity';
    });

    // Remove from cart
    builder.addCase(removeFromCart.pending, (state) => {
      state.syncing = true;
    });
    builder.addCase(removeFromCart.fulfilled, (state, action) => {
      state.syncing = false;
      state.cart = action.payload;
      state.lastSyncedAt = new Date().toISOString();
      AsyncStorage.setItem('cart', JSON.stringify(action.payload));
    });
    builder.addCase(removeFromCart.rejected, (state, action) => {
      state.syncing = false;
      state.error = action.payload || 'Failed to remove from cart';
    });

    // Apply discount code
    builder.addCase(applyDiscountCode.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(applyDiscountCode.fulfilled, (state, action) => {
      state.loading = false;
      state.cart = action.payload;
      AsyncStorage.setItem('cart', JSON.stringify(action.payload));
    });
    builder.addCase(applyDiscountCode.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to apply discount';
    });

    // Clear cart
    builder.addCase(clearCart.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(clearCart.fulfilled, (state, action) => {
      state.loading = false;
      state.cart = action.payload;
      AsyncStorage.removeItem('cart');
    });
    builder.addCase(clearCart.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to clear cart';
    });

    // Sync cart
    builder.addCase(syncCart.pending, (state) => {
      state.syncing = true;
    });
    builder.addCase(syncCart.fulfilled, (state, action) => {
      state.syncing = false;
      state.cart = action.payload;
      state.lastSyncedAt = new Date().toISOString();
      AsyncStorage.setItem('cart', JSON.stringify(action.payload));
    });
    builder.addCase(syncCart.rejected, (state, action) => {
      state.syncing = false;
      state.error = action.payload || 'Failed to sync cart';
    });
  },
});

// ============================================================================
// Actions
// ============================================================================

export const {
  addItemLocally,
  updateQuantityLocally,
  removeItemLocally,
  loadCartFromStorage,
  clearError,
} = cartSlice.actions;

// ============================================================================
// Selectors
// ============================================================================

export const selectCart = (state: { cart: CartState }) => state.cart.cart;
export const selectCartLoading = (state: { cart: CartState }) => state.cart.loading;
export const selectCartSyncing = (state: { cart: CartState }) => state.cart.syncing;
export const selectCartError = (state: { cart: CartState }) => state.cart.error;
export const selectCartItemCount = (state: { cart: CartState }) =>
  state.cart.cart?.itemCount || 0;
export const selectCartTotalQuantity = (state: { cart: CartState }) =>
  state.cart.cart?.totalQuantity || 0;
export const selectCartTotal = (state: { cart: CartState }) =>
  state.cart.cart?.total || 0;

// ============================================================================
// Export
// ============================================================================

export default cartSlice.reducer;
