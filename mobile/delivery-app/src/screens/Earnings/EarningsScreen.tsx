/**
 * Earnings Screen
 * Shows delivery statistics and earnings breakdown
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchStatsAsync } from '../../store/deliverySlice';

/**
 * StatCard Component
 */
const StatCard: React.FC<{ title: string; data: any }> = ({ title, data }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>Deliveries:</Text>
      <Text style={styles.statValue}>{data.completed}</Text>
    </View>
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>Earnings:</Text>
      <Text style={styles.statValue}>CHF {data.earnings.toFixed(2)}</Text>
    </View>
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>Distance:</Text>
      <Text style={styles.statValue}>{data.distance.toFixed(1)} km</Text>
    </View>
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>On-Time Rate:</Text>
      <Text style={[styles.statValue, styles.rateValue]}>
        {(data.onTimeRate * 100).toFixed(0)}%
      </Text>
    </View>
  </View>
);

export const EarningsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { stats } = useAppSelector((state) => state.delivery);
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    await dispatch(fetchStatsAsync());
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (!stats) {
    return (
      <View style={styles.container}>
        <Text>Loading statistics...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Earnings & Statistics</Text>
      </View>

      <StatCard title="Today" data={stats.today} />
      <StatCard title="This Week" data={stats.week} />
      <StatCard title="This Month" data={stats.month} />

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Monthly Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Average per Delivery:</Text>
          <Text style={styles.summaryValue}>
            CHF {(stats.month.earnings / stats.month.completed || 0).toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Average Distance:</Text>
          <Text style={styles.summaryValue}>
            {(stats.month.distance / stats.month.completed || 0).toFixed(1)} km
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 20, backgroundColor: '#007AFF' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
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
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  statLabel: { fontSize: 14, color: '#666' },
  statValue: { fontSize: 14, fontWeight: '600', color: '#333' },
  rateValue: { color: '#28A745' },
  summary: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#007AFF' },
});

export default EarningsScreen;
