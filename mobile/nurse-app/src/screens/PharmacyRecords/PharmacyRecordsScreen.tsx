/**
 * Pharmacy Records Screen
 * Access patient pharmacy records and medication history
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const PharmacyRecordsScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Pharmacy Patient Records</Text>
      
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Pharmacy records access</Text>
        <Text style={styles.placeholderSubtext}>
          View patient medication history from connected pharmacies
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Features:</Text>
        <Text style={styles.infoItem}>• Medication dispensing history</Text>
        <Text style={styles.infoItem}>• Drug interaction warnings</Text>
        <Text style={styles.infoItem}>• Allergy cross-reference</Text>
        <Text style={styles.infoItem}>• Pharmacy contact information</Text>
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
  placeholder: {
    padding: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  infoBox: {
    padding: 20,
    backgroundColor: '#e3f2fd',
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

export default PharmacyRecordsScreen;
