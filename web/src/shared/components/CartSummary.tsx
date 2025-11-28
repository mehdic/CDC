/**
 * CartSummary Component
 * Displays cart totals including subtotal, tax, and discount
 * T3-035: Cart Frontend Components
 */

import React from 'react';
import { Cart } from '../hooks/useCart';

interface CartSummaryProps {
  cart: Cart;
  className?: string;
}

export const CartSummary: React.FC<CartSummaryProps> = ({ cart, className = '' }) => {
  return (
    <div
      className={`bg-gray-50 rounded-lg p-6 border border-gray-200 ${className}`}
      data-testid="cart-summary"
    >
      <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

      <div className="space-y-2 mb-4">
        {/* Subtotal */}
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span data-testid="cart-subtotal" className="font-medium">
            CHF {cart.subtotal.toFixed(2)}
          </span>
        </div>

        {/* Tax */}
        <div className="flex justify-between">
          <span className="text-gray-600">Tax (10%)</span>
          <span data-testid="cart-tax" className="font-medium">
            CHF {cart.tax.toFixed(2)}
          </span>
        </div>

        {/* Discount */}
        {cart.discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span className="text-gray-600">
              Discount {cart.discountCode && `(${cart.discountCode})`}
            </span>
            <span data-testid="cart-discount" className="font-medium">
              -CHF {cart.discount.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="border-t pt-4 flex justify-between items-center">
        <span className="text-lg font-semibold">Total</span>
        <span data-testid="cart-total" className="text-xl font-bold text-blue-600">
          CHF {cart.total.toFixed(2)}
        </span>
      </div>

      {/* Item Count */}
      <div className="mt-4 pt-4 border-t text-sm text-gray-600">
        <span data-testid="cart-item-count">
          {cart.itemCount} item{cart.itemCount !== 1 ? 's' : ''} ({cart.totalQuantity} total quantity)
        </span>
      </div>
    </div>
  );
};
