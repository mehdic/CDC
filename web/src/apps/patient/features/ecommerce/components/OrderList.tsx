/**
 * OrderList Component
 * Displays list of orders with pagination
 * Task: T8-040 - Patient E-Commerce Order History
 */

import React from 'react';
import { Order } from '../types';
import { OrderCard } from './OrderCard';
import { Pagination } from './Pagination';

interface OrderListProps {
  orders: Order[];
  loading: boolean;
  error: Error | null;
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onOrderClick: (orderId: string) => void;
  className?: string;
}

export function OrderList({
  orders,
  loading,
  error,
  currentPage,
  totalPages,
  total,
  limit,
  onPageChange,
  onOrderClick,
  className = '',
}: OrderListProps): JSX.Element {
  if (loading) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Chargement des commandes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-red-600 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Erreur de chargement
        </h3>
        <p className="text-gray-600">{error.message}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div
        className={`text-center py-12 ${className}`}
        data-testid="no-orders-message"
      >
        <div className="text-gray-400 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucune commande trouvée
        </h3>
        <p className="text-gray-600">
          Vous n'avez pas encore passé de commande.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4" data-testid="orders-list">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onClick={onOrderClick}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
