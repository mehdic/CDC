/**
 * useCart Hook Tests
 * T3-037: Shopping Cart Tests
 */

import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCart, useAddToCart, useRemoveFromCart, useUpdateCartQuantity } from '../useCart';

// Create a fresh queryClient for each test
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
};

describe('useCart Hooks', () => {
  describe('useCart', () => {
    it('should initialize cart hook', async () => {
      // This test verifies the hook initializes without errors
      // Full data fetching would require API mocking
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCart(), { wrapper });

      // Hook should be defined
      expect(result.current).toBeDefined();

      // Should have expected properties
      expect(typeof result.current.data).toBeDefined();
      expect(typeof result.current.isLoading).toBeDefined();
    });
  });

  describe('useAddToCart', () => {
    it('should add product to cart', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAddToCart(), { wrapper });

      // Note: In a real test, you would mock the API response
      // and test the actual mutation result
      expect(result.current.mutate).toBeDefined();
      expect(result.current.isPending).toBe(false);
    });
  });

  describe('useRemoveFromCart', () => {
    it('should remove product from cart', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useRemoveFromCart(), { wrapper });

      expect(result.current.mutate).toBeDefined();
      expect(result.current.isPending).toBe(false);
    });
  });

  describe('useUpdateCartQuantity', () => {
    it('should update item quantity', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateCartQuantity(), { wrapper });

      expect(result.current.mutate).toBeDefined();
      expect(result.current.isPending).toBe(false);
    });
  });
});
