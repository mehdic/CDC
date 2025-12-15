/**
 * Earnings Screen
 * Shows delivery statistics and earnings breakdown with period filtering
 */

import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { BonusItem } from '../../components/BonusProgressCard';
import BonusProgressCard from '../../components/BonusProgressCard';
import type { DeliveryStatistics } from '../../components/DeliveryStatsCard';
import DeliveryStatsCard from '../../components/DeliveryStatsCard';
import type { EarningsSummaryData } from '../../components/EarningsSummaryCard';
import EarningsSummaryCard from '../../components/EarningsSummaryCard';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchStatsAsync } from '../../store/deliverySlice';

type PeriodType = 'day' | 'week' | 'month' | 'custom';

/**
 * PeriodFilter Component
 */
const PeriodFilter: React.FC<{
  selectedPeriod: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  testID?: string;
}> = ({ selectedPeriod, onPeriodChange, testID = 'period-filter' }) => {
  const periods: { label: string; value: PeriodType }[] = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
  ];

  return (
    <View style={styles.filterContainer} testID={testID}>
      <FlatList
        data={periods}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedPeriod === item.value && styles.filterButtonActive,
            ]}
            onPress={() => onPeriodChange(item.value)}
            testID={`${testID}-${item.value}`}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedPeriod === item.value && styles.filterButtonTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.value}
        horizontal
        scrollEnabled={false}
        contentContainerStyle={styles.filterContent}
        testID={`${testID}-list`}
      />
    </View>
  );
};

/**
 * Mock data generator for earnings
 */
const generateMockEarnings = (period: PeriodType) => {
  const baseGross = period === 'day' ? 80 : period === 'week' ? 480 : 1920;
  const gross = baseGross + Math.random() * 100;
  const fees = gross * 0.15; // 15% platform fee
  const net = gross - fees;

  return {
    gross,
    fees,
    net,
    previousPeriod: {
      gross: gross * 0.92,
      net: net * 0.92,
    },
  };
};

const generateMockStats = (period: PeriodType): DeliveryStatistics => {
  const count = period === 'day' ? 8 : period === 'week' ? 45 : 180;
  const totalDistance = period === 'day' ? 42 : period === 'week' ? 250 : 1000;
  const averageTime = period === 'day' ? 35 : period === 'week' ? 33 : 32;

  return {
    count,
    totalDistance,
    averageTime,
    onTimeRate: 0.92,
  };
};

const generateMockBonuses = (): BonusItem[] => [
  {
    id: 'bonus-1',
    title: 'Delivery Sprint',
    description: 'Complete 10 deliveries',
    target: 10,
    current: 7,
    unit: 'deliveries',
    reward: 25,
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'bonus-2',
    title: 'Distance Challenge',
    description: 'Cover 50 km in a week',
    target: 50,
    current: 38,
    unit: 'km',
    reward: 15,
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'bonus-3',
    title: 'Perfect Rating',
    description: 'Maintain 95% on-time rate',
    target: 95,
    current: 92,
    unit: '%',
    reward: 50,
    expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const EarningsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { stats } = useAppSelector((state) => state.delivery);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');

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

  // Get data for selected period
  const getEarningsData = (): EarningsSummaryData => {
    if (!stats) {
      return { gross: 0, fees: 0, net: 0 };
    }

    const mockData = generateMockEarnings(selectedPeriod);
    return mockData;
  };

  const getStatsData = (): DeliveryStatistics => {
    if (!stats) {
      return {
        count: 0,
        totalDistance: 0,
        averageTime: 0,
        onTimeRate: 0,
      };
    }

    const mockData = generateMockStats(selectedPeriod);
    return mockData;
  };

  const getBonusData = (): BonusItem[] => {
    return generateMockBonuses();
  };

  if (!stats) {
    return (
      <View style={styles.container} testID="earnings-screen-loading">
        <Text testID="earnings-screen-loading-text">Loading statistics...</Text>
      </View>
    );
  }

  const earningsData = getEarningsData();
  const statsData = getStatsData();
  const bonusData = getBonusData();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      testID="earnings-screen"
    >
      <View style={styles.header} testID="earnings-screen-header">
        <Text style={styles.title} testID="earnings-screen-title">
          Earnings & Statistics
        </Text>
      </View>

      {/* Period Filter */}
      <PeriodFilter
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        testID="earnings-period-filter"
      />

      {/* Earnings Summary */}
      <EarningsSummaryCard
        data={earningsData}
        period={selectedPeriod}
        testID="earnings-summary"
      />

      {/* Delivery Statistics */}
      <DeliveryStatsCard
        data={statsData}
        period={selectedPeriod}
        testID="delivery-stats"
      />

      {/* Active Bonuses */}
      <BonusProgressCard
        bonuses={bonusData}
        testID="bonus-progress"
      />

      {/* Additional Info */}
      <View style={styles.infoContainer} testID="earnings-info-container">
        <Text style={styles.infoText} testID="earnings-info-text">
          💡 Tip: Complete deliveries on time to unlock bonus rewards!
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  filterContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  filterContent: {
    paddingHorizontal: 8,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  infoContainer: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    marginBottom: 24,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
});

export default EarningsScreen;
