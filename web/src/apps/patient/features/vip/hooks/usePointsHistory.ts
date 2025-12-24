/**
 * usePointsHistory Hook
 * React hook for managing points history with pagination
 * Task: T8-044 - Patient VIP Program Portal
 */

import { useState, useEffect } from 'react';
import { PointsHistory } from '../types/vip.types';
import { getPointsHistory } from '../services/vipService';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UsePointsHistoryResult {
  history: PointsHistory[];
  loading: boolean;
  error: Error | null;
  pagination: Pagination | null;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  refetch: () => Promise<void>;
}

export function usePointsHistory(initialPage: number = 1, initialLimit: number = 10): UsePointsHistoryResult {
  const [history, setHistory] = useState<PointsHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPageState] = useState<number>(initialPage);
  const [limit, setLimitState] = useState<number>(initialLimit);

  const fetchHistory = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPointsHistory(page, limit);
      setHistory(response.data);
      setPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        totalPages: response.pagination.total_pages,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch points history'));
      setHistory([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, limit]);

  return {
    history,
    loading,
    error,
    pagination,
    setPage: setPageState,
    setLimit: setLimitState,
    refetch: fetchHistory,
  };
}
