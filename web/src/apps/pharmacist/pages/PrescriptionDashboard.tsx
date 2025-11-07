/**
 * Prescription Dashboard Page
 * Main pharmacist dashboard showing prescription queue with filters and statistics
 * Task: T115 - Create Prescription Dashboard
 */

import React, { useState, useMemo } from 'react';
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
} from '@mui/material';
import {
  PendingActions as PendingIcon,
  RateReview as ReviewIcon,
  CheckCircle as ApprovedIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

import {
  usePrescriptions,
  PrescriptionStatus,
  PrescriptionFilters,
} from '../../../shared/hooks/usePrescriptions';
import { PrescriptionQueue } from '../components/PrescriptionQueue';
import { StatusFilters } from '../components/StatusFilters';

// ============================================================================
// Types
// ============================================================================

interface DashboardStat {
  label: string;
  value: number;
  icon: React.ReactElement;
  color: string;
}

// ============================================================================
// Component
// ============================================================================

export const PrescriptionDashboard: React.FC = () => {
  // State for filters
  const [selectedStatuses, setSelectedStatuses] = useState<PrescriptionStatus[]>([
    PrescriptionStatus.PENDING,
    PrescriptionStatus.IN_REVIEW,
    PrescriptionStatus.CLARIFICATION_NEEDED,
  ]);

  // Build query filters
  const filters: PrescriptionFilters = useMemo(() => {
    return {
      status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      limit: 100,
      offset: 0,
    };
  }, [selectedStatuses]);

  // Fetch prescriptions
  const { data, isLoading, error, refetch } = usePrescriptions(filters);

  // Calculate statistics
  const stats: DashboardStat[] = useMemo(() => {
    if (!data) {
      return [
        { label: 'Pending Review', value: 0, icon: <PendingIcon />, color: '#ff9800' },
        { label: 'In Review', value: 0, icon: <ReviewIcon />, color: '#2196f3' },
        { label: 'Approved Today', value: 0, icon: <ApprovedIcon />, color: '#4caf50' },
        { label: 'Safety Warnings', value: 0, icon: <WarningIcon />, color: '#f44336' },
      ];
    }

    const prescriptions = data.prescriptions || [];

    // Count by status
    const pendingCount = prescriptions.filter(
      (p) => p.status === PrescriptionStatus.PENDING
    ).length;

    const inReviewCount = prescriptions.filter(
      (p) => p.status === PrescriptionStatus.IN_REVIEW
    ).length;

    // Approved today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const approvedTodayCount = prescriptions.filter((p) => {
      if (!p.approved_at) return false;
      const approvedDate = new Date(p.approved_at);
      approvedDate.setHours(0, 0, 0, 0);
      return approvedDate.getTime() === today.getTime();
    }).length;

    // Prescriptions with safety warnings
    const safetyWarningsCount = prescriptions.filter(
      (p) =>
        (p.drug_interactions && p.drug_interactions.length > 0) ||
        (p.allergy_warnings && p.allergy_warnings.length > 0) ||
        (p.contraindications && p.contraindications.length > 0)
    ).length;

    return [
      { label: 'Pending Review', value: pendingCount, icon: <PendingIcon />, color: '#ff9800' },
      { label: 'In Review', value: inReviewCount, icon: <ReviewIcon />, color: '#2196f3' },
      { label: 'Approved Today', value: approvedTodayCount, icon: <ApprovedIcon />, color: '#4caf50' },
      { label: 'Safety Warnings', value: safetyWarningsCount, icon: <WarningIcon />, color: '#f44336' },
    ];
  }, [data]);

  // Calculate status counts for filter chips
  const statusCounts = useMemo(() => {
    if (!data) return undefined;

    const prescriptions = data.prescriptions || [];

    return {
      [PrescriptionStatus.PENDING]: prescriptions.filter(
        (p) => p.status === PrescriptionStatus.PENDING
      ).length,
      [PrescriptionStatus.IN_REVIEW]: prescriptions.filter(
        (p) => p.status === PrescriptionStatus.IN_REVIEW
      ).length,
      [PrescriptionStatus.CLARIFICATION_NEEDED]: prescriptions.filter(
        (p) => p.status === PrescriptionStatus.CLARIFICATION_NEEDED
      ).length,
      [PrescriptionStatus.APPROVED]: prescriptions.filter(
        (p) => p.status === PrescriptionStatus.APPROVED
      ).length,
      [PrescriptionStatus.REJECTED]: prescriptions.filter(
        (p) => p.status === PrescriptionStatus.REJECTED
      ).length,
      [PrescriptionStatus.EXPIRED]: prescriptions.filter(
        (p) => p.status === PrescriptionStatus.EXPIRED
      ).length,
    };
  }, [data]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Prescription Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review and manage prescriptions awaiting validation
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: `${stat.color}20`,
                      color: stat.color,
                      display: 'flex',
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Status Filters */}
      <Box sx={{ mb: 3 }}>
        <StatusFilters
          selectedStatuses={selectedStatuses}
          onStatusChange={setSelectedStatuses}
          counts={statusCounts}
        />
      </Box>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Error loading prescriptions: {error.message}
          </Typography>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Prescription Queue */}
      {!isLoading && data && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              Prescription Queue
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {data.total} prescription(s) found
            </Typography>
          </Box>
          <PrescriptionQueue
            prescriptions={data.prescriptions || []}
            loading={isLoading}
          />
        </Paper>
      )}

      {/* Empty State */}
      {!isLoading && data && data.prescriptions.length === 0 && (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Prescriptions Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedStatuses.length === 0
              ? 'Select a status filter to view prescriptions'
              : 'No prescriptions match the selected filters'}
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default PrescriptionDashboard;
