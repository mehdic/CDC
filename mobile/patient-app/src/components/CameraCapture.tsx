/**
 * Camera Capture Component
 * Allows users to capture prescription images using device camera
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

interface CameraCaptureProps {
  onCapture: (imageUri: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<RNCamera>(null);

  /**
   * Request camera permission
   */
  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      const permission = Platform.select({
        ios: PERMISSIONS.IOS.CAMERA,
        android: PERMISSIONS.ANDROID.CAMERA,
      });

      if (!permission) {
        return false;
      }

      const result = await request(permission);

      if (result === RESULTS.GRANTED) {
        return true;
      }

      if (result === RESULTS.DENIED || result === RESULTS.BLOCKED) {
        Alert.alert(
          'Permission requise',
          'L\'accès à la caméra est nécessaire pour prendre des photos de vos ordonnances.',
          [{ text: 'OK' }]
        );
        return false;
      }

      return false;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  };

  /**
   * Handle camera ready state
   */
  const handleCameraReady = () => {
    setIsCameraReady(true);
  };

  /**
   * Capture photo from camera
   */
  const handleCapture = async () => {
    if (!cameraRef.current || !isCameraReady || isCapturing) {
      return;
    }

    try {
      setIsCapturing(true);

      const options = {
        quality: 0.8,
        base64: false,
        orientation: 'portrait',
        fixOrientation: true,
      };

      const data = await cameraRef.current.takePictureAsync(options);

      if (data.uri) {
        onCapture(data.uri);
      } else {
        Alert.alert(
          'Erreur',
          'Impossible de capturer la photo. Veuillez réessayer.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de la capture de la photo.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <View style={styles.container}>
      <RNCamera
        ref={cameraRef}
        style={styles.camera}
        type={RNCamera.Constants.Type.back}
        flashMode={RNCamera.Constants.FlashMode.auto}
        androidCameraPermissionOptions={{
          title: 'Permission d\'utiliser la caméra',
          message: 'Nous avons besoin de votre permission pour utiliser la caméra',
          buttonPositive: 'OK',
          buttonNegative: 'Annuler',
        }}
        onCameraReady={handleCameraReady}
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Photographier l'ordonnance</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Guide frame */}
          <View style={styles.guideContainer}>
            <View style={styles.guide}>
              <View style={styles.guideCornerTopLeft} />
              <View style={styles.guideCornerTopRight} />
              <View style={styles.guideCornerBottomLeft} />
              <View style={styles.guideCornerBottomRight} />
            </View>
            <Text style={styles.guideText}>
              Placez l'ordonnance dans le cadre
            </Text>
          </View>

          {/* Capture button */}
          <View style={styles.footer}>
            <View style={styles.placeholder} />
            <TouchableOpacity
              style={[
                styles.captureButton,
                (!isCameraReady || isCapturing) && styles.captureButtonDisabled,
              ]}
              onPress={handleCapture}
              disabled={!isCameraReady || isCapturing}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <View style={styles.placeholder} />
          </View>
        </View>
      </RNCamera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '300',
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  guideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guide: {
    width: 300,
    height: 400,
    position: 'relative',
  },
  guideCornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FFF',
  },
  guideCornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FFF',
  },
  guideCornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FFF',
  },
  guideCornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FFF',
  },
  guideText: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
  },
});

export default CameraCapture;
