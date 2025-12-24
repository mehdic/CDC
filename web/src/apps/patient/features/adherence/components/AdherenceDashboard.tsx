/**
 * Adherence Dashboard Component
 * Main dashboard showing medication adherence metrics and overview
 * T8-043: Patient Adherence Tracking
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  LinearProgress,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  Paper,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useAdherence } from '../hooks/useAdherence';
import { MedicationReminders } from './MedicationReminders';
import { AdherenceHistory } from './AdherenceHistory';
import type { MedicationAdherence } from '../types/adherence.types';

interface AdherenceDashboardProps {
  patientId: string;
  autoRefetch?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index} style={{ width: '100%' }}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
};

/**
 * Component to display individual medication adherence
 */
const MedicationAdherenceCard: React.FC<{ medication: MedicationAdherence }> = ({ medication }) => {
  const getAdherenceColor = (rate: number) => {
    if (rate >= 80) return '#4caf50'; // green
    if (rate >= 60) return '#ff9800'; // orange
    return '#f44336'; // red
  };

  const getAdherenceLabel = (rate: number) => {
    if (rate >= 80) return 'Bon';
    if (rate >= 60) return 'Moyen';
    return 'Faible';
  };

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              {medication.medicationName}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {medication.dosage} - {medication.frequency}
            </Typography>
          </Box>
          <Chip
            label={getAdherenceLabel(medication.adherenceRate)}
            color={medication.adherenceRate >= 60 ? 'success' : 'error'}
            size="small"
            sx={{ backgroundColor: getAdherenceColor(medication.adherenceRate), color: 'white' }}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">Taux d'adhésion</Typography>
            <Typography variant="body2" fontWeight="bold">
              {Math.round(medication.adherenceRate)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={medication.adherenceRate}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: getAdherenceColor(medication.adherenceRate),
              },
            }}
          />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                {medication.totalTaken}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Prises
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: 'warning.main' }}>
                {medication.totalMissed}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Oubliées
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary">
                {medication.totalScheduled}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Programmées
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {medication.lastTakenAt && (
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2 }}>
            Dernière prise: {new Date(medication.lastTakenAt).toLocaleDateString('fr-CH')}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Main adherence dashboard component
 */
export const AdherenceDashboard: React.FC<AdherenceDashboardProps> = ({
  patientId,
  autoRefetch = false,
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const { dashboard, stats, medications, isLoading, error, clearError } = useAdherence({
    patientId,
    autoRefetch,
  });

  if (isLoading && !dashboard) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!dashboard || !stats) {
    return (
      <Alert severity="info">
        Aucune donnée d'adhésion disponible. Assurez-vous d'avoir des médicaments prescrits.
      </Alert>
    );
  }

  return (
    <>
      <Grid container spacing={3}>
        {/* Overall Adherence Card */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Vue d'ensemble de l'adhésion"
              subheader="Votre taux d'adhésion global aux médicaments"
            />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={stats.overallAdherenceRate}
                    size={100}
                    thickness={4}
                    sx={{
                      color: stats.overallAdherenceRate >= 80 ? '#4caf50' : '#ff9800',
                    }}
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
                    <Typography variant="h5" component="div" color="textSecondary">
                      {Math.round(stats.overallAdherenceRate)}%
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Médicaments actifs
                        </Typography>
                        <Typography variant="h6">{stats.totalMedicationsActive}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Adhésion forte (&gt;80%)
                        </Typography>
                        <Typography variant="h6">{stats.medicationsWithHighAdherence}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Doses prises
                        </Typography>
                        <Typography variant="h6">{stats.totalTakenDoses}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Doses oubliées
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'error.main' }}>
                          {stats.totalMissedDoses}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Trend */}
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {stats.trendDirection === 'improving' && (
                      <>
                        <TrendingUpIcon sx={{ color: 'success.main' }} />
                        <Typography variant="body2" sx={{ color: 'success.main' }}>
                          Tendance positive
                        </Typography>
                      </>
                    )}
                    {stats.trendDirection === 'declining' && (
                      <>
                        <TrendingDownIcon sx={{ color: 'error.main' }} />
                        <Typography variant="body2" sx={{ color: 'error.main' }}>
                          Tendance négative
                        </Typography>
                      </>
                    )}
                    {stats.trendDirection === 'stable' && (
                      <Typography variant="body2" color="textSecondary">
                        Tendance stable
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Medications with Low Adherence Alert */}
        {stats.medicationsWithLowAdherence > 0 && (
          <Grid item xs={12}>
            <Alert severity="warning" icon={<InfoIcon />}>
              {stats.medicationsWithLowAdherence} médicament(s) avec une faible adhésion. Cliquez sur
              l'onglet "Médicaments" pour plus de détails.
            </Alert>
          </Grid>
        )}
      </Grid>

      {/* Tabs for different views */}
      <Paper sx={{ mt: 3, mb: 2 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, newValue) => setTabIndex(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Médicaments" />
          <Tab label="Rappels" />
          <Tab label="Historique" />
        </Tabs>
      </Paper>

      {/* Medications Tab */}
      <TabPanel value={tabIndex} index={0}>
        <Box>
          {medications.length > 0 ? (
            medications.map((medication) => (
              <MedicationAdherenceCard key={medication.id} medication={medication} />
            ))
          ) : (
            <Alert severity="info">Aucun médicament trouvé.</Alert>
          )}
        </Box>
      </TabPanel>

      {/* Reminders Tab */}
      <TabPanel value={tabIndex} index={1}>
        <MedicationReminders patientId={patientId} />
      </TabPanel>

      {/* History Tab */}
      <TabPanel value={tabIndex} index={2}>
        <AdherenceHistory patientId={patientId} />
      </TabPanel>
    </>
  );
};

export default AdherenceDashboard;
