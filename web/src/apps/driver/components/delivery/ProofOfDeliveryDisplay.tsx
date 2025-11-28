/**
 * ProofOfDeliveryDisplay Component
 * Displays proof of delivery (signature and/or photo) for a completed delivery
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardMedia,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  LocationOn as LocationIcon,
  Schedule as TimeIcon,
} from '@mui/icons-material';
import { ProofOfDelivery } from '../../../../shared/types/proofOfDelivery';

interface ProofOfDeliveryDisplayProps {
  open: boolean;
  proof: ProofOfDelivery | null;
  loading?: boolean;
  onClose: () => void;
}

export const ProofOfDeliveryDisplay: React.FC<ProofOfDeliveryDisplayProps> = ({
  open,
  proof,
  loading = false,
  onClose,
}) => {
  if (!proof) return null;

  const formatDateTime = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString();
  };

  const formatCoordinates = (lat: number, lng: number, accuracy: number): string => {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)} (±${accuracy.toFixed(0)}m)`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'success';
      case 'submitted':
        return 'info';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Proof of Delivery</Typography>
          <Chip
            icon={<CheckIcon />}
            label={proof.status.charAt(0).toUpperCase() + proof.status.slice(1)}
            color={getStatusColor(proof.status) as any}
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Recipient Information */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Recipient
              </Typography>
              <Typography variant="h6">{proof.recipientName}</Typography>
            </Box>

            {/* Timestamp */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimeIcon fontSize="small" />
                  Timestamp
                </Typography>
                <Typography variant="body2">{formatDateTime(proof.timestamp)}</Typography>
              </Box>

              {proof.location && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon fontSize="small" />
                    Location
                  </Typography>
                  <Typography variant="body2">
                    {formatCoordinates(proof.location.latitude, proof.location.longitude, proof.location.accuracy)}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Signature */}
            {proof.signature && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Signature
                </Typography>
                <Card>
                  <CardMedia
                    component="img"
                    image={`data:${proof.signature.mimeType};base64,${proof.signature.base64}`}
                    alt="Delivery signature"
                    data-testid="proof-signature-image"
                    sx={{ height: 250, objectFit: 'contain', backgroundColor: '#f5f5f5' }}
                  />
                </Card>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Captured: {formatDateTime(proof.signature.capturedAt)}
                </Typography>
              </Box>
            )}

            {/* Photo */}
            {proof.photo && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Photo Proof
                </Typography>
                <Card>
                  <CardMedia
                    component="img"
                    image={`data:${proof.photo.mimeType};base64,${proof.photo.base64}`}
                    alt="Delivery photo"
                    data-testid="proof-photo-image"
                    sx={{ height: 300, objectFit: 'cover' }}
                  />
                </Card>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Captured: {formatDateTime(proof.photo.capturedAt)}
                </Typography>
                {proof.photo.location && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Location: {formatCoordinates(
                      proof.photo.location.latitude,
                      proof.photo.location.longitude,
                      proof.photo.location.accuracy
                    )}
                  </Typography>
                )}
              </Box>
            )}

            {/* Notes */}
            {proof.notes && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Notes
                </Typography>
                <Alert severity="info">{proof.notes}</Alert>
              </Box>
            )}

            {/* Status Alert */}
            {proof.status === 'verified' && (
              <Alert severity="success" sx={{ mt: 2 }}>
                This proof of delivery has been verified and is valid.
              </Alert>
            )}
            {proof.status === 'pending' && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This proof of delivery is pending verification.
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProofOfDeliveryDisplay;
