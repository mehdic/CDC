/**
 * useVIPOffers Hook
 * React hook for managing VIP offers with pagination
 * Task: T8-044 - Patient VIP Program Portal
 */

import { useState, useEffect } from 'react';
import { VIPOffer } from '../types/vip.types';
import { getOffers } from '../services/vipService';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseVIPOffersResult {
  offers: VIPOffer[];
  loading: boolean;
  error: Error | null;
  pagination: Pagination | null;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  refetch: () => Promise<void>;
}

export function useVIPOffers(initialPage: number = 1, initialLimit: number = 10): UseVIPOffersResult {
  const [offers, setOffers] = useState<VIPOffer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPageState] = useState<number>(initialPage);
  const [limit, setLimitState] = useState<number>(initialLimit);

  const fetchOffers = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await getOffers(page, limit);
      setOffers(response.data);
      setPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        totalPages: response.pagination.total_pages,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch offers'));
      setOffers([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [page, limit]);

  return {
    offers,
    loading,
    error,
    pagination,
    setPage: setPageState,
    setLimit: setLimitState,
    refetch: fetchOffers,
  };
}
