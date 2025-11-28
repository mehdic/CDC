/**
 * DeliveryCompletionFlow Component
 * Complete flow for marking delivery as complete with proof
 * - Capture recipient name
 * - Capture signature or photo (or both)
 * - Record delivery completion
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Alert,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
} from '@mui/material';
import { Delivery } from '../../../../shared/hooks/useDelivery';
import { SignatureCapture } from './SignatureCapture';
import { PhotoCapture } from './PhotoCapture';
import { SignatureData, PhotoData, DeliveryCompletionPayload } from '../../../../shared/types/proofOfDelivery';

interface DeliveryCompletionFlowProps {
  open: boolean;
  delivery: Delivery | null;
  onComplete: (payload: DeliveryCompletionPayload) => Promise<boolean>;
  onCancel: () => void;
}

type CompletionStep = 'recipient' | 'proof-type' | 'signature' | 'photo' | 'notes' | 'review';

interface CompletionState {
  recipientName: string;
  proofType: 'signature' | 'photo' | 'both';
  signature?: SignatureData;
  photo?: PhotoData;
  notes: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export const DeliveryCompletionFlow: React.FC<DeliveryCompletionFlowProps> = ({
  open,
  delivery,
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<CompletionStep>('recipient');
  const [stepOrder, setStepOrder] = useState<CompletionStep[]>(['recipient', 'proof-type']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [state, setState] = useState<CompletionState>({
    recipientName: '',
    proofType: 'signature',
    notes: '',
    location: {
      latitude: 0,
      longitude: 0,
      accuracy: 0,
    },
  });

  // Get location on dialog open
  React.useEffect(() => {
    if (open && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setLocation(loc);
          setState((prev) => ({ ...prev, location: loc }));
        },
        (err) => {
          console.warn('Location access denied:', err);
        }
      );
    }
  }, [open]);

  if (!delivery) return null;

  // Determine if controlled substance (requires signature)
  const isControlledSubstance = delivery.tracking_info?.controlled_substance === true;

  const handleRecipientSubmit = () => {
    if (!state.recipientName.trim()) {
      setError('Please enter recipient name');
      return;
    }
    setError(null);
    setCurrentStep('proof-type');
  };

  const handleProofTypeSubmit = () => {
    const newSteps: CompletionStep[] = ['recipient', 'proof-type'];

    if (state.proofType === 'signature') {
      newSteps.push('signature');
    } else if (state.proofType === 'photo') {
      newSteps.push('photo');
    } else if (state.proofType === 'both') {
      newSteps.push('signature', 'photo');
    }

    newSteps.push('notes', 'review');
    setStepOrder(newSteps);
    setError(null);

    // Move to next step
    if (state.proofType === 'signature') {
      setCurrentStep('signature');
    } else if (state.proofType === 'photo') {
      setCurrentStep('photo');
    }
  };

  const handleSignatureCapture = (signature: SignatureData) => {
    setState((prev) => ({ ...prev, signature }));
    setError(null);

    // Move to next step
    if (state.proofType === 'both') {
      setCurrentStep('photo');
    } else {
      setCurrentStep('notes');
    }
  };

  const handlePhotoCapture = (photo: PhotoData) => {
    setState((prev) => ({ ...prev, photo }));
    setError(null);

    // Move to next step
    if (state.proofType === 'both' && !state.signature) {
      setCurrentStep('signature');
    } else {
      setCurrentStep('notes');
    }
  };

  const handleNotesSubmit = () => {
    setError(null);
    setCurrentStep('review');
  };

  const handleSubmit = async () => {
    // Validate proof captured
    if (!state.signature && !state.photo) {
      setError('Please capture proof (signature or photo)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: DeliveryCompletionPayload = {
        deliveryId: delivery.id,
        recipientName: state.recipientName,
        signature: state.signature,
        photo: state.photo,
        notes: state.notes || undefined,
        location: state.location,
      };

      const success = await onComplete(payload);
      if (success) {
        onCancel();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete delivery';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStepIndex = stepOrder.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / stepOrder.length) * 100;

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Complete Delivery</Typography>
          <Typography variant="caption" color="text.secondary">
            {currentStepIndex + 1} of {stepOrder.length}
          </Typography>
        </Box>
      </DialogTitle>

      <Box sx={{ width: '100%', height: 4, backgroundColor: '#eee' }}>
        <Box sx={{ width: `${progress}%`, height: '100%', backgroundColor: '#1976d2' }} />
      </Box>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Recipient Name Step */}
        {currentStep === 'recipient' && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Who is receiving the delivery?
            </Typography>
            <TextField
              fullWidth
              label="Recipient Name"
              value={state.recipientName}
              onChange={(e) => setState({ ...state, recipientName: e.target.value })}
              placeholder="Enter full name"
              autoFocus
              data-testid="recipient-name-input"
            />
          </Box>
        )}

        {/* Proof Type Step */}
        {currentStep === 'proof-type' && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              How would you like to capture proof?
            </Typography>
            {isControlledSubstance && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Signature is required for controlled substances
              </Alert>
            )}
            <FormControl fullWidth>
              <RadioGroup
                value={state.proofType}
                onChange={(e) => setState({ ...state, proofType: e.target.value as 'signature' | 'photo' | 'both' })}
              >
                <FormControlLabel
                  value="signature"
                  control={<Radio />}
                  label="Signature only"
                />
                <FormControlLabel
                  value="photo"
                  control={<Radio />}
                  label="Photo only"
                />
                <FormControlLabel
                  value="both"
                  control={<Radio />}
                  label="Both signature and photo"
                />
              </RadioGroup>
            </FormControl>
          </Box>
        )}

        {/* Signature Step */}
        {currentStep === 'signature' && (
          <SignatureCapture
            onSignatureCapture={handleSignatureCapture}
            onCancel={() => {
              setCurrentStep('proof-type');
              setState((prev) => ({ ...prev, signature: undefined }));
            }}
            isRequired={isControlledSubstance}
          />
        )}

        {/* Photo Step */}
        {currentStep === 'photo' && (
          <PhotoCapture
            onPhotoCapture={handlePhotoCapture}
            onCancel={() => {
              if (state.proofType === 'both' && state.signature) {
                setCurrentStep('signature');
              } else {
                setCurrentStep('proof-type');
              }
              setState((prev) => ({ ...prev, photo: undefined }));
            }}
            isRequired={state.proofType === 'photo' || state.proofType === 'both'}
          />
        )}

        {/* Notes Step */}
        {currentStep === 'notes' && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Additional Notes (Optional)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Notes"
              value={state.notes}
              onChange={(e) => setState({ ...state, notes: e.target.value })}
              placeholder="Any additional information about the delivery..."
              data-testid="notes-input"
            />
          </Box>
        )}

        {/* Review Step */}
        {currentStep === 'review' && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Delivery Summary
            </Typography>

            <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 2 }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Recipient
                </Typography>
                <Typography variant="body1">{state.recipientName}</Typography>
              </Box>

              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Proof Type
                </Typography>
                <Typography variant="body1">
                  {state.proofType === 'both'
                    ? 'Signature & Photo'
                    : state.proofType.charAt(0).toUpperCase() + state.proofType.slice(1)}
                </Typography>
              </Box>

              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Proof Captured
                </Typography>
                <Typography variant="body1">
                  {state.signature ? '✓ Signature ' : ''}
                  {state.photo ? '✓ Photo' : ''}
                </Typography>
              </Box>

              {state.notes && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Notes
                  </Typography>
                  <Typography variant="body2">{state.notes}</Typography>
                </Box>
              )}
            </Box>

            {location && (
              <Alert severity="info">
                Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>

        {currentStep !== 'review' && (
          <Button
            variant="outlined"
            onClick={() => {
              if (currentStep === 'proof-type') {
                setCurrentStep('recipient');
              } else if (currentStep === 'signature') {
                setCurrentStep('proof-type');
              } else if (currentStep === 'photo') {
                if (state.proofType === 'both' && !state.signature) {
                  setCurrentStep('proof-type');
                } else {
                  setCurrentStep(state.proofType === 'both' ? 'signature' : 'proof-type');
                }
              } else if (currentStep === 'notes') {
                setCurrentStep(
                  state.proofType === 'both' ? 'photo' : state.proofType === 'photo' ? 'photo' : 'signature'
                );
              }
            }}
            disabled={isSubmitting}
          >
            Back
          </Button>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={
            currentStep === 'recipient'
              ? handleRecipientSubmit
              : currentStep === 'proof-type'
              ? handleProofTypeSubmit
              : currentStep === 'notes'
              ? handleNotesSubmit
              : handleSubmit
          }
          disabled={isSubmitting}
          startIcon={isSubmitting && currentStep === 'review' ? <CircularProgress size={20} /> : null}
        >
          {currentStep === 'review' ? (isSubmitting ? 'Completing...' : 'Confirm & Complete') : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeliveryCompletionFlow;
