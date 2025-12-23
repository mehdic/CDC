/**
 * useSearch Hook
 * Manages product search with debouncing for performance
 * Task: T8-038 - Patient E-Commerce Product Catalog
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { searchProducts } from '../services/ecommerceService';
import { Product } from '../types';

interface UseSearchResult {
  results: Product[];
  loading: boolean;
  error: Error | null;
  query: string;
  setQuery: (query: string) => void;
  clearSearch: () => void;
  hasSearched: boolean;
}

const DEBOUNCE_DELAY = 300; // 300ms debounce for fast search

export function useSearch(minChars: number = 2): UseSearchResult {
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [query, setQueryState] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minChars) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      const startTime = performance.now();
      const response = await searchProducts(searchQuery, 50);
      const endTime = performance.now();

      // Log search performance
      console.info(
        `Search for "${searchQuery}" took ${(endTime - startTime).toFixed(2)}ms`
      );

      setResults(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Search failed'));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [minChars]);

  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      performSearch(newQuery);
    }, DEBOUNCE_DELAY);
  }, [performSearch]);

  const clearSearch = useCallback(() => {
    setQueryState('');
    setResults([]);
    setHasSearched(false);
    setError(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    results,
    loading,
    error,
    query,
    setQuery,
    clearSearch,
    hasSearched,
  };
}
