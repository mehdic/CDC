/**
 * DeliveryTracking Component
 * View and track delivery status with timeline
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  LocalShipping as ShippingIcon,
  Inventory as PackageIcon,
  Cancel as CancelIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { Delivery, DeliveryStatus } from '../../../../shared/hooks/useDelivery';

interface DeliveryTrackingProps {
  open: boolean;
  delivery: Delivery | null;
  onClose: () => void;
}

const getStatusIcon = (status: DeliveryStatus, isActive: boolean) => {
  const color = isActive ? 'primary' : 'grey';

  switch (status) {
    case DeliveryStatus.PENDING:
      return <PackageIcon color={color} />;
    case DeliveryStatus.ASSIGNED:
      return <PackageIcon color={color} />;
    case DeliveryStatus.IN_TRANSIT:
      return <ShippingIcon color={color} />;
    case DeliveryStatus.DELIVERED:
      return <CheckIcon color={color} />;
    case DeliveryStatus.FAILED:
      return <ErrorIcon color="error" />;
    case DeliveryStatus.CANCELLED:
      return <CancelIcon color="warning" />;
    default:
      return <PackageIcon color={color} />;
  }
};

export const DeliveryTracking: React.FC<DeliveryTrackingProps> = ({ open, delivery, onClose }) => {
  if (!delivery) return null;

  const formatDateTime = (dateStr: string | null): string => {
    if (!dateStr) return 'Not yet';
    return new Date(dateStr).toLocaleString();
  };

  const timelineEvents = [
    {
      label: 'Created',
      time: delivery.created_at,
      status: DeliveryStatus.PENDING,
      isActive: true,
    },
    {
      label: 'Assigned to Personnel',
      time: delivery.delivery_personnel_id ? delivery.created_at : null,
      status: DeliveryStatus.ASSIGNED,
      isActive: delivery.status !== DeliveryStatus.PENDING,
    },
    {
      label: 'Picked Up',
      time: delivery.picked_up_at,
      status: DeliveryStatus.IN_TRANSIT,
      isActive: delivery.picked_up_at !== null,
    },
    {
      label: 'Delivered',
      time: delivery.delivered_at,
      status: DeliveryStatus.DELIVERED,
      isActive: delivery.delivered_at !== null,
    },
  ];

  // Add failure or cancellation if applicable
  if (delivery.status === DeliveryStatus.FAILED) {
    timelineEvents.push({
      label: `Failed: ${delivery.failure_reason || 'Unknown reason'}`,
      time: delivery.failed_at,
      status: DeliveryStatus.FAILED,
      isActive: true,
    });
  } else if (delivery.status === DeliveryStatus.CANCELLED) {
    timelineEvents.push({
      label: 'Cancelled',
      time: delivery.updated_at,
      status: DeliveryStatus.CANCELLED,
      isActive: true,
    });
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Delivery Tracking</Typography>
          <Chip
            label={delivery.status.replace('_', ' ').toUpperCase()}
            color={
              delivery.status === DeliveryStatus.DELIVERED
                ? 'success'
                : delivery.status === DeliveryStatus.FAILED
                ? 'error'
                : 'primary'
            }
          />
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Tracking Number
          </Typography>
          <Typography variant="h6">{delivery.tracking_number || 'Not assigned'}</Typography>
        </Box>

        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Delivery ID
            </Typography>
            <Typography variant="body2">{delivery.id}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Patient ID
            </Typography>
            <Typography variant="body2">{delivery.user_id}</Typography>
          </Box>
          {delivery.order_id && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Order ID
              </Typography>
              <Typography variant="body2">{delivery.order_id}</Typography>
            </Box>
          )}
          {delivery.delivery_personnel_id && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Assigned To
              </Typography>
              <Typography variant="body2">{delivery.delivery_personnel_id}</Typography>
            </Box>
          )}
        </Box>

        <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
          Delivery Timeline
        </Typography>

        <Timeline position="right">
          {timelineEvents.map((event, index) => (
            <TimelineItem key={index}>
              <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.3 }}>
                {formatDateTime(event.time)}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color={event.isActive ? 'primary' : 'grey'}>
                  {getStatusIcon(event.status, event.isActive)}
                </TimelineDot>
                {index < timelineEvents.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="body1" fontWeight={event.isActive ? 600 : 400}>
                  {event.label}
                </Typography>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>

        {delivery.scheduled_at && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="subtitle2">Scheduled Delivery Time</Typography>
            <Typography variant="body2">{formatDateTime(delivery.scheduled_at)}</Typography>
          </Box>
        )}

        {delivery.tracking_info && Object.keys(delivery.tracking_info).length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Tracking Information
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                {JSON.stringify(delivery.tracking_info, null, 2)}
              </pre>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeliveryTracking;
