/**
 * OrderFilters Component
 * Filter controls for order list (status, date range, search)
 * Task: T8-040 - Patient E-Commerce Order History
 */

import React, { useState } from 'react';
import { OrderStatus, OrderFilters as OrderFiltersType } from '../types';

interface OrderFiltersProps {
  filters: OrderFiltersType;
  onFiltersChange: (filters: OrderFiltersType) => void;
  className?: string;
}

const statusOptions: Array<{ value: OrderStatus | ''; label: string }> = [
  { value: '', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'processing', label: 'En traitement' },
  { value: 'shipped', label: 'Expédié' },
  { value: 'delivered', label: 'Livré' },
  { value: 'cancelled', label: 'Annulé' },
];

export function OrderFilters({
  filters,
  onFiltersChange,
  className = '',
}: OrderFiltersProps): JSX.Element {
  const [searchInput, setSearchInput] = useState<string>(filters.search || '');

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const value = e.target.value as OrderStatus | '';
    onFiltersChange({
      ...filters,
      status: value || undefined,
      page: 1,
    });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFiltersChange({
      ...filters,
      start_date: e.target.value || undefined,
      page: 1,
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFiltersChange({
      ...filters,
      end_date: e.target.value || undefined,
      page: 1,
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchInput(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    onFiltersChange({
      ...filters,
      search: searchInput || undefined,
      page: 1,
    });
  };

  const handleClearFilters = (): void => {
    setSearchInput('');
    onFiltersChange({
      page: 1,
      limit: filters.limit,
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    // Sort handling can be added here when implementing sort functionality
    console.log('Sort changed to:', e.target.value);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtres</h3>

      <form onSubmit={handleSearchSubmit} className="space-y-4">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Rechercher
          </label>
          <input
            type="text"
            id="search"
            data-testid="search-input"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Numéro de commande..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <select
            id="status"
            data-testid="status-filter"
            value={filters.status || ''}
            onChange={handleStatusChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
            Date de début
          </label>
          <input
            type="date"
            id="start-date"
            data-testid="start-date"
            value={filters.start_date || ''}
            onChange={handleStartDateChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
            Date de fin
          </label>
          <input
            type="date"
            id="end-date"
            data-testid="end-date"
            value={filters.end_date || ''}
            onChange={handleEndDateChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sort */}
        <div>
          <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
            Trier par
          </label>
          <select
            id="sort"
            data-testid="sort-dropdown"
            onChange={handleSortChange}
            defaultValue="date-desc"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date-desc">Plus récent</option>
            <option value="date-asc">Plus ancien</option>
            <option value="total-desc">Total décroissant</option>
            <option value="total-asc">Total croissant</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Rechercher
          </button>
          <button
            type="button"
            onClick={handleClearFilters}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Réinitialiser
          </button>
        </div>
      </form>
    </div>
  );
}
