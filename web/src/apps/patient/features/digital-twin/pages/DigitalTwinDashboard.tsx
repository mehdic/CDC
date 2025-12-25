/**
 * Digital Twin Dashboard Page
 * Main patient health profile dashboard with AI-powered insights
 */

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Chip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  AccountCircle as ProfileIcon,
  TrendingUp as TrendIcon,
} from '@mui/icons-material';
import { useDigitalTwin } from '../hooks/useDigitalTwin';
import { HealthInsightsCard } from '../components/HealthInsightsCard';
import { MedicationTimeline } from '../components/MedicationTimeline';
import { PredictionsPanel } from '../components/PredictionsPanel';

interface DigitalTwinDashboardProps {
  patientId: string;
}

export function DigitalTwinDashboard({
  patientId,
}: DigitalTwinDashboardProps): React.ReactElement {
  const { profile, loading, error, refresh } = useDigitalTwin(patientId);

  if (loading && !profile) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load digital twin profile: {error.message}
        </Alert>
        <Button variant="contained" onClick={refresh} startIcon={<RefreshIcon />}>
          Retry
        </Button>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info">No profile data available</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ProfileIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" gutterBottom>
                {profile.patient_name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {profile.age && (
                  <Chip label={`Age: ${profile.age}`} size="small" variant="outlined" />
                )}
                <Chip
                  label={`${profile.demographic.age_group}`}
                  size="small"
                  color="primary"
                />
                <Chip
                  label={`Profile ${profile.demographic.profile_completeness}% complete`}
                  size="small"
                  color={
                    profile.demographic.profile_completeness >= 80
                      ? 'success'
                      : 'warning'
                  }
                />
                {profile.engagement.vip_status && (
                  <Chip label="VIP Member" size="small" color="secondary" />
                )}
              </Box>
            </Box>
          </Box>
          <Box>
            <Button
              variant="outlined"
              startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              onClick={refresh}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh Profile'}
            </Button>
          </Box>
        </Box>
        {profile.cached && profile.computed_at && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Last updated:{' '}
            {new Date(profile.computed_at).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Typography>
        )}
      </Paper>

      {/* Dashboard Grid */}
      <Grid container spacing={3}>
        {/* Health Insights */}
        <Grid item xs={12} md={6}>
          <HealthInsightsCard insights={profile.health_insights} />
        </Grid>

        {/* Predictions */}
        <Grid item xs={12} md={6}>
          <PredictionsPanel predictions={profile.predictions} />
        </Grid>

        {/* Medication Timeline */}
        <Grid item xs={12}>
          <MedicationTimeline
            currentMedications={profile.medical_history.current_medications}
            pastMedications={profile.medical_history.past_medications}
          />
        </Grid>

        {/* Summary Stats */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Activity Summary</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="h4" color="primary">
                  {profile.medical_history.total_prescriptions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Prescriptions
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="h4" color="primary">
                  {profile.purchase_behavior.total_orders}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Orders
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="h4" color="primary">
                  {profile.engagement.teleconsultation_count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Teleconsultations
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="h4" color="primary">
                  {profile.medical_history.chronic_conditions.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Chronic Conditions
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
