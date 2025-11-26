/**
 * Barcode Scanner Screen
 * Allows nurses to scan medication barcodes for verification
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

interface BarcodeScannerScreenProps {
  navigation: any;
  route: {
    params: {
      patientId: string;
      onScan: (barcode: string) => void;
    };
  };
}

export const BarcodeScannerScreen: React.FC<BarcodeScannerScreenProps> = ({
  navigation,
  route,
}) => {
  const { onScan } = route.params;
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    requestCameraPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestCameraPermission = async () => {
    try {
      const permission =
        Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;

      const result = await check(permission);

      if (result === RESULTS.GRANTED) {
        setHasPermission(true);
      } else if (result === RESULTS.DENIED) {
        const requestResult = await request(permission);
        setHasPermission(requestResult === RESULTS.GRANTED);
      } else if (result === RESULTS.BLOCKED) {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in your device settings to scan barcodes.',
          [
            { text: 'Cancel', onPress: () => navigation.goBack() },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        setHasPermission(false);
      }
    } catch (error) {
      console.error('Camera permission error:', error);
      setHasPermission(false);
    }
  };

  const handleBarCodeRead = ({ data }: { data: string; type: string }) => {
    if (!scanned && data) {
      setScanned(true);
      onScan(data);
      setTimeout(() => {
        navigation.goBack();
      }, 500);
    }
  };

  const handleRescan = () => {
    setScanned(false);
  };

  const handleManualEntry = () => {
    Alert.prompt(
      'Enter Barcode',
      'Please enter the barcode number manually:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: (barcode) => {
            if (barcode && barcode.trim()) {
              onScan(barcode.trim());
              navigation.goBack();
            } else {
              Alert.alert('Error', 'Please enter a valid barcode');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>Camera permission not granted</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RNCamera
        style={styles.camera}
        onBarCodeRead={handleBarCodeRead}
        barCodeTypes={[
          RNCamera.Constants.BarCodeType.qr,
          RNCamera.Constants.BarCodeType.ean13,
          RNCamera.Constants.BarCodeType.ean8,
          RNCamera.Constants.BarCodeType.code128,
          RNCamera.Constants.BarCodeType.code39,
          RNCamera.Constants.BarCodeType.datamatrix,
        ]}
        captureAudio={false}
      >
        <View style={styles.overlay}>
          <View style={styles.topOverlay}>
            <Text style={styles.instructionText}>
              Position the barcode within the frame
            </Text>
          </View>

          <View style={styles.middleRow}>
            <View style={styles.sideOverlay} />
            <View style={styles.scanArea}>
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />
            </View>
            <View style={styles.sideOverlay} />
          </View>

          <View style={styles.bottomOverlay}>
            {scanned && (
              <View style={styles.scannedBadge}>
                <Text style={styles.scannedText}>✓ Barcode Scanned</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.manualButton]}
              onPress={handleManualEntry}
            >
              <Text style={styles.actionButtonText}>Enter Manually</Text>
            </TouchableOpacity>

            {scanned && (
              <TouchableOpacity
                style={[styles.actionButton, styles.rescanButton]}
                onPress={handleRescan}
              >
                <Text style={styles.actionButtonText}>Scan Again</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 20,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  middleRow: {
    flexDirection: 'row',
    height: 250,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#3498DB',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#3498DB',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#3498DB',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#3498DB',
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  scannedBadge: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  scannedText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 6,
    minWidth: 200,
    alignItems: 'center',
  },
  manualButton: {
    backgroundColor: '#3498DB',
  },
  rescanButton: {
    backgroundColor: '#F39C12',
  },
  cancelButton: {
    backgroundColor: '#95A5A6',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#3498DB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BarcodeScannerScreen;
