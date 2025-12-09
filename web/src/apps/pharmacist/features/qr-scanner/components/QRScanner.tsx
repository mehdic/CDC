/**
 * QR Scanner Component
 * Real camera-based QR code scanning for prescription verification
 * Task: T8-008 - Pharmacist QR Scanner
 */

import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import '../styles/QRScanner.css';

export interface ScanResult {
  prescriptionId: string;
  patientId: string;
  checksum: string;
  timestamp: number;
}

export interface QRScannerProps {
  onScanSuccess: (result: ScanResult) => void;
  onScanError: (error: Error) => void;
  isActive?: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  onScanError,
  isActive = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(isActive);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const animationFrameId = useRef<number | null>(null);
  const lastScannedRef = useRef<string | null>(null);
  const scanCooldownRef = useRef<number>(0);

  // Request camera access
  useEffect(() => {
    const requestCameraAccess = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Prefer rear camera on mobile
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraPermission('granted');
          setError(null);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to access camera';
        setCameraPermission('denied');
        setError(errorMsg);
        onScanError(new Error(`Camera access denied: ${errorMsg}`));
      }
    };

    if (isActive) {
      requestCameraAccess();
    }

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isActive, onScanError]);

  // QR scanning loop
  useEffect(() => {
    if (!isScanning || cameraPermission !== 'granted' || !videoRef.current || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    const scanFrame = () => {
      if (!video.readyState === video.HAVE_ENOUGH_DATA) {
        animationFrameId.current = requestAnimationFrame(scanFrame);
        return;
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data and scan for QR code
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      // Handle cooldown to prevent duplicate scans
      const now = Date.now();
      if (now < scanCooldownRef.current) {
        animationFrameId.current = requestAnimationFrame(scanFrame);
        return;
      }

      if (code) {
        try {
          // Parse QR code data
          const qrData = JSON.parse(code.data);

          // Validate QR code format
          if (!qrData.prescriptionId || !qrData.patientId || !qrData.checksum) {
            throw new Error('Invalid QR code format');
          }

          // Verify checksum
          if (!verifyChecksum(qrData)) {
            throw new Error('QR code checksum validation failed');
          }

          // Prevent duplicate scans within 2 seconds
          if (lastScannedRef.current === code.data) {
            animationFrameId.current = requestAnimationFrame(scanFrame);
            return;
          }

          // Success!
          lastScannedRef.current = code.data;
          scanCooldownRef.current = now + 2000; // 2-second cooldown
          setFeedbackState('success');

          const result: ScanResult = {
            prescriptionId: qrData.prescriptionId,
            patientId: qrData.patientId,
            checksum: qrData.checksum,
            timestamp: now,
          };

          onScanSuccess(result);

          // Reset feedback state after 1 second
          setTimeout(() => {
            setFeedbackState('idle');
          }, 1000);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'QR code parsing failed';
          setFeedbackState('error');
          setError(errorMsg);

          // Reset feedback state after 2 seconds
          setTimeout(() => {
            setFeedbackState('idle');
            setError(null);
          }, 2000);
        }
      } else {
        setFeedbackState('scanning');
      }

      animationFrameId.current = requestAnimationFrame(scanFrame);
    };

    animationFrameId.current = requestAnimationFrame(scanFrame);

    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isScanning, cameraPermission, onScanSuccess, onScanError]);

  const handleToggleScanning = () => {
    setIsScanning(!isScanning);
  };

  const handleReset = () => {
    lastScannedRef.current = null;
    scanCooldownRef.current = 0;
    setError(null);
    setFeedbackState('idle');
  };

  return (
    <div className="qr-scanner-container">
      <div className={`qr-scanner-wrapper ${feedbackState}`}>
        {cameraPermission === 'granted' && (
          <>
            <video
              ref={videoRef}
              className="qr-scanner-video"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Scan frame overlay */}
            <div className="qr-scanner-frame">
              <div className="qr-scanner-corner qr-scanner-corner-tl" />
              <div className="qr-scanner-corner qr-scanner-corner-tr" />
              <div className="qr-scanner-corner qr-scanner-corner-bl" />
              <div className="qr-scanner-corner qr-scanner-corner-br" />
            </div>

            {/* Feedback overlay */}
            <div className={`qr-scanner-feedback ${feedbackState}`}>
              {feedbackState === 'scanning' && (
                <div className="qr-scanner-feedback-content">
                  <div className="qr-scanner-spinner" />
                  <p>Position QR code in frame</p>
                </div>
              )}
              {feedbackState === 'success' && (
                <div className="qr-scanner-feedback-content success">
                  <div className="qr-scanner-checkmark">✓</div>
                  <p>QR Code Scanned Successfully</p>
                </div>
              )}
              {feedbackState === 'error' && (
                <div className="qr-scanner-feedback-content error">
                  <div className="qr-scanner-error-icon">!</div>
                  <p>{error || 'Scan failed'}</p>
                </div>
              )}
            </div>
          </>
        )}

        {cameraPermission === 'denied' && (
          <div className="qr-scanner-error">
            <div className="qr-scanner-error-icon">!</div>
            <h3>Camera Access Denied</h3>
            <p>{error}</p>
            <p className="qr-scanner-hint">Please enable camera access in your browser settings</p>
          </div>
        )}

        {cameraPermission === 'pending' && (
          <div className="qr-scanner-loading">
            <div className="qr-scanner-spinner" />
            <p>Requesting camera access...</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="qr-scanner-controls">
        <button
          onClick={handleToggleScanning}
          className={`qr-scanner-button ${isScanning ? 'active' : ''}`}
          disabled={cameraPermission !== 'granted'}
        >
          {isScanning ? 'Stop Scanning' : 'Start Scanning'}
        </button>
        <button
          onClick={handleReset}
          className="qr-scanner-button"
          disabled={cameraPermission !== 'granted'}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

/**
 * Verify QR code checksum
 * Simple hash-based validation
 */
function verifyChecksum(qrData: any): boolean {
  if (!qrData.checksum) {
    return false;
  }

  const dataToHash = `${qrData.prescriptionId}:${qrData.patientId}`;
  const calculatedChecksum = simpleHash(dataToHash);

  return calculatedChecksum === qrData.checksum;
}

/**
 * Simple hash function for checksum calculation
 */
function simpleHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

export default QRScanner;
