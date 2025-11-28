/**
 * Delivery Options Component
 * T3-039: Checkout Frontend - Delivery method selection
 */

import React from 'react';

export interface DeliveryMethod {
  id: string;
  name: string;
  description: string;
  cost: number;
  estimatedDelivery: number;
  icon?: string;
}

export interface DeliveryOptionsProps {
  methods: DeliveryMethod[];
  selectedMethod?: DeliveryMethod;
  onMethodSelect: (method: DeliveryMethod) => void;
}

export const DeliveryOptions: React.FC<DeliveryOptionsProps> = ({
  methods,
  selectedMethod,
  onMethodSelect,
}) => {
  const formatCost = (cost: number): string => {
    return cost === 0 ? 'Gratuit' : `CHF ${cost.toFixed(2)}`;
  };

  const formatDeliveryTime = (days: number): string => {
    if (days === 0) return 'Disponible immédiatement';
    if (days === 1) return 'Livraison le lendemain';
    return `${days}-${days + 1} jours ouvrables`;
  };

  const getIcon = (methodId: string): string => {
    const icons: Record<string, string> = {
      standard: '📦',
      express: '⚡',
      pickup: '🏪',
    };
    return icons[methodId] || '📦';
  };

  return (
    <div className="delivery-options" data-testid="delivery-options">
      <h3 className="form-title">Mode de livraison</h3>

      <div className="methods-list">
        {methods.map((method) => (
          <div
            key={method.id}
            className={`method-card ${selectedMethod?.id === method.id ? 'selected' : ''}`}
            onClick={() => onMethodSelect(method)}
            data-testid={`delivery-${method.id}`}
          >
            <div className="method-icon">{getIcon(method.id)}</div>
            <div className="method-content">
              <div className="method-header">
                <div className="method-name">{method.name}</div>
                <div className="method-cost">{formatCost(method.cost)}</div>
              </div>
              <div className="method-description">{method.description}</div>
              <div className="method-delivery-time">
                {formatDeliveryTime(method.estimatedDelivery)}
              </div>
            </div>
            <div className="radio-indicator">
              <div className={`radio-circle ${selectedMethod?.id === method.id ? 'selected' : ''}`}>
                {selectedMethod?.id === method.id && <div className="radio-dot" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedMethod && (
        <div className="selected-info" data-testid="selected-delivery-method">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Mode de livraison sélectionné : <strong>{selectedMethod.name}</strong></span>
        </div>
      )}

      <style jsx>{`
        .delivery-options {
          padding: 1.5rem;
        }

        .form-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: #111827;
        }

        .methods-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .method-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
        }

        .method-card:hover {
          border-color: #3b82f6;
          background-color: #eff6ff;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .method-card.selected {
          border-color: #3b82f6;
          background-color: #eff6ff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .method-icon {
          font-size: 2rem;
          min-width: 48px;
          text-align: center;
        }

        .method-content {
          flex: 1;
        }

        .method-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .method-name {
          font-weight: 600;
          font-size: 1rem;
          color: #111827;
        }

        .method-cost {
          font-weight: 700;
          font-size: 1.125rem;
          color: #3b82f6;
        }

        .method-description {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .method-delivery-time {
          font-size: 0.875rem;
          color: #059669;
          font-weight: 500;
        }

        .radio-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .radio-circle {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid #d1d5db;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .radio-circle.selected {
          border-color: #3b82f6;
        }

        .radio-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #3b82f6;
        }

        .selected-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1.5rem;
          padding: 1rem;
          background-color: #ecfdf5;
          border-radius: 6px;
          color: #047857;
          font-size: 0.875rem;
        }

        .selected-info svg {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        @media (max-width: 640px) {
          .method-card {
            flex-direction: column;
            text-align: center;
          }

          .method-header {
            flex-direction: column;
            gap: 0.25rem;
          }
        }
      `}</style>
    </div>
  );
};
