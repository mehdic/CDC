/**
 * Inventory Dashboard Screen
 * Main inventory management screen for pharmacists
 *
 * Features:
 * - Stock overview (total items, low stock count, expiring soon)
 * - Quick stats (inventory value, out of stock items)
 * - Active alerts list with severity indicators
 * - Quick actions (Scan QR, View All Items, View Alerts)
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInventoryAnalytics, fetchActiveAlerts } from '../store/inventorySlice';
import { RootState, AppDispatch } from '../store';

export const InventoryDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();

  const { analytics, alerts, loading } = useSelector((state: RootState) => state.inventory);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    dispatch(fetchInventoryAnalytics());
    dispatch(fetchActiveAlerts());
  };

  const handleScanQR = () => {
    navigation.navigate('QRScanner' as never);
  };

  const handleViewAllItems = () => {
    navigation.navigate('InventoryList' as never);
  };

  const handleViewAlerts = () => {
    navigation.navigate('InventoryAlerts' as never);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Inventory Dashboard</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{analytics?.overview?.total_items || 0}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, styles.warningText]}>
            {analytics?.overview?.low_stock_items || 0}
          </Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, styles.errorText]}>
            {analytics?.overview?.expiring_soon_items || 0}
          </Text>
          <Text style={styles.statLabel}>Expiring Soon</Text>
        </View>
      </View>

      {/* Inventory Value */}
      <View style={styles.valueCard}>
        <Text style={styles.valueLabel}>Total Inventory Value</Text>
        <Text style={styles.valueAmount}>
          CHF {analytics?.overview?.total_inventory_value || '0.00'}
        </Text>
      </View>

      {/* Active Alerts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Alerts</Text>
          <TouchableOpacity onPress={handleViewAlerts}>
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>

        {alerts.slice(0, 5).map((alert) => (
          <View key={alert.id} style={styles.alertCard}>
            <View style={[styles.alertIndicator, getSeverityStyle(alert.severity)]} />
            <View style={styles.alertContent}>
              <Text style={styles.alertType}>{alert.alert_type.replace('_', ' ').toUpperCase()}</Text>
              <Text style={styles.alertMessage}>{alert.message}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.primaryAction} onPress={handleScanQR}>
          <Text style={styles.primaryActionText}>📷 Scan QR Code</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryAction} onPress={handleViewAllItems}>
          <Text style={styles.secondaryActionText}>📦 View All Items</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Helper function to get severity color
const getSeverityStyle = (severity: string) => {
  switch (severity) {
    case 'critical':
      return { backgroundColor: '#DC2626' };
    case 'high':
      return { backgroundColor: '#F59E0B' };
    case 'medium':
      return { backgroundColor: '#3B82F6' };
    default:
      return { backgroundColor: '#6B7280' };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  warningText: {
    color: '#F59E0B',
  },
  errorText: {
    color: '#DC2626',
  },
  valueCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  valueAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 8,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sectionLink: {
    fontSize: 14,
    color: '#3B82F6',
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: 'row',
  },
  alertIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#111827',
  },
  actionsContainer: {
    padding: 16,
  },
  primaryAction: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryAction: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryActionText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
});
