/**
 * CartItemComponent
 * Individual cart item with quantity controls
 * T3-035: Cart Frontend Components
 */

import React, { useState } from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { CartItem } from '../hooks/useCart';

interface CartItemComponentProps {
  item: CartItem;
  availableStock: number;
  onRemove: (productId: string) => void;
  onQuantityChange: (productId: string, quantity: number) => void;
  loading?: boolean;
}

export const CartItemComponent: React.FC<CartItemComponentProps> = ({
  item,
  availableStock,
  onRemove,
  onQuantityChange,
  loading = false,
}) => {
  const [quantity, setQuantity] = useState(item.quantity);

  const handleIncrement = () => {
    if (quantity < availableStock) {
      const newQuantity = quantity + 1;
      setQuantity(newQuantity);
      onQuantityChange(item.productId, newQuantity);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      onQuantityChange(item.productId, newQuantity);
    }
  };

  const handleQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value, 10);
    if (!isNaN(newQuantity) && newQuantity > 0 && newQuantity <= availableStock) {
      setQuantity(newQuantity);
      onQuantityChange(item.productId, newQuantity);
    }
  };

  return (
    <div
      className="flex gap-4 py-4 border-b border-gray-200 last:border-b-0"
      data-testid={`cart-item-${item.productId}`}
    >
      {/* Product Image */}
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-24 h-24 object-cover rounded-lg bg-gray-100"
        />
      )}

      {/* Product Details */}
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
        {item.description && <p className="text-sm text-gray-600 mb-2">{item.description}</p>}
        <p className="text-sm text-gray-500">{item.category}</p>

        {/* Prescription Badge */}
        {item.requiresPrescription && (
          <span className="inline-block mt-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
            Requires Prescription
          </span>
        )}
      </div>

      {/* Quantity & Price */}
      <div className="flex flex-col items-end gap-2">
        {/* Price */}
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">CHF {item.price.toFixed(2)}</div>
          <div className="text-sm text-gray-500">Subtotal: CHF {item.subtotal.toFixed(2)}</div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={handleDecrement}
            disabled={quantity <= 1 || loading}
            data-testid={`decrement-qty-${item.productId}`}
            className="p-1 hover:bg-gray-200 disabled:hover:bg-gray-100 rounded transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4" />
          </button>

          <input
            type="number"
            min="1"
            max={availableStock}
            value={quantity}
            onChange={handleQuantityInput}
            disabled={loading}
            data-testid={`quantity-input-${item.productId}`}
            className="w-12 text-center border-0 bg-transparent font-medium outline-none"
          />

          <button
            onClick={handleIncrement}
            disabled={quantity >= availableStock || loading}
            data-testid={`increment-qty-${item.productId}`}
            className="p-1 hover:bg-gray-200 disabled:hover:bg-gray-100 rounded transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <span className="text-xs text-gray-500">{availableStock} available</span>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => onRemove(item.productId)}
        disabled={loading}
        data-testid={`remove-item-${item.productId}`}
        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        aria-label={`Remove ${item.name}`}
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
};
