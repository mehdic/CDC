/**
 * Delivery Card Component
 * Displays a single delivery in the list with key information and priority indicators
 * Part of T8-020: Delivery Request List & Detail
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Button,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  LocalShipping as DeliveryIcon,
  AccessTime as TimeIcon,
  LocalOffer as TagIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { Delivery, DeliveryStatus } from '../../../../shared/hooks/useDelivery';
import { PriorityBadge } from './PriorityBadge';

export interface DeliveryCardProps {
  delivery: Delivery;
  onClick?: () => void;
  'data-testid'?: string;
}

const getStatusColor = (status: DeliveryStatus): 'default' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case DeliveryStatus.DELIVERED:
      return 'success';
    case DeliveryStatus.FAILED:
      return 'error';
    case DeliveryStatus.IN_TRANSIT:
      return 'warning';
    case DeliveryStatus.ASSIGNED:
    case DeliveryStatus.PENDING:
      return 'info';
    default:
      return 'default';
  }
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Not scheduled';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getDeliveryAddress = (delivery: Delivery): string => {
  if (delivery.tracking_info?.address) {
    return String(delivery.tracking_info.address);
  }
  return 'Address not available';
};

export const DeliveryCard: React.FC<DeliveryCardProps> = ({
  delivery,
  onClick,
  'data-testid': testId,
}) => {
  const address = getDeliveryAddress(delivery);
  const scheduledDate = formatDate(delivery.scheduled_at);
  const statusColor = getStatusColor(delivery.status);

  return (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        '&:hover': onClick
          ? {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transform: 'translateY(-2px)',
            }
          : undefined,
      }}
      onClick={onClick}
      data-testid={testId || `delivery-card-${delivery.id}`}
    >
      <CardContent sx={{ pb: 1 }}>
        {/* Header with status and priority */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
              <DeliveryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              {delivery.user_id}
            </Typography>
          </Box>
          <PriorityBadge
            isControlledSubstance={delivery.tracking_info?.contains_controlled_substance === true}
            requiresTemperatureControl={delivery.tracking_info?.requires_temperature_control === true}
            isUrgent={delivery.status === DeliveryStatus.IN_TRANSIT}
          />
        </Box>

        {/* Status chip */}
        <Box sx={{ mb: 1 }}>
          <Chip
            label={delivery.status.replace(/_/g, ' ').toUpperCase()}
            color={statusColor}
            size="small"
            variant="outlined"
            data-testid={`delivery-status-${delivery.id}`}
          />
        </Box>

        {/* Address */}
        <Box
          sx={{
            mb: 1.5,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            📍
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
            {address}
          </Typography>
        </Box>

        {/* Scheduled date */}
        {delivery.scheduled_at && (
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimeIcon sx={{ fontSize: 18 }} />
            Scheduled: {scheduledDate}
          </Typography>
        )}

        {/* Tracking number if available */}
        {delivery.tracking_number && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <TagIcon sx={{ fontSize: 16 }} />
            Track #: {delivery.tracking_number}
          </Typography>
        )}

        {/* Special instructions indicator */}
        {delivery.tracking_info?.special_handling_instructions && (
          <Box sx={{ mt: 1, p: 1, backgroundColor: '#fff3cd', borderRadius: 1, borderLeft: '3px solid #ffc107' }}>
            <Typography variant="caption" color="text.secondary">
              <strong>Special handling:</strong> {String(delivery.tracking_info.special_handling_instructions)}
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ pt: 0 }}>
        <Tooltip title="View full delivery details">
          <Button
            size="small"
            color="primary"
            endIcon={<ViewIcon />}
            data-testid={`view-delivery-button-${delivery.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            View Details
          </Button>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default DeliveryCard;
