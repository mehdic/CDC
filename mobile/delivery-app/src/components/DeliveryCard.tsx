/**
 * DeliveryCard Component
 * Reusable card for displaying delivery overview in lists
 * Extracted from DeliveryListScreen for reusability
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';

import { DeliveryRequest, DeliveryStatus } from '../types/delivery';

export interface DeliveryCardProps {
  delivery: DeliveryRequest;
  onPress: (delivery: DeliveryRequest) => void;
  style?: ViewStyle;
  testID?: string;
}

/**
 * DeliveryCard Component
 * Displays delivery overview with status, priority, and key information
 */
export const DeliveryCard: React.FC<DeliveryCardProps> = ({
  delivery,
  onPress,
  style,
  testID = 'delivery-card'
}) => {
  const getStatusColor = (status: DeliveryStatus): ViewStyle => {
    const colors: Record<DeliveryStatus, ViewStyle> = {
      pending: { backgroundColor: '#FFC107' },
      assigned: { backgroundColor: '#17A2B8' },
      accepted: { backgroundColor: '#007AFF' },
      in_transit: { backgroundColor: '#9C27B0' },
      arrived: { backgroundColor: '#FF9800' },
      delivered: { backgroundColor: '#28A745' },
      failed: { backgroundColor: '#DC3545' },
      returned: { backgroundColor: '#6C757D' },
    };
    return colors[status] || colors.pending;
  };

  const getPriorityColor = (priority: string): ViewStyle => {
    const colors: Record<string, ViewStyle> = {
      urgent: { backgroundColor: '#DC3545' },
      high: { backgroundColor: '#FF9800' },
      medium: { backgroundColor: '#FFC107' },
      low: { backgroundColor: '#6C757D' },
    };
    return colors[priority] || colors.medium;
  };

  const formatDistance = (distance: number): string => {
    return distance.toFixed(1);
  };

  const formatDuration = (duration: number): string => {
    return `${duration}`;
  };

  const getSpecialHandlingText = (): string | null => {
    const specialHandling = delivery.packages.flatMap(pkg => pkg.specialHandling);
    if (specialHandling.length === 0) {return null;}

    const uniqueHandling = [...new Set(specialHandling)];
    return uniqueHandling.map(h => h.replace('_', ' ')).join(', ');
  };

  const specialHandlingText = getSpecialHandlingText();

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={() => onPress(delivery)}
      testID={testID}
      accessible={true}
      accessibilityLabel={`Delivery for ${delivery.patient.name}`}
      accessibilityHint={`${delivery.status} delivery. Distance: ${formatDistance(delivery.distance)} km. Estimated time: ${delivery.estimatedDuration} minutes. Priority: ${delivery.priority}. Double tap to view details.`}
      accessibilityRole="button"
    >
      <View style={styles.cardHeader}>
        <Text
          style={styles.patientName}
          testID={`${testID}-patient-name`}
          accessibilityRole="header"
          accessibilityLabel={`Patient name: ${delivery.patient.name}`}
        >
          {delivery.patient.name}
        </Text>
        <View
          style={[styles.statusBadge, getStatusColor(delivery.status)]}
          testID={`${testID}-status-badge`}
          accessible={true}
          accessibilityLabel={`Delivery status: ${delivery.status}`}
        >
          <Text style={styles.statusText}>{delivery.status}</Text>
        </View>
      </View>

      <Text
        style={styles.address}
        testID={`${testID}-address`}
        accessibilityLabel={`Address: ${delivery.patient.address.street}, ${delivery.patient.address.city}`}
      >
        {delivery.patient.address.street}, {delivery.patient.address.city}
      </Text>

      <View style={styles.cardFooter}>
        <Text
          style={styles.distance}
          testID={`${testID}-distance`}
          accessibilityLabel={`Distance: ${formatDistance(delivery.distance)} kilometers`}
        >
          {formatDistance(delivery.distance)} km
        </Text>
        <Text
          style={styles.duration}
          testID={`${testID}-duration`}
          accessibilityLabel={`Estimated duration: ${delivery.estimatedDuration} minutes`}
        >
          {formatDuration(delivery.estimatedDuration)} min
        </Text>
        <View
          style={[styles.priorityBadge, getPriorityColor(delivery.priority)]}
          testID={`${testID}-priority-badge`}
          accessible={true}
          accessibilityLabel={`Priority level: ${delivery.priority}`}
        >
          <Text style={styles.priorityText}>{delivery.priority.toUpperCase()}</Text>
        </View>
      </View>

      {specialHandlingText && (
        <Text
          style={styles.specialHandling}
          numberOfLines={1}
          testID={`${testID}-special-handling`}
          accessibilityLabel={`Special handling: ${specialHandlingText}`}
        >
          ⚠️ {specialHandlingText}
        </Text>
      )}

      {delivery.specialInstructions && (
        <Text
          style={styles.instructions}
          numberOfLines={2}
          testID={`${testID}-instructions`}
          accessibilityLabel={`Special instructions: ${delivery.specialInstructions}`}
          accessibilityLiveRegion="polite"
        >
          ℹ️ {delivery.specialInstructions}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  distance: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  duration: {
    fontSize: 14,
    color: '#666',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  priorityText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  specialHandling: {
    marginTop: 8,
    fontSize: 12,
    color: '#856404',
    fontWeight: '600',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  instructions: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default DeliveryCard;
