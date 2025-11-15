/**
 * Consultation Trends Widget
 * Displays consultation booking trends
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon,
  VideoCall as ConsultIcon,
} from '@mui/icons-material';
import { useConsultationTrends } from '@shared/hooks/useDashboardAnalytics';

export const ConsultationTrendsWidget: React.FC = () => {
  const { data: response, isLoading, error } = useConsultationTrends();
  const trends = response?.data;

  if (isLoading) {
    return (
      <Card data-testid="consultation-trends">
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card data-testid="consultation-trends">
        <CardContent>
          <Alert severity="error">
            Erreur lors du chargement des tendances de consultation
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const isPositiveTrend = trends?.trend.startsWith('+');

  return (
    <Card data-testid="consultation-trends">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ConsultIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="bold">
            Tendances des Consultations
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h3" fontWeight="bold" color="primary.main">
                {trends?.thisWeek || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cette semaine
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h3" fontWeight="bold" color="text.secondary">
                {trends?.lastWeek || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Semaine dernière
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isPositiveTrend ? (
              <TrendUpIcon sx={{ color: 'success.main', mr: 0.5 }} />
            ) : (
              <TrendDownIcon sx={{ color: 'error.main', mr: 0.5 }} />
            )}
            <Typography
              variant="body1"
              fontWeight="bold"
              color={isPositiveTrend ? 'success.main' : 'error.main'}
            >
              {trends?.trend || '0%'}
            </Typography>
          </Box>

          {trends?.peakDays && trends.peakDays.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                Jours de pointe:
              </Typography>
              {trends.peakDays.map((day, index) => (
                <Chip
                  key={index}
                  label={day}
                  size="small"
                  sx={{ ml: 0.5, fontSize: '0.7rem' }}
                />
              ))}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
