/**
 * MFASetupDialog Component
 *
 * Dialog for MFA setup with QR code
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';

interface MFASetupDialogProps {
  open: boolean;
  onClose: () => void;
}

export const MFASetupDialog: React.FC<MFASetupDialogProps> = ({ open, onClose }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchMFASetup();
    }
  }, [open]);

  const fetchMFASetup = async () => {
    setLoading(true);
    try {
      const response = await fetch('/account/mfa/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setQrCodeUrl(data.qrCodeUrl);
        setSecret(data.secret);
      }
    } catch (error) {
      console.error('Failed to setup MFA:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Configurer l'authentification à deux facteurs (MFA)</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Scannez ce code QR avec votre application d'authentification (Google Authenticator, Authy, etc.)
            </Typography>

            {qrCodeUrl && (
              <Box
                data-testid="mfa-qr-code"
                sx={{
                  width: 256,
                  height: 256,
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={qrCodeUrl}
                  alt="QR Code MFA"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </Box>
            )}

            {secret && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Clé manuelle (si vous ne pouvez pas scanner)
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {secret}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};
