/**
 * Medication Order Screen
 * Create and manage medication orders for patients
 */

import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';

import { useAppSelector } from '../../hooks/useRedux';

const MedicationOrderScreen: React.FC = () => {
  const { activeOrders } = useAppSelector((state) => state.medication);
  const [selectedUrgency, setSelectedUrgency] = useState<'routine' | 'urgent' | 'stat'>('routine');

  const handleCreateOrder = () => {
    Alert.alert('Create Order', 'Medication order creation functionality');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#ffc107';
      case 'processing':
        return '#17a2b8';
      case 'ready':
        return '#28a745';
      case 'delivered':
        return '#6c757d';
      default:
        return '#999';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Medication Orders</Text>

      <TouchableOpacity style={styles.createButton} onPress={handleCreateOrder}>
        <Text style={styles.createButtonText}>+ Create New Order</Text>
      </TouchableOpacity>

      <View style={styles.filterContainer}>
        {(['routine', 'urgent', 'stat'] as const).map((urgency) => (
          <TouchableOpacity
            key={urgency}
            style={[
              styles.filterButton,
              selectedUrgency === urgency && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedUrgency(urgency)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedUrgency === urgency && styles.filterButtonTextActive,
              ]}
            >
              {urgency.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={activeOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.orderItem}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderPatient}>Patient: {item.patientId}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) },
                ]}
              >
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.orderMedications}>
              {item.medications.length} medication(s)
            </Text>
            <Text style={styles.orderTime}>Ordered: {item.orderedAt}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No active orders</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  orderItem: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderPatient: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderMedications: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
  },
});

export default MedicationOrderScreen;
