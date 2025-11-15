/**
 * Patient Metrics Widget
 * Displays patient statistics on dashboard
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as NewPatientIcon,
  FavoriteBorder as ActiveIcon,
  LocalHospital as ChronicIcon,
} from '@mui/icons-material';
import { usePatientMetrics } from '@shared/hooks/useDashboardAnalytics';

interface MetricItemProps {
  label: string;
  value: number;
  icon: React.ReactElement;
  color: string;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, value, icon, color }) => (
  <Box sx={{ textAlign: 'center', p: 2 }}>
    <Box
      sx={{
        display: 'inline-flex',
        p: 1.5,
        borderRadius: 2,
        backgroundColor: `${color}20`,
        color,
        mb: 1,
      }}
    >
      {icon}
    </Box>
    <Typography variant="h4" fontWeight="bold">
      {value.toLocaleString()}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
  </Box>
);

export const PatientMetricsWidget: React.FC = () => {
  const { data: response, isLoading, error } = usePatientMetrics();
  const metrics = response?.data;

  if (isLoading) {
    return (
      <Card data-testid="patient-metrics">
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
      <Card data-testid="patient-metrics">
        <CardContent>
          <Alert severity="error">
            Erreur lors du chargement des métriques patients
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="patient-metrics">
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Patients
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <MetricItem
              label="Total"
              value={metrics?.totalPatients || 0}
              icon={<PeopleIcon />}
              color="#1976d2"
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <MetricItem
              label="Nouveaux"
              value={metrics?.newPatients || 0}
              icon={<NewPatientIcon />}
              color="#4caf50"
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <MetricItem
              label="Actifs"
              value={metrics?.activePatients || 0}
              icon={<ActiveIcon />}
              color="#ff9800"
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <MetricItem
              label="Chroniques"
              value={metrics?.chronicPatients || 0}
              icon={<ChronicIcon />}
              color="#f44336"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
