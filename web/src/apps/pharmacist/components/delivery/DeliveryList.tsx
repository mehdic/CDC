/**
 * DeliveryList Component
 * Displays deliveries in a DataGrid with filtering and sorting
 */

import React from 'react';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Chip, Box, IconButton, Tooltip } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, LocalShipping as TrackIcon } from '@mui/icons-material';
import { Delivery, DeliveryStatus } from '../../../../shared/hooks/useDelivery';

interface DeliveryListProps {
  deliveries: Delivery[];
  loading: boolean;
  onEdit?: (delivery: Delivery) => void;
  onDelete?: (delivery: Delivery) => void;
  onTrack?: (delivery: Delivery) => void;
}

const getStatusColor = (status: DeliveryStatus): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case DeliveryStatus.PENDING:
      return 'default';
    case DeliveryStatus.ASSIGNED:
      return 'info';
    case DeliveryStatus.IN_TRANSIT:
      return 'primary';
    case DeliveryStatus.DELIVERED:
      return 'success';
    case DeliveryStatus.FAILED:
      return 'error';
    case DeliveryStatus.CANCELLED:
      return 'warning';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: DeliveryStatus): string => {
  switch (status) {
    case DeliveryStatus.PENDING:
      return 'Pending';
    case DeliveryStatus.ASSIGNED:
      return 'Assigned';
    case DeliveryStatus.IN_TRANSIT:
      return 'In Transit';
    case DeliveryStatus.DELIVERED:
      return 'Delivered';
    case DeliveryStatus.FAILED:
      return 'Failed';
    case DeliveryStatus.CANCELLED:
      return 'Cancelled';
    default:
      return status;
  }
};

export const DeliveryList: React.FC<DeliveryListProps> = ({
  deliveries,
  loading,
  onEdit,
  onDelete,
  onTrack,
}) => {
  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'Delivery ID',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={params.value}>
          <span>{params.value?.substring(0, 8)}...</span>
        </Tooltip>
      ),
    },
    {
      field: 'tracking_number',
      headerName: 'Tracking #',
      width: 130,
      renderCell: (params: GridRenderCellParams) => params.value || 'N/A',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={getStatusLabel(params.value as DeliveryStatus)}
          color={getStatusColor(params.value as DeliveryStatus)}
          size="small"
        />
      ),
    },
    {
      field: 'user_id',
      headerName: 'Patient',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={params.value}>
          <span>{params.value?.substring(0, 8)}...</span>
        </Tooltip>
      ),
    },
    {
      field: 'delivery_personnel_id',
      headerName: 'Assigned To',
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.value) {
          return <Chip label="Unassigned" size="small" variant="outlined" />;
        }
        return (
          <Tooltip title={params.value}>
            <span>{params.value?.substring(0, 8)}...</span>
          </Tooltip>
        );
      },
    },
    {
      field: 'scheduled_at',
      headerName: 'Scheduled',
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.value) return 'Not scheduled';
        return new Date(params.value).toLocaleString();
      },
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 150,
      renderCell: (params: GridRenderCellParams) => new Date(params.value).toLocaleString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const delivery = params.row as Delivery;
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {onTrack && (
              <Tooltip title="Track delivery">
                <IconButton size="small" onClick={() => onTrack(delivery)} color="primary">
                  <TrackIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onEdit && delivery.status === DeliveryStatus.PENDING && (
              <Tooltip title="Edit delivery">
                <IconButton size="small" onClick={() => onEdit(delivery)} color="default">
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (delivery.status === DeliveryStatus.PENDING || delivery.status === DeliveryStatus.CANCELLED) && (
              <Tooltip title="Delete delivery">
                <IconButton size="small" onClick={() => onDelete(delivery)} color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <DataGrid
      rows={deliveries}
      columns={columns}
      loading={loading}
      pageSizeOptions={[10, 25, 50, 100]}
      initialState={{
        pagination: {
          paginationModel: { pageSize: 25 },
        },
      }}
      checkboxSelection
      disableRowSelectionOnClick
      autoHeight
      sx={{
        '& .MuiDataGrid-row:hover': {
          cursor: 'pointer',
        },
      }}
    />
  );
};

export default DeliveryList;
