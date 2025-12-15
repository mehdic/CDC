/**
 * PackageInfo Component
 * Reusable collapsible package display with medications and special handling
 * Extracted from DeliveryDetailScreen for reusability
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';

import { DeliveryPackage, SpecialHandling } from '../types/delivery';

export interface PackageInfoProps {
  package: DeliveryPackage;
  packageIndex: number;
  isExpanded?: boolean;
  onToggle?: () => void;
  style?: ViewStyle;
  testID?: string;
}

/**
 * PackageInfo Component
 * Displays package details with collapsible medication list
 */
export const PackageInfo: React.FC<PackageInfoProps> = ({
  package: pkg,
  packageIndex,
  isExpanded: controlledIsExpanded,
  onToggle,
  style,
  testID = 'package-info',
}) => {
  // Support both controlled and uncontrolled expansion
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const isExpanded = controlledIsExpanded !== undefined ? controlledIsExpanded : internalIsExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsExpanded(!internalIsExpanded);
    }
  };

  const getSpecialHandlingIcon = (handling: SpecialHandling): string => {
    const icons: Record<SpecialHandling, string> = {
      cold_chain: '❄️',
      narcotics: '⚠️',
      signature_required: '✍️',
      id_verification: '🆔',
      time_sensitive: '⏱️',
    };
    return icons[handling] || '📦';
  };

  const getSpecialHandlingLabel = (handling: SpecialHandling): string => {
    return handling.replace('_', ' ');
  };

  const medicationCount = pkg.medications.length;
  const hasSpecialHandling = pkg.specialHandling.length > 0;

  return (
    <View style={[styles.container, style]} testID={testID}>
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggle}
        testID={`${testID}-header`}
        accessible={true}
        accessibilityLabel={`Package ${packageIndex + 1}`}
        accessibilityHint={`${isExpanded ? 'Collapse' : 'Expand'} to ${isExpanded ? 'hide' : 'view'} package details. Contains ${medicationCount} medication${medicationCount !== 1 ? 's' : ''}.`}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
      >
        <Text
          style={styles.title}
          testID={`${testID}-title`}
          accessibilityRole="header"
        >
          Package {packageIndex + 1}
        </Text>
        <Text style={styles.expandIcon}>
          {isExpanded ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>

      <Text
        style={styles.qrCode}
        testID={`${testID}-qr-code`}
        accessibilityLabel={`QR code: ${pkg.qrCode}`}
      >
        QR: {pkg.qrCode}
      </Text>

      {hasSpecialHandling && (
        <View
          style={styles.specialHandling}
          testID={`${testID}-special-handling`}
          accessible={true}
          accessibilityRole="list"
          accessibilityLabel={`Special handling requirements: ${pkg.specialHandling.map(getSpecialHandlingLabel).join(', ')}`}
        >
          {pkg.specialHandling.map((handling, index) => (
            <View
              key={`${handling}-${index}`}
              style={styles.handlingBadge}
              testID={`${testID}-handling-${handling}`}
              accessible={true}
              accessibilityLabel={getSpecialHandlingLabel(handling)}
            >
              <Text style={styles.handlingText}>
                {getSpecialHandlingIcon(handling)} {getSpecialHandlingLabel(handling)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {isExpanded && (
        <View
          style={styles.medicationsContainer}
          testID={`${testID}-medications`}
        >
          <Text
            style={styles.medicationsTitle}
            testID={`${testID}-medications-title`}
            accessibilityRole="header"
          >
            Medications ({medicationCount}):
          </Text>
          {pkg.medications.map((med, index) => (
            <View
              key={med.id}
              style={styles.medication}
              testID={`${testID}-medication-${index}`}
              accessible={true}
              accessibilityLabel={`Medication: ${med.name}, Quantity: ${med.quantity}, Dosage: ${med.dosage}`}
            >
              <Text
                style={styles.medName}
                testID={`${testID}-medication-${index}-name`}
                accessibilityLabel={`Medication name: ${med.name}`}
              >
                {med.name}
              </Text>
              <Text
                style={styles.medDetails}
                testID={`${testID}-medication-${index}-details`}
                accessibilityLabel={`Quantity: ${med.quantity}, Dosage: ${med.dosage}`}
              >
                {med.quantity}x - {med.dosage}
              </Text>
              {med.isControlledSubstance && (
                <Text
                  style={styles.controlledSubstance}
                  testID={`${testID}-medication-${index}-controlled`}
                  accessibilityLabel="Warning: Controlled substance"
                >
                  ⚠️ Controlled Substance
                </Text>
              )}
              {med.requiresColdChain && (
                <Text
                  style={styles.coldChain}
                  testID={`${testID}-medication-${index}-cold-chain`}
                  accessibilityLabel="Warning: Requires cold chain"
                >
                  ❄️ Requires Cold Chain
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  expandIcon: {
    fontSize: 16,
    color: '#666',
  },
  qrCode: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  specialHandling: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  handlingBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  handlingText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '600',
  },
  medicationsContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  medicationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  medication: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  medName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  medDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  controlledSubstance: {
    fontSize: 12,
    color: '#DC3545',
    marginTop: 4,
    fontWeight: '600',
  },
  coldChain: {
    fontSize: 12,
    color: '#17A2B8',
    marginTop: 4,
    fontWeight: '600',
  },
});

export default PackageInfo;
