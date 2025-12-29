/**
 * Product Service Unit Tests
 * Tests for medication/product search API functionality
 * Task: Medication Autocomplete Feature
 */

import {
  searchProducts,
  getProductById,
  getStockStatusLabel,
  getStockStatusColor,
  debounce,
  ProductSearchResult,
} from '../productService';

// ============================================================================
// Mocks
// ============================================================================

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// ============================================================================
// Test Data
// ============================================================================

const mockProduct: ProductSearchResult = {
  id: 'prod-001',
  name: 'Paracetamol 500mg',
  sku: 'PARA-500',
  manufacturer: 'Sandoz',
  price: 8.5,
  stock: 150,
  stock_status: 'in_stock',
  requires_prescription: false,
  category: 'analgesics',
  dosage_form: 'tablet',
};

const mockSearchResponse = {
  products: [mockProduct],
  query: 'para',
  total: 1,
  timestamp: '2025-12-29T12:00:00.000Z',
};

const mockProductDetailResponse = {
  product: mockProduct,
  timestamp: '2025-12-29T12:00:00.000Z',
};

// ============================================================================
// Setup and Teardown
// ============================================================================

beforeEach(() => {
  jest.clearAllMocks();
  mockLocalStorage.getItem.mockReturnValue('mock-auth-token');
});

// ============================================================================
// searchProducts Tests
// ============================================================================

describe('searchProducts', () => {
  it('should return empty array for query less than 2 characters', async () => {
    const result = await searchProducts('a');
    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should return empty array for empty query', async () => {
    const result = await searchProducts('');
    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should return empty array for whitespace-only query', async () => {
    const result = await searchProducts('   ');
    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should call API with correct parameters for valid query', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSearchResponse),
    });

    const result = await searchProducts('para', 10);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/products/search?q=para&limit=10'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-auth-token',
        }),
      })
    );
    expect(result).toEqual([mockProduct]);
  });

  it('should trim whitespace from query', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSearchResponse),
    });

    await searchProducts('  para  ', 10);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/products/search?q=para&limit=10'),
      expect.anything()
    );
  });

  it('should cap limit at 50', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSearchResponse),
    });

    await searchProducts('para', 100);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('limit=50'),
      expect.anything()
    );
  });

  it('should return empty array on 400 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    });

    const result = await searchProducts('ab');

    expect(result).toEqual([]);
  });

  it('should throw error on other non-ok responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(searchProducts('para')).rejects.toThrow(
      'Search failed: 500 Internal Server Error'
    );
  });

  it('should throw error on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(searchProducts('para')).rejects.toThrow('Network error');
  });

  it('should handle response with empty products array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          products: [],
          query: 'xyz',
          total: 0,
          timestamp: '2025-12-29T12:00:00.000Z',
        }),
    });

    const result = await searchProducts('xyz');

    expect(result).toEqual([]);
  });

  it('should handle response without products property', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          query: 'test',
          total: 0,
          timestamp: '2025-12-29T12:00:00.000Z',
        }),
    });

    const result = await searchProducts('test');

    expect(result).toEqual([]);
  });
});

// ============================================================================
// getProductById Tests
// ============================================================================

describe('getProductById', () => {
  it('should return product for valid ID', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProductDetailResponse),
    });

    const result = await getProductById('prod-001');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/products/prod-001'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-auth-token',
        }),
      })
    );
    expect(result).toEqual(mockProduct);
  });

  it('should throw error for empty ID', async () => {
    await expect(getProductById('')).rejects.toThrow('Product ID is required');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should throw error for 404 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(getProductById('invalid-id')).rejects.toThrow(
      'Product not found: invalid-id'
    );
  });

  it('should throw error for other non-ok responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(getProductById('prod-001')).rejects.toThrow(
      'Failed to fetch product: 500 Internal Server Error'
    );
  });
});

// ============================================================================
// getStockStatusLabel Tests
// ============================================================================

describe('getStockStatusLabel', () => {
  it('should return "En stock" for in_stock status', () => {
    expect(getStockStatusLabel('in_stock')).toBe('En stock');
  });

  it('should return "Stock faible" for low_stock status', () => {
    expect(getStockStatusLabel('low_stock')).toBe('Stock faible');
  });

  it('should return "Rupture de stock" for out_of_stock status', () => {
    expect(getStockStatusLabel('out_of_stock')).toBe('Rupture de stock');
  });

  it('should return "Inconnu" for unknown status', () => {
    // @ts-expect-error Testing unknown status
    expect(getStockStatusLabel('unknown')).toBe('Inconnu');
  });
});

// ============================================================================
// getStockStatusColor Tests
// ============================================================================

describe('getStockStatusColor', () => {
  it('should return "success" for in_stock status', () => {
    expect(getStockStatusColor('in_stock')).toBe('success');
  });

  it('should return "warning" for low_stock status', () => {
    expect(getStockStatusColor('low_stock')).toBe('warning');
  });

  it('should return "error" for out_of_stock status', () => {
    expect(getStockStatusColor('out_of_stock')).toBe('error');
  });

  it('should return "default" for unknown status', () => {
    // @ts-expect-error Testing unknown status
    expect(getStockStatusColor('unknown')).toBe('default');
  });
});

// ============================================================================
// debounce Tests
// ============================================================================

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should delay function execution', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn('test');

    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);

    expect(mockFn).toHaveBeenCalledWith('test');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should cancel previous call if called again before timeout', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn('first');
    jest.advanceTimersByTime(200);
    debouncedFn('second');
    jest.advanceTimersByTime(300);

    expect(mockFn).toHaveBeenCalledWith('second');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should execute each call if enough time passes between calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn('first');
    jest.advanceTimersByTime(300);

    debouncedFn('second');
    jest.advanceTimersByTime(300);

    expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
    expect(mockFn).toHaveBeenNthCalledWith(2, 'second');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});
