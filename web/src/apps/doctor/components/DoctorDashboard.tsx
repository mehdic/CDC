/**
 * Doctor Dashboard Component
 * Main dashboard showing patient overview and key metrics
 * Task: T4-029 - Doctor Dashboard
 */

import React from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  People as PatientsIcon,
  LocalHospital as ActiveIcon,
  Medication as PrescriptionIcon,
  TrendingUp as ComplianceIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDoctorDashboard, useRecentConsultations } from '../hooks/useDoctor';

// ============================================================================
// Dashboard Card Component
// ============================================================================

interface DashboardMetricCardProps {
  testId: string;
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactElement;
  color: string;
  onClick?: () => void;
}

const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  testId,
  title,
  value,
  subtitle,
  icon,
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold" color={color} data-testid="metric-value">
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: `${color}20`,
            color,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// ============================================================================
// Recent Consultation Item
// ============================================================================

interface RecentConsultationItemProps {
  patientName: string;
  type: string;
  date: string;
  status: string;
}

const RecentConsultationItem: React.FC<RecentConsultationItemProps> = ({
  patientName,
  type,
  date,
  status,
}) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      pb: 1.5,
      borderBottom: '1px solid #f0f0f0',
      '&:last-child': { borderBottom: 'none' },
    }}
  >
    <Box>
      <Typography variant="body2" fontWeight="500">
        {patientName}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {type} • {date}
      </Typography>
    </Box>
    <Box
      sx={{
        px: 1.5,
        py: 0.5,
        borderRadius: 1,
        backgroundColor: status === 'completed' ? '#e8f5e9' : '#fff3e0',
        color: status === 'completed' ? '#2e7d32' : '#e65100',
        fontSize: '0.75rem',
        fontWeight: 600,
      }}
    >
      {status === 'completed' ? 'Complétée' : 'Prévue'}
    </Box>
  </Box>
);

// ============================================================================
// Main Dashboard Component
// ============================================================================

export const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } =
    useDoctorDashboard();
  const { data: consultationsData, isLoading: consultationsLoading } = useRecentConsultations(5);

  const analytics = dashboardData?.data;
  const consultations = consultationsData?.data || [];

  const handleRefresh = () => {
    refetchDashboard();
  };

  if (dashboardLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress aria-label="Chargement du tableau de bord médecin" />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }} data-testid="dashboard-view">
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom data-testid="dashboard-title">
            Tableau de Bord Médecin
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Vue d&apos;ensemble de vos patients et activités
          </Typography>
        </Box>
        <IconButton onClick={handleRefresh} aria-label="Actualiser" data-testid="refresh-button">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Error State */}
      {dashboardError && (
        <Alert severity="error" sx={{ mb: 3 }} data-testid="error-alert">
          Erreur lors du chargement du tableau de bord
        </Alert>
      )}

      {analytics && (
        <>
          {/* Main Metrics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <DashboardMetricCard
                testId="total-patients-card"
                title="Patients Total"
                value={analytics.totalPatients}
                subtitle={`${analytics.activePatients} actifs`}
                icon={<PatientsIcon />}
                color="#1976d2"
                onClick={() => navigate('/doctor/patients')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DashboardMetricCard
                testId="active-patients-card"
                title="Patients Actifs"
                value={analytics.activePatients}
                subtitle={`${analytics.chronicPatients} chroniques`}
                icon={<ActiveIcon />}
                color="#4caf50"
                onClick={() => navigate('/doctor/patients')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DashboardMetricCard
                testId="pending-prescriptions-card"
                title="Ordonnances en Attente"
                value={analytics.pendingPrescriptions}
                subtitle={`${analytics.prescriptionsThisMonth} ce mois`}
                icon={<PrescriptionIcon />}
                color="#ff9800"
                onClick={() => navigate('/doctor/prescriptions')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DashboardMetricCard
                testId="compliance-card"
                title="Observance Moyenne"
                value={`${analytics.averagePatientCompliance}%`}
                subtitle="Adhésion patient"
                icon={<ComplianceIcon />}
                color="#9c27b0"
                onClick={() => navigate('/doctor/observance')}
              />
            </Grid>
          </Grid>

          {/* Content Grid */}
          <Grid container spacing={3}>
            {/* Quick Actions */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }} data-testid="quick-actions-panel">
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  Actions Rapides
                </Typography>
                <Stack spacing={2}>
                  <Card
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 2 },
                      transition: 'box-shadow 0.2s',
                    }}
                    onClick={() => navigate('/doctor/prescriptions/new')}
                    data-testid="new-prescription-action"
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PrescriptionIcon sx={{ mr: 2, color: '#ff9800' }} />
                      <Box>
                        <Typography variant="body2" fontWeight="600">
                          Nouvelle Ordonnance
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Créer une ordonnance pour un patient
                        </Typography>
                      </Box>
                    </Box>
                  </Card>

                  <Card
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 2 },
                      transition: 'box-shadow 0.2s',
                    }}
                    onClick={() => navigate('/doctor/patients')}
                    data-testid="view-patients-action"
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PatientsIcon sx={{ mr: 2, color: '#1976d2' }} />
                      <Box>
                        <Typography variant="body2" fontWeight="600">
                          Consulter les Patients
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Voir liste complète et détails patients
                        </Typography>
                      </Box>
                    </Box>
                  </Card>

                  <Card
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 2 },
                      transition: 'box-shadow 0.2s',
                    }}
                    onClick={() => navigate('/doctor/messages')}
                    data-testid="messages-action"
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PatientsIcon sx={{ mr: 2, color: '#4caf50' }} />
                      <Box>
                        <Typography variant="body2" fontWeight="600">
                          Messages Sécurisés
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Communiquer avec pharmaciens
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Stack>
              </Paper>
            </Grid>

            {/* Recent Consultations */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }} data-testid="recent-consultations-panel">
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  Consultations Récentes
                </Typography>
                {consultationsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={40} aria-label="Chargement des consultations récentes" />
                  </Box>
                ) : consultations.length > 0 ? (
                  <Stack spacing={0}>
                    {consultations.map((consultation) => (
                      <RecentConsultationItem
                        key={consultation.id}
                        patientName={consultation.patientName}
                        type={consultation.type === 'teleconsultation' ? 'Téléconsultation' : 'Consultation'}
                        date={new Date(consultation.date).toLocaleDateString('fr-CH')}
                        status={consultation.status}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    Aucune consultation récente
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Summary Statistics */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }} data-testid="summary-stats-panel">
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  Résumé de l&apos;Activité
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" fontWeight="bold" color="#1976d2">
                        {analytics.appointmentsThisWeek}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Rendez-vous cette semaine
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" fontWeight="bold" color="#4caf50">
                        {analytics.consultationsThisMonth}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Consultations ce mois
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" fontWeight="bold" color="#ff9800">
                        {analytics.chronicPatients}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Patients chroniques
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" fontWeight="bold" color="#9c27b0">
                        {`${analytics.averagePatientCompliance}%`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Observance moyenne
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};

export default DoctorDashboard;
