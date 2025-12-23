/**
 * ProductCard Component
 * Displays individual product information
 * Task: T8-038 - Patient E-Commerce Product Catalog
 */

import React, { useState } from 'react';
import { Product } from '../types';
import '../styles/ProductCard.css';

interface ProductCardProps {
  product: Product;
  onViewDetails: (productId: string) => void;
  onAddToCart?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetails,
  onAddToCart,
}) => {
  const [imageLoadError, setImageLoadError] = useState(false);

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= product.low_stock_threshold;
  const isOnSale = product.original_price ? product.original_price > product.price : false;
  const discountPercentage = isOnSale
    ? Math.round(
        ((product.original_price! - product.price) / product.original_price!) * 100
      )
    : 0;

  return (
    <div
      className={`product-card ${isOutOfStock ? 'product-card--out-of-stock' : ''}`}
      data-testid={`product-card-${product.id}`}
    >
      <div className="product-card__image-container">
        {product.image_url && !imageLoadError ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="product-card__image"
            onError={() => setImageLoadError(true)}
            loading="lazy"
          />
        ) : (
          <div className="product-card__image-placeholder">
            <svg
              className="product-card__image-placeholder-icon"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="product-card__image-placeholder-text">No Image</p>
          </div>
        )}

        {isOutOfStock && (
          <div className="product-card__out-of-stock-badge">Out of Stock</div>
        )}

        {isOnSale && !isOutOfStock && (
          <div className="product-card__discount-badge">{discountPercentage}% OFF</div>
        )}

        {isLowStock && !isOutOfStock && (
          <div className="product-card__low-stock-badge">Low Stock</div>
        )}

        {product.is_featured && (
          <div className="product-card__featured-badge">Featured</div>
        )}
      </div>

      <div className="product-card__content">
        <div className="product-card__category">
          {product.category?.name || 'Uncategorized'}
        </div>

        <h3 className="product-card__name">{product.name}</h3>

        {product.manufacturer && (
          <p className="product-card__manufacturer">{product.manufacturer}</p>
        )}

        <div className="product-card__rating">
          {product.review_count > 0 ? (
            <>
              <span className="product-card__rating-stars">
                {'⭐'.repeat(Math.round(product.rating))}
              </span>
              <span className="product-card__rating-value">{product.rating.toFixed(1)}</span>
              <span className="product-card__rating-count">
                ({product.review_count} reviews)
              </span>
            </>
          ) : (
            <span className="product-card__rating-no-reviews">No reviews yet</span>
          )}
        </div>

        <div className="product-card__pricing">
          {isOnSale ? (
            <>
              <span className="product-card__original-price">
                ${product.original_price?.toFixed(2)}
              </span>
              <span className="product-card__price">${product.price.toFixed(2)}</span>
            </>
          ) : (
            <span className="product-card__price">${product.price.toFixed(2)}</span>
          )}
        </div>

        {product.requires_prescription && (
          <div className="product-card__prescription-badge">Requires Prescription</div>
        )}

        <div className="product-card__actions">
          <button
            className="product-card__button product-card__button--details"
            onClick={() => onViewDetails(product.id)}
            data-testid={`view-details-${product.id}`}
          >
            View Details
          </button>

          {!isOutOfStock && onAddToCart && (
            <button
              className="product-card__button product-card__button--add-to-cart"
              onClick={() => onAddToCart(product)}
              data-testid={`add-to-cart-${product.id}`}
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
