/**
 * Terminal Payment Screen
 * Collects card payments from customers at delivery location
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  Button,
  Typography,
  Box,
  LinearProgress,
  Alert,
  CircularProgress,
  Grid,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { TerminalAPI } from '../../services/terminalAPI';

interface PaymentScreenProps {
  deliveryId: string;
  codTransactionId: string;
  amount: number;
  terminalSerial: string;
  onSuccess?: (transaction: any) => void;
  onCancel?: () => void;
}

type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed' | 'declined';

export const PaymentScreen: React.FC<PaymentScreenProps> = ({
  deliveryId,
  codTransactionId,
  amount,
  terminalSerial,
  onSuccess,
  onCancel,
}) => {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  /**
   * Initiate card payment
   */
  const handleInitiatePayment = async () => {
    setLoading(true);
    setError(null);
    setStatus('processing');
    setProgress(0);

    try {
      // Step 1: Initiate payment
      const initiateResponse = await TerminalAPI.initiateCardPayment(deliveryId, {
        serial_number: terminalSerial,
        cod_transaction_id: codTransactionId,
        amount,
        location: {
          address: 'Customer Location',
          latitude: 0,
          longitude: 0,
        },
      });

      setProgress(30);

      // Step 2: Process payment on terminal
      const transactionId = initiateResponse.transaction.id;

      const paymentResponse = await TerminalAPI.processPayment(terminalSerial, transactionId, {
        description: `Payment for order #${deliveryId}`,
        skip_screen: false,
      });

      setProgress(80);

      // Check if approved
      if (paymentResponse.transaction.status === 'Approved') {
        setStatus('success');
        setTransaction(paymentResponse.transaction);
        setProgress(100);

        if (onSuccess) {
          setTimeout(() => onSuccess(paymentResponse.transaction), 1500);
        }
      } else if (paymentResponse.transaction.status === 'Declined') {
        setStatus('declined');
        setTransaction(paymentResponse.transaction);
        setError('Payment was declined. Please try another card or payment method.');
      } else {
        setStatus('failed');
        setTransaction(paymentResponse.transaction);
        setError(`Payment processing failed: ${paymentResponse.transaction.status}`);
      }
    } catch (err) {
      setStatus('failed');
      setError(err instanceof Error ? err.message : 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refund transaction
   */
  const handleRefund = async () => {
    if (!transaction) return;

    setLoading(true);
    setError(null);

    try {
      await TerminalAPI.refundTransaction(terminalSerial, transaction.id, 'Customer request');
      setStatus('idle');
      setTransaction(null);
      setProgress(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refund failed');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    idle: 'default',
    processing: 'info',
    success: 'success',
    failed: 'error',
    declined: 'warning',
  };

  const statusMessages = {
    idle: 'Ready to accept payment',
    processing: 'Processing payment...',
    success: 'Payment approved!',
    failed: 'Payment failed',
    declined: 'Payment declined',
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Card sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CreditCardIcon sx={{ mr: 2, fontSize: 28, color: 'primary.main' }} />
          <Typography variant="h5" component="h1">
            Card Payment
          </Typography>
        </Box>

        {/* Amount */}
        <Card variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="caption" color="textSecondary">
            Payment Amount
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              CHF {amount.toFixed(2)}
            </Typography>
          </Box>
        </Card>

        {/* Delivery Info */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary">
                Delivery ID
              </Typography>
              <Typography variant="body2">{deliveryId.substring(0, 8)}...</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary">
                Terminal
              </Typography>
              <Typography variant="body2">{terminalSerial}</Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Status */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Chip
            label={statusMessages[status]}
            color={statusColors[status] as any}
            variant="outlined"
            icon={
              status === 'processing' ? (
                <CircularProgress size={20} />
              ) : status === 'success' ? (
                <CheckCircleIcon />
              ) : status === 'failed' || status === 'declined' ? (
                <ErrorIcon />
              ) : undefined
            }
          />
        </Box>

        {/* Progress */}
        {status === 'processing' && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress variant="determinate" value={progress} sx={{ mb: 1 }} />
            <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'center', display: 'block' }}>
              {progress}% - {progress < 30 ? 'Initializing' : progress < 80 ? 'Processing' : 'Completing'}
            </Typography>
          </Box>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Transaction Details (Success) */}
        {status === 'success' && transaction && (
          <Card variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'success.50' }}>
            <Typography variant="caption" color="textSecondary">
              Card Details
            </Typography>
            <Typography variant="body2">{transaction.card_scheme} •••• {transaction.card_last4}</Typography>

            <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
              Authorization Code
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {transaction.auth_code}
            </Typography>

            <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
              Receipt ID
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {transaction.receipt_id}
            </Typography>
          </Card>
        )}

        {/* Transaction Details (Failed/Declined) */}
        {(status === 'failed' || status === 'declined') && transaction && (
          <Card variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'error.50' }}>
            <Typography variant="body2" sx={{ color: 'error.main' }}>
              Transaction {transaction.status}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {transaction.status === 'Declined'
                ? 'The card was declined. Please try another payment method.'
                : 'There was an issue processing the payment. Please try again.'}
            </Typography>
          </Card>
        )}

        {/* Instructions */}
        {status === 'idle' && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Instructions:</strong> Ask customer to insert or tap their card on the terminal. The payment
            will be processed automatically.
          </Alert>
        )}

        {/* Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          {status === 'idle' && (
            <>
              <Button variant="outlined" fullWidth onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={handleInitiatePayment}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <CreditCardIcon />}
              >
                {loading ? 'Processing...' : 'Start Payment'}
              </Button>
            </>
          )}

          {status === 'processing' && (
            <Button variant="outlined" fullWidth onClick={onCancel} disabled={loading}>
              Cancel Payment
            </Button>
          )}

          {status === 'success' && (
            <>
              <Button variant="outlined" fullWidth onClick={handleRefund} disabled={loading}>
                Refund
              </Button>
              <Button variant="contained" fullWidth onClick={() => onSuccess?.(transaction)} disabled={loading}>
                Confirm & Continue
              </Button>
            </>
          )}

          {(status === 'failed' || status === 'declined') && (
            <>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  setStatus('idle');
                  setTransaction(null);
                  setError(null);
                }}
                disabled={loading}
              >
                Try Again
              </Button>
              <Button variant="text" fullWidth onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
            </>
          )}
        </Box>
      </Card>
    </Container>
  );
};

export default PaymentScreen;
