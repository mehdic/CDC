/**
 * ShoppingCart Component
 * Main shopping cart display and management
 * T3-035: Cart Frontend Components
 */

import React, { useState } from 'react';
import { useCartOperations } from '../hooks/useCart';
import { CartSummary } from './CartSummary';
import { CartItemComponent } from './CartItemComponent';

interface ShoppingCartProps {
  onCheckout?: () => void;
  className?: string;
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({ onCheckout, className = '' }) => {
  const { cart, operations } = useCartOperations();
  const [discountCode, setDiscountCode] = useState('');
  const [loading, setLoading] = useState(false);

  const isLoading = cart.isLoading;
  const cartData = cart.data?.cart;

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <p className="text-gray-500">Loading cart...</p>
      </div>
    );
  }

  if (!cartData) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <p className="text-gray-500">Unable to load cart</p>
      </div>
    );
  }

  const handleRemoveItem = async (productId: string) => {
    setLoading(true);
    try {
      await operations.removeFromCart.mutate({ productId });
      await cart.refetch();
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (productId: string, quantity: number, availableStock: number) => {
    setLoading(true);
    try {
      await operations.updateQuantity.mutate({
        quantity,
        availableStock,
      });
      await cart.refetch();
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;

    setLoading(true);
    try {
      // Note: Actual discount validation should be done by backend
      // For now, we'll assume 10% discount
      const discountAmount = cartData.subtotal * 0.1;
      await operations.applyDiscount.mutate({
        discountCode,
        discountAmount,
      });
      setDiscountCode('');
      await cart.refetch();
    } catch (error) {
      console.error('Failed to apply discount:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCart = async () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      setLoading(true);
      try {
        await operations.clearCart.mutate({});
        await cart.refetch();
      } catch (error) {
        console.error('Failed to clear cart:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      {cartData.items.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-12"
          data-testid="empty-cart-message"
        >
          <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
          <p className="text-gray-400 text-sm">Start adding products to your cart</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Shopping Cart</h2>
                <button
                  onClick={handleClearCart}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                >
                  Clear Cart
                </button>
              </div>

              <div className="divide-y">
                {cartData.items.map((item) => (
                  <CartItemComponent
                    key={item.productId}
                    item={item}
                    availableStock={100}
                    onRemove={handleRemoveItem}
                    onQuantityChange={(productId, quantity) =>
                      handleQuantityChange(productId, quantity, 100)
                    }
                    loading={loading}
                  />
                ))}
              </div>

              {/* Discount Code */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-3">Apply Discount Code</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    placeholder="Enter discount code"
                    disabled={loading}
                    data-testid="discount-code-input"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleApplyDiscount}
                    disabled={!discountCode.trim() || loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Continue Shopping */}
              <div className="mt-6">
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>

          {/* Cart Summary */}
          <div>
            <CartSummary cart={cartData} />

            {/* Checkout Button */}
            <button
              onClick={onCheckout}
              disabled={loading || cartData.items.length === 0}
              className="w-full mt-6 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
