/**
 * QR Scanner Screen
 * Comprehensive package verification workflow
 *
 * Features:
 * - QR code scanning with camera
 * - Package verification against delivery assignment
 * - Scan history tracking
 * - Patient ID scanning for controlled substances
 * - Location capture with GPS
 * - Error handling with retry capability
 */

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

import { QRScanner } from '../../components/QRScanner';
import { PackageVerification } from '../../components/PackageVerification';
import { ScanHistory } from '../../components/ScanHistory';
import { useScan } from '../../hooks/useScan';

interface QRScannerScreenParams {
  readonly deliveryId: string;
}

export const QRScannerScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { deliveryId } = route.params as QRScannerScreenParams;

  const { scannedCode, verificationState, history, handleScan, handleRescan, clearHistory } =
    useScan(deliveryId);

  const [showHistory, setShowHistory] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');

  /**
   * Handle scan from QR scanner
   */
  const handleQRScan = useCallback(
    async (qrCode: string): Promise<void> => {
      try {
        await handleScan(qrCode);
      } catch (error) {
        Alert.alert('Scan Error', error instanceof Error ? error.message : 'Failed to scan QR code');
      }
    },
    [handleScan]
  );

  /**
   * Handle permission denied for camera
   */
  const handlePermissionDenied = useCallback((): void => {
    Alert.alert(
      'Camera Permission Required',
      'Camera access is required to scan package QR codes. Please check your device settings.'
    );
  }, []);

  /**
   * Handle scanner error
   */
  const handleScannerError = useCallback((error: Error): void => {
    Alert.alert('Scanner Error', error.message || 'An error occurred during scanning');
  }, []);

  /**
   * Handle confirmation after successful verification
   */
  const handleConfirmScan = useCallback((): void => {
    if (verificationState.status === 'verified') {
      // Pass verification result to next screen
      navigation.navigate('ProofOfDelivery', {
        deliveryId,
        packageId: verificationState.result?.packageId,
        scanResult: verificationState.result,
      });
    }
  }, [navigation, deliveryId, verificationState]);

  /**
   * Handle manual code entry
   */
  const handleManualEntry = useCallback(async (): Promise<void> => {
    if (!manualCode.trim()) {
      Alert.alert('Error', 'Please enter a QR code');
      return;
    }

    setShowManualEntry(false);
    setManualCode('');
    await handleQRScan(manualCode.trim());
  }, [manualCode, handleQRScan]);

  /**
   * Handle scanner error fall back to manual entry
   */
  const handleCameraError = useCallback((): void => {
    Alert.alert(
      'Camera Unavailable',
      'Camera is not available. Would you like to enter the code manually?',
      [
        {
          text: 'Yes',
          onPress: () => setShowManualEntry(true),
        },
        {
          text: 'No',
          style: 'cancel',
        },
      ]
    );
  }, []);

  // Show scanner or verification result
  const isShowingScanner = verificationState.status === 'idle' || verificationState.status === 'scanning';

  return (
    <View style={styles.container}>
      {/* Main scanner view */}
      {isShowingScanner ? (
        <>
          <QRScanner
            onScan={handleQRScan}
            onError={handleScannerError}
            onPermissionDenied={handlePermissionDenied}
            title="Scan Package QR Code"
            subtitle="Position the QR code within the camera frame"
          />

          {/* Header with actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowManualEntry(true)}
              accessible={true}
              accessibilityLabel="Enter code manually"
              accessibilityRole="button"
            >
              <Text style={styles.headerButtonText}>Type Code</Text>
            </TouchableOpacity>

            {history.length > 0 && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowHistory(true)}
                accessible={true}
                accessibilityLabel={`View scan history (${history.length} scans)`}
                accessibilityRole="button"
              >
                <Text style={styles.headerButtonText}>History ({history.length})</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.headerButton, styles.headerButtonDanger]}
              onPress={() => navigation.goBack()}
              accessible={true}
              accessibilityLabel="Close scanner"
              accessibilityRole="button"
            >
              <Text style={[styles.headerButtonText, styles.headerButtonDangerText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        /* Verification result view */
        <PackageVerification
          state={verificationState}
          onRescan={handleRescan}
          onConfirm={handleConfirmScan}
          onCancel={() => navigation.goBack()}
        />
      )}

      {/* Manual entry modal */}
      <Modal visible={showManualEntry} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter QR Code Manually</Text>
            <Text style={styles.modalSubtitle}>Type or paste the QR code data:</Text>

            {/* Manual entry input would go here - simplified for this example */}
            <ScrollView style={styles.manualEntryForm}>
              <Text style={styles.manualEntryLabel}>QR Code Data</Text>
              {/* TextInput component would be added with proper state management */}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setShowManualEntry(false);
                  setManualCode('');
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleManualEntry}
              >
                <Text style={styles.modalButtonPrimaryText}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* History modal */}
      <Modal visible={showHistory} animationType="slide">
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Scan History</Text>
            <TouchableOpacity onPress={() => setShowHistory(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScanHistory
            entries={history}
            onClear={clearHistory}
            onSelectEntry={entry => {
              // Could implement entry selection for more details
            }}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // Header actions
  headerActions: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  headerButton: {
    flex: 1,
    backgroundColor: '#374151',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  headerButtonDanger: {
    backgroundColor: '#DC2626',
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  headerButtonDangerText: {
    color: '#FFFFFF',
  },

  // Manual entry modal
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  manualEntryForm: {
    maxHeight: 300,
    marginBottom: 16,
  },
  manualEntryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#059669',
  },
  modalButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonSecondary: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonSecondaryText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },

  // History modal
  historyContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
    padding: 4,
  },
});

export default QRScannerScreen;
