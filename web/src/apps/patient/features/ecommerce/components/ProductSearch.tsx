/**
 * ProductSearch Component
 * Implements fast search with debouncing
 * Task: T8-038 - Patient E-Commerce Product Catalog
 */

import React, { useEffect, useRef } from 'react';
import '../styles/ProductSearch.css';

interface ProductSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  onClear: () => void;
  loading: boolean;
  resultsCount?: number;
  hasSearched: boolean;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  query,
  onQueryChange,
  onClear,
  loading,
  resultsCount,
  hasSearched,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onQueryChange(e.target.value);
  };

  const handleClear = () => {
    onClear();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="product-search" data-testid="product-search">
      <div className="product-search__input-wrapper">
        <svg
          className="product-search__search-icon"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          ref={inputRef}
          type="text"
          className="product-search__input"
          placeholder="Search products..."
          value={query}
          onChange={handleChange}
          data-testid="search-input"
          aria-label="Search products"
        />

        {loading && (
          <span className="product-search__spinner" data-testid="search-spinner">
            <span className="spinner"></span>
          </span>
        )}

        {query && !loading && (
          <button
            className="product-search__clear-button"
            onClick={handleClear}
            data-testid="clear-search"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {hasSearched && !loading && (
        <div className="product-search__results-info">
          <p className="product-search__results-count">
            {resultsCount ? `Found ${resultsCount} product${resultsCount !== 1 ? 's' : ''}` : 'No products found'}
          </p>
        </div>
      )}

      {query.length > 0 && query.length < 2 && (
        <div className="product-search__hint">
          <p className="product-search__hint-text">
            Enter at least 2 characters to search
          </p>
        </div>
      )}
    </div>
  );
};
