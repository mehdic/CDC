/**
 * Delivery Status Timeline Component
 * T8-042: Patient Delivery Tracking
 * Visual timeline showing delivery progress
 */

import React from 'react';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import { Paper, Typography, Box } from '@mui/material';
import {
  CheckCircle as CheckIcon,
  LocalShipping as TruckIcon,
  MyLocation as LocationIcon,
  Home as HomeIcon,
  AccessTime as ClockIcon,
} from '@mui/icons-material';
import type { DeliveryStatus } from '../types/tracking';

/**
 * Props
 */
export interface DeliveryStatusTimelineProps {
  status: DeliveryStatus;
  createdAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
}

/**
 * Timeline Step Configuration
 */
interface TimelineStep {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  statuses: DeliveryStatus[];
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    id: 'placed',
    label: 'Order Placed',
    description: 'Your order has been confirmed',
    icon: <CheckIcon />,
    statuses: ['pending', 'assigned', 'accepted', 'in_transit', 'arrived', 'delivered'],
  },
  {
    id: 'assigned',
    label: 'Assigned to Driver',
    description: 'Driver has accepted your delivery',
    icon: <TruckIcon />,
    statuses: ['assigned', 'accepted', 'in_transit', 'arrived', 'delivered'],
  },
  {
    id: 'picked_up',
    label: 'Picked Up',
    description: 'Package picked up from pharmacy',
    icon: <LocationIcon />,
    statuses: ['accepted', 'in_transit', 'arrived', 'delivered'],
  },
  {
    id: 'in_transit',
    label: 'Out for Delivery',
    description: 'Driver is on the way',
    icon: <LocationIcon />,
    statuses: ['in_transit', 'arrived', 'delivered'],
  },
  {
    id: 'delivered',
    label: 'Delivered',
    description: 'Successfully delivered to you',
    icon: <HomeIcon />,
    statuses: ['delivered'],
  },
];

/**
 * Get Step Color
 */
function getStepColor(
  step: TimelineStep,
  status: DeliveryStatus
): 'success' | 'primary' | 'secondary' | 'grey' {
  if (step.statuses.includes(status)) {
    if (step.id === 'delivered') return 'success';
    if (step.id === 'in_transit') return 'secondary';
    if (step.id === 'assigned' || step.id === 'picked_up') return 'primary';
    return 'success';
  }
  return 'grey';
}

/**
 * Format Timestamp
 */
function formatTimestamp(timestamp?: string): string {
  if (!timestamp) return 'Pending';
  return new Date(timestamp).toLocaleString();
}

/**
 * Get Step Status Text
 */
function getStepStatusText(
  step: TimelineStep,
  status: DeliveryStatus,
  createdAt?: string,
  pickedUpAt?: string,
  deliveredAt?: string
): string {
  if (step.id === 'placed' && createdAt) {
    return formatTimestamp(createdAt);
  }
  if (step.id === 'picked_up' && pickedUpAt) {
    return formatTimestamp(pickedUpAt);
  }
  if (step.id === 'delivered' && deliveredAt) {
    return formatTimestamp(deliveredAt);
  }
  if (step.statuses.includes(status)) {
    if (step.id === 'in_transit' && status === 'in_transit') {
      return 'In Progress';
    }
    return 'Completed';
  }
  return 'Pending';
}

/**
 * Delivery Status Timeline Component
 */
export const DeliveryStatusTimeline: React.FC<DeliveryStatusTimelineProps> = ({
  status,
  createdAt,
  pickedUpAt,
  deliveredAt,
}) => {
  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Delivery Timeline
      </Typography>

      <Timeline position="alternate">
        {TIMELINE_STEPS.map((step, index) => {
          const isActive = step.statuses.includes(status);
          const color = getStepColor(step, status);
          const statusText = getStepStatusText(step, status, createdAt, pickedUpAt, deliveredAt);

          return (
            <TimelineItem key={step.id}>
              <TimelineOppositeContent color="text.secondary">
                <Typography variant="caption">{statusText}</Typography>
              </TimelineOppositeContent>

              <TimelineSeparator>
                <TimelineDot color={color} variant={isActive ? 'filled' : 'outlined'}>
                  {step.icon}
                </TimelineDot>
                {index < TIMELINE_STEPS.length - 1 && <TimelineConnector />}
              </TimelineSeparator>

              <TimelineContent>
                <Typography variant="subtitle1" fontWeight={isActive ? 'bold' : 'normal'}>
                  {step.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
    </Paper>
  );
};
