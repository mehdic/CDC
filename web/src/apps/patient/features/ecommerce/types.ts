/**
 * Patient E-Commerce Types
 * Type definitions for product catalog, categories, and related entities
 * Task: T8-038 - Patient E-Commerce Product Catalog
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  display_order: number;
  children: Category[];
  parent_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  manufacturer: string | null;
  category_id: string;
  category?: Category;
  price: number;
  original_price: number | null;
  stock: number;
  low_stock_threshold: number;
  requires_prescription: boolean;
  image_url: string | null;
  expiry_date: string | null;
  rating: number;
  review_count: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductListResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface SearchResponse {
  data: Product[];
  query: string;
  count: number;
}

export interface CategoryTreeResponse {
  data: Category[];
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  category_id?: string;
  search?: string;
  requires_prescription?: boolean;
  min_price?: number;
  max_price?: number;
  in_stock_only?: boolean;
  sort_by?: 'created_at' | 'name' | 'price' | 'rating';
  sort_order?: 'ASC' | 'DESC';
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type SortField = 'created_at' | 'name' | 'price' | 'rating';
export type SortOrder = 'ASC' | 'DESC';
