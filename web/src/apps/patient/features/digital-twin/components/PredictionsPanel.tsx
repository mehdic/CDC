/**
 * Predictions Panel Component
 * Displays predictive insights: refill predictions, health needs, screenings
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Box,
  Divider,
} from '@mui/material';
import {
  Event as EventIcon,
  LocalHospital as HealthIcon,
  Assignment as ScreeningIcon,
  Autorenew as RefillIcon,
} from '@mui/icons-material';
import type { Predictions } from '../types/digitalTwin.types';

interface PredictionsPanelProps {
  predictions: Predictions;
}

export function PredictionsPanel({ predictions }: PredictionsPanelProps): React.ReactElement {
  const { refill_due_dates, upcoming_health_needs, recommended_screenings } = predictions;

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getConfidenceColor = (
    confidence: number
  ): 'success' | 'primary' | 'warning' | 'default' => {
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'primary';
    if (confidence >= 40) return 'warning';
    return 'default';
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <EventIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Predictive Insights</Typography>
        </Box>

        {/* Refill Predictions */}
        {refill_due_dates.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Upcoming Refills
            </Typography>
            <List dense>
              {refill_due_dates.slice(0, 5).map((refill, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <RefillIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={refill.medication_name}
                    secondary={`Due: ${formatDate(refill.predicted_refill_date)}`}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={`${refill.confidence}% confidence`}
                      size="small"
                      color={getConfidenceColor(refill.confidence)}
                    />
                    {refill.auto_refill_eligible && (
                      <Chip label="Auto-refill eligible" size="small" color="success" />
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
          </Box>
        )}

        {/* Upcoming Health Needs */}
        {upcoming_health_needs.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Upcoming Health Needs
            </Typography>
            <List dense>
              {upcoming_health_needs.map((need, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <HealthIcon color="secondary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={need} />
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
          </Box>
        )}

        {/* Recommended Screenings */}
        {recommended_screenings.length > 0 ? (
          <Box>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Recommended Screenings
            </Typography>
            <List dense>
              {recommended_screenings.map((screening, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <ScreeningIcon color="info" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={screening} />
                </ListItem>
              ))}
            </List>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No additional screenings recommended at this time
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
