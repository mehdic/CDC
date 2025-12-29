/**
 * Product Service
 * API calls for medication/product search in prescription workflow
 * Task: Medication Autocomplete Feature
 */

// ============================================================================
// Types
// ============================================================================

export interface ProductSearchResult {
  id: string;
  name: string;
  sku: string;
  manufacturer: string;
  price: number;
  stock: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  requires_prescription: boolean;
  category: string;
  dosage_form: string;
}

export interface ProductSearchResponse {
  products: ProductSearchResult[];
  query: string;
  total: number;
  timestamp: string;
}

export interface ProductDetailResponse {
  product: ProductSearchResult;
  timestamp: string;
}

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const PRESCRIPTION_SERVICE_URL = import.meta.env.VITE_PRESCRIPTION_SERVICE_URL || 'http://localhost:4003';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get authentication headers with Bearer token
 */
const getAuthHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
});

/**
 * Debounce function for search
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Search products/medications by query
 * @param query - Search query (minimum 2 characters)
 * @param limit - Maximum number of results (default: 10, max: 50)
 * @returns Promise<ProductSearchResult[]> - Array of matching products
 */
export async function searchProducts(
  query: string,
  limit: number = 10
): Promise<ProductSearchResult[]> {
  // Validate query
  if (!query || query.trim().length < 2) {
    return [];
  }

  const trimmedQuery = query.trim();
  const params = new URLSearchParams({
    q: trimmedQuery,
    limit: Math.min(limit, 50).toString(),
  });

  try {
    const response = await fetch(
      `${PRESCRIPTION_SERVICE_URL}/products/search?${params.toString()}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 400) {
        // Invalid query, return empty array
        return [];
      }
      throw new Error(`Search failed: ${response.status} ${response.statusText}`);
    }

    const data: ProductSearchResponse = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
}

/**
 * Get product by ID
 * @param id - Product ID
 * @returns Promise<ProductSearchResult> - Product details
 */
export async function getProductById(id: string): Promise<ProductSearchResult> {
  if (!id) {
    throw new Error('Product ID is required');
  }

  try {
    const response = await fetch(
      `${PRESCRIPTION_SERVICE_URL}/products/${id}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Product not found: ${id}`);
      }
      throw new Error(`Failed to fetch product: ${response.status} ${response.statusText}`);
    }

    const data: ProductDetailResponse = await response.json();
    return data.product;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

/**
 * Get stock status label for display
 */
export function getStockStatusLabel(status: ProductSearchResult['stock_status']): string {
  switch (status) {
    case 'in_stock':
      return 'En stock';
    case 'low_stock':
      return 'Stock faible';
    case 'out_of_stock':
      return 'Rupture de stock';
    default:
      return 'Inconnu';
  }
}

/**
 * Get stock status color for MUI Chip
 */
export function getStockStatusColor(
  status: ProductSearchResult['stock_status']
): 'success' | 'warning' | 'error' | 'default' {
  switch (status) {
    case 'in_stock':
      return 'success';
    case 'low_stock':
      return 'warning';
    case 'out_of_stock':
      return 'error';
    default:
      return 'default';
  }
}

export default {
  searchProducts,
  getProductById,
  getStockStatusLabel,
  getStockStatusColor,
  debounce,
};
