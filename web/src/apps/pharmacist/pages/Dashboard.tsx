/**
 * Dashboard Page
 * Main pharmacist dashboard with analytics widgets
 * Task: Dashboard Analytics Implementation
 */

import React, { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  TextField,
  Button,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDashboardAnalytics } from '@shared/hooks/useDashboardAnalytics';
import { PatientMetricsWidget } from '../components/dashboard/PatientMetricsWidget';
import { PopularMedicationsWidget } from '../components/dashboard/PopularMedicationsWidget';
import { ConsultationTrendsWidget } from '../components/dashboard/ConsultationTrendsWidget';
import { RevenueAnalyticsWidget } from '../components/dashboard/RevenueAnalyticsWidget';

// ============================================================================
// Dashboard Cards Component
// ============================================================================

interface DashboardCardProps {
  testId: string;
  title: string;
  value: number | string;
  subtitle?: string;
  color: string;
  onClick?: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  testId,
  title,
  value,
  subtitle,
  color,
  onClick,
}) => (
  <Card
    data-testid={testId}
    sx={{
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': onClick
        ? {
            transform: 'translateY(-4px)',
            boxShadow: 4,
          }
        : {},
    }}
    onClick={onClick}
  >
    <CardContent>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography
        variant="h3"
        fontWeight="bold"
        color={color}
        data-testid="count"
      >
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

// ============================================================================
// Main Dashboard Component
// ============================================================================

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});

  const { data: response, isLoading, error, refetch } = useDashboardAnalytics(
    dateRange.start,
    dateRange.end
  );
  const analytics = response?.data;

  const handleDateRangeFilter = () => {
    // Trigger refetch with new date range
    refetch();
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Tableau de Bord
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Vue d&apos;ensemble de votre activité pharmaceutique
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={handleRefresh} aria-label="Actualiser">
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Date Range Filter */}
      <Paper sx={{ p: 2, mb: 3 }} data-testid="date-range-filter">
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Date de début"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={dateRange.start || ''}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          />
          <TextField
            label="Date de fin"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={dateRange.end || ''}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          />
          <Button variant="contained" onClick={handleDateRangeFilter}>
            Appliquer
          </Button>
        </Stack>
      </Paper>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Erreur lors du chargement du tableau de bord
          </Typography>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Dashboard Content */}
      {!isLoading && analytics && (
        <>
          {/* Main Metrics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <DashboardCard
                testId="prescriptions-card"
                title="Ordonnances"
                value={analytics.prescriptions.total}
                subtitle={`${analytics.prescriptions.pending} en attente`}
                color="#1976d2"
                onClick={() => navigate('/prescriptions')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DashboardCard
                testId="inventory-card"
                title="Inventaire"
                value={analytics.inventory.totalItems}
                subtitle={`${analytics.inventory.lowStock} stocks faibles`}
                color="#ff9800"
                onClick={() => navigate('/inventory')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DashboardCard
                testId="consultations-card"
                title="Consultations"
                value={analytics.consultations.total}
                subtitle={`${analytics.consultations.upcoming} à venir`}
                color="#4caf50"
                onClick={() => navigate('/teleconsultation')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DashboardCard
                testId="deliveries-card"
                title="Livraisons"
                value={analytics.deliveries.total}
                subtitle={`${analytics.deliveries.inTransit} en cours`}
                color="#00bcd4"
                onClick={() => navigate('/deliveries')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card data-testid="revenue-card">
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Chiffre d&apos;Affaires
                  </Typography>
                  <Typography
                    variant="h3"
                    fontWeight="bold"
                    color="#9c27b0"
                    data-testid="value"
                  >
                    {new Intl.NumberFormat('fr-CH', {
                      style: 'currency',
                      currency: 'CHF',
                      minimumFractionDigits: 0,
                    }).format(analytics.revenue.total)}
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    {analytics.revenue.trend}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Analytics Widgets */}
          <Grid container spacing={3}>
            {/* Patient Metrics */}
            <Grid item xs={12} md={6}>
              <PatientMetricsWidget />
            </Grid>

            {/* Revenue Analytics */}
            <Grid item xs={12} md={6}>
              <RevenueAnalyticsWidget revenue={analytics.revenue} />
            </Grid>

            {/* Popular Medications */}
            <Grid item xs={12} md={6}>
              <PopularMedicationsWidget />
            </Grid>

            {/* Consultation Trends */}
            <Grid item xs={12} md={6}>
              <ConsultationTrendsWidget />
            </Grid>
          </Grid>

          {/* Notifications Panel */}
          <Box sx={{ mt: 4 }}>
            <Paper sx={{ p: 3 }} data-testid="notifications-panel">
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationsIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Notifications
                </Typography>
              </Box>
              <Stack spacing={2}>
                {analytics.inventory.lowStock > 0 && (
                  <Alert severity="warning">
                    {analytics.inventory.lowStock} article(s) en stock faible
                  </Alert>
                )}
                {analytics.inventory.expiringSoon > 0 && (
                  <Alert severity="info">
                    {analytics.inventory.expiringSoon} article(s) expirant bientôt
                  </Alert>
                )}
                {analytics.prescriptions.pending > 0 && (
                  <Alert severity="info">
                    {analytics.prescriptions.pending} ordonnance(s) en attente de validation
                  </Alert>
                )}
                {analytics.deliveries.inTransit > 0 && (
                  <Alert severity="info">
                    {analytics.deliveries.inTransit} livraison(s) en cours
                  </Alert>
                )}
              </Stack>
            </Paper>
          </Box>

          {/* Quick Links */}
          <Grid container spacing={2} sx={{ mt: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/prescriptions')}
              >
                Ordonnances
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/inventory')}
              >
                Inventaire
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/teleconsultation')}
              >
                Téléconsultation
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/messages')}
              >
                Messages
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/deliveries')}
              >
                Livraisons
              </Button>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};

export default Dashboard;
