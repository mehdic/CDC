/**
 * ProductDetail Component
 * Displays detailed product information
 * Task: T8-038 - Patient E-Commerce Product Catalog
 */

import React, { useState } from 'react';
import { Product } from '../types';
import '../styles/ProductDetail.css';

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
  onAddToCart?: (product: Product, quantity: number) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= product.low_stock_threshold;
  const isOnSale = product.original_price ? product.original_price > product.price : false;
  const discountPercentage = isOnSale
    ? Math.round(
        ((product.original_price! - product.price) / product.original_price!) * 100
      )
    : 0;

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0 && value <= Math.min(10, product.stock)) {
      setQuantity(value);
    }
  };

  const handleAddToCart = async () => {
    if (onAddToCart && quantity > 0) {
      setIsAdding(true);
      try {
        onAddToCart(product, quantity);
        // Reset after success
        setQuantity(1);
      } finally {
        setIsAdding(false);
      }
    }
  };

  const availableQuantity = Math.min(10, product.stock);

  return (
    <div className="product-detail" data-testid={`product-detail-${product.id}`}>
      <button
        className="product-detail__close"
        onClick={onClose}
        data-testid="close-product-detail"
        aria-label="Close product details"
      >
        ✕
      </button>

      <div className="product-detail__container">
        <div className="product-detail__image-section">
          {product.image_url && !imageLoadError ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="product-detail__image"
              onError={() => setImageLoadError(true)}
            />
          ) : (
            <div className="product-detail__image-placeholder">
              <svg
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
              <p>No Image</p>
            </div>
          )}

          {isOnSale && !isOutOfStock && (
            <div className="product-detail__discount-badge">{discountPercentage}% OFF</div>
          )}
        </div>

        <div className="product-detail__info-section">
          <div className="product-detail__header">
            <h1 className="product-detail__name">{product.name}</h1>
            <div className="product-detail__category">
              {product.category?.name || 'Uncategorized'}
            </div>
          </div>

          {product.manufacturer && (
            <p className="product-detail__manufacturer">
              <strong>Manufacturer:</strong> {product.manufacturer}
            </p>
          )}

          <div className="product-detail__rating">
            {product.review_count > 0 ? (
              <>
                <span className="product-detail__rating-stars">
                  {'⭐'.repeat(Math.round(product.rating))}
                </span>
                <span className="product-detail__rating-value">{product.rating.toFixed(1)}</span>
                <span className="product-detail__rating-count">
                  ({product.review_count} reviews)
                </span>
              </>
            ) : (
              <span className="product-detail__rating-no-reviews">No reviews yet</span>
            )}
          </div>

          <div className="product-detail__pricing">
            {isOnSale ? (
              <>
                <span className="product-detail__original-price">
                  ${product.original_price?.toFixed(2)}
                </span>
                <span className="product-detail__price">${product.price.toFixed(2)}</span>
                <span className="product-detail__savings">
                  You save ${(product.original_price! - product.price).toFixed(2)}
                </span>
              </>
            ) : (
              <span className="product-detail__price">${product.price.toFixed(2)}</span>
            )}
          </div>

          <div className="product-detail__stock">
            {isOutOfStock ? (
              <div className="product-detail__out-of-stock" data-testid="out-of-stock">
                <strong>Out of Stock</strong>
                <p>This item is currently unavailable.</p>
              </div>
            ) : isLowStock ? (
              <div className="product-detail__low-stock">
                <strong>Low in Stock</strong>
                <p>Only {product.stock} item{product.stock !== 1 ? 's' : ''} available</p>
              </div>
            ) : (
              <div className="product-detail__in-stock">
                <strong>In Stock</strong>
                <p>{product.stock} item{product.stock !== 1 ? 's' : ''} available</p>
              </div>
            )}
          </div>

          {product.requires_prescription && (
            <div className="product-detail__prescription-notice">
              <strong>⚠️ Prescription Required</strong>
              <p>This medication requires a valid prescription to purchase.</p>
            </div>
          )}

          {product.expiry_date && (
            <p className="product-detail__expiry">
              <strong>Expiry Date:</strong> {new Date(product.expiry_date).toLocaleDateString()}
            </p>
          )}

          {product.description && (
            <div className="product-detail__description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>
          )}

          <div className="product-detail__sku">
            <strong>SKU:</strong> {product.sku}
          </div>

          {!isOutOfStock && onAddToCart && (
            <div className="product-detail__purchase">
              <div className="product-detail__quantity">
                <label htmlFor="quantity">Quantity:</label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  max={availableQuantity}
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="product-detail__quantity-input"
                  data-testid="quantity-input"
                  disabled={isOutOfStock || isAdding}
                />
              </div>

              <button
                className="product-detail__add-to-cart-button"
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAdding}
                data-testid="add-to-cart-button"
              >
                {isAdding ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
