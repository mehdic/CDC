/**
 * CategoryBrowser Component
 * Displays hierarchical category navigation
 * Task: T8-038 - Patient E-Commerce Product Catalog
 */

import React from 'react';
import { Category } from '../types';
import '../styles/CategoryBrowser.css';

interface CategoryBrowserProps {
  categories: Category[];
  selectedCategoryId?: string;
  onSelectCategory: (categoryId: string | null) => void;
  onSelectSubcategory?: (categoryId: string) => void;
}

interface CategoryNodeProps {
  category: Category;
  isSelected: boolean;
  depth: number;
  onSelectCategory: (categoryId: string) => void;
  onSelectSubcategory?: (categoryId: string) => void;
}

const CategoryNode: React.FC<CategoryNodeProps> = ({
  category,
  isSelected,
  depth,
  onSelectCategory,
  onSelectSubcategory,
}) => {
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="category-node" style={{ paddingLeft: `${depth * 16}px` }}>
      <button
        className={`category-node__label ${isSelected ? 'category-node__label--selected' : ''}`}
        onClick={() => {
          onSelectCategory(category.id);
          if (onSelectSubcategory) {
            onSelectSubcategory(category.id);
          }
        }}
        data-testid={`category-${category.id}`}
      >
        {category.icon_url && (
          <img
            src={category.icon_url}
            alt={category.name}
            className="category-node__icon"
          />
        )}
        <span className="category-node__name">{category.name}</span>
        {hasChildren && (
          <span className="category-node__expand-icon">
            {depth === 0 ? '▼' : '→'}
          </span>
        )}
      </button>

      {hasChildren && depth < 2 && (
        <div className="category-node__children">
          {category.children!.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              isSelected={isSelected && child.id === selectedCategoryId}
              depth={depth + 1}
              onSelectCategory={onSelectCategory}
              onSelectSubcategory={onSelectSubcategory}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CategoryBrowser: React.FC<CategoryBrowserProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onSelectSubcategory,
}) => {
  const handleClearSelection = () => {
    onSelectCategory(null);
  };

  return (
    <div className="category-browser" data-testid="category-browser">
      <div className="category-browser__header">
        <h3 className="category-browser__title">Categories</h3>
        {selectedCategoryId && (
          <button
            className="category-browser__clear-button"
            onClick={handleClearSelection}
            data-testid="clear-category-filter"
          >
            Clear
          </button>
        )}
      </div>

      <nav className="category-browser__list">
        {categories.map((category) => (
          <CategoryNode
            key={category.id}
            category={category}
            isSelected={category.id === selectedCategoryId}
            depth={0}
            onSelectCategory={onSelectCategory}
            onSelectSubcategory={onSelectSubcategory}
          />
        ))}
      </nav>
    </div>
  );
};
