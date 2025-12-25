/**
 * System Health Card Component
 * Displays system health status and service metrics
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Stack,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as HealthyIcon,
  Warning as DegradedIcon,
  Error as UnhealthyIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import type { SystemMonitoring, HealthStatus } from '../types/admin.types';

interface SystemHealthCardProps {
  health: SystemMonitoring;
}

/**
 * Get color for health status
 */
const getStatusColor = (status: HealthStatus): 'success' | 'warning' | 'error' => {
  switch (status) {
    case 'healthy':
      return 'success';
    case 'degraded':
      return 'warning';
    case 'unhealthy':
      return 'error';
    default:
      return 'error';
  }
};

/**
 * Get icon for health status
 */
const getStatusIcon = (status: HealthStatus): React.ReactElement => {
  switch (status) {
    case 'healthy':
      return <HealthyIcon fontSize="small" />;
    case 'degraded':
      return <DegradedIcon fontSize="small" />;
    case 'unhealthy':
      return <UnhealthyIcon fontSize="small" />;
    default:
      return <UnhealthyIcon fontSize="small" />;
  }
};

/**
 * Get progress color based on usage percentage
 */
const getUsageColor = (usage: number): 'success' | 'warning' | 'error' => {
  if (usage < 60) return 'success';
  if (usage < 80) return 'warning';
  return 'error';
};

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({ health }) => {
  return (
    <Card data-testid="system-health-card">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SpeedIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Sante du Systeme
            </Typography>
          </Box>
          <Chip
            icon={getStatusIcon(health.overall)}
            label={health.overall === 'healthy' ? 'Operationnel' :
                   health.overall === 'degraded' ? 'Degrade' : 'Critique'}
            color={getStatusColor(health.overall)}
            size="small"
            data-testid="overall-status"
          />
        </Box>

        {/* System Metrics */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Ressources Systeme
          </Typography>
          <Stack spacing={2}>
            {/* CPU Usage */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">CPU</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {health.metrics.cpuUsage}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={health.metrics.cpuUsage}
                color={getUsageColor(health.metrics.cpuUsage)}
                sx={{ height: 8, borderRadius: 4 }}
                data-testid="cpu-usage"
              />
            </Box>

            {/* Memory Usage */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Memoire</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {health.metrics.memoryUsage}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={health.metrics.memoryUsage}
                color={getUsageColor(health.metrics.memoryUsage)}
                sx={{ height: 8, borderRadius: 4 }}
                data-testid="memory-usage"
              />
            </Box>

            {/* Disk Usage */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Disque</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {health.metrics.diskUsage}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={health.metrics.diskUsage}
                color={getUsageColor(health.metrics.diskUsage)}
                sx={{ height: 8, borderRadius: 4 }}
                data-testid="disk-usage"
              />
            </Box>
          </Stack>
        </Box>

        {/* Active Connections */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Connexions actives
          </Typography>
          <Typography variant="h4" fontWeight="bold" color="primary" data-testid="active-connections">
            {health.metrics.activeConnections}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Services Status */}
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Services
        </Typography>
        <Stack spacing={1}>
          {health.services.map((service) => (
            <Box
              key={service.name}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 1,
                bgcolor: 'grey.50',
                borderRadius: 1,
              }}
              data-testid={`service-${service.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getStatusIcon(service.status)}
                <Typography variant="body2">{service.name}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Temps de reponse">
                  <Typography variant="caption" color="text.secondary">
                    {service.responseTime}ms
                  </Typography>
                </Tooltip>
                <Chip
                  label={service.status}
                  color={getStatusColor(service.status)}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>
          ))}
        </Stack>

        {/* Last Check Time */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Derniere verification: {new Date(health.timestamp).toLocaleString('fr-FR')}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default SystemHealthCard;
