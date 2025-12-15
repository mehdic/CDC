/**
 * Profile Screen
 * View and edit delivery personnel profile
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { logoutAsync } from '../../store/authSlice';

export const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { personnel, hinEIDVerified } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          dispatch(logoutAsync());
        },
      },
    ]);
  };

  if (!personnel) {return null;}

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{personnel.name.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{personnel.name}</Text>
        <Text style={styles.badge}>Badge: {personnel.badgeNumber}</Text>
        {hinEIDVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ HIN e-ID Verified</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.item}>
          <Text style={styles.itemLabel}>Email</Text>
          <Text style={styles.itemValue}>{personnel.email}</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.itemLabel}>Phone</Text>
          <Text style={styles.itemValue}>{personnel.phone}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehicle Information</Text>
        <View style={styles.item}>
          <Text style={styles.itemLabel}>Type</Text>
          <Text style={styles.itemValue}>{personnel.vehicleType}</Text>
        </View>
        {personnel.licensePlate && (
          <View style={styles.item}>
            <Text style={styles.itemLabel}>License Plate</Text>
            <Text style={styles.itemValue}>{personnel.licensePlate}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.item}>
          <Text style={styles.itemLabel}>Rating</Text>
          <Text style={styles.itemValue}>{personnel.rating.toFixed(1)} ⭐</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.itemLabel}>Total Deliveries</Text>
          <Text style={styles.itemValue}>{personnel.totalDeliveries}</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.itemLabel}>Status</Text>
          <Text style={[styles.itemValue, personnel.isActive && styles.activeStatus]}>
            {personnel.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { alignItems: 'center', padding: 24, backgroundColor: '#FFF' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  badge: { fontSize: 14, color: '#666', marginTop: 4 },
  verifiedBadge: {
    backgroundColor: '#28A745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  verifiedText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  section: { backgroundColor: '#FFF', marginTop: 16, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  item: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  itemLabel: { fontSize: 14, color: '#666' },
  itemValue: { fontSize: 14, fontWeight: '600', color: '#333' },
  activeStatus: { color: '#28A745' },
  logoutButton: {
    backgroundColor: '#DC3545',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});

export default ProfileScreen;
