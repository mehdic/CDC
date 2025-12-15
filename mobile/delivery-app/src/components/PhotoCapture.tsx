/**
 * Photo Capture Component
 * Camera-based photo capture with permission handling
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

import type { CameraPermissionStatus } from '../types/scanner';

export interface PhotoCaptureProps {
  onCapture: (photoUri: string) => void;
  label: string;
  required?: boolean;
  capturedUri?: string;
}

interface CameraState {
  hasPermission: CameraPermissionStatus;
  isCapturing: boolean;
  showCamera: boolean;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  onCapture,
  label,
  required = false,
  capturedUri,
}) => {
  const cameraRef = useRef<RNCamera>(null);
  const [state, setState] = useState<CameraState>({
    hasPermission: 'checking',
    isCapturing: false,
    showCamera: false,
  });

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = useCallback(async () => {
    try {
      const permission = Platform.select({
        ios: PERMISSIONS.IOS.CAMERA,
        android: PERMISSIONS.ANDROID.CAMERA,
      });

      if (!permission) {
        setState((prev) => ({ ...prev, hasPermission: 'unavailable' }));
        return;
      }

      const result = await check(permission);

      switch (result) {
        case RESULTS.GRANTED:
          setState((prev) => ({ ...prev, hasPermission: 'granted' }));
          break;
        case RESULTS.DENIED:
          const requestResult = await request(permission);
          setState((prev) => ({
            ...prev,
            hasPermission: requestResult === RESULTS.GRANTED ? 'granted' : 'denied',
          }));
          break;
        case RESULTS.BLOCKED:
        case RESULTS.LIMITED:
          setState((prev) => ({ ...prev, hasPermission: 'denied' }));
          break;
        case RESULTS.UNAVAILABLE:
          setState((prev) => ({ ...prev, hasPermission: 'unavailable' }));
          break;
      }
    } catch (error) {
      console.error('Camera permission check failed:', error);
      setState((prev) => ({ ...prev, hasPermission: 'denied' }));
    }
  }, []);

  const handleOpenCamera = () => {
    if (state.hasPermission === 'granted') {
      setState((prev) => ({ ...prev, showCamera: true }));
    } else if (state.hasPermission === 'denied') {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access in your device settings to take photos.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current) {return;}

    setState((prev) => ({ ...prev, isCapturing: true }));

    try {
      const options = {
        quality: 0.8,
        base64: false,
        pauseAfterCapture: true,
      };

      const data = await cameraRef.current.takePictureAsync(options);

      if (data.uri) {
        onCapture(data.uri);
        setState((prev) => ({ ...prev, showCamera: false, isCapturing: false }));
      }
    } catch (error) {
      console.error('Photo capture failed:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
      setState((prev) => ({ ...prev, isCapturing: false }));
    }
  };

  const handleCloseCamera = () => {
    setState((prev) => ({ ...prev, showCamera: false }));
  };

  const handleRetake = () => {
    setState((prev) => ({ ...prev, showCamera: true }));
  };

  if (state.hasPermission === 'checking') {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Checking camera permission...</Text>
        </View>
      </View>
    );
  }

  if (state.hasPermission === 'unavailable') {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Camera not available on this device</Text>
        </View>
      </View>
    );
  }

  if (state.showCamera) {
    return (
      <View style={styles.cameraFullContainer}>
        <View style={styles.cameraHeader}>
          <Text style={styles.cameraTitle}>{label}</Text>
          <TouchableOpacity
            onPress={handleCloseCamera}
            style={styles.closeButton}
            testID="camera-close-button"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <RNCamera
          ref={cameraRef}
          style={styles.camera}
          type={RNCamera.Constants.Type.back}
          flashMode={RNCamera.Constants.FlashMode.auto}
          captureAudio={false}
          androidCameraPermissionOptions={{
            title: 'Camera Permission',
            message: 'We need camera access to take delivery photos',
            buttonPositive: 'OK',
            buttonNegative: 'Cancel',
          }}
          testID="camera"
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraControls}>
              <TouchableOpacity
                onPress={handleTakePhoto}
                style={[styles.captureButton, state.isCapturing && styles.captureButtonDisabled]}
                disabled={state.isCapturing}
                testID="camera-capture-button"
              >
                {state.isCapturing ? (
                  <ActivityIndicator size="large" color="#FFF" />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </RNCamera>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>

      {capturedUri ? (
        <View>
          <Image source={{ uri: capturedUri }} style={styles.preview} testID="photo-preview" />
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={handleRetake}
            testID="photo-retake-button"
          >
            <Text style={styles.retakeButtonText}>Retake Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={handleOpenCamera}
          testID="photo-open-camera-button"
        >
          <Text style={styles.cameraButtonText}>📷 Take Photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  required: {
    color: '#DC3545',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6C757D',
  },
  errorContainer: {
    padding: 40,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#856404',
  },
  cameraButton: {
    backgroundColor: '#007AFF',
    padding: 40,
    borderRadius: 8,
    alignItems: 'center',
  },
  cameraButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  retakeButton: {
    backgroundColor: '#6C757D',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cameraFullContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: '#000',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 28,
    color: '#FFF',
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  cameraControls: {
    height: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: '#007AFF',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#007AFF',
  },
});

export default PhotoCapture;
