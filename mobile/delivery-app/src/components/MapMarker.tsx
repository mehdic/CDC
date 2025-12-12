/**
 * MapMarker Component
 * T8-021: GPS Tracking & Route Display
 * Reusable map marker with accuracy indicator
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Marker } from 'react-native-maps';
import { Coordinates } from '../types/delivery';

/**
 * Marker type discriminated union
 */
type MarkerType =
  | 'current_location'
  | 'destination'
  | 'waypoint'
  | 'pharmacy'
  | 'warning';

/**
 * Accuracy level based on GPS accuracy
 */
type AccuracyLevel =
  | 'excellent' // < 5m
  | 'good' // 5-10m
  | 'moderate' // 10-25m
  | 'poor'; // > 25m

/**
 * MapMarker Props
 */
interface MapMarkerProps {
  readonly coordinate: Coordinates;
  readonly type: MarkerType;
  readonly title?: string;
  readonly description?: string;
  readonly onPress?: () => void;
  readonly accuracy?: number; // in meters
}

/**
 * Calculate accuracy level
 */
const getAccuracyLevel = (accuracyMeters?: number): AccuracyLevel => {
  if (!accuracyMeters) return 'good';
  if (accuracyMeters < 5) return 'excellent';
  if (accuracyMeters < 10) return 'good';
  if (accuracyMeters < 25) return 'moderate';
  return 'poor';
};

/**
 * Get color based on marker type
 */
const getMarkerColor = (type: MarkerType): string => {
  switch (type) {
    case 'current_location':
      return '#007AFF'; // Blue
    case 'destination':
      return '#FF3B30'; // Red
    case 'waypoint':
      return '#34C759'; // Green
    case 'pharmacy':
      return '#FF9500'; // Orange
    case 'warning':
      return '#FFD60A'; // Yellow
    default:
      return '#8E8E93'; // Gray
  }
};

/**
 * Get accuracy indicator style
 */
const getAccuracyIndicatorStyle = (
  level: AccuracyLevel
): { color: string; borderColor: string } => {
  switch (level) {
    case 'excellent':
      return { color: '#34C759', borderColor: '#34C759' }; // Green
    case 'good':
      return { color: '#007AFF', borderColor: '#007AFF' }; // Blue
    case 'moderate':
      return { color: '#FF9500', borderColor: '#FF9500' }; // Orange
    case 'poor':
      return { color: '#FF3B30', borderColor: '#FF3B30' }; // Red
  }
};

/**
 * Accuracy Circle Component
 */
const AccuracyCircle: React.FC<{
  readonly radius: number;
  readonly level: AccuracyLevel;
}> = ({ radius, level }) => {
  const indicatorStyle = getAccuracyIndicatorStyle(level);

  return (
    <View
      style={[
        styles.accuracyCircle,
        {
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          borderColor: indicatorStyle.borderColor,
        },
      ]}
    />
  );
};

/**
 * Accuracy Label Component
 */
const AccuracyLabel: React.FC<{
  readonly accuracy: number;
  readonly level: AccuracyLevel;
}> = ({ accuracy, level }) => {
  const indicatorStyle = getAccuracyIndicatorStyle(level);

  return (
    <View style={[styles.accuracyLabel, { backgroundColor: indicatorStyle.color }]}>
      <Text style={styles.accuracyLabelText}>{Math.round(accuracy)}m</Text>
    </View>
  );
};

/**
 * MapMarker Component
 */
export const MapMarker: React.FC<MapMarkerProps> = ({
  coordinate,
  type,
  title,
  description,
  onPress,
  accuracy,
}) => {
  const pinColor = getMarkerColor(type);
  const accuracyLevel = getAccuracyLevel(accuracy);
  const accuracyRadiusMeters = accuracy ?? 0;

  // Convert accuracy from meters to map units (rough approximation)
  const accuracyRadiusUnits = accuracyRadiusMeters / 111000; // ~111km per degree

  return (
    <View>
      {/* Accuracy Circle (only for current location) */}
      {type === 'current_location' && accuracy && (
        <Marker
          coordinate={coordinate}
          style={{
            opacity: 0.3,
          }}
        >
          <AccuracyCircle radius={accuracyRadiusUnits * 100000} level={accuracyLevel} />
        </Marker>
      )}

      {/* Main Marker */}
      <Marker
        coordinate={coordinate}
        title={title}
        description={description}
        pinColor={pinColor}
        onPress={onPress}
      >
        {/* Accuracy Label (only for current location with accuracy) */}
        {type === 'current_location' && accuracy && accuracy > 0 && (
          <AccuracyLabel accuracy={accuracy} level={accuracyLevel} />
        )}
      </Marker>
    </View>
  );
};

const styles = StyleSheet.create({
  accuracyCircle: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    opacity: 0.3,
  },
  accuracyLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accuracyLabelText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default MapMarker;
