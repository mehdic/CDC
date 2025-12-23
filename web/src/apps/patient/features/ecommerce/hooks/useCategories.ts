/**
 * useCategories Hook
 * Manages category fetching and navigation
 * Task: T8-038 - Patient E-Commerce Product Catalog
 */

import { useState, useEffect, useCallback } from 'react';
import { getCategories } from '../services/ecommerceService';
import { Category } from '../types';

interface UseCategoriesResult {
  categories: Category[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCategories();
      setCategories(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const refetch = useCallback(async () => {
    await fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetch,
  };
}
