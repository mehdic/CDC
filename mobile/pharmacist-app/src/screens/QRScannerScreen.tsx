/**
 * QR Scanner Screen
 * Camera-based QR code scanning for inventory updates
 *
 * Features:
 * - Real-time QR code scanning using device camera
 * - GS1 DataMatrix format support
 * - Transaction type selection (receive, dispense, transfer, etc.)
 * - Quantity input
 * - Instant stock update confirmation
 * - Offline queue (scans synced when back online)
 *
 * Dependencies:
 * - react-native-camera OR react-native-vision-camera
 * - react-native-permissions (for camera access)
 */

import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Platform, Linking } from 'react-native';
import { RNCamera } from 'react-native-camera';
import { request, PERMISSIONS, RESULTS, check } from 'react-native-permissions';
import { useDispatch } from 'react-redux';

import { AppDispatch } from '../store';
import { scanQRCode } from '../store/inventorySlice';

// Import from react-native-camera (production implementation)

export const QRScannerScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();

  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [transactionType, setTransactionType] = useState<'receive' | 'dispense' | 'transfer'>('receive');
  const [quantity, setQuantity] = useState<string>('1');
  const [notes, setNotes] = useState<string>('');
  const [scanning, setScanning] = useState<boolean>(true);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'blocked' | 'unavailable' | 'checking'>('checking');
  const [showManualEntry, setShowManualEntry] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');

  // Check and request camera permission on mount
  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    try {
      const permission = Platform.select({
        ios: PERMISSIONS.IOS.CAMERA,
        android: PERMISSIONS.ANDROID.CAMERA,
      });

      if (!permission) {
        setCameraPermission('unavailable');
        return;
      }

      const result = await check(permission);

      switch (result) {
        case RESULTS.GRANTED:
          setCameraPermission('granted');
          break;
        case RESULTS.DENIED:
          // Not yet asked, let's request
          requestCameraPermission();
          break;
        case RESULTS.BLOCKED:
          setCameraPermission('blocked');
          break;
        case RESULTS.UNAVAILABLE:
          setCameraPermission('unavailable');
          break;
        default:
          setCameraPermission('denied');
      }
    } catch (error) {
      console.error('Permission check error:', error);
      setCameraPermission('unavailable');
    }
  };

  const requestCameraPermission = async () => {
    try {
      const permission = Platform.select({
        ios: PERMISSIONS.IOS.CAMERA,
        android: PERMISSIONS.ANDROID.CAMERA,
      });

      if (!permission) {
        setCameraPermission('unavailable');
        return;
      }

      const result = await request(permission);

      switch (result) {
        case RESULTS.GRANTED:
          setCameraPermission('granted');
          break;
        case RESULTS.BLOCKED:
          setCameraPermission('blocked');
          showPermissionAlert();
          break;
        default:
          setCameraPermission('denied');
      }
    } catch (error) {
      console.error('Permission request error:', error);
      setCameraPermission('denied');
    }
  };

  const showPermissionAlert = () => {
    Alert.alert(
      'Camera Permission Required',
      'Please enable camera permission in your device settings to scan QR codes.',
      [
        {
          text: 'Open Settings',
          onPress: () => Linking.openSettings(),
        },
        {
          text: 'Use Manual Entry',
          onPress: () => setShowManualEntry(true),
          style: 'cancel',
        },
      ]
    );
  };

  const onBarCodeRead = (event: any) => {
    if (scanning && event.data) {
      setScannedCode(event.data);
      setScanning(false);
    }
  };

  const handleManualEntry = () => {
    if (!manualCode.trim()) {
      Alert.alert('Error', 'Please enter a QR code');
      return;
    }
    setScannedCode(manualCode.trim());
    setScanning(false);
    setShowManualEntry(false);
  };

  const handleConfirmScan = async () => {
    if (!scannedCode) {
      Alert.alert('Error', 'No QR code scanned');
      return;
    }

    const quantityNum = parseInt(quantity, 10);
    if (isNaN(quantityNum) || quantityNum < 1) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    try {
      // TODO: Get pharmacy_id and user_id from auth context
      const pharmacy_id = 'YOUR_PHARMACY_ID';
      const user_id = 'YOUR_USER_ID';

      await dispatch(
        scanQRCode({
          qr_code: scannedCode,
          transaction_type: transactionType,
          quantity: quantityNum,
          pharmacy_id,
          user_id,
          notes: notes || undefined,
        })
      ).unwrap();

      Alert.alert('Success', `Successfully ${transactionType}d ${quantityNum} units`, [
        {
          text: 'Scan Another',
          onPress: () => {
            setScannedCode(null);
            setScanning(true);
            setQuantity('1');
            setNotes('');
          },
        },
        {
          text: 'Back to Dashboard',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Scan Failed', error.message || 'Unknown error occurred');
    }
  };

  const handleRescan = () => {
    setScannedCode(null);
    setScanning(true);
  };

  // Render permission error states
  const renderPermissionError = () => {
    let title = 'Camera Unavailable';
    let message = 'Camera is not available on this device.';
    let showRetry = false;

    switch (cameraPermission) {
      case 'checking':
        title = 'Checking Permissions';
        message = 'Please wait...';
        break;
      case 'denied':
        title = 'Camera Permission Denied';
        message = 'Please grant camera permission to scan QR codes.';
        showRetry = true;
        break;
      case 'blocked':
        title = 'Camera Permission Blocked';
        message = 'Please enable camera permission in your device settings.';
        break;
      case 'unavailable':
        title = 'Camera Unavailable';
        message = 'Camera is not available on this device.';
        break;
    }

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>{title}</Text>
        <Text style={styles.errorMessage}>{message}</Text>

        {showRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={checkCameraPermission}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}

        {cameraPermission === 'blocked' && (
          <TouchableOpacity style={styles.settingsButton} onPress={() => Linking.openSettings()}>
            <Text style={styles.settingsButtonText}>Open Settings</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.manualEntryButton}
          onPress={() => setShowManualEntry(true)}
        >
          <Text style={styles.manualEntryButtonText}>Enter Code Manually</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render manual entry form
  const renderManualEntry = () => (
    <View style={styles.manualEntryContainer}>
      <Text style={styles.manualEntryTitle}>Manual QR Code Entry</Text>
      <Text style={styles.manualEntryLabel}>Enter QR Code Data:</Text>
      <TextInput
        style={styles.manualEntryInput}
        value={manualCode}
        onChangeText={setManualCode}
        placeholder="e.g., (01)08901234567890(17)250630"
        multiline
        numberOfLines={3}
      />
      <View style={styles.manualEntryButtons}>
        <TouchableOpacity
          style={[styles.manualEntryButton, styles.cancelButton]}
          onPress={() => {
            setShowManualEntry(false);
            setManualCode('');
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.manualEntryButton, styles.submitButton]}
          onPress={handleManualEntry}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Manual Entry Modal */}
      {showManualEntry && renderManualEntry()}

      {/* Camera View or Error State */}
      {scanning && !scannedCode && !showManualEntry ? (
        cameraPermission === 'granted' ? (
          <View style={styles.cameraContainer}>
            {/* Production implementation with react-native-camera */}
            <RNCamera
              style={styles.camera}
              onBarCodeRead={onBarCodeRead}
              captureAudio={false}
              type={RNCamera.Constants.Type.back}
              flashMode={RNCamera.Constants.FlashMode.off}
              androidCameraPermissionOptions={{
                title: 'Permission to use camera',
                message: 'We need your permission to scan QR codes',
                buttonPositive: 'Ok',
                buttonNegative: 'Cancel',
              }}
            >
              <View style={styles.scanOverlay}>
                <View style={styles.scanFrame} />
                <Text style={styles.scanInstruction}>
                  Position QR code within the frame
                </Text>
              </View>
            </RNCamera>
          </View>
        ) : (
          renderPermissionError()
        )
      ) : (
        /* Scan Details Form */
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>QR Code Scanned</Text>

          {/* Scanned Code Display */}
          <View style={styles.codeDisplay}>
            <Text style={styles.codeLabel}>Scanned Data:</Text>
            <Text style={styles.codeValue}>{scannedCode}</Text>
          </View>

          {/* Transaction Type Selector */}
          <Text style={styles.fieldLabel}>Transaction Type</Text>
          <View style={styles.typeSelector}>
            {['receive', 'dispense', 'transfer'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  transactionType === type && styles.typeButtonActive,
                ]}
                onPress={() => setTransactionType(type as any)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    transactionType === type && styles.typeButtonTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quantity Input */}
          <Text style={styles.fieldLabel}>Quantity</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholder="Enter quantity"
          />

          {/* Notes Input */}
          <Text style={styles.fieldLabel}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholder="Add notes about this transaction..."
          />

          {/* Action Buttons */}
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmScan}>
            <Text style={styles.confirmButtonText}>Confirm Transaction</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.rescanButton} onPress={handleRescan}>
            <Text style={styles.rescanButtonText}>Scan Different Code</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 8,
  },
  scanInstruction: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 4,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 16,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  demoButton: {
    marginTop: 32,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  demoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  codeDisplay: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'monospace',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  confirmButton: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  rescanButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  rescanButtonText: {
    color: '#111827',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  manualEntryButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  manualEntryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  manualEntryContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  manualEntryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  manualEntryLabel: {
    fontSize: 16,
    color: '#D1D5DB',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  manualEntryInput: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  manualEntryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#6B7280',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#059669',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
