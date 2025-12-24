/**
 * OrderCard Component
 * Displays order summary in list view
 * Task: T8-040 - Patient E-Commerce Order History
 */

import React from 'react';
import { Order } from '../types';
import { OrderStatusBadge } from './OrderStatusBadge';

interface OrderCardProps {
  order: Order;
  onClick?: (orderId: string) => void;
  className?: string;
}

export function OrderCard({
  order,
  onClick,
  className = '',
}: OrderCardProps): JSX.Element {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-CH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number): string => {
    return `CHF ${price.toFixed(2)}`;
  };

  const handleClick = (): void => {
    if (onClick) {
      onClick(order.id);
    }
  };

  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        handleClick();
      }}
      data-testid={`order-link-${order.id}`}
      className={`block no-underline ${className}`}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div
        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
        data-testid={`order-${order.id}`}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900" data-testid={`order-number-${order.id}`}>
              Commande #{order.order_number}
            </h3>
            <p className="text-sm text-gray-600" data-testid={`order-date-${order.id}`}>
              {formatDate(order.created_at)}
            </p>
          </div>
          <div data-testid={`order-status-${order.id}`}>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              {order.items.length} article{order.items.length > 1 ? 's' : ''}
            </span>
            <span className="text-lg font-bold text-gray-900" data-testid={`order-total-${order.id}`}>
              {formatPrice(order.total)}
            </span>
          </div>

          {order.delivery_date && (
            <p className="text-sm text-gray-600" data-testid={`delivery-date-${order.id}`}>
              Livré le: {formatDate(order.delivery_date)}
            </p>
          )}
          {order.estimated_delivery && !order.delivery_date && (
            <p className="text-sm text-gray-600" data-testid={`estimated-delivery-${order.id}`}>
              Livraison estimée: {formatDate(order.estimated_delivery)}
            </p>
          )}
        </div>

        {order.tracking_number && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Numéro de suivi:</span> {order.tracking_number}
            </p>
          </div>
        )}
      </div>
    </a>
  );
}
