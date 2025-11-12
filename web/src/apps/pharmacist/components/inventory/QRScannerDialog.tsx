/**
 * QR Scanner Dialog
 * Modal dialog for scanning QR codes using device camera
 * Supports both desktop and mobile devices
 */

import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { useSnackbar } from 'notistack';

interface QRScannerDialogProps {
  open: boolean;
  onClose: () => void;
  onScan: (data: any) => void;
}

export function QRScannerDialog({ open, onClose, onScan }: QRScannerDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (open && !scanning) {
      setScanning(true);
      initScanner();
    }

    return () => {
      cleanupScanner();
    };
  }, [open]);

  const initScanner = () => {
    // Clean up existing scanner
    cleanupScanner();

    // Create new scanner
    scannerRef.current = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
      },
      false
    );

    scannerRef.current.render(onScanSuccess, onScanFailure);
  };

  const cleanupScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (error) {
        // Scanner might already be cleared
        console.warn('Scanner cleanup warning:', error);
      }
      scannerRef.current = null;
    }
  };

  const onScanSuccess = async (decodedText: string, decodedResult: any) => {
    console.log('QR Code detected:', decodedText);

    // Dispatch custom event for test compatibility
    window.dispatchEvent(new CustomEvent('qr-scanned', { detail: decodedText }));

    try {
      const response = await fetch('/api/inventory/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: decodedText }),
      });

      if (response.ok) {
        const data = await response.json();
        enqueueSnackbar('QR Code scanned successfully', { variant: 'success' });

        // Create success indicator for tests
        const successDiv = document.createElement('div');
        successDiv.setAttribute('data-testid', 'scan-success');
        successDiv.textContent = 'Scan successful';
        document.body.appendChild(successDiv);

        onScan(data);
        cleanupScanner();
        setScanning(false);
        onClose();

        // Remove success indicator after a delay
        setTimeout(() => {
          successDiv.remove();
        }, 1000);
      } else {
        enqueueSnackbar('Failed to process QR code', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      enqueueSnackbar('Error processing QR code', { variant: 'error' });
    }
  };

  const onScanFailure = (error: any) => {
    // Don't show errors for normal scanning process
    // Only log to console for debugging
    if (error && !error.includes('NotFoundException')) {
      console.debug('QR scan error:', error);
    }
  };

  const handleClose = () => {
    cleanupScanner();
    setScanning(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Scan QR Code</DialogTitle>
      <DialogContent>
        <Box sx={{ minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div id="qr-reader" style={{ width: '100%' }}></div>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Position the QR code within the frame to scan
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
