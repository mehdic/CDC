/**
 * Priority Badge Component
 * Shows priority indicators (urgent, controlled substance, cold chain)
 * Part of T8-020: Delivery Request List & Detail
 */

import React from 'react';
import { Box, Tooltip, Chip } from '@mui/material';
import {
  LocalFireDepartment as UrgentIcon,
  AcUnit as ColdChainIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

export interface PriorityBadgeProps {
  isControlledSubstance?: boolean;
  requiresTemperatureControl?: boolean;
  isUrgent?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  isControlledSubstance = false,
  requiresTemperatureControl = false,
  isUrgent = false,
}) => {
  const badges: React.ReactNode[] = [];

  if (isUrgent) {
    badges.push(
      <Tooltip key="urgent" title="Delivery in transit - urgent">
        <Chip
          icon={<UrgentIcon sx={{ color: '#d32f2f !important' }} />}
          label="Urgent"
          size="small"
          sx={{
            backgroundColor: '#ffebee',
            color: '#d32f2f',
            fontWeight: 600,
          }}
          data-testid="priority-badge-urgent"
        />
      </Tooltip>
    );
  }

  if (isControlledSubstance) {
    badges.push(
      <Tooltip key="controlled" title="Contains controlled substances - requires special handling">
        <Chip
          icon={<SecurityIcon sx={{ color: '#f57c00 !important' }} />}
          label="Controlled"
          size="small"
          sx={{
            backgroundColor: '#fff3e0',
            color: '#f57c00',
            fontWeight: 600,
          }}
          data-testid="priority-badge-controlled"
        />
      </Tooltip>
    );
  }

  if (requiresTemperatureControl) {
    badges.push(
      <Tooltip key="cold-chain" title="Requires temperature control - cold chain delivery">
        <Chip
          icon={<ColdChainIcon sx={{ color: '#1976d2 !important' }} />}
          label="Cold Chain"
          size="small"
          sx={{
            backgroundColor: '#e3f2fd',
            color: '#1976d2',
            fontWeight: 600,
          }}
          data-testid="priority-badge-cold-chain"
        />
      </Tooltip>
    );
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0.5,
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
      }}
      data-testid="priority-badge-container"
    >
      {badges}
    </Box>
  );
};

export default PriorityBadge;
