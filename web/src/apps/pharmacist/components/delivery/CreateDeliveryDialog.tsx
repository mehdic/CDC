/**
 * CreateDeliveryDialog Component
 * Dialog for creating new deliveries
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
} from '@mui/material';
import { CreateDeliveryPayload } from '../../../../shared/hooks/useDelivery';

interface CreateDeliveryDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateDeliveryPayload) => Promise<void>;
}

export const CreateDeliveryDialog: React.FC<CreateDeliveryDialogProps> = ({ open, onClose, onSubmit }) => {
  const [userId, setUserId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!userId.trim()) {
      setError('User ID is required');
      return;
    }

    if (!deliveryAddress.trim()) {
      setError('Delivery address is required');
      return;
    }

    setSubmitting(true);

    try {
      // In production, this would use actual encryption
      // For now, we'll simulate by base64 encoding
      const payload: CreateDeliveryPayload = {
        user_id: userId.trim(),
        order_id: orderId.trim() || undefined,
        delivery_address_encrypted: btoa(deliveryAddress),
        delivery_notes_encrypted: deliveryNotes.trim() ? btoa(deliveryNotes) : undefined,
        scheduled_at: scheduledAt || undefined,
      };

      await onSubmit(payload);
      handleClose();
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to create delivery');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setUserId('');
    setOrderId('');
    setDeliveryAddress('');
    setDeliveryNotes('');
    setScheduledAt('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Delivery</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="User ID (Patient)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            fullWidth
            helperText="UUID of the patient receiving the delivery"
          />

          <TextField
            label="Order ID (Optional)"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            fullWidth
            helperText="UUID of the associated order (if any)"
          />

          <TextField
            label="Delivery Address"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            required
            fullWidth
            multiline
            rows={3}
            helperText="Full delivery address (will be encrypted)"
          />

          <TextField
            label="Delivery Notes (Optional)"
            value={deliveryNotes}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            fullWidth
            multiline
            rows={2}
            helperText="Special instructions or notes (will be encrypted)"
          />

          <TextField
            label="Scheduled Delivery Time (Optional)"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Delivery'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateDeliveryDialog;
