/**
 * Delivery Tracking Screen
 * Real-time tracking of active medication deliveries
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { nurseApiClient } from '../../services/nurseApiClient';
import { DeliveryTracking } from '../../types';

export const DeliveryTrackingScreen: React.FC = () => {
  const [deliveries, setDeliveries] = useState<DeliveryTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDeliveries();
    const interval = setInterval(loadDeliveries, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadDeliveries = async () => {
    try {
      const data = await nurseApiClient.getActiveDeliveries();
      setDeliveries(data);
    } catch (error) {
      console.error('Failed to load deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDeliveries();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#95A5A6';
      case 'picked_up':
        return '#F39C12';
      case 'in_transit':
        return '#3498DB';
      case 'arrived':
        return '#9B59B6';
      case 'delivered':
        return '#27AE60';
      default:
        return '#7F8C8D';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'picked_up':
        return '📦';
      case 'in_transit':
        return '🚗';
      case 'arrived':
        return '📍';
      case 'delivered':
        return '✓';
      default:
        return '•';
    }
  };

  const renderDelivery = ({ item }: { item: DeliveryTracking }) => (
    <View style={styles.deliveryCard}>
      <View style={styles.deliveryHeader}>
        <Text style={styles.orderId}>Order #{item.orderId}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
          <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      {item.deliveryPersonnel && (
        <View style={styles.deliveryPersonnel}>
          <Text style={styles.personnelLabel}>Delivery Person:</Text>
          <Text style={styles.personnelName}>{item.deliveryPersonnel.name}</Text>
          <Text style={styles.personnelPhone}>{item.deliveryPersonnel.phone}</Text>
        </View>
      )}

      {item.currentLocation && (
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText}>{item.currentLocation}</Text>
        </View>
      )}

      <View style={styles.etaRow}>
        <Text style={styles.etaLabel}>Estimated Arrival:</Text>
        <Text style={styles.etaTime}>
          {new Date(item.estimatedArrival).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      {item.updates && item.updates.length > 0 && (
        <View style={styles.updatesSection}>
          <Text style={styles.updatesTitle}>Updates:</Text>
          {item.updates.slice(0, 3).map((update, index) => (
            <View key={index} style={styles.updateItem}>
              <Text style={styles.updateTime}>
                {new Date(update.timestamp).toLocaleTimeString()}
              </Text>
              <Text style={styles.updateStatus}>{update.status}</Text>
              {update.notes && <Text style={styles.updateNotes}>{update.notes}</Text>}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
        <Text style={styles.loadingText}>Loading deliveries...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Deliveries</Text>
        <Text style={styles.headerSubtitle}>{deliveries.length} in progress</Text>
      </View>

      <FlatList
        data={deliveries}
        renderItem={renderDelivery}
        keyExtractor={(item) => item.orderId}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No active deliveries</Text>
            <Text style={styles.emptySubtext}>All deliveries have been completed</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7F8C8D',
  },
  header: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DDE2E8',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  list: {
    padding: 16,
  },
  deliveryCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DDE2E8',
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  deliveryPersonnel: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  personnelLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  personnelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  personnelPhone: {
    fontSize: 14,
    color: '#3498DB',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#7F8C8D',
  },
  etaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#DDE2E8',
  },
  etaLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  etaTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#27AE60',
  },
  updatesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#DDE2E8',
  },
  updatesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  updateItem: {
    marginBottom: 8,
    paddingLeft: 12,
  },
  updateTime: {
    fontSize: 12,
    color: '#95A5A6',
  },
  updateStatus: {
    fontSize: 14,
    color: '#2C3E50',
    marginTop: 2,
  },
  updateNotes: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 2,
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95A5A6',
  },
});

export default DeliveryTrackingScreen;
