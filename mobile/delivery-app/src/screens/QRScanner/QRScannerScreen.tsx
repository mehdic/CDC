/**
 * QR Scanner Screen
 * Scans package QR codes for verification
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';
import deliveryApi from '../../services/deliveryApi';

export const QRScannerScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { deliveryId } = route.params;
  const [scanning, setScanning] = useState(true);

  const handleScan = async (event: any) => {
    if (!scanning) return;

    setScanning(false);
    const qrCode = event.data;

    try {
      const response = await deliveryApi.verifyPackageQR(qrCode);

      if (response.success && response.data?.valid) {
        if (response.data.deliveryId === deliveryId) {
          Alert.alert('Success', 'Package verified!', [
            {
              text: 'OK',
              onPress: () => navigation.navigate('ProofOfDelivery', { deliveryId }),
            },
          ]);
        } else {
          Alert.alert('Error', 'Package does not match this delivery');
          setScanning(true);
        }
      } else {
        Alert.alert('Error', 'Invalid QR code');
        setScanning(true);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify QR code');
      setScanning(true);
    }
  };

  return (
    <View style={styles.container}>
      <QRCodeScanner
        onRead={handleScan}
        flashMode={RNCamera.Constants.FlashMode.off}
        topContent={
          <View style={styles.topContent}>
            <Text style={styles.title}>Scan Package QR Code</Text>
            <Text style={styles.subtitle}>Position the QR code within the frame</Text>
          </View>
        }
        bottomContent={
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topContent: { padding: 20, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#CCC' },
  cancelButton: {
    backgroundColor: '#DC3545',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  cancelButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});

export default QRScannerScreen;
