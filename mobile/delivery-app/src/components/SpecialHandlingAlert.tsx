/**
 * SpecialHandlingAlert Component
 * Displays special handling requirements for delivery packages
 * Supports: controlled substances, cold chain, fragile items, signature requirements, ID verification
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

export type AlertType =
  | 'controlled_substance'
  | 'cold_chain'
  | 'fragile'
  | 'signature_required'
  | 'id_required';

export interface SpecialHandlingAlertProps {
  type: AlertType;
  details: string;
  acknowledged: boolean;
  onAcknowledge?: () => void;
  testID?: string;
}

/**
 * Get styling and metadata for each alert type
 */
const getAlertConfig = (type: AlertType) => {
  const configs: Record<AlertType, {
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    icon: string;
    label: string;
    severity: 'critical' | 'high' | 'medium';
  }> = {
    controlled_substance: {
      backgroundColor: '#FFEBEE',
      borderColor: '#DC3545',
      textColor: '#C41C3B',
      icon: '⚠️',
      label: 'Controlled Substance',
      severity: 'critical',
    },
    cold_chain: {
      backgroundColor: '#E3F2FD',
      borderColor: '#1976D2',
      textColor: '#1565C0',
      icon: '❄️',
      label: 'Cold Chain Required',
      severity: 'high',
    },
    fragile: {
      backgroundColor: '#FFF3E0',
      borderColor: '#F57C00',
      textColor: '#E65100',
      icon: '📦',
      label: 'Fragile Item',
      severity: 'medium',
    },
    signature_required: {
      backgroundColor: '#F3E5F5',
      borderColor: '#7B1FA2',
      textColor: '#6A1B9A',
      icon: '✍️',
      label: 'Signature Required',
      severity: 'high',
    },
    id_required: {
      backgroundColor: '#FCE4EC',
      borderColor: '#C2185B',
      textColor: '#AD1457',
      icon: '🆔',
      label: 'ID Verification Required',
      severity: 'high',
    },
  };

  return configs[type] || configs.controlled_substance;
};

/**
 * SpecialHandlingAlert Component
 * Displays alert with appropriate styling based on type
 */
export const SpecialHandlingAlert: React.FC<SpecialHandlingAlertProps> = ({
  type,
  details,
  acknowledged,
  onAcknowledge,
  testID = 'special-handling-alert',
}) => {
  const config = getAlertConfig(type);

  const containerStyle: ViewStyle = {
    backgroundColor: config.backgroundColor,
    borderLeftColor: config.borderColor,
    borderLeftWidth: 4,
    opacity: acknowledged ? 0.6 : 1,
  };

  return (
    <View
      style={[styles.container, containerStyle]}
      testID={testID}
      accessible={true}
      accessibilityLabel={`${config.label} alert`}
      accessibilityHint={details}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <View style={styles.headerRow}>
        <Text
          style={styles.icon}
          accessible={false}
          testID={`${testID}-icon`}
        >
          {config.icon}
        </Text>
        <View style={styles.labelContainer}>
          <Text
            style={[styles.label, { color: config.textColor }]}
            testID={`${testID}-label`}
          >
            {config.label}
          </Text>
          {config.severity === 'critical' && (
            <View
              style={[styles.severityBadge, { backgroundColor: config.borderColor }]}
              testID={`${testID}-severity-badge`}
              accessible={true}
              accessibilityLabel="Critical severity"
            >
              <Text style={styles.severityText}>CRITICAL</Text>
            </View>
          )}
        </View>
      </View>

      <Text
        style={[styles.details, { color: config.textColor }]}
        testID={`${testID}-details`}
      >
        {details}
      </Text>

      {acknowledged && (
        <View
          style={styles.acknowledgedBadge}
          testID={`${testID}-acknowledged-badge`}
          accessible={true}
          accessibilityLabel="This alert has been acknowledged"
        >
          <Text style={styles.acknowledgedText}>✓ Acknowledged</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  labelContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  details: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  acknowledgedBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  acknowledgedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
});

export default SpecialHandlingAlert;
