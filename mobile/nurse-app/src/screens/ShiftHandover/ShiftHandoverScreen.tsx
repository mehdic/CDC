/**
 * Shift Handover Screen
 * Create and view shift handover notes
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

const ShiftHandoverScreen: React.FC = () => {
  const handleCreateHandover = () => {
    // Placeholder for create handover note
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Shift Handover</Text>

      <TouchableOpacity style={styles.createButton} onPress={handleCreateHandover}>
        <Text style={styles.createButtonText}>+ Create Handover Note</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Shift Notes</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No handover notes for current shift</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Handover Includes:</Text>
        <Text style={styles.infoItem}>• Patient status updates</Text>
        <Text style={styles.infoItem}>• Critical pending tasks</Text>
        <Text style={styles.infoItem}>• Medication administration notes</Text>
        <Text style={styles.infoItem}>• Special patient requirements</Text>
        <Text style={styles.infoItem}>• Shift-specific concerns</Text>
      </View>
    </ScrollView>
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  placeholder: {
    padding: 30,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
  },
  infoBox: {
    padding: 20,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoItem: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
});

export default ShiftHandoverScreen;
