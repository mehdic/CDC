/**
 * Low-Confidence Field Warning Component
 * Displays visual warnings for AI transcription fields with confidence < 80%
 * T109 - FR-013a: Low-confidence fields must be highlighted with red/yellow indicators
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// ============================================================================
// Types
// ============================================================================

export interface ConfidenceWarningProps {
  confidence: number | null;
  fieldName: string;
  value: string;
  showInline?: boolean; // Show inline with field vs. as separate warning banner
  onPress?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export const ConfidenceWarning: React.FC<ConfidenceWarningProps> = ({
  confidence,
  fieldName,
  value,
  showInline = true,
  onPress,
}) => {
  // No warning if confidence is null or >= 80%
  if (confidence === null || confidence >= 80) {
    return null;
  }

  // Determine severity level based on confidence score
  const getSeverityLevel = (): 'critical' | 'warning' => {
    if (confidence < 60) return 'critical'; // Red
    return 'warning'; // Yellow
  };

  const severity = getSeverityLevel();

  // Inline warning (small indicator badge)
  if (showInline) {
    return (
      <View style={[styles.inlineWarning, severity === 'critical' ? styles.critical : styles.warning]}>
        <Icon
          name={severity === 'critical' ? 'alert-circle' : 'alert'}
          size={14}
          color="#fff"
          style={styles.icon}
        />
        <Text style={styles.inlineText}>{Math.round(confidence)}%</Text>
      </View>
    );
  }

  // Full warning banner (for review screen)
  return (
    <View
      style={[
        styles.warningBanner,
        severity === 'critical' ? styles.criticalBanner : styles.warningBanner,
      ]}
    >
      <Icon
        name={severity === 'critical' ? 'alert-circle' : 'alert'}
        size={20}
        color={severity === 'critical' ? '#DC2626' : '#D97706'}
        style={styles.bannerIcon}
      />
      <View style={styles.bannerContent}>
        <Text style={styles.bannerTitle}>
          {severity === 'critical' ? 'Critical: ' : 'Warning: '}
          Low AI Confidence
        </Text>
        <Text style={styles.bannerText}>
          {fieldName}: "{value}" (Confidence: {Math.round(confidence)}%)
        </Text>
        <Text style={styles.bannerSubtext}>
          Please verify this field manually before approval
        </Text>
      </View>
    </View>
  );
};

// ============================================================================
// Multi-Field Warning Component
// ============================================================================

export interface LowConfidenceFieldsSummaryProps {
  lowConfidenceFields: {
    fieldName: string;
    value: string;
    confidence: number;
  }[];
  onFieldPress?: (fieldName: string) => void;
}

export const LowConfidenceFieldsSummary: React.FC<LowConfidenceFieldsSummaryProps> = ({
  lowConfidenceFields,
  onFieldPress,
}) => {
  if (lowConfidenceFields.length === 0) {
    return null;
  }

  const criticalCount = lowConfidenceFields.filter((f) => f.confidence < 60).length;
  const warningCount = lowConfidenceFields.length - criticalCount;

  return (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryHeader}>
        <Icon name="alert-circle-outline" size={24} color="#DC2626" />
        <Text style={styles.summaryTitle}>
          {lowConfidenceFields.length} Field{lowConfidenceFields.length > 1 ? 's' : ''} Require Verification
        </Text>
      </View>

      {criticalCount > 0 && (
        <View style={styles.summaryBadge}>
          <View style={[styles.summaryDot, styles.critical]} />
          <Text style={styles.summaryBadgeText}>
            {criticalCount} Critical (&lt;60%)
          </Text>
        </View>
      )}

      {warningCount > 0 && (
        <View style={styles.summaryBadge}>
          <View style={[styles.summaryDot, styles.warning]} />
          <Text style={styles.summaryBadgeText}>
            {warningCount} Warning (60-79%)
          </Text>
        </View>
      )}

      <Text style={styles.summaryDescription}>
        FR-013a requires explicit verification of all low-confidence fields before approval
      </Text>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  // Inline warning badge
  inlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  critical: {
    backgroundColor: '#DC2626', // Red
  },
  warning: {
    backgroundColor: '#D97706', // Yellow/Orange
  },
  icon: {
    marginRight: 2,
  },
  inlineText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },

  // Full warning banner
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7', // Light yellow
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
    padding: 12,
    marginVertical: 8,
    borderRadius: 4,
  },
  criticalBanner: {
    backgroundColor: '#FEE2E2', // Light red
    borderLeftColor: '#DC2626',
  },
  bannerIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
  },
  bannerSubtext: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },

  // Summary component
  summaryContainer: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991B1B',
    marginLeft: 8,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  summaryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  summaryBadgeText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  summaryDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 12,
    fontStyle: 'italic',
  },
});

export default ConfidenceWarning;
