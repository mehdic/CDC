/**
 * StatusIndicator Component
 * Displays message delivery/read status
 */

import React from 'react';
import { Box, Tooltip } from '@mui/material';
import {
  Schedule as PendingIcon,
  Done as SentIcon,
  DoneAll as DeliveredIcon,
  Error as FailedIcon,
} from '@mui/icons-material';
import { MessageStatus } from '../types/messaging.types';

interface StatusIndicatorProps {
  status: MessageStatus;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const getIconComponent = (status: MessageStatus) => {
  switch (status) {
    case MessageStatus.PENDING:
      return PendingIcon;
    case MessageStatus.SENT:
      return SentIcon;
    case MessageStatus.DELIVERED:
    case MessageStatus.READ:
      return DeliveredIcon;
    case MessageStatus.FAILED:
      return FailedIcon;
    default:
      return SentIcon;
  }
};

const getStatusColor = (
  status: MessageStatus
): 'action' | 'success' | 'error' | 'warning' | 'info' => {
  switch (status) {
    case MessageStatus.PENDING:
      return 'action';
    case MessageStatus.SENT:
      return 'action';
    case MessageStatus.DELIVERED:
      return 'success';
    case MessageStatus.READ:
      return 'info';
    case MessageStatus.FAILED:
      return 'error';
    default:
      return 'action';
  }
};

const getStatusLabel = (status: MessageStatus): string => {
  switch (status) {
    case MessageStatus.PENDING:
      return 'En cours...';
    case MessageStatus.SENT:
      return 'Envoyé';
    case MessageStatus.DELIVERED:
      return 'Livré';
    case MessageStatus.READ:
      return 'Lu';
    case MessageStatus.FAILED:
      return 'Échec';
    default:
      return 'Inconnu';
  }
};

const getSizeProps = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small':
      return { fontSize: 'small' };
    case 'large':
      return { fontSize: 'large' };
    default:
      return { fontSize: 'medium' };
  }
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'small',
  showLabel = false,
}) => {
  const IconComponent = getIconComponent(status);
  const color = getStatusColor(status);
  const label = getStatusLabel(status);

  return (
    <Tooltip title={label}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: showLabel ? 0.5 : 0,
        }}
      >
        <IconComponent
          {...getSizeProps(size)}
          color={color}
          data-testid={`status-indicator-${status}`}
        />
        {showLabel && (
          <span style={{ fontSize: size === 'small' ? '0.75rem' : '0.875rem', color }}>
            {label}
          </span>
        )}
      </Box>
    </Tooltip>
  );
};
