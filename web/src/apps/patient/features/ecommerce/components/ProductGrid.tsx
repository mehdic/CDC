/**
 * ProductGrid Component
 * Displays products in a responsive grid
 * Task: T8-038 - Patient E-Commerce Product Catalog
 */

import React from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import '../styles/ProductGrid.css';

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  error: Error | null;
  onViewDetails: (productId: string) => void;
  onAddToCart?: (product: Product) => void;
  emptyMessage?: string;
  columns?: number;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading,
  error,
  onViewDetails,
  onAddToCart,
  emptyMessage = 'No products found',
  columns = 4,
}) => {
  if (loading) {
    return (
      <div className="product-grid" data-testid="product-grid-loading">
        <div className="product-grid__loading">
          <div className="spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-grid product-grid--error" data-testid="product-grid-error">
        <div className="product-grid__error">
          <svg
            className="product-grid__error-icon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4v2m0 4v2m-9-15a9 9 0 1118 0 9 9 0 01-18 0z"
            />
          </svg>
          <p className="product-grid__error-message">
            Failed to load products. Please try again.
          </p>
          <p className="product-grid__error-detail">{error.message}</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="product-grid product-grid--empty" data-testid="product-grid-empty">
        <div className="product-grid__empty">
          <svg
            className="product-grid__empty-icon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="product-grid__empty-message">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="product-grid"
      style={
        {
          '--grid-columns': columns,
        } as React.CSSProperties & { '--grid-columns': number }
      }
      data-testid="product-list"
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onViewDetails={onViewDetails}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
};
