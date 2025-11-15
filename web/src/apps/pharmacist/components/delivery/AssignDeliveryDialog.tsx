/**
 * AssignDeliveryDialog Component
 * Dialog for assigning deliveries to delivery personnel
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  Typography,
  Chip,
} from '@mui/material';
import { Delivery } from '../../../../shared/hooks/useDelivery';

interface AssignDeliveryDialogProps {
  open: boolean;
  delivery: Delivery | null;
  onClose: () => void;
  onAssign: (deliveryId: string, personnelId: string) => Promise<void>;
}

export const AssignDeliveryDialog: React.FC<AssignDeliveryDialogProps> = ({
  open,
  delivery,
  onClose,
  onAssign,
}) => {
  const [personnelId, setPersonnelId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!delivery) return;

    setError(null);

    // Validation
    if (!personnelId.trim()) {
      setError('Delivery personnel ID is required');
      return;
    }

    setSubmitting(true);

    try {
      await onAssign(delivery.id, personnelId.trim());
      handleClose();
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to assign delivery');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setPersonnelId('');
    setError(null);
    onClose();
  };

  if (!delivery) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Delivery to Personnel</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Delivery Information
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip label={`ID: ${delivery.id.substring(0, 8)}...`} size="small" />
              <Chip label={`Tracking: ${delivery.tracking_number || 'N/A'}`} size="small" />
              <Chip label={`Patient: ${delivery.user_id.substring(0, 8)}...`} size="small" />
            </Box>
          </Box>

          <TextField
            label="Delivery Personnel ID"
            value={personnelId}
            onChange={(e) => setPersonnelId(e.target.value)}
            required
            fullWidth
            helperText="UUID of the delivery personnel to assign"
            placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
          />

          <Alert severity="info">
            This will assign the delivery to the specified personnel and update the status to &quot;Assigned&quot;.
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={submitting}>
          {submitting ? 'Assigning...' : 'Assign Delivery'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignDeliveryDialog;
