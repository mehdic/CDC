/**
 * OrderStatusBadge Component
 * Displays order status with appropriate styling
 * Task: T8-040 - Patient E-Commerce Order History
 */

import React from 'react';
import { OrderStatus } from '../types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const statusConfig: Record<
  OrderStatus,
  { label: string; color: string; bgColor: string }
> = {
  pending: {
    label: 'En attente',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-100',
  },
  processing: {
    label: 'En traitement',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
  },
  shipped: {
    label: 'Expédié',
    color: 'text-purple-800',
    bgColor: 'bg-purple-100',
  },
  delivered: {
    label: 'Livré',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
  },
  cancelled: {
    label: 'Annulé',
    color: 'text-red-800',
    bgColor: 'bg-red-100',
  },
};

export function OrderStatusBadge({
  status,
  className = '',
}: OrderStatusBadgeProps): JSX.Element {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color} ${config.bgColor} ${className}`}
      data-testid={`order-status-badge-${status}`}
    >
      {config.label}
    </span>
  );
}
