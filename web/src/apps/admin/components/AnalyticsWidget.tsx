/**
 * Analytics Widget Component
 * Displays platform-wide analytics and metrics
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Divider,
  Stack,
} from '@mui/material';
import {
  People as PeopleIcon,
  ShoppingCart as OrdersIcon,
  Receipt as PrescriptionsIcon,
  VideoCall as ConsultationsIcon,
  LocalShipping as DeliveriesIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import type { AdminAnalytics, UserType } from '../types/admin.types';
import { USER_TYPE_LABELS } from '../types/admin.types';

interface AnalyticsWidgetProps {
  analytics: AdminAnalytics;
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  subtitle?: string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, title, value, subtitle, color }) => (
  <Box
    sx={{
      p: 2,
      bgcolor: 'grey.50',
      borderRadius: 2,
      borderLeft: 4,
      borderColor: color,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      <Box sx={{ color }}>{icon}</Box>
      <Typography variant="subtitle2" color="text.secondary">
        {title}
      </Typography>
    </Box>
    <Typography variant="h4" fontWeight="bold">
      {typeof value === 'number' ? value.toLocaleString('fr-CH') : value}
    </Typography>
    {subtitle && (
      <Typography variant="caption" color="text.secondary">
        {subtitle}
      </Typography>
    )}
  </Box>
);

export const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({ analytics }) => {
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card data-testid="analytics-widget">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <TrendingUpIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Analyses de la Plateforme
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {/* Users Metrics */}
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              icon={<PeopleIcon />}
              title="Utilisateurs Totaux"
              value={analytics.users.total}
              subtitle={`+${analytics.users.newThisMonth} ce mois`}
              color="#1976d2"
            />
          </Grid>

          {/* Active Users */}
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              icon={<PeopleIcon />}
              title="Utilisateurs Actifs Aujourd'hui"
              value={analytics.users.activeToday}
              color="#4caf50"
            />
          </Grid>

          {/* Revenue */}
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              icon={<TrendingUpIcon />}
              title="Chiffre d'Affaires"
              value={formatCurrency(analytics.orders.revenue)}
              subtitle={`${analytics.orders.completed} commandes`}
              color="#9c27b0"
            />
          </Grid>

          {/* Orders */}
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              icon={<OrdersIcon />}
              title="Commandes"
              value={analytics.orders.total}
              subtitle={`${analytics.orders.pending} en attente`}
              color="#ff9800"
            />
          </Grid>

          {/* Prescriptions */}
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              icon={<PrescriptionsIcon />}
              title="Ordonnances"
              value={analytics.prescriptions.total}
              subtitle={`${analytics.prescriptions.pending} en attente`}
              color="#00bcd4"
            />
          </Grid>

          {/* Consultations */}
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              icon={<ConsultationsIcon />}
              title="Teleconsultations"
              value={analytics.consultations.total}
              subtitle={`${analytics.consultations.scheduled} planifiees`}
              color="#e91e63"
            />
          </Grid>

          {/* Deliveries */}
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              icon={<DeliveriesIcon />}
              title="Livraisons"
              value={analytics.deliveries.total}
              subtitle={`${analytics.deliveries.inProgress} en cours`}
              color="#795548"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Users by Type */}
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Repartition par Type d'Utilisateur
        </Typography>
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {(Object.entries(analytics.users.byType) as [UserType, number][]).map(([type, count]) => (
            <Box
              key={type}
              sx={{
                px: 2,
                py: 1,
                bgcolor: 'grey.100',
                borderRadius: 1,
                textAlign: 'center',
              }}
              data-testid={`user-type-${type}`}
            >
              <Typography variant="h6" fontWeight="bold">
                {count}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {USER_TYPE_LABELS[type]}
              </Typography>
            </Box>
          ))}
        </Stack>

        {/* Success Rates */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Indicateurs de Performance
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  {analytics.prescriptions.total > 0
                    ? Math.round(
                        (analytics.prescriptions.processed / analytics.prescriptions.total) * 100
                      )
                    : 0}
                  %
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ordonnances traitees
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  {analytics.consultations.total > 0
                    ? Math.round(
                        (analytics.consultations.completed / analytics.consultations.total) * 100
                      )
                    : 0}
                  %
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Consultations terminees
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  {analytics.deliveries.total > 0
                    ? Math.round(
                        (analytics.deliveries.completed / analytics.deliveries.total) * 100
                      )
                    : 0}
                  %
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Livraisons reussies
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight="bold" color="error.main">
                  {analytics.deliveries.failed}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Livraisons echouees
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AnalyticsWidget;
