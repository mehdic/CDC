/**
 * Patient E-Commerce Catalog Page
 * Main catalog page with products, categories, search, and filtering
 * Task: T8-038 - Patient E-Commerce Product Catalog
 */

import React, { useState } from 'react';
import {
  ProductCard,
  CategoryBrowser,
  ProductSearch,
  ProductGrid,
  Pagination,
  ProductDetail,
} from '../components';
import { useProducts, useCategories, useSearch } from '../hooks';
import { Product } from '../types';
import '../styles/Catalog.css';

export const Catalog: React.FC = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();

  // Hooks for data fetching
  const {
    products,
    loading: productsLoading,
    error: productsError,
    pagination,
    setFilters,
  } = useProducts({
    page: 1,
    limit: 20,
    category_id: selectedCategoryId || undefined,
    in_stock_only: inStockOnly,
    min_price: minPrice,
    max_price: maxPrice,
  });

  const { categories, loading: categoriesLoading } = useCategories();

  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    query: searchQuery,
    setQuery: setSearchQuery,
    clearSearch,
    hasSearched,
  } = useSearch();

  // Determine which products to display
  const displayProducts = hasSearched ? searchResults : products;
  const isLoading = hasSearched ? searchLoading : productsLoading;
  const error = hasSearched ? searchError : productsError;

  // Get selected product for detail view
  const selectedProduct = displayProducts.find((p) => p.id === selectedProductId);

  const handlePageChange = (page: number) => {
    setFilters({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setFilters({ category_id: categoryId || undefined, page: 1 });
  };

  const handleAddToCart = (product: Product) => {
    // TODO: Implement cart functionality
    console.log('Add to cart:', product);
    alert(`Added "${product.name}" to cart`);
  };

  const handleAddToCartDetail = (product: Product, quantity: number) => {
    // TODO: Implement cart functionality with quantity
    console.log('Add to cart:', product, quantity);
    alert(`Added ${quantity} x "${product.name}" to cart`);
    setSelectedProductId(null);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    clearSearch();
  };

  return (
    <div className="catalog" data-testid="catalog-page">
      <div className="catalog__header">
        <h1>Product Catalog</h1>
        <p className="catalog__subtitle">
          Browse our selection of OTC medications and parapharmacy items
        </p>
      </div>

      <div className="catalog__search-bar">
        <ProductSearch
          query={searchQuery}
          onQueryChange={handleSearch}
          onClear={handleClearSearch}
          loading={searchLoading}
          resultsCount={hasSearched ? searchResults.length : undefined}
          hasSearched={hasSearched}
        />
      </div>

      <div className="catalog__container">
        {/* Sidebar with categories and filters */}
        <aside className="catalog__sidebar" data-testid="catalog-sidebar">
          <div className="catalog__section">
            {categoriesLoading ? (
              <div className="catalog__loading">
                <p>Loading categories...</p>
              </div>
            ) : (
              <CategoryBrowser
                categories={categories}
                selectedCategoryId={selectedCategoryId || undefined}
                onSelectCategory={handleCategorySelect}
              />
            )}
          </div>

          {/* Filters section */}
          {!hasSearched && (
            <div className="catalog__section catalog__filters">
              <h3 className="catalog__filters-title">Filters</h3>

              <div className="catalog__filter-group">
                <label className="catalog__filter-label">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => {
                      setInStockOnly(e.target.checked);
                      setFilters({ in_stock_only: e.target.checked, page: 1 });
                    }}
                    data-testid="filter-in-stock"
                  />
                  In Stock Only
                </label>
              </div>

              <div className="catalog__filter-group">
                <label className="catalog__filter-label">
                  Min Price: ${minPrice || '0'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={minPrice || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    setMinPrice(value);
                    setFilters({ min_price: value, page: 1 });
                  }}
                  placeholder="Min"
                  className="catalog__filter-input"
                  data-testid="filter-min-price"
                />
              </div>

              <div className="catalog__filter-group">
                <label className="catalog__filter-label">
                  Max Price: ${maxPrice || '∞'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={maxPrice || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    setMaxPrice(value);
                    setFilters({ max_price: value, page: 1 });
                  }}
                  placeholder="Max"
                  className="catalog__filter-input"
                  data-testid="filter-max-price"
                />
              </div>

              <button
                className="catalog__filter-clear"
                onClick={() => {
                  setInStockOnly(false);
                  setMinPrice(undefined);
                  setMaxPrice(undefined);
                  setFilters({
                    in_stock_only: false,
                    min_price: undefined,
                    max_price: undefined,
                    page: 1,
                  });
                }}
                data-testid="clear-filters"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </aside>

        {/* Main content area */}
        <main className="catalog__main">
          {hasSearched && (
            <div className="catalog__search-results-header">
              <h2 className="catalog__search-results-title">
                Search Results for "{searchQuery}"
              </h2>
              <button
                className="catalog__search-clear-link"
                onClick={handleClearSearch}
                data-testid="clear-search-link"
              >
                Back to catalog
              </button>
            </div>
          )}

          {/* Product grid */}
          <ProductGrid
            products={displayProducts}
            loading={isLoading}
            error={error}
            onViewDetails={(id) => setSelectedProductId(id)}
            onAddToCart={handleAddToCart}
            emptyMessage={
              hasSearched
                ? `No products found matching "${searchQuery}"`
                : 'No products available in this category'
            }
            columns={4}
          />

          {/* Pagination - only show if not searching */}
          {!hasSearched && pagination && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.total_pages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          )}
        </main>
      </div>

      {/* Product detail modal */}
      {selectedProduct && (
        <div
          className="catalog__modal-overlay"
          onClick={() => setSelectedProductId(null)}
          data-testid="modal-overlay"
        >
          <div
            className="catalog__modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <ProductDetail
              product={selectedProduct}
              onClose={() => setSelectedProductId(null)}
              onAddToCart={handleAddToCartDetail}
            />
          </div>
        </div>
      )}
    </div>
  );
};
