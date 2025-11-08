/**
 * Prescription Status Filters Component
 * Multi-select filter for prescription statuses with badge counts
 * Task: T121 - Implement prescription status filters
 */

import React from 'react';
import {
  Box,
  Chip,
  Stack,
  Typography,
  Paper,
} from '@mui/material';
import {
  PendingActions as PendingIcon,
  RateReview as ReviewIcon,
  Help as ClarificationIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  EventBusy as ExpiredIcon,
} from '@mui/icons-material';
import { PrescriptionStatus } from '../../../shared/hooks/usePrescriptions';

// ============================================================================
// Types
// ============================================================================

export interface StatusFilterProps {
  selectedStatuses: PrescriptionStatus[];
  onStatusChange: (statuses: PrescriptionStatus[]) => void;
  counts?: Record<PrescriptionStatus, number>;
}

interface StatusOption {
  value: PrescriptionStatus;
  label: string;
  icon: React.ReactElement;
  color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

// ============================================================================
// Status Configuration
// ============================================================================

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: PrescriptionStatus.PENDING,
    label: 'Pending',
    icon: <PendingIcon />,
    color: 'warning',
  },
  {
    value: PrescriptionStatus.IN_REVIEW,
    label: 'In Review',
    icon: <ReviewIcon />,
    color: 'info',
  },
  {
    value: PrescriptionStatus.CLARIFICATION_NEEDED,
    label: 'Clarification Needed',
    icon: <ClarificationIcon />,
    color: 'error',
  },
  {
    value: PrescriptionStatus.APPROVED,
    label: 'Approved',
    icon: <ApprovedIcon />,
    color: 'success',
  },
  {
    value: PrescriptionStatus.REJECTED,
    label: 'Rejected',
    icon: <RejectedIcon />,
    color: 'error',
  },
  {
    value: PrescriptionStatus.EXPIRED,
    label: 'Expired',
    icon: <ExpiredIcon />,
    color: 'default',
  },
];

// ============================================================================
// Component
// ============================================================================

export const StatusFilters: React.FC<StatusFilterProps> = ({
  selectedStatuses,
  onStatusChange,
  counts,
}) => {
  /**
   * Toggle status selection
   */
  const handleToggleStatus = (status: PrescriptionStatus) => {
    if (selectedStatuses.includes(status)) {
      // Remove status from selection
      onStatusChange(selectedStatuses.filter((s) => s !== status));
    } else {
      // Add status to selection
      onStatusChange([...selectedStatuses, status]);
    }
  };

  /**
   * Clear all selections
   */
  const handleClearAll = () => {
    onStatusChange([]);
  };

  /**
   * Select all statuses
   */
  const handleSelectAll = () => {
    onStatusChange(STATUS_OPTIONS.map((opt) => opt.value));
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" fontWeight="bold">
          Filter by Status
        </Typography>
        <Box>
          <Chip
            label="Select All"
            size="small"
            onClick={handleSelectAll}
            sx={{ mr: 1 }}
            variant="outlined"
          />
          <Chip
            label="Clear All"
            size="small"
            onClick={handleClearAll}
            variant="outlined"
          />
        </Box>
      </Box>

      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
        {STATUS_OPTIONS.map((option) => {
          const isSelected = selectedStatuses.includes(option.value);
          const count = counts?.[option.value] ?? 0;

          return (
            <Chip
              key={option.value}
              icon={option.icon}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span>{option.label}</span>
                  {counts && (
                    <Box
                      component="span"
                      sx={{
                        ml: 0.5,
                        px: 0.75,
                        py: 0.25,
                        borderRadius: '10px',
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {count}
                    </Box>
                  )}
                </Box>
              }
              onClick={() => handleToggleStatus(option.value)}
              color={isSelected ? option.color : 'default'}
              variant={isSelected ? 'filled' : 'outlined'}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8,
                },
              }}
            />
          );
        })}
      </Stack>
    </Paper>
  );
};

export default StatusFilters;
