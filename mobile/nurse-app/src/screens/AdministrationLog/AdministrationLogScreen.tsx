/**
 * Administration Log Screen
 * Log medication administration and view history
 */

import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

import { useAppSelector } from '../../hooks/useRedux';

const AdministrationLogScreen: React.FC = () => {
  const { administrationHistory } = useAppSelector((state) => state.medication);

  const handleLogAdministration = () => {
    // Placeholder for log medication administration
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Administration Log</Text>

      <TouchableOpacity style={styles.logButton} onPress={handleLogAdministration}>
        <Text style={styles.logButtonText}>+ Log Administration</Text>
      </TouchableOpacity>

      <FlatList
        data={administrationHistory}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.logItem}>
            <Text style={styles.medicationName}>{item.medicationName}</Text>
            <Text style={styles.dosage}>Dosage: {item.dosage}</Text>
            <Text style={styles.route}>Route: {item.route}</Text>
            <Text style={styles.time}>
              Administered: {new Date(item.administeredAt).toLocaleString()}
            </Text>
            {item.adverseReaction && (
              <View style={styles.reactionWarning}>
                <Text style={styles.reactionText}>Adverse reaction reported</Text>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No administration logs</Text>
          </View>
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
  logButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  logButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logItem: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 10,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  dosage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  route: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  reactionWarning: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff3cd',
    borderRadius: 4,
  },
  reactionText: {
    color: '#856404',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default AdministrationLogScreen;
