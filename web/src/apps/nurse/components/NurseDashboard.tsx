/**
 * Nurse Dashboard Component (T4-001)
 * Main dashboard showing patient summary, pending orders, deliveries, and quick actions
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  TextField,
} from '@mui/material';
import {
  PersonAdd as AddPatientIcon,
  MedicalServices as OrderIcon,
  LocalShipping as DeliveryIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material';
import { getDashboardStats } from '../services/nurseApi';
import { useOrders } from '../hooks/useOrders';
import type { DashboardStats } from '../types/nurse';

export const NurseDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');

  const { orders: pendingOrders, loading: ordersLoading } = useOrders({
    status: 'pending',
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch dashboard summary
        const summaryResponse = await fetch('/api/nurse/dashboard/summary');
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          setStats(summaryData.data || summaryData);
        } else {
          // Fallback to getDashboardStats
          const statsData = await getDashboardStats();
          setStats(statsData);
        }

        // Fetch patients list
        const patientsResponse = await fetch('/api/nurse/patients');
        if (patientsResponse.ok) {
          const patientsData = await patientsResponse.json();
          setPatients(patientsData.data || []);
        }

        // Fetch upcoming deliveries
        const deliveriesResponse = await fetch('/api/nurse/deliveries/upcoming');
        if (deliveriesResponse.ok) {
          const deliveriesData = await deliveriesResponse.json();
          setUpcomingDeliveries(deliveriesData.data || []);
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" data-testid="error-alert">{error}</Alert>
      </Container>
    );
  }

  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    patient.room?.toLowerCase().includes(patientSearchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }} data-testid="dashboard-view">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Tableau de bord infirmière
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Vue d&apos;ensemble de vos patients et commandes
        </Typography>
      </Box>

      {/* Profile and Role Badge */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" data-testid="profile-name">Caroline Leclerc</Typography>
        <Chip label="Infirmier" data-testid="role-badge" color="primary" size="small" />
      </Box>

      {/* Patient Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Rechercher un patient..."
          value={patientSearchTerm}
          onChange={(e) => setPatientSearchTerm(e.target.value)}
          data-testid="patient-search-input"
          size="small"
        />
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Patients Total
                  </Typography>
                  <Typography variant="h4" data-testid="total-patients">{stats?.totalPatients || 0}</Typography>
                </Box>
                <AddPatientIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Commandes en attente
                  </Typography>
                  <Typography variant="h4" data-testid="active-orders-count">{stats?.pendingOrders || 0}</Typography>
                </Box>
                <OrderIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Livraisons en cours
                  </Typography>
                  <Typography variant="h4" data-testid="pending-deliveries">{stats?.pendingDeliveries || stats?.inTransitDeliveries || 0}</Typography>
                </Box>
                <DeliveryIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Messages non lus
                  </Typography>
                  <Typography variant="h4" data-testid="unread-messages">
                    {stats?.unreadMessages || 0}
                  </Typography>
                </Box>
                <NotificationIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Patient List Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Patients assignés</Typography>
        <List data-testid="patient-list">
          {filteredPatients.length === 0 ? (
            <Typography color="text.secondary">Aucun patient trouvé</Typography>
          ) : (
            filteredPatients.map((patient) => (
              <ListItem
                key={patient.id}
                data-testid={`patient-${patient.id}`}
                button
                onClick={() => navigate(`/nurse/patients/${patient.id}`)}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 'none' },
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <Box display="flex" justifyContent="space-between" width="100%" mb={1}>
                  <Typography variant="subtitle1" fontWeight="bold">{patient.name}</Typography>
                  <Typography variant="body2" color="text.secondary">Room {patient.room}</Typography>
                </Box>
                <Box display="flex" gap={1} flexWrap="wrap" data-testid="conditions">
                  {patient.conditions?.map((condition: string, index: number) => (
                    <Chip key={index} label={condition} size="small" variant="outlined" />
                  ))}
                </Box>
                {patient.activeOrders > 0 && (
                  <Typography variant="caption" color="primary" sx={{ mt: 1 }}>
                    {patient.activeOrders} commande(s) active(s)
                  </Typography>
                )}
              </ListItem>
            ))
          )}
        </List>
      </Paper>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Pending Orders */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Commandes en attente</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/nurse/orders')}
              >
                Voir tout
              </Button>
            </Box>

            {ordersLoading ? (
              <Box textAlign="center" py={3}>
                <CircularProgress size={24} />
              </Box>
            ) : pendingOrders.length === 0 ? (
              <Typography color="text.secondary">Aucune commande en attente</Typography>
            ) : (
              <List>
                {pendingOrders.slice(0, 5).map((order) => (
                  <ListItem
                    key={order.id}
                    button
                    onClick={() => navigate(`/nurse/orders/${order.id}`)}
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <ListItemText
                      primary={order.patientName}
                      secondary={`Chambre ${order.room} \u2022 ${order.medications.length} médicaments`}
                    />
                    <Chip
                      label={order.urgency.toUpperCase()}
                      size="small"
                      color={
                        order.urgency === 'stat'
                          ? 'error'
                          : order.urgency === 'urgent'
                          ? 'warning'
                          : 'default'
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Actions rapides
            </Typography>
            <Box display="flex" flexDirection="column" gap={2} mt={2}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<OrderIcon />}
                onClick={() => navigate('/nurse/orders/new')}
              >
                Nouvelle commande
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<AddPatientIcon />}
                onClick={() => navigate('/nurse/patients')}
              >
                Voir patients
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<DeliveryIcon />}
                onClick={() => navigate('/nurse/tracking')}
              >
                Suivi des livraisons
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<NotificationIcon />}
                onClick={() => navigate('/nurse/notifications')}
              >
                Notifications
              </Button>
            </Box>
          </Paper>

          {/* Today's Summary */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Résumé du jour
            </Typography>
            <Box mt={2}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Livraisons aujourd&apos;hui</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {stats?.todayDeliveries || 0}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Commandes urgentes</Typography>
                <Typography variant="body2" fontWeight="bold" color="error">
                  {stats?.urgentOrders || 0}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Patients actifs</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {stats?.totalPatients || 0}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Upcoming Deliveries Widget */}
          <Paper sx={{ p: 3, mt: 3 }} data-testid="upcoming-deliveries-widget">
            <Typography variant="h6" gutterBottom>
              Livraisons à venir
            </Typography>
            <Box mt={2}>
              <Typography variant="h5" data-testid="upcoming-deliveries-count" fontWeight="bold" color="primary">
                {upcomingDeliveries.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                livraison(s) prévue(s)
              </Typography>
              {upcomingDeliveries.length > 0 && (
                <List sx={{ mt: 2 }}>
                  {upcomingDeliveries.map((delivery) => (
                    <ListItem key={delivery.id} dense>
                      <ListItemText
                        primary={delivery.patientName}
                        secondary={`${delivery.medications?.join(', ')} - ${delivery.status}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default NurseDashboard;
