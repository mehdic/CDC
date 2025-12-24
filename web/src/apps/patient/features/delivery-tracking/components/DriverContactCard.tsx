/**
 * Driver Contact Card Component
 * T8-042: Patient Delivery Tracking
 * Displays driver information with contact options
 */

import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Avatar,
  Typography,
  Button,
  Rating,
  Chip,
} from '@mui/material';
import { Phone as PhoneIcon, Chat as ChatIcon, Star as StarIcon } from '@mui/icons-material';
import type { DriverInfo } from '../types/tracking';

/**
 * Props
 */
export interface DriverContactCardProps {
  driver: DriverInfo | null;
  onCall?: () => void;
  onChat?: () => void;
}

/**
 * Driver Contact Card Component
 */
export const DriverContactCard: React.FC<DriverContactCardProps> = ({
  driver,
  onCall,
  onChat,
}) => {
  if (!driver) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body1" color="text.secondary">
              No driver assigned yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              A driver will be assigned to your delivery soon
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Driver Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={driver.photo_url}
              alt={driver.name}
              sx={{ width: 64, height: 64 }}
            >
              {driver.name.charAt(0)}
            </Avatar>

            <Box>
              <Typography variant="h6">{driver.name}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Your Delivery Personnel
              </Typography>

              {/* Rating */}
              {driver.rating !== undefined && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Rating
                    value={driver.rating}
                    precision={0.1}
                    readOnly
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {driver.rating.toFixed(1)}
                  </Typography>
                  {driver.total_deliveries !== undefined && (
                    <Typography variant="caption" color="text.secondary">
                      ({driver.total_deliveries} deliveries)
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </Box>

          {/* Contact Buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<PhoneIcon />}
              onClick={onCall}
              disabled={!driver.phone && !onCall}
            >
              Call
            </Button>
            <Button
              variant="outlined"
              startIcon={<ChatIcon />}
              onClick={onChat}
              disabled={!onChat}
            >
              Chat
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
