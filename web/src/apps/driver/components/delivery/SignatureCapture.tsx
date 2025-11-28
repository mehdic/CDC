/**
 * SignatureCapture Component
 * Captures recipient signature for proof of delivery
 * Touch-based signature drawing on canvas
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Clear as ClearIcon,
  Done as DoneIcon,
} from '@mui/icons-material';
import { SignatureData } from '../../../../shared/types/proofOfDelivery';

interface SignatureCaptureProps {
  onSignatureCapture: (signature: SignatureData) => void;
  onCancel: () => void;
  isRequired?: boolean;
}

export const SignatureCapture: React.FC<SignatureCaptureProps> = ({
  onSignatureCapture,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to match container
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.offsetWidth - 16; // Account for padding
      canvas.height = 250;

      // Set up canvas context
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  // Handle touch/mouse events
  const getCoordinates = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    if (e instanceof TouchEvent) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasSignature(true);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!hasSignature) {
      setError('Please sign the canvas before submitting');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not available');

      // Convert canvas to base64
      const base64 = canvas.toDataURL('image/png').split(',')[1];

      const signatureData: SignatureData = {
        base64,
        timestamp: new Date().toISOString(),
        capturedAt: new Date().toISOString(),
        mimeType: 'image/png',
      };

      onSignatureCapture(signatureData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to capture signature';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Signature Capture
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Please sign in the box below to confirm delivery
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          mb: 2,
          border: '2px solid #ddd',
          borderRadius: 1,
          overflow: 'hidden',
          backgroundColor: '#f5f5f5',
        }}
        onMouseLeave={stopDrawing}
        onTouchEnd={stopDrawing}
      >
        <canvas
          ref={canvasRef}
          data-testid="signature-pad"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            display: 'block',
            width: '100%',
            cursor: 'crosshair',
            touchAction: 'none',
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          startIcon={<ClearIcon />}
          onClick={clearSignature}
          disabled={!hasSignature || isSubmitting}
        >
          Clear
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <DoneIcon />}
            onClick={handleSubmit}
            disabled={!hasSignature || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Confirm Signature'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default SignatureCapture;
