/**
 * Delivery Tracking Screen
 * Track medication delivery status in real-time
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const DeliveryTrackingScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Delivery Tracking</Text>
      
      <View style={styles.trackingCard}>
        <Text style={styles.cardTitle}>Active Deliveries</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No active deliveries</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Tracking Features:</Text>
        <Text style={styles.infoItem}>• Real-time GPS location</Text>
        <Text style={styles.infoItem}>• Estimated arrival time</Text>
        <Text style={styles.infoItem}>• Delivery personnel contact</Text>
        <Text style={styles.infoItem}>• Delivery status updates</Text>
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
  trackingCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  placeholder: {
    padding: 30,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  infoBox: {
    padding: 20,
    backgroundColor: '#e8f5e9',
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

export default DeliveryTrackingScreen;
