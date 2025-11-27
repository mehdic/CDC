/**
 * CartIcon Component
 * Displays shopping cart icon with item count
 * T3-035: Cart Frontend Components
 */

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../hooks/useCart';

interface CartIconProps {
  onClick?: () => void;
  className?: string;
}

export const CartIcon: React.FC<CartIconProps> = ({ onClick, className = '' }) => {
  const { data } = useCart();
  const itemCount = data?.cart?.itemCount || 0;

  return (
    <button
      onClick={onClick}
      className={`relative p-2 hover:bg-gray-100 rounded-lg transition-colors ${className}`}
      data-testid="cart-icon"
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <ShoppingCart className="w-6 h-6" />
      {itemCount > 0 && (
        <span
          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
          data-testid="cart-count"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
};
