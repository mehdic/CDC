/**
 * Prescription Status Badge Component
 * Displays the current status of a prescription with appropriate styling
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PrescriptionStatus } from '@metapharm/api-types';

interface PrescriptionStatusBadgeProps {
  status: PrescriptionStatus;
  size?: 'small' | 'medium' | 'large';
}

interface StatusConfig {
  label: string;
  backgroundColor: string;
  textColor: string;
  icon?: string;
}

const STATUS_CONFIG: Record<PrescriptionStatus, StatusConfig> = {
  [PrescriptionStatus.PENDING]: {
    label: 'En attente',
    backgroundColor: '#FFF4E6',
    textColor: '#F59E0B',
  },
  [PrescriptionStatus.TRANSCRIBING]: {
    label: 'Transcription en cours',
    backgroundColor: '#E0F2FE',
    textColor: '#0284C7',
  },
  [PrescriptionStatus.VALIDATING]: {
    label: 'Validation en cours',
    backgroundColor: '#E0E7FF',
    textColor: '#6366F1',
  },
  [PrescriptionStatus.AWAITING_APPROVAL]: {
    label: 'En attente d\'approbation',
    backgroundColor: '#FEF3C7',
    textColor: '#D97706',
  },
  [PrescriptionStatus.APPROVED]: {
    label: 'Approuvée',
    backgroundColor: '#D1FAE5',
    textColor: '#059669',
  },
  [PrescriptionStatus.REJECTED]: {
    label: 'Rejetée',
    backgroundColor: '#FEE2E2',
    textColor: '#DC2626',
  },
  [PrescriptionStatus.EXPIRED]: {
    label: 'Expirée',
    backgroundColor: '#F3F4F6',
    textColor: '#6B7280',
  },
};

const SIZE_CONFIG = {
  small: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    borderRadius: 10,
  },
  medium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    borderRadius: 12,
  },
  large: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    borderRadius: 14,
  },
};

export const PrescriptionStatusBadge: React.FC<PrescriptionStatusBadgeProps> = ({
  status,
  size = 'medium',
}) => {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.backgroundColor,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          paddingVertical: sizeConfig.paddingVertical,
          borderRadius: sizeConfig.borderRadius,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: config.textColor,
            fontSize: sizeConfig.fontSize,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
  },
});

export default PrescriptionStatusBadge;
