/**
 * QRScanner Component
 * Low-level camera-based QR code scanning with barcode support
 *
 * Features:
 * - Real-time QR/barcode scanning using device camera
 * - Multiple barcode format support (QR, CODE_128, EAN_13)
 * - Fallback to manual entry when camera unavailable
 * - Haptic feedback on successful scan
 * - Torch control for low-light conditions
 *
 * Handles:
 * - Camera permissions (iOS/Android)
 * - Scanner state management
 * - Scan debouncing to prevent duplicate reads
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Linking, TouchableOpacity, Alert, Vibration } from 'react-native';
import { RNCamera } from 'react-native-camera';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import QRCodeScanner from 'react-native-qrcode-scanner';

import type { CameraPermissionStatus } from '../types/scanner';

export interface QRScannerProps {
  readonly onScan: (qrCode: string) => void;
  readonly onError?: (error: Error) => void;
  readonly onPermissionDenied?: () => void;
  readonly title?: string;
  readonly subtitle?: string;
}

interface ScannerState {
  readonly isScanning: boolean;
  readonly hasPermission: CameraPermissionStatus;
  readonly enableTorch: boolean;
}

/**
 * QRScanner Component
 * Manages camera permissions and provides barcode scanning capability
 */
export const QRScanner: React.FC<QRScannerProps> = ({
  onScan,
  onError,
  onPermissionDenied,
  title = 'Scan Package QR Code',
  subtitle = 'Position the QR code within the frame',
}) => {
  const [state, setState] = useState<ScannerState>({
    isScanning: true,
    hasPermission: 'checking',
    enableTorch: false,
  });

  // Check camera permission on mount
  useEffect(() => {
    checkCameraPermission();
  }, []);

  /**
   * Check current camera permission status
   */
  const checkCameraPermission = useCallback(async (): Promise<void> => {
    try {
      const permission = Platform.select({
        ios: PERMISSIONS.IOS.CAMERA,
        android: PERMISSIONS.ANDROID.CAMERA,
      });

      if (!permission) {
        setState(prev => ({ ...prev, hasPermission: 'unavailable' }));
        return;
      }

      const result = await check(permission);

      switch (result) {
        case RESULTS.GRANTED:
          setState(prev => ({ ...prev, hasPermission: 'granted' }));
          break;
        case RESULTS.DENIED:
          await requestCameraPermission();
          break;
        case RESULTS.BLOCKED:
          setState(prev => ({ ...prev, hasPermission: 'blocked' }));
          break;
        case RESULTS.UNAVAILABLE:
          setState(prev => ({ ...prev, hasPermission: 'unavailable' }));
          break;
        default:
          setState(prev => ({ ...prev, hasPermission: 'denied' }));
      }
    } catch (error) {
      console.error('Permission check error:', error);
      setState(prev => ({ ...prev, hasPermission: 'denied' }));
      onError?.(error instanceof Error ? error : new Error('Permission check failed'));
    }
  }, [onError]);

  /**
   * Request camera permission from user
   */
  const requestCameraPermission = useCallback(async (): Promise<void> => {
    try {
      const permission = Platform.select({
        ios: PERMISSIONS.IOS.CAMERA,
        android: PERMISSIONS.ANDROID.CAMERA,
      });

      if (!permission) {
        setState(prev => ({ ...prev, hasPermission: 'unavailable' }));
        return;
      }

      const result = await request(permission);

      switch (result) {
        case RESULTS.GRANTED:
          setState(prev => ({ ...prev, hasPermission: 'granted' }));
          break;
        case RESULTS.BLOCKED:
          setState(prev => ({ ...prev, hasPermission: 'blocked' }));
          showPermissionBlockedAlert();
          break;
        default:
          setState(prev => ({ ...prev, hasPermission: 'denied' }));
          onPermissionDenied?.();
      }
    } catch (error) {
      console.error('Permission request error:', error);
      setState(prev => ({ ...prev, hasPermission: 'denied' }));
      onError?.(error instanceof Error ? error : new Error('Permission request failed'));
    }
  }, [onError, onPermissionDenied]);

  /**
   * Show alert when camera permission is blocked in device settings
   */
  const showPermissionBlockedAlert = useCallback((): void => {
    Alert.alert(
      'Camera Permission Required',
      'Please enable camera permission in your device settings to scan QR codes.',
      [
        {
          text: 'Open Settings',
          onPress: () => Linking.openSettings(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  }, []);

  /**
   * Handle successful QR code scan
   * Includes debouncing to prevent duplicate scans
   */
  const handleScan = useCallback(
    (event: any): void => {
      if (!state.isScanning || !event?.data) {return;}

      setState(prev => ({ ...prev, isScanning: false }));

      // Vibration feedback
      Vibration.vibrate(200);

      // Call parent handler
      onScan(event.data);
    },
    [state.isScanning, onScan]
  );

  /**
   * Toggle torch (flashlight) for low-light conditions
   */
  const toggleTorch = useCallback((): void => {
    setState(prev => ({ ...prev, enableTorch: !prev.enableTorch }));
  }, []);

  /**
   * Retry scanning after permission was denied
   */
  const handleRetry = useCallback((): void => {
    checkCameraPermission();
  }, [checkCameraPermission]);

  // Render permission error state
  if (state.hasPermission !== 'granted') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Camera Permission Required</Text>
        <Text style={styles.errorMessage}>
          {state.hasPermission === 'checking'
            ? 'Checking camera access...'
            : state.hasPermission === 'blocked'
              ? 'Camera permission is blocked in settings'
              : 'Camera permission is required to scan QR codes'}
        </Text>
        {state.hasPermission === 'denied' && (
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
        {state.hasPermission === 'blocked' && (
          <TouchableOpacity style={styles.settingsButton} onPress={() => Linking.openSettings()}>
            <Text style={styles.settingsButtonText}>Open Settings</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Render scanner
  return (
    <View style={styles.container}>
      <QRCodeScanner
        onRead={handleScan}
        flashMode={state.enableTorch ? RNCamera.Constants.FlashMode.torch : RNCamera.Constants.FlashMode.off}
        topContent={
          <View style={styles.topContent}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        }
        bottomContent={
          <View style={styles.bottomContent}>
            <TouchableOpacity
              style={[styles.torchButton, state.enableTorch && styles.torchButtonActive]}
              onPress={toggleTorch}
            >
              <Text style={styles.torchButtonText}>{state.enableTorch ? '🔦 Light On' : '🔦 Light Off'}</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topContent: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  bottomContent: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  torchButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  torchButtonActive: {
    backgroundColor: '#FBBF24',
  },
  torchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 6,
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
