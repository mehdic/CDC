/**
 * DeliveryManagement Page
 * Comprehensive delivery management dashboard for pharmacists
 *
 * Features:
 * - View all deliveries with filtering and sorting
 * - Create new deliveries
 * - Assign deliveries to delivery personnel
 * - Track delivery status in real-time
 * - Delete pending/cancelled deliveries
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useDeliveryData, Delivery, DeliveryStatus } from '../../../shared/hooks/useDelivery';
import DeliveryList from '../components/delivery/DeliveryList';
import CreateDeliveryDialog from '../components/delivery/CreateDeliveryDialog';
import AssignDeliveryDialog from '../components/delivery/AssignDeliveryDialog';
import DeliveryTracking from '../components/delivery/DeliveryTracking';

export const DeliveryManagement: React.FC = () => {
  const {
    deliveries,
    loading,
    error,
    fetchDeliveries,
    createDelivery,
    deleteDelivery,
    assignDelivery,
  } = useDeliveryData();

  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | 'all'>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  // Fetch deliveries on mount and when filter changes
  useEffect(() => {
    const filters = statusFilter !== 'all' ? { status: statusFilter as DeliveryStatus } : {};
    fetchDeliveries(filters);
  }, [statusFilter, fetchDeliveries]);

  const handleRefresh = () => {
    const filters = statusFilter !== 'all' ? { status: statusFilter as DeliveryStatus } : {};
    fetchDeliveries(filters);
  };

  const handleCreateDelivery = async (payload: { user_id: string; order_id?: string; delivery_address_encrypted: string; delivery_notes_encrypted?: string; scheduled_at?: string }) => {
    const result = await createDelivery(payload);
    if (result) {
      setCreateDialogOpen(false);
      handleRefresh();
    }
  };

  const handleDeleteDelivery = async (delivery: Delivery) => {
    if (!confirm(`Are you sure you want to delete delivery ${delivery.id}?`)) {
      return;
    }

    const success = await deleteDelivery(delivery.id);
    if (success) {
      handleRefresh();
    }
  };

  const handleAssignClick = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setAssignDialogOpen(true);
  };

  const handleAssignDelivery = async (deliveryId: string, personnelId: string) => {
    const result = await assignDelivery(deliveryId, personnelId);
    if (result) {
      setAssignDialogOpen(false);
      setSelectedDelivery(null);
      handleRefresh();
    }
  };

  const handleTrackClick = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setTrackingDialogOpen(true);
  };

  const handleTrackingClose = () => {
    setTrackingDialogOpen(false);
    setSelectedDelivery(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Delivery Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            New Delivery
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => {}}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DeliveryStatus | 'all')}
              label="Status Filter"
            >
              <MenuItem value="all">All Deliveries</MenuItem>
              <MenuItem value={DeliveryStatus.PENDING}>Pending</MenuItem>
              <MenuItem value={DeliveryStatus.ASSIGNED}>Assigned</MenuItem>
              <MenuItem value={DeliveryStatus.IN_TRANSIT}>In Transit</MenuItem>
              <MenuItem value={DeliveryStatus.DELIVERED}>Delivered</MenuItem>
              <MenuItem value={DeliveryStatus.FAILED}>Failed</MenuItem>
              <MenuItem value={DeliveryStatus.CANCELLED}>Cancelled</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary">
            {deliveries.length} {deliveries.length === 1 ? 'delivery' : 'deliveries'} found
          </Typography>

          {loading && <CircularProgress size={20} />}
        </Box>
      </Paper>

      {/* Delivery List */}
      <Paper sx={{ p: 2 }}>
        <DeliveryList
          deliveries={deliveries}
          loading={loading}
          onDelete={handleDeleteDelivery}
          onTrack={handleTrackClick}
          onAssign={handleAssignClick}
        />
      </Paper>

      {/* Dialogs */}
      <CreateDeliveryDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateDelivery}
      />

      <AssignDeliveryDialog
        open={assignDialogOpen}
        delivery={selectedDelivery}
        onClose={() => {
          setAssignDialogOpen(false);
          setSelectedDelivery(null);
        }}
        onAssign={handleAssignDelivery}
      />

      <DeliveryTracking
        open={trackingDialogOpen}
        delivery={selectedDelivery}
        onClose={handleTrackingClose}
      />
    </Box>
  );
};

export default DeliveryManagement;
