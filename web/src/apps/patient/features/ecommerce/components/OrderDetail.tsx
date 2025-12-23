/**
 * OrderDetail Component
 * Displays full order details with items, pricing, and actions
 * Task: T8-040 - Patient E-Commerce Order History
 */

import React, { useState } from 'react';
import { Order } from '../types';
import { OrderStatusBadge } from './OrderStatusBadge';
import { InvoiceDownload } from './InvoiceDownload';
import { reorderItems } from '../services/orderService';

interface OrderDetailProps {
  order: Order;
  onReorderSuccess?: () => void;
  className?: string;
}

export function OrderDetail({
  order,
  onReorderSuccess,
  className = '',
}: OrderDetailProps): JSX.Element {
  const [reordering, setReordering] = useState<boolean>(false);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [reorderSuccess, setReorderSuccess] = useState<boolean>(false);

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

  const handleReorder = async (): Promise<void> => {
    try {
      setReordering(true);
      setReorderError(null);
      setReorderSuccess(false);

      await reorderItems(order.id);

      setReorderSuccess(true);
      if (onReorderSuccess) {
        onReorderSuccess();
      }
    } catch (err) {
      setReorderError('Erreur lors de la recommande');
      console.error('Reorder error:', err);
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900" data-testid="order-number">
              Commande #{order.order_number}
            </h2>
            <p className="text-sm text-gray-600 mt-1" data-testid="order-date">
              Passée le {formatDate(order.created_at)}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {order.tracking_number && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Numéro de suivi:</span> {order.tracking_number}
            </p>
          </div>
        )}
      </div>

      {/* Delivery Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Informations de livraison
        </h3>
        <div className="bg-gray-50 rounded-lg p-4" data-testid="delivery-address">
          <p className="text-gray-900">{order.delivery_address.street}</p>
          <p className="text-gray-900">
            {order.delivery_address.postalCode} {order.delivery_address.city}
          </p>
          {order.delivery_address.country && (
            <p className="text-gray-900">{order.delivery_address.country}</p>
          )}

          {order.delivery_date && (
            <p className="text-sm text-gray-600 mt-3">
              <span className="font-medium">Livré le:</span>{' '}
              {formatDate(order.delivery_date)}
            </p>
          )}
          {order.estimated_delivery && !order.delivery_date && (
            <p className="text-sm text-gray-600 mt-3">
              <span className="font-medium">Livraison estimée:</span>{' '}
              {formatDate(order.estimated_delivery)}
            </p>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Articles commandés
        </h3>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center border-b border-gray-200 pb-4"
              data-testid={`order-item-${item.product_id}`}
            >
              {item.product_image_url && (
                <img
                  src={item.product_image_url}
                  alt={item.product_name}
                  className="w-20 h-20 object-cover rounded-lg mr-4"
                />
              )}
              <div className="flex-1">
                <h4
                  className="font-medium text-gray-900"
                  data-testid={`item-name-${item.product_id}`}
                >
                  {item.product_name}
                </h4>
                <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                <p className="text-sm text-gray-600">
                  Quantité: {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {formatPrice(item.total_price)}
                </p>
                <p className="text-sm text-gray-600">
                  {formatPrice(item.unit_price)} / unité
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="border-t border-gray-200 pt-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Résumé de la commande
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Sous-total</span>
            <span data-testid="order-subtotal">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>TVA</span>
            <span data-testid="order-tax">{formatPrice(order.tax)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Frais de livraison</span>
            <span data-testid="order-shipping">{formatPrice(order.shipping)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span data-testid="order-total">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={handleReorder}
          disabled={reordering || order.status === 'cancelled'}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          data-testid="reorder-button"
        >
          {reordering ? 'Recommande en cours...' : 'Commander à nouveau'}
        </button>

        {(order.status === 'delivered' || order.status === 'cancelled') && (
          <InvoiceDownload
            orderId={order.id}
            orderNumber={order.order_number}
          />
        )}
      </div>

      {/* Feedback Messages */}
      {reorderSuccess && (
        <div
          className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md"
          data-testid="notification"
          role="alert"
        >
          <p className="text-green-800">
            Articles ajoutés au panier avec succès!
          </p>
        </div>
      )}

      {reorderError && (
        <div
          className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md"
          role="alert"
        >
          <p className="text-red-800">{reorderError}</p>
        </div>
      )}

      {order.notes && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
          <p className="text-gray-600">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
