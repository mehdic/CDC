/**
 * Order Review Component
 * T3-039: Checkout Frontend - Order summary and review before submission
 */

import React from 'react';
import { Cart } from '@shared/hooks/useCart';
import { Address } from './AddressForm';
import { DeliveryMethod } from './DeliveryOptions';
import { PaymentMethodOption } from './PaymentMethod';

export interface OrderReviewProps {
  cart: Cart;
  deliveryAddress: Address;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethodOption;
  shippingCost: number;
  onEdit?: (step: number) => void;
}

export const OrderReview: React.FC<OrderReviewProps> = ({
  cart,
  deliveryAddress,
  deliveryMethod,
  paymentMethod,
  shippingCost,
  onEdit,
}) => {
  const grandTotal = cart.total + shippingCost - cart.discount;

  return (
    <div className="order-review" data-testid="order-review">
      <h3 className="form-title">Récapitulatif de la commande</h3>

      {/* Order Items */}
      <div className="review-section">
        <div className="section-header">
          <h4>Articles ({cart.itemCount})</h4>
          {onEdit && (
            <button className="btn-edit" onClick={() => onEdit(0)} data-testid="edit-items">
              Modifier
            </button>
          )}
        </div>
        <div className="items-list" data-testid="order-summary">
          {cart.items.map((item) => (
            <div key={item.id} className="item-row" data-testid={`order-item-${item.id}`}>
              <div className="item-info">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.name} className="item-image" />
                )}
                <div>
                  <div className="item-name">{item.name}</div>
                  {item.requiresPrescription && (
                    <span className="prescription-badge">Sur ordonnance</span>
                  )}
                </div>
              </div>
              <div className="item-quantity">x{item.quantity}</div>
              <div className="item-price">CHF {item.subtotal.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Address */}
      <div className="review-section">
        <div className="section-header">
          <h4>Adresse de livraison</h4>
          {onEdit && (
            <button className="btn-edit" onClick={() => onEdit(1)} data-testid="edit-address">
              Modifier
            </button>
          )}
        </div>
        <div className="address-display" data-testid="selected-address">
          <div className="address-line">{deliveryAddress.street}</div>
          <div className="address-line">
            {deliveryAddress.postalCode} {deliveryAddress.city}
          </div>
          <div className="address-line">{deliveryAddress.country}</div>
        </div>
      </div>

      {/* Delivery Method */}
      <div className="review-section">
        <div className="section-header">
          <h4>Mode de livraison</h4>
          {onEdit && (
            <button className="btn-edit" onClick={() => onEdit(2)} data-testid="edit-delivery">
              Modifier
            </button>
          )}
        </div>
        <div className="delivery-display" data-testid="selected-delivery-method">
          <div className="method-name">{deliveryMethod.name}</div>
          <div className="method-description">{deliveryMethod.description}</div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="review-section">
        <div className="section-header">
          <h4>Moyen de paiement</h4>
          {onEdit && (
            <button className="btn-edit" onClick={() => onEdit(3)} data-testid="edit-payment">
              Modifier
            </button>
          )}
        </div>
        <div className="payment-display">
          <div className="method-name">{paymentMethod.name}</div>
        </div>
      </div>

      {/* Price Summary */}
      <div className="price-summary">
        <div className="summary-row" data-testid="summary-subtotal">
          <span>Sous-total</span>
          <span>CHF {cart.subtotal.toFixed(2)}</span>
        </div>
        <div className="summary-row" data-testid="summary-shipping">
          <span>Frais de livraison</span>
          <span data-testid="shipping-cost">CHF {shippingCost.toFixed(2)}</span>
        </div>
        {cart.tax > 0 && (
          <div className="summary-row" data-testid="summary-tax">
            <span>TVA</span>
            <span>CHF {cart.tax.toFixed(2)}</span>
          </div>
        )}
        {cart.discount > 0 && (
          <div className="summary-row discount">
            <span>Réduction {cart.discountCode && `(${cart.discountCode})`}</span>
            <span>-CHF {cart.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="summary-divider" />
        <div className="summary-row total" data-testid="summary-total">
          <span>Total</span>
          <span data-testid="order-total">CHF {grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <style jsx>{`
        .order-review {
          padding: 1.5rem;
        }

        .form-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: #111827;
        }

        .review-section {
          background-color: #f9fafb;
          padding: 1.25rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        h4 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
        }

        .btn-edit {
          background: none;
          border: none;
          color: #3b82f6;
          font-weight: 500;
          cursor: pointer;
          font-size: 0.875rem;
          padding: 0.25rem 0.5rem;
        }

        .btn-edit:hover {
          text-decoration: underline;
        }

        .items-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .item-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: white;
          border-radius: 6px;
        }

        .item-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
        }

        .item-image {
          width: 48px;
          height: 48px;
          object-fit: cover;
          border-radius: 4px;
        }

        .item-name {
          font-weight: 500;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .prescription-badge {
          display: inline-block;
          font-size: 0.75rem;
          padding: 0.125rem 0.5rem;
          background-color: #fef3c7;
          color: #92400e;
          border-radius: 10px;
        }

        .item-quantity {
          color: #6b7280;
          font-size: 0.875rem;
          min-width: 40px;
          text-align: center;
        }

        .item-price {
          font-weight: 600;
          color: #111827;
          min-width: 80px;
          text-align: right;
        }

        .address-display,
        .delivery-display,
        .payment-display {
          padding: 0.75rem;
          background: white;
          border-radius: 6px;
        }

        .address-line {
          color: #374151;
          margin-bottom: 0.25rem;
        }

        .address-line:last-child {
          margin-bottom: 0;
        }

        .method-name {
          font-weight: 500;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .method-description {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .price-summary {
          background-color: #f9fafb;
          padding: 1.5rem;
          border-radius: 8px;
          margin-top: 1.5rem;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          color: #374151;
        }

        .summary-row.discount {
          color: #059669;
        }

        .summary-divider {
          height: 1px;
          background-color: #d1d5db;
          margin: 0.75rem 0;
        }

        .summary-row.total {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
        }

        @media (max-width: 640px) {
          .item-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .item-quantity,
          .item-price {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
};
