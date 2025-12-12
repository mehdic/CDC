/**
 * Delivery List Screen
 * Displays list of assigned deliveries with pagination, filtering, and pull-to-refresh
 * Part of T8-020: Delivery Request List & Detail
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Pagination,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useDeliveryData, Delivery, DeliveryStatus } from '../../../shared/hooks/useDelivery';
import { DeliveryCard } from '../components/delivery/DeliveryCard';
import { DeliveryFilters } from '../components/delivery/DeliveryFilters';

export interface DeliveryListScreenProps {
  onSelectDelivery?: (delivery: Delivery) => void;
}

export const DeliveryListScreen: React.FC<DeliveryListScreenProps> = ({ onSelectDelivery }) => {
  const {
    deliveries,
    pagination,
    loading,
    error,
    fetchDeliveries,
  } = useDeliveryData();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Fetch deliveries on mount and when filters change
  useEffect(() => {
    const filters = statusFilter !== 'all' ? { status: statusFilter as DeliveryStatus } : {};
    fetchDeliveries({ ...filters, page: currentPage, limit: 20 });
  }, [currentPage, statusFilter, fetchDeliveries]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const filters = statusFilter !== 'all' ? { status: statusFilter as DeliveryStatus } : {};
      await fetchDeliveries({ ...filters, page: 1, limit: 20 });
      setCurrentPage(1);
    } finally {
      setIsRefreshing(false);
    }
  }, [statusFilter, fetchDeliveries]);

  // Handle status filter change
  const handleFilterChange = (newStatus: DeliveryStatus | 'all') => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  // Handle delivery selection
  const handleSelectDelivery = (delivery: Delivery) => {
    if (onSelectDelivery) {
      onSelectDelivery(delivery);
    }
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            My Deliveries
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and complete your delivery assignments
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading || isRefreshing}
          sx={{ whiteSpace: 'nowrap' }}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => {}}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <DeliveryFilters
        currentFilter={statusFilter}
        onFilterChange={handleFilterChange}
        loading={loading}
      />

      {/* Loading State */}
      {loading && deliveries.length === 0 && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Loading deliveries...
          </Typography>
        </Box>
      )}

      {/* Empty State */}
      {!loading && deliveries.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: '#fff' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No deliveries found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {statusFilter !== 'all'
              ? `No deliveries with status "${statusFilter}"`
              : 'Check back later for new delivery assignments'}
          </Typography>
        </Paper>
      )}

      {/* Deliveries List */}
      {!loading && deliveries.length > 0 && (
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {deliveries.length} of {pagination?.total_items || 0} deliveries
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            {deliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                onClick={() => handleSelectDelivery(delivery)}
                data-testid={`delivery-card-${delivery.id}`}
              />
            ))}
          </Box>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={pagination.total_pages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                disabled={loading}
                data-testid="delivery-pagination"
              />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default DeliveryListScreen;
