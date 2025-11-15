/**
 * Revenue Analytics Widget
 * Displays revenue statistics
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';

interface RevenueAnalyticsWidgetProps {
  revenue?: {
    total: number;
    thisMonth: number;
    trend: string;
  };
}

export const RevenueAnalyticsWidget: React.FC<RevenueAnalyticsWidgetProps> = ({ revenue }) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isPositiveTrend = revenue?.trend?.startsWith('+');

  return (
    <Card data-testid="revenue-analytics">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <MoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="bold">
            Chiffre d'Affaires
          </Typography>
        </Box>

        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total
            </Typography>
            <Typography variant="h3" fontWeight="bold" color="primary.main">
              {formatCurrency(revenue?.total || 0)}
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Ce mois
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(revenue?.thisMonth || 0)}
              </Typography>
              {revenue?.trend && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {isPositiveTrend ? (
                    <TrendUpIcon sx={{ color: 'success.main', fontSize: 20 }} />
                  ) : (
                    <TrendDownIcon sx={{ color: 'error.main', fontSize: 20 }} />
                  )}
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    color={isPositiveTrend ? 'success.main' : 'error.main'}
                    sx={{ ml: 0.5 }}
                  >
                    {revenue.trend}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};
