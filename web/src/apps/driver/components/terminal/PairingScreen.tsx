/**
 * Terminal Pairing Screen
 * Allows drivers to pair their mobile payment terminal via Bluetooth
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  Button,
  TextField,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import BluetoothIcon from '@mui/icons-material/Bluetooth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import { TerminalAPI } from '../../services/terminalAPI';

interface PairingScreenProps {
  onSuccess?: (terminal: any) => void;
  onCancel?: () => void;
}

type PairingStep = 'enter-details' | 'pairing' | 'confirmation' | 'success';

export const PairingScreen: React.FC<PairingScreenProps> = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState<PairingStep>('enter-details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [serialNumber, setSerialNumber] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [macAddress, setMacAddress] = useState('');

  // Response data
  const [pairingResponse, setPairingResponse] = useState<any>(null);
  const [terminal, setTerminal] = useState<any>(null);

  const driverId = localStorage.getItem('driver_id') || '';

  /**
   * Step 1: Request pairing
   */
  const handleRequestPairing = async () => {
    if (!serialNumber || !deviceName) {
      setError('Please enter both serial number and device name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await TerminalAPI.pairTerminal({
        driver_id: driverId,
        serial_number: serialNumber,
        device_name: deviceName,
      });

      setPairingResponse(response);
      setSuccess(`Pairing code: ${response.pairing_code}`);
      setStep('pairing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate pairing');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: Confirm pairing with code
   */
  const handleConfirmPairing = async () => {
    if (!pairingCode || !macAddress) {
      setError('Please enter both pairing code and MAC address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await TerminalAPI.confirmPairing(serialNumber, {
        pairing_code: pairingCode,
        mac_address: macAddress,
      });

      setTerminal(response);
      setSuccess('Terminal paired successfully!');
      setStep('success');

      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm pairing');
      setStep('pairing');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset form
   */
  const handleReset = () => {
    setStep('enter-details');
    setSerialNumber('');
    setDeviceName('');
    setPairingCode('');
    setMacAddress('');
    setPairingResponse(null);
    setTerminal(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <BluetoothIcon sx={{ mr: 2, fontSize: 28, color: 'primary.main' }} />
          <Typography variant="h5" component="h1">
            Terminal Pairing
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={['enter-details', 'pairing', 'confirmation', 'success'].indexOf(step)} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Device Details</StepLabel>
          </Step>
          <Step>
            <StepLabel>Enter Pairing Code</StepLabel>
          </Step>
          <Step>
            <StepLabel>Confirm Pairing</StepLabel>
          </Step>
        </Stepper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Step 1: Enter Device Details */}
        {step === 'enter-details' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Terminal Serial Number"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="e.g., H30116000004"
              fullWidth
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BluetoothIcon />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Device Name"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g., My Payment Terminal"
              fullWidth
              disabled={loading}
            />

            <Typography variant="caption" color="textSecondary">
              Enter the serial number and give your terminal a name for easy identification.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button variant="outlined" fullWidth onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={handleRequestPairing}
                disabled={loading || !serialNumber || !deviceName}
                startIcon={loading ? <CircularProgress size={20} /> : undefined}
              >
                {loading ? 'Initiating...' : 'Start Pairing'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 2: Enter Pairing Code */}
        {step === 'pairing' && pairingResponse && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              <strong>On your terminal:</strong> Enter the pairing code shown on this screen, then confirm
              on the device.
            </Alert>

            {/* Display pairing code */}
            <Box
              sx={{
                p: 2,
                bgcolor: 'grey.100',
                borderRadius: 1,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: 'primary.main',
              }}
            >
              <Typography variant="caption" color="textSecondary">
                Pairing Code (expires in 15 minutes)
              </Typography>
              <Typography variant="h3" sx={{ fontFamily: 'monospace', my: 1 }}>
                {pairingResponse.pairing_code}
              </Typography>
            </Box>

            <TextField
              label="Pairing Code from Terminal"
              value={pairingCode}
              onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code"
              fullWidth
              disabled={loading}
              maxLength={6}
              inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '24px' } }}
            />

            <TextField
              label="MAC Address"
              value={macAddress}
              onChange={(e) => setMacAddress(e.target.value.toUpperCase())}
              placeholder="e.g., 00:1A:7D:DA:71:13"
              fullWidth
              disabled={loading}
              helperText="Shown on terminal during pairing"
            />

            <Typography variant="caption" color="textSecondary">
              After entering the pairing code on your terminal, enter the code from the device and its MAC
              address.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setStep('enter-details')}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={handleConfirmPairing}
                disabled={loading || !pairingCode || !macAddress}
                startIcon={loading ? <CircularProgress size={20} /> : undefined}
              >
                {loading ? 'Confirming...' : 'Confirm Pairing'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 3: Success */}
        {step === 'success' && terminal && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mx: 'auto' }} />

            <Typography variant="h6" sx={{ color: 'success.main' }}>
              Terminal Paired Successfully!
            </Typography>

            <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="textSecondary">
                Device Name
              </Typography>
              <Typography variant="body1">{deviceName}</Typography>

              <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
                Serial Number
              </Typography>
              <Typography variant="body1">{terminal.serial_number}</Typography>

              <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
                Status
              </Typography>
              <Typography variant="body1">{terminal.status}</Typography>
            </Card>

            <Typography variant="caption" color="textSecondary">
              Your terminal is now ready to accept card payments. You can now start collecting payments
              from customers.
            </Typography>

            <Button variant="contained" fullWidth onClick={() => onSuccess?.(terminal)} sx={{ mt: 2 }}>
              Continue to Dashboard
            </Button>

            <Button variant="text" fullWidth onClick={handleReset}>
              Pair Another Terminal
            </Button>
          </Box>
        )}
      </Card>
    </Container>
  );
};

export default PairingScreen;
