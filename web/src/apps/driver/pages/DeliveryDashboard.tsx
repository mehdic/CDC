/**
 * Driver Delivery Dashboard
 * Main page for delivery drivers to manage and complete deliveries
 * Shows pending deliveries and allows marking them as complete with proof
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  LocalShipping as DeliveryIcon,
  Done as DoneIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useDeliveryData, Delivery, DeliveryStatus } from '../../../shared/hooks/useDelivery';
import { useProofOfDelivery } from '../../../shared/hooks/useProofOfDelivery';
import { DeliveryCompletionFlow } from '../components/delivery/DeliveryCompletionFlow';
import { ProofOfDeliveryDisplay } from '../components/delivery/ProofOfDeliveryDisplay';
import { DeliveryCompletionPayload } from '../../../shared/types/proofOfDelivery';

export const DeliveryDashboard: React.FC = () => {
  const {
    deliveries,
    loading: deliveriesLoading,
    error: deliveriesError,
    fetchDeliveries,
    updateDelivery,
  } = useDeliveryData();

  const {
    proof,
    uploadProof,
    fetchProofByDeliveryId,
  } = useProofOfDelivery();

  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | 'all'>('all');
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [proofDisplayOpen, setProofDisplayOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [loadingProof, setLoadingProof] = useState(false);

  // Fetch deliveries on mount and when filter changes
  useEffect(() => {
    const filters = statusFilter !== 'all' ? { status: statusFilter as DeliveryStatus } : {};
    fetchDeliveries(filters);
  }, [statusFilter, fetchDeliveries]);

  const handleRefresh = () => {
    const filters = statusFilter !== 'all' ? { status: statusFilter as DeliveryStatus } : {};
    fetchDeliveries(filters);
  };

  const handleCompleteClick = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setCompletionDialogOpen(true);
  };

  const handleCompletionSubmit = async (payload: DeliveryCompletionPayload): Promise<boolean> => {
    try {
      // Upload proof of delivery
      const uploadedProof = await uploadProof(payload);
      if (!uploadedProof) {
        throw new Error('Failed to upload proof of delivery');
      }

      // Update delivery status to DELIVERED
      const updated = await updateDelivery(payload.deliveryId, {
        status: DeliveryStatus.DELIVERED,
        tracking_info: {
          proof_id: uploadedProof.id,
          completed_at: new Date().toISOString(),
          recipient_name: payload.recipientName,
        },
      });

      if (updated) {
        handleRefresh();
        return true;
      }
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete delivery';
      console.error('Completion error:', message);
      return false;
    }
  };

  const handleViewProof = async (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setLoadingProof(true);

    try {
      const proofData = await fetchProofByDeliveryId(delivery.id);
      if (proofData) {
        setProofDisplayOpen(true);
      } else {
        alert('No proof of delivery found for this delivery');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load proof';
      alert(`Error: ${message}`);
    } finally {
      setLoadingProof(false);
    }
  };

  const getStatusColor = (status: DeliveryStatus): 'default' | 'error' | 'info' | 'success' | 'warning' | 'primary' | 'secondary' => {
    switch (status) {
      case DeliveryStatus.DELIVERED:
        return 'success';
      case DeliveryStatus.FAILED:
        return 'error';
      case DeliveryStatus.IN_TRANSIT:
        return 'warning';
      case DeliveryStatus.ASSIGNED:
      case DeliveryStatus.PENDING:
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeliveryIcon /> My Deliveries
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and complete your delivery assignments
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={deliveriesLoading}
        >
          Refresh
        </Button>
      </Box>

      {/* Error Alert */}
      {deliveriesError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => {}}>
          {deliveriesError}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DeliveryStatus | 'all')}
              label="Status Filter"
            >
              <MenuItem value="all">All Deliveries</MenuItem>
              <MenuItem value={DeliveryStatus.ASSIGNED}>Assigned to Me</MenuItem>
              <MenuItem value={DeliveryStatus.IN_TRANSIT}>In Transit</MenuItem>
              <MenuItem value={DeliveryStatus.DELIVERED}>Delivered</MenuItem>
              <MenuItem value={DeliveryStatus.FAILED}>Failed</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" color="text.secondary">
            {deliveriesLoading ? (
              <CircularProgress size={16} sx={{ mr: 1 }} />
            ) : (
              `${deliveries.length} ${deliveries.length === 1 ? 'delivery' : 'deliveries'}`
            )}
          </Typography>
        </Box>
      </Paper>

      {/* Deliveries Table */}
      <TableContainer component={Paper}>
        {deliveriesLoading && deliveries.length === 0 ? (
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : deliveries.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No deliveries found for the selected filter
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Patient</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deliveries.map((delivery) => (
                <TableRow key={delivery.id} data-testid={`delivery-row-${delivery.id}`}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {delivery.user_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {delivery.tracking_info?.address || 'Address not specified'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={delivery.status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(delivery.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      {delivery.status === DeliveryStatus.ASSIGNED ||
                      delivery.status === DeliveryStatus.IN_TRANSIT ? (
                        <Tooltip title="Complete Delivery">
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<DoneIcon />}
                            onClick={() => handleCompleteClick(delivery)}
                            data-testid={`complete-button-${delivery.id}`}
                          >
                            Complete
                          </Button>
                        </Tooltip>
                      ) : delivery.status === DeliveryStatus.DELIVERED ? (
                        <Tooltip title="View Proof">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ViewIcon />}
                            onClick={() => handleViewProof(delivery)}
                            disabled={loadingProof}
                            data-testid={`view-proof-button-${delivery.id}`}
                          >
                            View Proof
                          </Button>
                        </Tooltip>
                      ) : null}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Dialogs */}
      <DeliveryCompletionFlow
        open={completionDialogOpen}
        delivery={selectedDelivery}
        onComplete={handleCompletionSubmit}
        onCancel={() => {
          setCompletionDialogOpen(false);
          setSelectedDelivery(null);
        }}
      />

      <ProofOfDeliveryDisplay
        open={proofDisplayOpen}
        proof={proof}
        loading={loadingProof}
        onClose={() => {
          setProofDisplayOpen(false);
          setSelectedDelivery(null);
        }}
      />
    </Box>
  );
};

export default DeliveryDashboard;
