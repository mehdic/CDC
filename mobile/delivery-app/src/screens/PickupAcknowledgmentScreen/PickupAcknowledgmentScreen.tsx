/**
 * PickupAcknowledgmentScreen
 * Screen for acknowledging all special handling requirements before pickup
 * Shows all alerts for a delivery and requires acknowledgments for each
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';

import { AcknowledgmentCheckbox } from '../../components/AcknowledgmentCheckbox';
import { SpecialHandlingAlert, AlertType } from '../../components/SpecialHandlingAlert';
import { DeliveryRequest, SpecialHandling } from '../../types/delivery';

export interface PickupAcknowledgmentScreenProps {
  delivery: DeliveryRequest;
  onAcknowledgeComplete: (acknowledgments: AcknowledgmentRecord[]) => void;
  onCancel: () => void;
  testID?: string;
}

export interface AcknowledgmentRecord {
  type: SpecialHandling;
  acknowledged: boolean;
  timestamp: string;
}

/**
 * Get display details for each special handling type
 */
const getHandlingDetails = (
  type: SpecialHandling
): {
  title: string;
  description: string;
  requirements: string[];
} => {
  const details: Record<SpecialHandling, {
    title: string;
    description: string;
    requirements: string[];
  }> = {
    narcotics: {
      title: 'Controlled Substance (DEA Requirement)',
      description: 'This package contains controlled medications requiring special handling.',
      requirements: [
        'Age verification (18+) may be required',
        'Photo ID verification at delivery',
        'Signature required from recipient',
        'Special documentation may be needed',
      ],
    },
    cold_chain: {
      title: 'Cold Chain Maintenance',
      description: 'This package requires temperature control throughout delivery.',
      requirements: [
        'Keep between 2-8°C (refrigerated)',
        'Monitor temperature logs',
        'Minimize time outside refrigeration',
        'Report any temperature excursions',
      ],
    },
    signature_required: {
      title: 'Signature Required',
      description: 'Recipient must sign for this delivery.',
      requirements: [
        'Obtain signature from recipient',
        'Have photo ID ready for verification',
        'Document recipient name clearly',
        'Take proof of delivery photo',
      ],
    },
    id_verification: {
      title: 'ID Verification Required',
      description: 'Patient identification must be verified before delivery.',
      requirements: [
        'Verify patient photo ID matches delivery name',
        'Record ID type and number',
        'Photograph ID for documentation',
        'Keep confidential per privacy regulations',
      ],
    },
    time_sensitive: {
      title: 'Time Sensitive Delivery',
      description: 'This package has specific delivery time requirements.',
      requirements: [
        'Deliver within scheduled time window',
        'Prioritize this delivery route',
        'Notify pharmacy of any delays',
        'Document actual delivery time',
      ],
    },
  };

  return details[type] || {
    title: type.replace('_', ' '),
    description: 'This package has special handling requirements.',
    requirements: [],
  };
};

/**
 * Map SpecialHandling types to AlertType for the SpecialHandlingAlert component
 */
const mapSpecialHandlingToAlertType = (type: SpecialHandling): AlertType => {
  const typeMap: Record<SpecialHandling, AlertType> = {
    'narcotics': 'controlled_substance',
    'cold_chain': 'cold_chain',
    'signature_required': 'signature_required',
    'id_verification': 'id_required',
    'time_sensitive': 'time_sensitive',
  };
  return typeMap[type];
};

/**
 * PickupAcknowledgmentScreen Component
 * Displays all special handling requirements and collects acknowledgments
 */
export const PickupAcknowledgmentScreen: React.FC<
  PickupAcknowledgmentScreenProps
> = ({
  delivery,
  onAcknowledgeComplete,
  onCancel,
  testID = 'pickup-acknowledgment-screen',
}) => {
  // Extract all unique special handling types from packages
  const specialHandlingTypes = useMemo(() => {
    const types = new Set<SpecialHandling>();
    delivery.packages.forEach(pkg => {
      pkg.specialHandling.forEach(type => types.add(type));
    });
    return Array.from(types);
  }, [delivery]);

  // Track acknowledgments
  const [acknowledgments, setAcknowledgments] = useState<
    Record<SpecialHandling, { acknowledged: boolean; timestamp: string }>
  >(
    specialHandlingTypes.reduce(
      (acc, type) => ({
        ...acc,
        [type]: { acknowledged: false, timestamp: '' },
      }),
      {} as Record<SpecialHandling, { acknowledged: boolean; timestamp: string }>
    )
  );

  // Check if all special handling items are acknowledged
  const allAcknowledged = useMemo(
    () =>
      specialHandlingTypes.length > 0 &&
      specialHandlingTypes.every(type => acknowledgments[type]?.acknowledged),
    [acknowledgments, specialHandlingTypes]
  );

  // Handle checkbox change
  const handleAcknowledgmentChange = (
    type: SpecialHandling,
    checked: boolean,
    timestamp: string
  ) => {
    setAcknowledgments(prev => ({
      ...prev,
      [type]: { acknowledged: checked, timestamp },
    }));
  };

  // Handle complete
  const handleComplete = () => {
    if (!allAcknowledged) {
      Alert.alert(
        'Acknowledgments Required',
        'You must acknowledge all special handling requirements before proceeding.',
        [{ text: 'OK' }]
      );
      return;
    }

    const records: AcknowledgmentRecord[] = specialHandlingTypes.map(type => ({
      type,
      acknowledged: acknowledgments[type].acknowledged,
      timestamp: acknowledgments[type].timestamp,
    }));

    onAcknowledgeComplete(records);
  };

  // If no special handling, show message
  if (specialHandlingTypes.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container} testID={testID}>
          <Text style={styles.noHandlingText}>
            This delivery has no special handling requirements.
          </Text>
          <TouchableOpacity
            style={styles.proceedButton}
            onPress={() => onAcknowledgeComplete([])}
            testID={`${testID}-proceed-button-no-handling`}
          >
            <Text style={styles.proceedButtonText}>Proceed</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container} testID={testID}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          testID={`${testID}-scroll`}
        >
          <View style={styles.header}>
            <Text style={styles.title} testID={`${testID}-title`}>
              Special Handling Acknowledgment
            </Text>
            <Text style={styles.subtitle} testID={`${testID}-subtitle`}>
              Please review and acknowledge all special requirements for this
              delivery.
            </Text>
          </View>

          <View style={styles.deliveryInfo} testID={`${testID}-delivery-info`}>
            <Text style={styles.infoLabel}>Patient:</Text>
            <Text style={styles.infoValue} testID={`${testID}-patient-name`}>
              {delivery.patient.name}
            </Text>
            <Text style={[styles.infoLabel, { marginTop: 8 }]}>
              Number of Packages:
            </Text>
            <Text style={styles.infoValue} testID={`${testID}-package-count`}>
              {delivery.packages.length}
            </Text>
          </View>

          <View style={styles.alertsContainer}>
            {specialHandlingTypes.map(type => {
              const details = getHandlingDetails(type);
              const ackStatus = acknowledgments[type];

              return (
                <View key={type} testID={`${testID}-alert-${type}`}>
                  <SpecialHandlingAlert
                    type={mapSpecialHandlingToAlertType(type)}
                    details={details.description}
                    acknowledged={ackStatus.acknowledged}
                    testID={`${testID}-alert-component-${type}`}
                  />

                  <View style={styles.requirementsList}>
                    {details.requirements.map((req, idx) => (
                      <Text
                        key={`${type}-req-${idx}`}
                        style={styles.requirementItem}
                        testID={`${testID}-requirement-${type}-${idx}`}
                      >
                        • {req}
                      </Text>
                    ))}
                  </View>

                  <AcknowledgmentCheckbox
                    label={details.title}
                    description="I understand and acknowledge these requirements"
                    checked={ackStatus.acknowledged}
                    onCheck={(checked, timestamp) =>
                      handleAcknowledgmentChange(type, checked, timestamp)
                    }
                    testID={`${testID}-checkbox-${type}`}
                    accessibilityLabel={`Acknowledge ${details.title}`}
                  />
                </View>
              );
            })}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText} testID={`${testID}-footer-text`}>
              {allAcknowledged
                ? '✓ All acknowledgments complete. Ready for pickup.'
                : `${specialHandlingTypes.length - Object.values(acknowledgments).filter(a => a.acknowledged).length} requirement(s) remaining`}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            testID={`${testID}-cancel-button`}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.proceedButton, !allAcknowledged && styles.proceedButtonDisabled]}
            onPress={handleComplete}
            disabled={!allAcknowledged}
            testID={`${testID}-proceed-button`}
          >
            <Text style={styles.proceedButtonText}>Proceed to Pickup</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  deliveryInfo: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginTop: 4,
  },
  alertsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  requirementsList: {
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 6,
  },
  requirementItem: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    marginBottom: 6,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    marginTop: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    backgroundColor: '#FFF',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  proceedButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proceedButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  noHandlingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 32,
  },
});

export default PickupAcknowledgmentScreen;
