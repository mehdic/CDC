/**
 * Digital Twin Dashboard
 * Comprehensive patient health overview with AI-powered insights
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  Tab,
  Tabs,
  Button,
} from '@mui/material';
import {
  Timeline,
  Insights,
  HealthAndSafety,
  Medication,
  Warning,
  TrendingUp,
  Lightbulb,
} from '@mui/icons-material';
import { digitalTwinService, DigitalTwinData } from '../../../shared/services/digitalTwinService';
import HealthScoreCard from '../features/digital-twin/HealthScoreCard';
import RiskFactorsPanel from '../features/digital-twin/RiskFactorsPanel';
import RecommendationsPanel from '../features/digital-twin/RecommendationsPanel';
import HealthTrajectoryChart from '../features/digital-twin/HealthTrajectoryChart';
import WhatIfScenarios from '../features/digital-twin/WhatIfScenarios';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`digital-twin-tabpanel-${index}`}
      aria-labelledby={`digital-twin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const DigitalTwinDashboard: React.FC = () => {
  const [digitalTwin, setDigitalTwin] = useState<DigitalTwinData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [generatingRecommendations, setGeneratingRecommendations] = useState<boolean>(false);

  // In a real app, get patient ID from auth context
  const patientId = localStorage.getItem('userId') || 'demo-patient-123';

  useEffect(() => {
    loadDigitalTwin();
  }, []);

  const loadDigitalTwin = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await digitalTwinService.getDigitalTwin(patientId);
      setDigitalTwin(data);
    } catch (err: any) {
      // If twin doesn't exist, try to create it
      if (err.response?.status === 404) {
        try {
          const newTwin = await digitalTwinService.createDigitalTwin({
            patientId,
            aiAnalysisConsent: true,
            dataSharingConsent: false,
          });
          setDigitalTwin(newTwin);
        } catch (createErr: any) {
          setError('Failed to create digital twin profile');
        }
      } else {
        setError(err.message || 'Failed to load digital twin');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRecommendations = async () => {
    if (!digitalTwin) return;

    setGeneratingRecommendations(true);
    try {
      await digitalTwinService.generateRecommendations(patientId);
      await loadDigitalTwin(); // Reload to get updated recommendations
    } catch (err: any) {
      setError('Failed to generate recommendations');
    } finally {
      setGeneratingRecommendations(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getRiskLevelColor = (level: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (level) {
      case 'low':
        return 'success';
      case 'moderate':
        return 'info';
      case 'high':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'info';
    }
  };

  const getAdherenceColor = (level: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (level) {
      case 'excellent':
        return 'success';
      case 'good':
        return 'success';
      case 'fair':
        return 'warning';
      case 'poor':
        return 'error';
      default:
        return 'info';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading your digital health profile...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadDigitalTwin}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!digitalTwin) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">
          No digital twin profile found. Please contact support.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Insights sx={{ mr: 1, fontSize: 40 }} />
          Your Digital Health Twin
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AI-powered comprehensive health overview and personalized insights
        </Typography>
      </Box>

      {/* Overall Health Score Card */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', color: 'white' }}>
                <Typography variant="h6" gutterBottom>
                  Overall Health Score
                </Typography>
                <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                  <CircularProgress
                    variant="determinate"
                    value={digitalTwin.overallHealthScore}
                    size={120}
                    thickness={5}
                    sx={{ color: 'white' }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h4" component="div" color="white">
                      {Math.round(digitalTwin.overallHealthScore)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={8}>
              <Box sx={{ color: 'white' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" gutterBottom>
                      Risk Level
                    </Typography>
                    <Chip
                      label={digitalTwin.currentRiskLevel.toUpperCase()}
                      color={getRiskLevelColor(digitalTwin.currentRiskLevel)}
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" gutterBottom>
                      Medication Adherence
                    </Typography>
                    <Chip
                      label={digitalTwin.medicationAdherence.toUpperCase()}
                      color={getAdherenceColor(digitalTwin.medicationAdherence)}
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" gutterBottom>
                      Active Medications
                    </Typography>
                    <Typography variant="h6">
                      {digitalTwin.medications.filter((m) => m.active).length}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" gutterBottom>
                      Chronic Conditions
                    </Typography>
                    <Typography variant="h6">
                      {digitalTwin.chronicConditions.filter((c) => c.status === 'active').length}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Risk Scores */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HealthAndSafety sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant="h6">Cardiovascular Risk</Typography>
              </Box>
              <Typography variant="h4" color="error.main" gutterBottom>
                {digitalTwin.cardiovascularRisk?.toFixed(1) || 'N/A'}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={digitalTwin.cardiovascularRisk || 0}
                color="error"
                sx={{ height: 8, borderRadius: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">Diabetes Risk</Typography>
              </Box>
              <Typography variant="h4" color="warning.main" gutterBottom>
                {digitalTwin.diabetesRisk?.toFixed(1) || 'N/A'}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={digitalTwin.diabetesRisk || 0}
                color="warning"
                sx={{ height: 8, borderRadius: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">Readmission Risk</Typography>
              </Box>
              <Typography variant="h4" color="info.main" gutterBottom>
                {digitalTwin.hospitalReadmissionRisk?.toFixed(1) || 'N/A'}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={digitalTwin.hospitalReadmissionRisk || 0}
                color="info"
                sx={{ height: 8, borderRadius: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for detailed views */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="digital twin tabs">
            <Tab
              icon={<Timeline />}
              label="Health Trajectory"
              iconPosition="start"
              id="digital-twin-tab-0"
            />
            <Tab
              icon={<Warning />}
              label="Risk Factors"
              iconPosition="start"
              id="digital-twin-tab-1"
            />
            <Tab
              icon={<Lightbulb />}
              label={`Recommendations (${digitalTwin.recommendations.length})`}
              iconPosition="start"
              id="digital-twin-tab-2"
            />
            <Tab
              icon={<Insights />}
              label="What-If Scenarios"
              iconPosition="start"
              id="digital-twin-tab-3"
            />
          </Tabs>
        </Box>

        <CardContent>
          <TabPanel value={activeTab} index={0}>
            <HealthTrajectoryChart trajectory={digitalTwin.healthTrajectory} />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <RiskFactorsPanel riskFactors={digitalTwin.riskFactors} />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<Lightbulb />}
                onClick={handleGenerateRecommendations}
                disabled={generatingRecommendations}
              >
                {generatingRecommendations ? 'Generating...' : 'Generate New Recommendations'}
              </Button>
            </Box>
            <RecommendationsPanel
              recommendations={digitalTwin.recommendations}
              onRefresh={loadDigitalTwin}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <WhatIfScenarios
              patientId={patientId}
              scenarios={digitalTwin.whatIfScenarios || []}
              onRefresh={loadDigitalTwin}
            />
          </TabPanel>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Last updated: {new Date(digitalTwin.lastUpdatedAt).toLocaleString()}
        </Typography>
      </Box>
    </Container>
  );
};

export default DigitalTwinDashboard;
