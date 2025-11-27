/**
 * QR Scanner Dialog
 * Modal dialog for scanning QR codes using device camera
 * Supports both desktop and mobile devices
 * Uses service-based architecture for camera management
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  TextField,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { QRScannerService } from '../../../../shared/services/qrScannerService';
import { Html5QrcodeCameraProvider } from '../../../../shared/services/Html5QrcodeProvider';
import { InventoryScannerService } from '../../../../shared/services/inventoryScannerService';
import { getUserData } from '../../../../shared/services/authService';

interface QRScannerDialogProps {
  open: boolean;
  onClose: () => void;
  onScan: (data: Record<string, unknown>) => void;
}

export function QRScannerDialog({ open, onClose, onScan }: QRScannerDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const scannerRef = useRef<QRScannerService | null>(null);
  const inventoryScannerRef = useRef<InventoryScannerService | null>(null);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    if (open && !scanning) {
      void initScanner();
    }

    return () => {
      void cleanupScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, scanning]);

  const initScanner = async () => {
    try {
      // Check camera availability
      const cameraProvider = new Html5QrcodeCameraProvider();
      const available = await cameraProvider.isAvailable();

      if (!available) {
        setCameraAvailable(false);
        setManualEntry(true);
        return;
      }

      setCameraAvailable(true);

      // Initialize QR scanner service
      const scanner = new QRScannerService(cameraProvider);
      await scanner.initialize('qr-reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorch: true,
        showZoom: true,
      });

      // Set up inventory scanner
      const userData = getUserData();
      const inventoryScanner = new InventoryScannerService();
      if (userData?.pharmacyId) {
        inventoryScanner.setAuth(userData.pharmacyId);
      }
      inventoryScannerRef.current = inventoryScanner;

      // Start scanning
      await scanner.startScanning(
        async (result) => {
          await handleScanSuccess(result);
        },
        (error) => {
          console.debug('Scan error:', error);
        }
      );

      scannerRef.current = scanner;
      setScanning(true);
    } catch (error) {
      console.error('Error initializing scanner:', error);
      enqueueSnackbar('Failed to initialize camera', { variant: 'error' });
      setCameraAvailable(false);
      setManualEntry(true);
    }
  };

  const cleanupScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.cleanup();
      } catch (error) {
        console.warn('Scanner cleanup warning:', error);
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleScanSuccess = async (result: Record<string, unknown>) => {
    setProcessing(true);

    try {
      if (!inventoryScannerRef.current) {
        throw new Error('Inventory scanner not initialized');
      }

      // Validate QR code
      const validation = inventoryScannerRef.current.validateQRCode(result.code);
      if (!validation.valid) {
        enqueueSnackbar(validation.error || 'Invalid QR code', { variant: 'error' });
        setProcessing(false);
        return;
      }

      // Process the scan
      const scanResponse = await inventoryScannerRef.current.processScan(result);

      if (scanResponse.success) {
        enqueueSnackbar('QR Code scanned successfully', { variant: 'success' });

        // Create success indicator for tests
        const successDiv = document.createElement('div');
        successDiv.setAttribute('data-testid', 'scan-success');
        successDiv.textContent = 'Scan successful';
        document.body.appendChild(successDiv);

        onScan(scanResponse.data);
        await cleanupScanner();
        handleClose();

        // Remove success indicator after a delay
        setTimeout(() => {
          successDiv.remove();
        }, 1000);
      } else {
        enqueueSnackbar(scanResponse.error || 'Failed to process QR code', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      enqueueSnackbar('Error processing QR code', { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleManualEntry = async () => {
    if (!manualCode.trim()) {
      enqueueSnackbar('Please enter a code', { variant: 'warning' });
      return;
    }

    // Trigger scan as if it were from camera
    await handleScanSuccess({
      code: manualCode,
      format: 'MANUAL_ENTRY',
      timestamp: Date.now(),
    });
    setManualCode('');
  };

  const handleClose = () => {
    cleanupScanner();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {manualEntry ? 'Enter Code' : 'Scan QR Code'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {!cameraAvailable && (
            <Alert severity="warning" sx={{ width: '100%', mb: 2 }}>
              Camera not available. Please enter the code manually.
            </Alert>
          )}

          {!manualEntry && cameraAvailable && (
            <>
              <div id="qr-reader" style={{ width: '100%' }}></div>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                Position the QR code within the frame to scan
              </Typography>
              <Button
                onClick={() => setManualEntry(true)}
                variant="text"
                size="small"
                sx={{ mt: 2 }}
              >
                Enter Code Manually
              </Button>
            </>
          )}

          {manualEntry && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter the barcode, QR code, or product code:
              </Typography>
              <TextField
                fullWidth
                label="Code"
                placeholder="Enter code and press Enter or click Submit"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualEntry();
                  }
                }}
                disabled={processing}
                autoFocus
              />
            </Box>
          )}

          {processing && (
            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={24} />
              <Typography>Processing...</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        {manualEntry && (
          <Button onClick={() => setManualEntry(false)} disabled={processing}>
            Back to Camera
          </Button>
        )}
        {manualEntry && (
          <Button
            onClick={handleManualEntry}
            variant="contained"
            disabled={processing || !manualCode.trim()}
          >
            Submit
          </Button>
        )}
        <Button onClick={handleClose} disabled={processing}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
