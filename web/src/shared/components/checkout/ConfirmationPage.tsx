/**
 * Order Confirmation Page
 * T3-041: Order Confirmation Flow
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface OrderConfirmationData {
  orderId: string;
  orderNumber: string;
  total: number;
  estimatedDelivery?: string;
  deliveryAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface ConfirmationPageProps {
  order: OrderConfirmationData;
}

export const ConfirmationPage: React.FC<ConfirmationPageProps> = ({ order }) => {
  const navigate = useNavigate();

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'À déterminer';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-CH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="confirmation-page" data-testid="confirmation-page">
      <div className="confirmation-container">
        {/* Success Icon */}
        <div className="success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Confirmation Message */}
        <div className="confirmation-message" data-testid="order-confirmation-message">
          <h1>Commande confirmée !</h1>
          <p>Merci pour votre commande. Nous avons bien reçu votre paiement.</p>
        </div>

        {/* Order Number */}
        <div className="order-info">
          <div className="info-card">
            <div className="info-label">Numéro de commande</div>
            <div className="info-value" data-testid="order-number">
              {order.orderNumber}
            </div>
          </div>

          {order.estimatedDelivery && (
            <div className="info-card">
              <div className="info-label">Livraison estimée</div>
              <div className="info-value" data-testid="estimated-delivery">
                {formatDate(order.estimatedDelivery)}
              </div>
            </div>
          )}

          <div className="info-card">
            <div className="info-label">Total</div>
            <div className="info-value total">CHF {order.total.toFixed(2)}</div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="order-summary-section">
          <h3>Récapitulatif de la commande</h3>
          <div className="order-items">
            {order.items.map((item) => (
              <div key={item.id} className="summary-item">
                <div className="item-details">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">x{item.quantity}</span>
                </div>
                <span className="item-total">CHF {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="delivery-info-section">
          <h3>Adresse de livraison</h3>
          <div className="address-box">
            <div>{order.deliveryAddress.street}</div>
            <div>
              {order.deliveryAddress.postalCode} {order.deliveryAddress.city}
            </div>
            <div>{order.deliveryAddress.country}</div>
          </div>
        </div>

        {/* Email Notification */}
        <div className="email-notice">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          <span>
            Un e-mail de confirmation a été envoyé à votre adresse. Vous pouvez suivre votre
            commande dans votre espace client.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            className="btn-secondary"
            onClick={() => navigate('/orders')}
            data-testid="btn-view-order"
          >
            Voir la commande
          </button>
          <button
            className="btn-primary"
            onClick={() => navigate('/ecommerce')}
            data-testid="btn-continue-shopping"
          >
            Continuer vos achats
          </button>
        </div>
      </div>

      <style jsx>{`
        .confirmation-page {
          min-height: calc(100vh - 200px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(to bottom, #eff6ff, #ffffff);
        }

        .confirmation-container {
          max-width: 600px;
          width: 100%;
          background: white;
          border-radius: 16px;
          padding: 3rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .success-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 2rem;
          color: #10b981;
        }

        .success-icon svg {
          width: 100%;
          height: 100%;
          stroke-width: 1.5;
        }

        .confirmation-message h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .confirmation-message p {
          font-size: 1.125rem;
          color: #6b7280;
          margin-bottom: 2rem;
        }

        .order-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .info-card {
          background-color: #f9fafb;
          padding: 1rem;
          border-radius: 8px;
        }

        .info-label {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .info-value {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
        }

        .info-value.total {
          font-size: 1.5rem;
          color: #10b981;
        }

        .order-summary-section,
        .delivery-info-section {
          text-align: left;
          margin-bottom: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .order-summary-section h3,
        .delivery-info-section h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #374151;
        }

        .order-items {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background-color: #f9fafb;
          border-radius: 6px;
        }

        .item-details {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .item-name {
          font-weight: 500;
          color: #111827;
        }

        .item-quantity {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .item-total {
          font-weight: 600;
          color: #111827;
        }

        .address-box {
          padding: 1rem;
          background-color: #f9fafb;
          border-radius: 6px;
          line-height: 1.6;
          color: #374151;
        }

        .email-notice {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background-color: #eff6ff;
          border-radius: 8px;
          text-align: left;
          margin-bottom: 2rem;
          color: #1e40af;
          font-size: 0.875rem;
        }

        .email-notice svg {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
        }

        .btn-primary,
        .btn-secondary {
          flex: 1;
          padding: 1rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 1rem;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
          border: none;
        }

        .btn-primary:hover {
          background-color: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .btn-secondary {
          background-color: white;
          color: #374151;
          border: 2px solid #e5e7eb;
        }

        .btn-secondary:hover {
          background-color: #f9fafb;
          border-color: #3b82f6;
          color: #3b82f6;
        }

        @media (max-width: 640px) {
          .confirmation-container {
            padding: 2rem 1.5rem;
          }

          .confirmation-message h1 {
            font-size: 1.5rem;
          }

          .action-buttons {
            flex-direction: column-reverse;
          }

          .order-info {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
