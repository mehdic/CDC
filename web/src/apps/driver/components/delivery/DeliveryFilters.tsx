/**
 * Delivery Filters Component
 * Provides filtering options for delivery list
 * Part of T8-020: Delivery Request List & Detail
 */

import React from 'react';
import {
  Paper,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Typography,
  CircularProgress,
} from '@mui/material';
import { DeliveryStatus } from '../../../../shared/hooks/useDelivery';

export interface DeliveryFiltersProps {
  currentFilter: DeliveryStatus | 'all';
  onFilterChange: (status: DeliveryStatus | 'all') => void;
  loading?: boolean;
}

export const DeliveryFilters: React.FC<DeliveryFiltersProps> = ({
  currentFilter,
  onFilterChange,
  loading = false,
}) => {
  const handleStatusChange = (event: SelectChangeEvent<DeliveryStatus | 'all'>) => {
    onFilterChange(event.target.value as DeliveryStatus | 'all');
  };

  return (
    <Paper
      sx={{
        p: 2.5,
        mb: 3,
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
      }}
      data-testid="delivery-filters"
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 220 }} disabled={loading}>
          <InputLabel id="status-filter-label">Filter by Status</InputLabel>
          <Select
            labelId="status-filter-label"
            id="status-filter"
            value={currentFilter}
            onChange={handleStatusChange}
            label="Filter by Status"
            data-testid="status-filter-select"
          >
            <MenuItem value="all">All Deliveries</MenuItem>
            <MenuItem value={DeliveryStatus.PENDING}>Pending</MenuItem>
            <MenuItem value={DeliveryStatus.ASSIGNED}>Assigned to Me</MenuItem>
            <MenuItem value={DeliveryStatus.IN_TRANSIT}>In Transit</MenuItem>
            <MenuItem value={DeliveryStatus.DELIVERED}>Delivered</MenuItem>
            <MenuItem value={DeliveryStatus.FAILED}>Failed</MenuItem>
            <MenuItem value={DeliveryStatus.CANCELLED}>Cancelled</MenuItem>
          </Select>
        </FormControl>

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            <Typography variant="caption" color="text.secondary">
              Loading...
            </Typography>
          </Box>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
          Tip: Use status filters to find deliveries by their current status
        </Typography>
      </Box>
    </Paper>
  );
};

export default DeliveryFilters;
