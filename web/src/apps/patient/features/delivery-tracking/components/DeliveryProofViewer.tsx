/**
 * Delivery Proof Viewer Component
 * T8-042: Patient Delivery Tracking
 * Displays delivery proof (signature and photo)
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Grid,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Image as ImageIcon,
  Draw as SignatureIcon,
} from '@mui/icons-material';
import type { DeliveryProof } from '../types/tracking';

/**
 * Props
 */
export interface DeliveryProofViewerProps {
  proof: DeliveryProof | null;
}

/**
 * Delivery Proof Viewer Component
 */
export const DeliveryProofViewer: React.FC<DeliveryProofViewerProps> = ({ proof }) => {
  const [imageDialogOpen, setImageDialogOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(
    null
  );

  if (!proof) {
    return null;
  }

  const handleOpenImage = (url: string, title: string) => {
    setSelectedImage({ url, title });
    setImageDialogOpen(true);
  };

  const handleCloseImage = () => {
    setImageDialogOpen(false);
    setSelectedImage(null);
  };

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CheckIcon color="success" />
            <Typography variant="h6">Delivery Proof</Typography>
          </Box>

          <Grid container spacing={2}>
            {/* Signature */}
            {proof.signature_image && (
              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    textAlign: 'center',
                  }}
                >
                  <SignatureIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Signature
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    {proof.recipient_name || 'Recipient signature'}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() =>
                      handleOpenImage(proof.signature_image!, 'Delivery Signature')
                    }
                  >
                    View Signature
                  </Button>
                </Box>
              </Grid>
            )}

            {/* Photo */}
            {proof.photo_image && (
              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    textAlign: 'center',
                  }}
                >
                  <ImageIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Delivery Photo
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    Proof of delivery location
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() =>
                      handleOpenImage(proof.photo_image!, 'Delivery Photo')
                    }
                  >
                    View Photo
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>

          {/* Delivery Details */}
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Delivered:</strong>{' '}
              {new Date(proof.timestamp).toLocaleString()}
            </Typography>
            {proof.location && (
              <Typography variant="body2" color="text.secondary">
                <strong>Location:</strong> {proof.location.latitude.toFixed(6)},{' '}
                {proof.location.longitude.toFixed(6)}
              </Typography>
            )}
            {proof.notes && (
              <Typography variant="body2" color="text.secondary">
                <strong>Notes:</strong> {proof.notes}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Image Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={handleCloseImage}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedImage?.title}
          <IconButton
            aria-label="close"
            onClick={handleCloseImage}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Box
              component="img"
              src={selectedImage.url}
              alt={selectedImage.title}
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: '70vh',
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
