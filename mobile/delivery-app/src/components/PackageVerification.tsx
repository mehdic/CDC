/**
 * PackageVerification Component
 * Displays verification results after QR code scan
 *
 * Features:
 * - Success/failure feedback
 * - Package details display
 * - Mismatch error handling
 * - Rescan button
 * - Loading state
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';

import type { PackageVerificationState, ScanVerificationResult } from '../types/scanner';

export interface PackageVerificationProps {
  readonly state: PackageVerificationState;
  readonly onRescan: () => void;
  readonly onConfirm?: () => void;
  readonly onCancel?: () => void;
}

/**
 * PackageVerification Component
 * Shows QR scan results and verification feedback
 */
export const PackageVerification: React.FC<PackageVerificationProps> = ({
  state,
  onRescan,
  onConfirm,
  onCancel,
}) => {
  const isVerified = useMemo(() => state.status === 'verified', [state.status]);
  const isFailed = useMemo(() => state.status === 'failed', [state.status]);

  if (state.status === 'idle' || state.status === 'scanning') {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Loading state */}
      {state.isLoading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Verifying package...</Text>
        </View>
      )}

      {/* Success state */}
      {isVerified && !state.isLoading && (
        <>
          <View style={[styles.resultContainer, styles.successContainer]}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.resultTitle}>Package Verified</Text>
            <Text style={styles.resultMessage}>This package matches your delivery assignment</Text>
          </View>

          {/* Package details */}
          {state.result && (
            <View style={styles.detailsContainer}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>QR Code</Text>
                <Text style={styles.detailValue}>{state.qrCode}</Text>
              </View>

              {state.result.package && (
                <>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Package ID</Text>
                    <Text style={styles.detailValue}>{state.result.package.id}</Text>
                  </View>

                  {state.result.package.medications && state.result.package.medications.length > 0 && (
                    <View style={styles.medicationsSection}>
                      <Text style={styles.medicationsLabel}>Medications ({state.result.package.medications.length})</Text>
                      {state.result.package.medications.map((med, idx) => (
                        <View key={med.id} style={styles.medicationItem}>
                          <Text style={styles.medicationName}>{med.name}</Text>
                          <Text style={styles.medicationQty}>Qty: {med.quantity}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {state.result.package.specialHandling && state.result.package.specialHandling.length > 0 && (
                    <View style={styles.handlingSection}>
                      <Text style={styles.handlingLabel}>Special Handling</Text>
                      <View style={styles.handlingTags}>
                        {state.result.package.specialHandling.map((handling, idx) => (
                          <View key={idx} style={styles.handlingTag}>
                            <Text style={styles.handlingTagText}>{handling}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionsContainer}>
            {onConfirm && (
              <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
                <Text style={styles.confirmButtonText}>Confirm & Continue</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.rescanButton} onPress={onRescan}>
              <Text style={styles.rescanButtonText}>Scan Different Package</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Failure state */}
      {isFailed && !state.isLoading && (
        <>
          <View style={[styles.resultContainer, styles.failureContainer]}>
            <Text style={styles.failureIcon}>✕</Text>
            <Text style={styles.resultTitle}>Verification Failed</Text>
            <Text style={styles.resultMessage}>{state.error || 'Package does not match delivery'}</Text>
          </View>

          {/* Show what was expected vs scanned */}
          {state.result && (
            <View style={styles.mismatchContainer}>
              <View style={styles.mismatchSection}>
                <Text style={styles.mismatchLabel}>Scanned QR Code</Text>
                <Text style={[styles.mismatchValue, styles.mismatchValueError]}>{state.qrCode}</Text>
              </View>

              {state.result.expectedPackageId && (
                <View style={styles.mismatchSection}>
                  <Text style={styles.mismatchLabel}>Expected Package ID</Text>
                  <Text style={[styles.mismatchValue, styles.mismatchValueExpected]}>
                    {state.result.expectedPackageId}
                  </Text>
                </View>
              )}

              {state.result.errors && state.result.errors.length > 0 && (
                <View style={styles.errorsSection}>
                  <Text style={styles.errorsLabel}>Issues Found</Text>
                  {state.result.errors.map((error, idx) => (
                    <Text key={idx} style={styles.errorItem}>
                      • {error}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Action buttons for failure */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.rescanButton} onPress={onRescan}>
              <Text style={styles.rescanButtonText}>Scan Again</Text>
            </TouchableOpacity>
            {onCancel && (
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    fontWeight: '500',
  },

  // Result container styles
  resultContainer: {
    padding: 24,
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  successContainer: {
    backgroundColor: '#ECFDF5',
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  failureContainer: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  successIcon: {
    fontSize: 48,
    color: '#059669',
    marginBottom: 12,
    fontWeight: '700',
  },
  failureIcon: {
    fontSize: 48,
    color: '#DC2626',
    marginBottom: 12,
    fontWeight: '700',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  resultMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Details styles
  detailsContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  detailSection: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Menlo',
  },

  // Medications section
  medicationsSection: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  medicationsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  medicationItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  medicationName: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  medicationQty: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
  },

  // Special handling section
  handlingSection: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  handlingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  handlingTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  handlingTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  handlingTagText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },

  // Mismatch styles
  mismatchContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  mismatchSection: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  mismatchLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mismatchValue: {
    fontSize: 14,
    fontFamily: 'Menlo',
    fontWeight: '500',
  },
  mismatchValueError: {
    color: '#DC2626',
  },
  mismatchValueExpected: {
    color: '#059669',
  },

  // Errors section
  errorsSection: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  errorItem: {
    fontSize: 13,
    color: '#991B1B',
    marginBottom: 4,
    lineHeight: 18,
  },

  // Actions
  actionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 12,
  },
  confirmButton: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  rescanButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  rescanButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
});
