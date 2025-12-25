/**
 * Admin Dashboard Page
 * Main dashboard for platform administration
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
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { useAdminDashboard } from '../hooks/useAdmin';
import { SystemHealthCard } from '../components/SystemHealthCard';
import { UserManagement } from '../components/UserManagement';
import { AnalyticsWidget } from '../components/AnalyticsWidget';
import { ConfigManagement } from '../components/ConfigManagement';
import { AuditLogViewer } from '../components/AuditLogViewer';
import type { AdminAnalytics, SystemMonitoring, AuditLogEntry } from '../types/admin.types';

/**
 * Tab panel component
 */
interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

/**
 * Quick stats card component
 */
interface QuickStatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  testId: string;
}

const QuickStatCard: React.FC<QuickStatCardProps> = ({ title, value, icon, color, testId }) => (
  <Card data-testid={testId}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold" sx={{ color }}>
            {typeof value === 'number' ? value.toLocaleString('fr-CH') : value}
          </Typography>
        </Box>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            bgcolor: `${color}20`,
            color,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

/**
 * Recent activity item component
 */
interface ActivityItemProps {
  activity: AuditLogEntry;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => (
  <Box
    sx={{
      py: 1.5,
      px: 2,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid',
      borderColor: 'divider',
      '&:last-child': { borderBottom: 0 },
    }}
  >
    <Box>
      <Typography variant="body2">{activity.actor}</Typography>
      <Typography variant="caption" color="text.secondary">
        {activity.action.replace(/_/g, ' ')}
      </Typography>
    </Box>
    <Typography variant="caption" color="text.secondary">
      {new Date(activity.timestamp).toLocaleTimeString('fr-FR')}
    </Typography>
  </Box>
);

/**
 * Mock data for demo purposes when API is not available
 */
const getMockData = (): {
  analytics: AdminAnalytics;
  systemHealth: SystemMonitoring;
  recentActivity: AuditLogEntry[];
} => ({
  analytics: {
    users: {
      total: 1250,
      byType: {
        pharmacist: 85,
        doctor: 120,
        nurse: 200,
        delivery_person: 45,
        patient: 790,
        admin: 10,
      },
      newThisMonth: 48,
      activeToday: 312,
    },
    orders: {
      total: 3420,
      completed: 3156,
      pending: 264,
      revenue: 425680,
    },
    prescriptions: {
      total: 2890,
      processed: 2654,
      pending: 236,
    },
    consultations: {
      total: 856,
      completed: 789,
      scheduled: 67,
    },
    deliveries: {
      total: 1876,
      completed: 1723,
      inProgress: 142,
      failed: 11,
    },
  },
  systemHealth: {
    overall: 'healthy',
    services: [
      { name: 'API Gateway', status: 'healthy', responseTime: 45, lastCheck: new Date().toISOString() },
      { name: 'Auth Service', status: 'healthy', responseTime: 32, lastCheck: new Date().toISOString() },
      { name: 'User Service', status: 'healthy', responseTime: 28, lastCheck: new Date().toISOString() },
      { name: 'Order Service', status: 'healthy', responseTime: 56, lastCheck: new Date().toISOString() },
      { name: 'Prescription Service', status: 'degraded', responseTime: 234, lastCheck: new Date().toISOString() },
      { name: 'Delivery Service', status: 'healthy', responseTime: 42, lastCheck: new Date().toISOString() },
    ],
    metrics: {
      cpuUsage: 42,
      memoryUsage: 68,
      diskUsage: 55,
      activeConnections: 312,
    },
    timestamp: new Date().toISOString(),
  },
  recentActivity: [
    { id: '1', action: 'user_login', actor: 'admin@metapharm.ch', actorId: '1', details: {}, timestamp: new Date().toISOString() },
    { id: '2', action: 'config_changed', actor: 'admin@metapharm.ch', actorId: '1', details: { key: 'mfa_required' }, timestamp: new Date(Date.now() - 300000).toISOString() },
    { id: '3', action: 'user_created', actor: 'admin@metapharm.ch', actorId: '1', target: 'new.pharmacist@example.com', targetId: '99', details: {}, timestamp: new Date(Date.now() - 600000).toISOString() },
    { id: '4', action: 'permission_changed', actor: 'admin@metapharm.ch', actorId: '1', target: 'nurse@example.com', targetId: '50', details: {}, timestamp: new Date(Date.now() - 900000).toISOString() },
  ],
});

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { data: dashboardData, isLoading, error, refetch } = useAdminDashboard();

  // Use mock data if API fails or data not available
  const data = dashboardData || getMockData();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }} data-testid="admin-dashboard">
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <DashboardIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Administration
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Tableau de bord de gestion de la plateforme MetaPharm Connect
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={() => refetch()} aria-label="Actualiser" disabled={isLoading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Error State */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Donnees de demonstration affichees - L'API n'est pas disponible
          </Typography>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress aria-label="Chargement" />
        </Box>
      )}

      {/* Dashboard Content */}
      {!isLoading && (
        <>
          {/* Quick Stats */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <QuickStatCard
                testId="stat-users"
                title="Utilisateurs Totaux"
                value={data.analytics.users.total}
                icon={<PeopleIcon />}
                color="#1976d2"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <QuickStatCard
                testId="stat-orders"
                title="Commandes"
                value={data.analytics.orders.total}
                icon={<AnalyticsIcon />}
                color="#ff9800"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <QuickStatCard
                testId="stat-prescriptions"
                title="Ordonnances"
                value={data.analytics.prescriptions.total}
                icon={<SettingsIcon />}
                color="#4caf50"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <QuickStatCard
                testId="stat-revenue"
                title="Chiffre d'Affaires"
                value={new Intl.NumberFormat('fr-CH', {
                  style: 'currency',
                  currency: 'CHF',
                  minimumFractionDigits: 0,
                }).format(data.analytics.orders.revenue)}
                icon={<SpeedIcon />}
                color="#9c27b0"
              />
            </Grid>
          </Grid>

          {/* Navigation Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab
                icon={<DashboardIcon />}
                iconPosition="start"
                label="Vue d'ensemble"
                data-testid="tab-overview"
              />
              <Tab
                icon={<PeopleIcon />}
                iconPosition="start"
                label="Utilisateurs"
                data-testid="tab-users"
              />
              <Tab
                icon={<SpeedIcon />}
                iconPosition="start"
                label="Systeme"
                data-testid="tab-system"
              />
              <Tab
                icon={<SettingsIcon />}
                iconPosition="start"
                label="Configuration"
                data-testid="tab-config"
              />
              <Tab
                icon={<HistoryIcon />}
                iconPosition="start"
                label="Audit"
                data-testid="tab-audit"
              />
            </Tabs>
          </Paper>

          {/* Tab Panels */}
          {/* Overview Tab */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              {/* Analytics */}
              <Grid item xs={12} lg={8}>
                <AnalyticsWidget analytics={data.analytics} />
              </Grid>

              {/* System Health + Recent Activity */}
              <Grid item xs={12} lg={4}>
                <Stack spacing={3}>
                  <SystemHealthCard health={data.systemHealth} />

                  {/* Recent Activity */}
                  <Card data-testid="recent-activity">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <HistoryIcon color="primary" />
                        <Typography variant="h6" fontWeight="bold">
                          Activite Recente
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 1 }} />
                      {data.recentActivity.slice(0, 5).map((activity) => (
                        <ActivityItem key={activity.id} activity={activity} />
                      ))}
                    </CardContent>
                  </Card>
                </Stack>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Users Tab */}
          <TabPanel value={activeTab} index={1}>
            <UserManagement />
          </TabPanel>

          {/* System Tab */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <SystemHealthCard health={data.systemHealth} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Metriques Systeme
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Surveillance detaillee disponible dans cette section.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Config Tab */}
          <TabPanel value={activeTab} index={3}>
            <ConfigManagement />
          </TabPanel>

          {/* Audit Tab */}
          <TabPanel value={activeTab} index={4}>
            <AuditLogViewer />
          </TabPanel>
        </>
      )}
    </Container>
  );
};

export default AdminDashboard;
