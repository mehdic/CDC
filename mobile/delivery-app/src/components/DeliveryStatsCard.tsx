/**
 * DeliveryStatsCard Component
 * Displays delivery statistics: count, distance, and average time
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

export interface DeliveryStatistics {
  count: number;
  totalDistance: number;
  averageTime: number;
  onTimeRate?: number;
}

export interface DeliveryStatsCardProps {
  data: DeliveryStatistics;
  period: 'day' | 'week' | 'month' | 'custom';
  style?: ViewStyle;
  testID?: string;
}

/**
 * DeliveryStatsCard Component
 * Shows delivery count, total distance, average delivery time, and on-time rate
 */
export const DeliveryStatsCard: React.FC<DeliveryStatsCardProps> = ({
  data,
  period,
  style,
  testID = 'delivery-stats-card',
}) => {
  const formatDistance = (distance: number): string => {
    return distance.toFixed(1);
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <View style={[styles.card, style]} testID={testID}>
      <Text style={styles.cardTitle} testID={`${testID}-title`}>
        Delivery Statistics
      </Text>

      {/* Delivery Count */}
      <View style={styles.statContainer} testID={`${testID}-count-container`}>
        <View style={styles.statBox}>
          <Text style={styles.statValue} testID={`${testID}-count-value`}>
            {data.count}
          </Text>
          <Text style={styles.statLabel} testID={`${testID}-count-label`}>
            Deliveries
          </Text>
        </View>

        {/* Total Distance */}
        <View style={styles.statBox}>
          <Text style={styles.statValue} testID={`${testID}-distance-value`}>
            {formatDistance(data.totalDistance)}
          </Text>
          <Text style={styles.statLabel} testID={`${testID}-distance-label`}>
            km Total
          </Text>
        </View>

        {/* Average Time */}
        <View style={styles.statBox}>
          <Text style={styles.statValue} testID={`${testID}-time-value`}>
            {formatTime(data.averageTime)}
          </Text>
          <Text style={styles.statLabel} testID={`${testID}-time-label`}>
            Avg. Time
          </Text>
        </View>
      </View>

      {/* On-Time Rate (if available) */}
      {data.onTimeRate !== undefined && (
        <View style={styles.onTimeContainer} testID={`${testID}-ontime-container`}>
          <View style={styles.onTimeBar}>
            <View
              style={[
                styles.onTimeProgress,
                { width: `${Math.min(data.onTimeRate * 100, 100)}%` },
              ]}
              testID={`${testID}-ontime-progress`}
            />
          </View>
          <View style={styles.onTimeTextContainer}>
            <Text style={styles.onTimeLabel} testID={`${testID}-ontime-label`}>
              On-Time Rate
            </Text>
            <Text style={styles.onTimeValue} testID={`${testID}-ontime-value`}>
              {(data.onTimeRate * 100).toFixed(0)}%
            </Text>
          </View>
        </View>
      )}

      {/* Average Per Delivery */}
      {data.count > 0 && (
        <View style={styles.averageContainer} testID={`${testID}-average-container`}>
          <Text style={styles.averageLabel} testID={`${testID}-average-label`}>
            Average Per Delivery
          </Text>
          <Text style={styles.averageValue} testID={`${testID}-average-distance-value`}>
            {formatDistance(data.totalDistance / data.count)} km
          </Text>
        </View>
      )}
    </View>
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  onTimeContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  onTimeBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  onTimeProgress: {
    height: '100%',
    backgroundColor: '#28A745',
    borderRadius: 4,
  },
  onTimeTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  onTimeLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  onTimeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#28A745',
  },
  averageContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  averageLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  averageValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
  },
});

export default DeliveryStatsCard;
