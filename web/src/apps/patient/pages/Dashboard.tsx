/**
 * Patient Dashboard Component
 * Main dashboard for patient showing health overview and quick actions
 */

import React from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  ShoppingCart as ShoppingIcon,
  LocalHospital as HealthIcon,
  VideoCall as VideoIcon,
  Medication as PrescriptionIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading] = React.useState(false);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress aria-label="Chargement du tableau de bord patient" />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }} data-testid="dashboard-view">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom data-testid="dashboard-title">
          Tableau de Bord Patient
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Vue d&apos;ensemble de votre santé et services
        </Typography>
      </Box>

      {/* Quick Action Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              },
            }}
            onClick={() => navigate('/patient/ecommerce')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    E-Commerce
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    Boutique
                  </Typography>
                </Box>
                <ShoppingIcon sx={{ fontSize: 40, color: '#1976d2' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              },
            }}
            onClick={() => navigate('/patient/prescriptions')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Ordonnances
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    Mes prescriptions
                  </Typography>
                </Box>
                <PrescriptionIcon sx={{ fontSize: 40, color: '#4caf50' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              },
            }}
            onClick={() => navigate('/patient/health-records')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Dossier Médical
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    Mon dossier
                  </Typography>
                </Box>
                <HealthIcon sx={{ fontSize: 40, color: '#ff9800' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              },
            }}
            onClick={() => navigate('/teleconsultation')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Téléconsultation
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    Consultation
                  </Typography>
                </Box>
                <VideoIcon sx={{ fontSize: 40, color: '#9c27b0' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Actions Rapides
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button variant="contained" onClick={() => navigate('/patient/ecommerce')}>
            Commander des médicaments
          </Button>
          <Button variant="outlined" onClick={() => navigate('/teleconsultation')}>
            Prendre rendez-vous
          </Button>
          <Button variant="outlined" onClick={() => navigate('/patient/vip')}>
            Programme VIP
          </Button>
        </Stack>
      </Box>
    </Container>
  );
};

export default PatientDashboard;
