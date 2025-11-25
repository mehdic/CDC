/**
 * Delivery List Screen
 * Shows pending and active deliveries with filters
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchAvailableRequests, fetchMyDeliveries } from '../../store/deliverySlice';
import { DeliveryRequest, DeliveryStatus } from '../../types/delivery';

export const DeliveryListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { requests } = useAppSelector((state) => state.delivery);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'available' | 'mine'>('available');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDeliveries();
  }, [filter]);

  const loadDeliveries = async () => {
    if (filter === 'available') {
      await dispatch(fetchAvailableRequests());
    } else {
      await dispatch(fetchMyDeliveries());
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDeliveries();
    setRefreshing(false);
  };

  const filteredRequests = requests.filter((req) =>
    req.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.patient.address.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: { item: DeliveryRequest }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DeliveryDetail', { deliveryId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.patientName}>{item.patient.name}</Text>
        <View style={[styles.statusBadge, getStatusColor(item.status)]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.address}>
        {item.patient.address.street}, {item.patient.address.city}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.distance}>{item.distance.toFixed(1)} km</Text>
        <Text style={styles.duration}>{item.estimatedDuration} min</Text>
        <View style={[styles.priorityBadge, getPriorityColor(item.priority)]}>
          <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
        </View>
      </View>
      {item.specialInstructions && (
        <Text style={styles.instructions} numberOfLines={2}>
          ℹ️ {item.specialInstructions}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'available' && styles.filterActive]}
          onPress={() => setFilter('available')}
        >
          <Text style={filter === 'available' ? styles.filterTextActive : styles.filterText}>
            Available
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'mine' && styles.filterActive]}
          onPress={() => setFilter('mine')}
        >
          <Text style={filter === 'mine' ? styles.filterTextActive : styles.filterText}>
            My Deliveries
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search by name or city..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredRequests}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No deliveries found</Text>
          </View>
        }
      />
    </View>
  );
};

const getStatusColor = (status: DeliveryStatus) => {
  const colors: Record<DeliveryStatus, any> = {
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

const getPriorityColor = (priority: string) => {
  const colors: Record<string, any> = {
    urgent: { backgroundColor: '#DC3545' },
    high: { backgroundColor: '#FF9800' },
    medium: { backgroundColor: '#FFC107' },
    low: { backgroundColor: '#6C757D' },
  };
  return colors[priority] || colors.medium;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  filterBar: { flexDirection: 'row', padding: 16, backgroundColor: '#FFF' },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#F0F0F0',
  },
  filterActive: { backgroundColor: '#007AFF' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#666' },
  filterTextActive: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  searchInput: {
    margin: 16,
    marginTop: 0,
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  patientName: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  address: { fontSize: 14, color: '#666', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  distance: { fontSize: 14, color: '#007AFF', fontWeight: '600' },
  duration: { fontSize: 14, color: '#666' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginLeft: 'auto' },
  priorityText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  instructions: { marginTop: 8, fontSize: 12, color: '#666', fontStyle: 'italic' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: '#999' },
});

export default DeliveryListScreen;
