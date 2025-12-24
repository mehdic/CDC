/**
 * OrderHistory Page
 * Main page for viewing order history with filters
 * Task: T8-040 - Patient E-Commerce Order History
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrderFilters as OrderFiltersType } from '../types';
import { useOrders } from '../hooks';
import { OrderList, OrderFilters } from '../components';

export function OrderHistory(): JSX.Element {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<OrderFiltersType>({
    page: 1,
    limit: 10,
  });

  const { orders, loading, error, pagination } = useOrders(filters);

  const handlePageChange = (page: number): void => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleFiltersChange = (newFilters: OrderFiltersType): void => {
    setFilters(newFilters);
  };

  const handleOrderClick = (orderId: string): void => {
    navigate(`/orders/${orderId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Historique des commandes
          </h1>
          <p className="mt-2 text-gray-600">
            Consultez vos commandes passées et suivez leur état
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <OrderFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </div>

          {/* Order List */}
          <div className="lg:col-span-3">
            <OrderList
              orders={orders}
              loading={loading}
              error={error}
              currentPage={pagination?.page || 1}
              totalPages={pagination?.totalPages || 1}
              total={pagination?.total || 0}
              limit={pagination?.limit || 10}
              onPageChange={handlePageChange}
              onOrderClick={handleOrderClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderHistory;
