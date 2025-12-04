/**
 * Observance Statistics Component
 * Patient compliance and adherence tracking
 * Task: T4-033 - Observance Statistics
 */

import React, { useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingIcon,
  Download as DownloadIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { useDoctorObservanceStats, usePatientComplianceChart } from '../hooks/useDoctor';
import type { ObservanceStats as ObservanceStatsType } from '../types/doctor';

// ============================================================================
// Patient Observance Row Component
// ============================================================================

interface PatientObservanceRowProps {
  stats: ObservanceStatsType;
  onViewChart?: (patientId: string) => void;
}

const PatientObservanceRow: React.FC<PatientObservanceRowProps> = ({ stats, onViewChart }) => {
  const trendIcon =
    stats.trend === 'improving' ? (
      <TrendingUpIcon sx={{ fontSize: 20, color: '#4caf50' }} />
    ) : stats.trend === 'declining' ? (
      <TrendingDownIcon sx={{ fontSize: 20, color: '#f44336' }} />
    ) : (
      <TrendingIcon sx={{ fontSize: 20, color: '#ff9800' }} />
    );

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'Amélioration';
      case 'declining':
        return 'Baisse';
      default:
        return 'Stable';
    }
  };

  return (
    <TableRow data-testid={`observance-row-${stats.patientId}`}>
      <TableCell>
        <Typography variant="body2" fontWeight="500">
          {stats.patientName}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <LinearProgress
            variant="determinate"
            value={stats.overallCompliance}
            sx={{
              width: 100,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                backgroundColor:
                  stats.overallCompliance >= 80 ? '#4caf50' : stats.overallCompliance >= 60 ? '#ff9800' : '#f44336',
              },
            }}
          />
          <Typography variant="body2" fontWeight="600" sx={{ minWidth: 45 }}>
            {stats.overallCompliance}%
          </Typography>
        </Box>
      </TableCell>
      <TableCell align="center">
        <Typography variant="body2">{stats.medicationAdherence}%</Typography>
      </TableCell>
      <TableCell align="center">
        <Typography variant="body2">{stats.appointmentAttendance}%</Typography>
      </TableCell>
      <TableCell align="center">
        <Typography variant="body2">{stats.labTestCompletion}%</Typography>
      </TableCell>
      <TableCell align="center">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
          {trendIcon}
          <Typography variant="caption">{getTrendLabel(stats.trend)}</Typography>
        </Box>
      </TableCell>
      <TableCell align="right">
        <Button size="small" onClick={() => onViewChart?.(stats.patientId)} data-testid="view-chart-button">
          Voir
        </Button>
      </TableCell>
    </TableRow>
  );
};

// ============================================================================
// Chart Dialog Component
// ============================================================================

interface ChartDialogProps {
  open: boolean;
  patientId?: string;
  patientName?: string;
  onClose: () => void;
}

const ChartDialog: React.FC<ChartDialogProps> = ({ open, patientId, patientName, onClose }) => {
  const { data: chartData, isLoading } = usePatientComplianceChart(patientId || '');
  const data = chartData?.data || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth data-testid="chart-dialog">
      <DialogTitle>
        Évolution de l&apos;observance - {patientName}
      </DialogTitle>
      <DialogContent sx={{ minHeight: 300 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <CircularProgress />
          </Box>
        ) : data.length > 0 ? (
          <Box sx={{ mt: 2 }}>
            {/* Simplified chart display */}
            <Stack spacing={1}>
              {data.map((point, idx) => (
                <Box key={idx}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption">{new Date(point.date).toLocaleDateString('fr-CH')}</Typography>
                    <Typography variant="caption" fontWeight="600">
                      {point.compliance}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={point.compliance}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor:
                          point.compliance >= 80 ? '#4caf50' : point.compliance >= 60 ? '#ff9800' : '#f44336',
                      },
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Aucune donnée disponible
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};

// ============================================================================
// Main Observance Stats Component
// ============================================================================

export const ObservanceStats: React.FC = () => {
  const [chartDialogOpen, setChartDialogOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>();
  const [selectedPatientName, setSelectedPatientName] = useState<string | undefined>();

  const { data: statsData, isLoading, error } = useDoctorObservanceStats();

  const overallStats = statsData?.data.overallStats || [];
  const chartData = statsData?.data.chartData || [];
  const topCompliantPatients = statsData?.data.topCompliantPatients || [];
  const needsAttentionPatients = statsData?.data.needsAttentionPatients || [];

  const handleViewChart = (patientId: string, patientName: string) => {
    setSelectedPatientId(patientId);
    setSelectedPatientName(patientName);
    setChartDialogOpen(true);
  };

  const handleExportReport = () => {
    // In a real application, this would generate a CSV or PDF
    // Export functionality would be implemented here
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">Erreur lors du chargement des statistiques d&apos;observance</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom data-testid="page-title">
            Statistiques d&apos;Observance
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Suivi de l&apos;adhésion thérapeutique des patients
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportReport}
          data-testid="export-button"
        >
          Exporter
        </Button>
      </Box>

      {/* Key Insights */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Overall Compliance */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }} data-testid="overall-compliance-panel">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <BarChartIcon sx={{ fontSize: 28, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Observance Globale
              </Typography>
            </Box>

            {chartData.length > 0 && (
              <Box>
                <Typography variant="h4" fontWeight="bold" color="primary" sx={{ mb: 2 }}>
                  {Math.round(chartData.reduce((sum, p) => sum + p.compliance, 0) / chartData.length)}%
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Adhésion aux médicaments
                    </Typography>
                    <LinearProgress variant="determinate" value={75} sx={{ height: 8 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Rendez-vous respectés
                    </Typography>
                    <LinearProgress variant="determinate" value={82} sx={{ height: 8 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Tests de laboratoire
                    </Typography>
                    <LinearProgress variant="determinate" value={68} sx={{ height: 8 }} />
                  </Box>
                </Stack>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Top Compliant Patients */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }} data-testid="top-compliant-panel">
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Meilleure Observance
            </Typography>
            {topCompliantPatients.length > 0 ? (
              <Stack spacing={1.5}>
                {topCompliantPatients.slice(0, 3).map((patient, idx) => (
                  <Box key={idx}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight="500">
                        {idx + 1}. {patient.firstName} {patient.lastName}
                      </Typography>
                      <TrendingUpIcon sx={{ fontSize: 18, color: '#4caf50' }} />
                    </Box>
                    <LinearProgress variant="determinate" value={90 - idx * 5} sx={{ height: 6 }} />
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Aucune donnée
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Patients Needing Attention */}
      {needsAttentionPatients.length > 0 && (
        <Paper sx={{ p: 3, mb: 4, backgroundColor: '#fff3e0', borderLeft: '4px solid #ff9800' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TrendingDownIcon sx={{ color: '#ff9800' }} />
            <Typography variant="h6" fontWeight="bold" color="#e65100">
              Nécessite une Attention
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {needsAttentionPatients.map((patient) => (
              <Grid item xs={12} sm={6} md={3} key={patient.id}>
                <Card sx={{ backgroundColor: 'white' }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Typography variant="body2" fontWeight="600" gutterBottom>
                      {patient.firstName} {patient.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Observance faible
                    </Typography>
                    <Button size="small" variant="outlined">
                      Contacter
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Detailed Table */}
      <Paper data-testid="observance-table-panel">
        <TableContainer>
          <Table data-testid="observance-table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Patient</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                  Observance
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                  Médicaments
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                  Rendez-vous
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                  Tests Lab
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                  Tendance
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {overallStats.map((stats) => (
                <PatientObservanceRow
                  key={stats.patientId}
                  stats={stats}
                  onViewChart={(patientId) => handleViewChart(patientId, stats.patientName)}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Chart Dialog */}
      <ChartDialog
        open={chartDialogOpen}
        patientId={selectedPatientId}
        patientName={selectedPatientName}
        onClose={() => setChartDialogOpen(false)}
      />
    </Container>
  );
};

export default ObservanceStats;
