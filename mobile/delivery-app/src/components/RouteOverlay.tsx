/**
 * RouteOverlay Component
 * T8-021: GPS Tracking & Route Display
 * Displays route information, distance, duration, and navigation hints
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { DeliveryRoute, Waypoint } from '../types/delivery';

/**
 * RouteOverlay Props
 */
interface RouteOverlayProps {
  readonly route: DeliveryRoute | null;
  readonly currentWaypointIndex?: number;
}

/**
 * Format distance for display
 */
const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
};

/**
 * Format duration for display
 */
const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${Math.round(mins)}min`;
};

/**
 * Calculate remaining distance to waypoint
 */
const getRemainingDistance = (waypointIndex: number, route: DeliveryRoute): number => {
  if (!route.waypoints || waypointIndex >= route.waypoints.length) {
    return 0;
  }

  // Sum distances from current waypoint to end
  let totalDistance = 0;
  for (let i = waypointIndex; i < route.waypoints.length - 1; i++) {
    const current = route.waypoints[i];
    const next = route.waypoints[i + 1];

    if (current && next) {
      const dLat = next.coordinates.latitude - current.coordinates.latitude;
      const dLon = next.coordinates.longitude - current.coordinates.longitude;
      const distance = Math.sqrt(dLat * dLat + dLon * dLon) * 111; // Rough km conversion
      totalDistance += distance;
    }
  }

  return totalDistance;
};

/**
 * WaypointCard Component
 */
const WaypointCard: React.FC<{
  readonly waypoint: Waypoint;
  readonly index: number;
  readonly isActive: boolean;
  readonly completed: boolean;
}> = ({ waypoint, index, isActive, completed }) => {
  const statusColor = completed ? '#34C759' : isActive ? '#007AFF' : '#D1D1D6';

  return (
    <View style={[styles.waypointCard, isActive && styles.waypointCardActive]}>
      <View style={[styles.waypointBadge, { backgroundColor: statusColor }]}>
        <Text style={styles.waypointBadgeText}>{index + 1}</Text>
      </View>

      <View style={styles.waypointContent}>
        <Text style={styles.waypointAddress}>{waypoint.address.street}</Text>
        <Text style={styles.waypointCity}>
          {waypoint.address.postalCode} {waypoint.address.city}
        </Text>

        {waypoint.estimatedArrival && (
          <Text style={styles.waypointTime}>
            ETA: {new Date(waypoint.estimatedArrival).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}
      </View>

      {completed && <Text style={styles.completedBadge}>✓</Text>}
    </View>
  );
};

/**
 * RouteOverlay Component
 */
export const RouteOverlay: React.FC<RouteOverlayProps> = ({ route, currentWaypointIndex = 0 }) => {
  const remainingDistance = useMemo(() => {
    if (!route || !route.waypoints || route.waypoints.length === 0) {
      return 0;
    }
    return getRemainingDistance(currentWaypointIndex, route);
  }, [route, currentWaypointIndex]);

  const remainingDuration = useMemo(() => {
    // Estimate based on distance and average speed of 20 km/h
    const avgSpeed = 20;
    return (remainingDistance / avgSpeed) * 60;
  }, [remainingDistance]);

  if (!route || !route.waypoints || route.waypoints.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No route available</Text>
      </View>
    );
  }

  const nextWaypoint = route.waypoints[currentWaypointIndex];

  return (
    <View style={styles.container}>
      {/* Summary Section */}
      <View style={styles.summarySection}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Distance</Text>
          <Text style={styles.summaryValue}>{formatDistance(route.totalDistance)}</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Time</Text>
          <Text style={styles.summaryValue}>{formatDuration(route.totalDuration)}</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Deliveries</Text>
          <Text style={styles.summaryValue}>{route.deliveryIds.length}</Text>
        </View>
      </View>

      {/* Current Waypoint Info */}
      {nextWaypoint && (
        <View style={styles.currentSection}>
          <Text style={styles.sectionTitle}>Next Delivery</Text>

          <View style={styles.currentWaypoint}>
            <Text style={styles.currentWaypointAddress}>{nextWaypoint.address.street}</Text>
            <Text style={styles.currentWaypointCity}>
              {nextWaypoint.address.postalCode} {nextWaypoint.address.city}
            </Text>

            <View style={styles.currentWaypointStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>{formatDistance(remainingDistance)}</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>ETA</Text>
                <Text style={styles.statValue}>{formatDuration(remainingDuration)}</Text>
              </View>
            </View>

            {nextWaypoint.address.instructions && (
              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsLabel}>Special Instructions:</Text>
                <Text style={styles.instructionsText}>
                  {nextWaypoint.address.instructions}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Waypoints List */}
      <View style={styles.waypointsSection}>
        <Text style={styles.sectionTitle}>
          All Deliveries ({route.waypoints.length})
        </Text>

        <ScrollView style={styles.waypointsList} nestedScrollEnabled>
          {route.waypoints.map((waypoint, index) => (
            <WaypointCard
              key={waypoint.deliveryId}
              waypoint={waypoint}
              index={index}
              isActive={index === currentWaypointIndex}
              completed={waypoint.completed}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Summary Section
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#F0F0F0',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  // Current Section
  currentSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  currentWaypoint: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
  },
  currentWaypointAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  currentWaypointCity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  currentWaypointStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  instructionsBox: {
    backgroundColor: '#FFF9E6',
    borderRadius: 6,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFB300',
  },
  instructionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9500',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 12,
    color: '#666',
  },

  // Waypoints List
  waypointsSection: {
    marginBottom: 8,
  },
  waypointsList: {
    maxHeight: 200,
  },
  waypointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 6,
    backgroundColor: '#F5F5F5',
  },
  waypointCardActive: {
    backgroundColor: '#E7F5FF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  waypointBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  waypointBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  waypointContent: {
    flex: 1,
  },
  waypointAddress: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  waypointCity: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  waypointTime: {
    fontSize: 11,
    color: '#999',
  },
  completedBadge: {
    fontSize: 18,
    color: '#34C759',
    marginLeft: 8,
  },
});

export default RouteOverlay;
