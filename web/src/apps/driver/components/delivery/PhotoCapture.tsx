/**
 * PhotoCapture Component
 * Captures photo proof of delivery with location embedding
 * Supports camera input and file upload
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardMedia,
} from '@mui/material';
import {
  PhotoCamera as CameraIcon,
  Delete as DeleteIcon,
  Done as DoneIcon,
} from '@mui/icons-material';
import { PhotoData } from '../../../../shared/types/proofOfDelivery';

interface PhotoCaptureProps {
  onPhotoCapture: (photo: PhotoData) => void;
  onCancel: () => void;
  isRequired?: boolean;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  onPhotoCapture,
  onCancel,
  isRequired = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Get location on component mount
  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = () => {
    setLoadingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          setLoadingLocation(false);
        },
        (err) => {
          console.warn('Location access denied:', err);
          setLoadingLocation(false);
          // Continue without location if denied
        }
      );
    }
  };

  const startCamera = async () => {
    try {
      setError(null);
      const constraints = {
        video: {
          facingMode: 'environment', // Back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access camera';
      setError(message);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const photoData = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(photoData);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCapturedPhoto(result);
        setError(null);
      }
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!capturedPhoto) {
      setError('Please capture or upload a photo');
      return;
    }

    if (loadingLocation) {
      setError('Still determining location, please wait...');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Convert data URL to base64
      const base64 = capturedPhoto.split(',')[1] || capturedPhoto;

      const photoData: PhotoData = {
        base64,
        timestamp: new Date().toISOString(),
        capturedAt: new Date().toISOString(),
        mimeType: 'image/jpeg',
        location: location || undefined,
      };

      onPhotoCapture(photoData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process photo';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPhoto = () => {
    setCapturedPhoto(null);
    setError(null);
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Photo Proof of Delivery
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {isRequired ? 'Photo is required' : 'Photo is optional'} for this delivery
        {loadingLocation && ' (determining location...)'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {capturedPhoto ? (
        <Box sx={{ mb: 2 }}>
          <Card>
            <CardMedia
              component="img"
              image={capturedPhoto}
              alt="Captured proof of delivery"
              data-testid="captured-photo"
              sx={{ maxHeight: 300, objectFit: 'contain' }}
            />
          </Card>

          {location && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Location captured: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              (±{location.accuracy.toFixed(0)}m)
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<DeleteIcon />}
              onClick={resetPhoto}
              disabled={isSubmitting}
            >
              Delete & Retake
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
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Photo'}
              </Button>
            </Box>
          </Box>
        </Box>
      ) : cameraActive ? (
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              mb: 2,
              border: '2px solid #ddd',
              borderRadius: 1,
              overflow: 'hidden',
              backgroundColor: '#000',
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={stopCamera}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              color="primary"
              startIcon={<CameraIcon />}
              onClick={capturePhoto}
              disabled={isSubmitting}
            >
              Capture Photo
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ mb: 2 }}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            startIcon={<CameraIcon />}
            onClick={startCamera}
            disabled={loadingLocation}
            sx={{ mb: 2 }}
            data-testid="start-camera-button"
          >
            {loadingLocation ? 'Getting location...' : 'Open Camera'}
          </Button>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Or upload an existing photo:
          </Typography>
          <Button
            fullWidth
            variant="outlined"
            component="label"
            disabled={loadingLocation || isSubmitting}
          >
            Upload Photo
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileUpload}
            />
          </Button>
        </Box>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Paper>
  );
};

export default PhotoCapture;
