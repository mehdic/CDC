/**
 * Prescription Queue DataGrid Component
 * Displays prescription queue with filtering, sorting, and row actions
 * Task: T117 - Implement DataGrid for prescription queue
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridValueGetterParams,
} from '@mui/x-data-grid';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Avatar,
  Typography,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Warning as WarningIcon,
  TrendingDown as LowConfidenceIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import {
  Prescription,
  PrescriptionStatus,
  PrescriptionSource,
} from '../../../shared/hooks/usePrescriptions';

// ============================================================================
// Types
// ============================================================================

export interface PrescriptionQueueProps {
  prescriptions: Prescription[];
  loading?: boolean;
  onRowClick?: (prescription: Prescription) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get status chip color
 */
const getStatusColor = (
  status: PrescriptionStatus
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case PrescriptionStatus.PENDING:
      return 'warning';
    case PrescriptionStatus.IN_REVIEW:
      return 'info';
    case PrescriptionStatus.CLARIFICATION_NEEDED:
      return 'error';
    case PrescriptionStatus.APPROVED:
      return 'success';
    case PrescriptionStatus.REJECTED:
      return 'error';
    case PrescriptionStatus.EXPIRED:
      return 'default';
    default:
      return 'default';
  }
};

/**
 * Get source badge text
 */
const getSourceLabel = (source: PrescriptionSource): string => {
  switch (source) {
    case PrescriptionSource.PATIENT_UPLOAD:
      return 'Patient Upload';
    case PrescriptionSource.DOCTOR_DIRECT:
      return 'Doctor';
    case PrescriptionSource.TELECONSULTATION:
      return 'Teleconsult';
    default:
      return source;
  }
};

/**
 * Format date to readable string
 */
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Calculate time ago from date
 */
const timeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
};

// ============================================================================
// Column Definitions
// ============================================================================

const columns: GridColDef[] = [
  {
    field: 'patient',
    headerName: 'Patient',
    flex: 1,
    minWidth: 150,
    renderCell: (params: GridRenderCellParams<Prescription>) => {
      const prescription = params.row;
      const patientName = prescription.patient
        ? `${prescription.patient.first_name} ${prescription.patient.last_name}`
        : 'Unknown Patient';

      return (
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
            {patientName.charAt(0)}
          </Avatar>
          <Typography variant="body2" fontWeight="medium">
            {patientName}
          </Typography>
        </Stack>
      );
    },
  },
  {
    field: 'source',
    headerName: 'Source',
    width: 130,
    renderCell: (params: GridRenderCellParams<Prescription>) => {
      const prescription = params.row;
      return (
        <Chip
          label={getSourceLabel(prescription.source)}
          size="small"
          variant="outlined"
        />
      );
    },
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 160,
    renderCell: (params: GridRenderCellParams<Prescription>) => {
      const prescription = params.row;
      return (
        <Chip
          label={prescription.status.replace('_', ' ').toUpperCase()}
          size="small"
          color={getStatusColor(prescription.status)}
        />
      );
    },
  },
  {
    field: 'warnings',
    headerName: 'Warnings',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params: GridRenderCellParams<Prescription>) => {
      const prescription = params.row;
      const hasSafetyWarnings =
        (prescription.drug_interactions?.length > 0) ||
        (prescription.allergy_warnings?.length > 0) ||
        (prescription.contraindications?.length > 0);

      const hasLowConfidence = prescription.ai_confidence_score !== null && prescription.ai_confidence_score < 80;

      return (
        <Stack direction="row" spacing={0.5}>
          {hasSafetyWarnings && (
            <Tooltip title="Safety Warnings">
              <WarningIcon color="error" fontSize="small" />
            </Tooltip>
          )}
          {hasLowConfidence && (
            <Tooltip title={`Low AI Confidence (${prescription.ai_confidence_score}%)`}>
              <LowConfidenceIcon color="warning" fontSize="small" />
            </Tooltip>
          )}
        </Stack>
      );
    },
  },
  {
    field: 'prescribed_date',
    headerName: 'Prescribed',
    width: 120,
    valueGetter: (params: GridValueGetterParams<Prescription>) => {
      return formatDate(params.row.prescribed_date);
    },
  },
  {
    field: 'created_at',
    headerName: 'Submitted',
    width: 110,
    renderCell: (params: GridRenderCellParams<Prescription>) => {
      return (
        <Tooltip title={formatDate(params.row.created_at)}>
          <Typography variant="body2" color="text.secondary">
            {timeAgo(params.row.created_at)}
          </Typography>
        </Tooltip>
      );
    },
  },
  {
    field: 'expiry_date',
    headerName: 'Expires',
    width: 120,
    renderCell: (params: GridRenderCellParams<Prescription>) => {
      const expiryDate = params.row.expiry_date;
      if (!expiryDate) return '-';

      const expiry = new Date(expiryDate);
      const now = new Date();
      const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0;
      const isExpired = daysUntilExpiry < 0;

      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {(isExpiringSoon || isExpired) && (
            <CalendarIcon
              fontSize="small"
              color={isExpired ? 'error' : 'warning'}
            />
          )}
          <Typography
            variant="body2"
            color={isExpired ? 'error' : isExpiringSoon ? 'warning.main' : 'text.primary'}
          >
            {formatDate(expiryDate)}
          </Typography>
        </Box>
      );
    },
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 80,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    renderCell: (params: GridRenderCellParams<Prescription>) => {
      return (
        <Tooltip title="View Details">
          <IconButton size="small" color="primary">
            <ViewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    },
  },
];

// ============================================================================
// Component
// ============================================================================

export const PrescriptionQueue: React.FC<PrescriptionQueueProps> = ({
  prescriptions,
  loading = false,
  onRowClick,
}) => {
  const navigate = useNavigate();

  /**
   * Handle row click to view prescription details
   */
  const handleRowClick = (prescription: Prescription) => {
    if (onRowClick) {
      onRowClick(prescription);
    } else {
      // Default: navigate to review page
      navigate(`/pharmacist/prescriptions/${prescription.id}`);
    }
  };

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <DataGrid
        rows={prescriptions}
        columns={columns}
        loading={loading}
        pageSizeOptions={[10, 25, 50, 100]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 25 },
          },
          sorting: {
            sortModel: [{ field: 'created_at', sort: 'desc' }],
          },
        }}
        onRowClick={(params) => handleRowClick(params.row as Prescription)}
        sx={{
          '& .MuiDataGrid-row': {
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          },
        }}
        disableRowSelectionOnClick
        density="comfortable"
      />
    </Box>
  );
};

export default PrescriptionQueue;
