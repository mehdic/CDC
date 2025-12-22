/**
 * Delivery Tracking Screen
 * Track medication delivery status in real-time with WebSocket support
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { selectDelivery } from '../../store/deliverySlice';
import { useDeliveryTracking } from '../../hooks/useDeliveryTracking';
import { DeliveryTracking } from '../../types';

const DeliveryTrackingScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    activeDeliveries,
    websocketConnected,
    isDeliveryApproaching,
    refreshDeliveries,
  } = useDeliveryTracking({
    enableWebSocket: true,
    enablePolling: true,
    etaThresholdMinutes: 15,
  });

  const [refreshing, setRefreshing] = React.useState(false);

  /**
   * Handle manual refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshDeliveries();
    setRefreshing(false);
  }, [refreshDeliveries]);

  /**
   * Handle delivery selection
   */
  const handleSelectDelivery = useCallback((delivery: DeliveryTracking) => {
    dispatch(selectDelivery(delivery.orderId));
  }, [dispatch]);

  /**
   * Contact delivery personnel
   */
  const handleContactDelivery = useCallback((phoneNumber: string | undefined) => {
    if (!phoneNumber) {
      Alert.alert('Contact Information', 'Phone number not available');
      return;
    }

    Alert.alert(
      'Contact Delivery Personnel',
      `Call ${phoneNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${phoneNumber}`).catch(() => {
              Alert.alert('Error', 'Unable to make call');
            });
          },
        },
      ]
    );
  }, []);

  /**
   * Get status color based on delivery status
   */
  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'pending':
        return '#FFC107'; // Amber
      case 'picked_up':
        return '#2196F3'; // Blue
      case 'in_transit':
        return '#FF9800'; // Orange
      case 'arrived':
        return '#4CAF50'; // Green
      case 'delivered':
        return '#388E3C'; // Dark green
      default:
        return '#999'; // Gray
    }
  }, []);

  /**
   * Get status label
   */
  const getStatusLabel = useCallback((status: string): string => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'picked_up':
        return 'Picked Up';
      case 'in_transit':
        return 'In Transit';
      case 'arrived':
        return 'Arrived';
      case 'delivered':
        return 'Delivered';
      default:
        return status;
    }
  }, []);

  /**
   * Calculate time until arrival
   */
  const getTimeUntilArrival = useCallback((estimatedArrival: string): string => {
    const now = new Date();
    const eta = new Date(estimatedArrival);
    const diffMs = eta.getTime() - now.getTime();

    if (diffMs < 0) return 'Overdue';

    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }, []);

  /**
   * Render delivery item
   */
  const renderDeliveryItem = useCallback(
    (delivery: DeliveryTracking) => {
      const approaching = isDeliveryApproaching(delivery);
      const statusColor = getStatusColor(delivery.status);
      const statusLabel = getStatusLabel(delivery.status);
      const timeUntilArrival = getTimeUntilArrival(delivery.estimatedArrival);

      return (
        <TouchableOpacity
          key={delivery.orderId}
          style={styles.deliveryCard}
          onPress={() => handleSelectDelivery(delivery)}
          activeOpacity={0.7}
        >
          {approaching && <View style={styles.approachingBadge} />}

          <View style={styles.cardHeader}>
            <View style={styles.headerContent}>
              <Text style={styles.orderId} numberOfLines={1}>
                Order {delivery.orderId.slice(-8).toUpperCase()}
              </Text>
              <Text style={styles.timestamp}>{new Date(delivery.updates?.[0]?.timestamp || Date.now()).toLocaleString()}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor },
              ]}
            >
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          </View>

          <View style={styles.cardContent}>
            {delivery.currentLocation && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Current Location:</Text>
                <Text style={styles.value} numberOfLines={1}>
                  {delivery.currentLocation}
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.label}>Estimated Arrival:</Text>
              <Text style={[styles.value, approaching && styles.approachingText]}>
                {timeUntilArrival}
              </Text>
            </View>

            {delivery.deliveryPersonnel && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Personnel:</Text>
                <Text style={styles.value}>{delivery.deliveryPersonnel.name}</Text>
              </View>
            )}
          </View>

          {delivery.deliveryPersonnel && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleContactDelivery(delivery.deliveryPersonnel?.phone)}
            >
              <Text style={styles.contactButtonText}>Contact Delivery</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      );
    },
    [
      isDeliveryApproaching,
      getStatusColor,
      getStatusLabel,
      getTimeUntilArrival,
      handleSelectDelivery,
      handleContactDelivery,
    ]
  );

  /**
   * Group deliveries by status
   */
  const deliveriesByStatus = useMemo(() => {
    const grouped: Record<string, DeliveryTracking[]> = {
      in_transit: [],
      arrived: [],
      pending: [],
      picked_up: [],
      delivered: [],
    };

    activeDeliveries.forEach((delivery) => {
      if (grouped[delivery.status]) {
        grouped[delivery.status].push(delivery);
      }
    });

    return grouped;
  }, [activeDeliveries]);

  // Deliveries to display (prioritize in-transit and arrived)
  const prioritizedDeliveries = useMemo(() => {
    return [
      ...deliveriesByStatus.in_transit,
      ...deliveriesByStatus.arrived,
      ...deliveriesByStatus.pending,
    ];
  }, [deliveriesByStatus]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Delivery Tracking</Text>
        <View style={styles.statusIndicator}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: websocketConnected ? '#4CAF50' : '#FFC107' },
            ]}
          />
          <Text style={styles.statusText}>
            {websocketConnected ? 'Connected' : 'Using Polling'}
          </Text>
        </View>
      </View>

      {activeDeliveries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Active Deliveries</Text>
          <Text style={styles.emptyStateMessage}>
            Pull down to refresh or check back later
          </Text>
        </View>
      ) : (
        <View>
          <Text style={styles.sectionHeader}>
            Active Deliveries ({activeDeliveries.length})
          </Text>
          {prioritizedDeliveries.map(renderDeliveryItem)}
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Features:</Text>
        <Text style={styles.infoItem}>
          Real-time GPS tracking updates
        </Text>
        <Text style={styles.infoItem}>
          Estimated arrival time notifications
        </Text>
        <Text style={styles.infoItem}>
          Direct contact with delivery personnel
        </Text>
        <Text style={styles.infoItem}>
          Delivery confirmation mechanism
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    marginTop: 8,
  },
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  approachingBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF5722',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerContent: {
    flex: 1,
    marginRight: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  cardContent: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 12,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  approachingText: {
    color: '#FF5722',
    fontWeight: '600',
  },
  contactButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#999',
  },
  infoBox: {
    padding: 16,
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1b5e20',
  },
  infoItem: {
    fontSize: 13,
    marginBottom: 8,
    color: '#2e7d32',
  },
});

export default DeliveryTrackingScreen;
