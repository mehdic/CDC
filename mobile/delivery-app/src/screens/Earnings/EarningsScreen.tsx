/**
 * Earnings Screen
 * Shows delivery statistics and earnings breakdown with period filtering and export functionality
 * Displays daily/weekly/monthly earnings, delivery counts, bonus progress, and export options
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  Share,
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
import earningsService from '../../services/earningsService';
import { fetchStatsAsync } from '../../store/deliverySlice';
import {
  fetchEarningsSummary,
  fetchEarningsTransactions,
  fetchBonusOpportunities,
  setSelectedPeriod,
  type TimePeriod,
} from '../../store/earningsSlice';

type PeriodType = TimePeriod;

/**
 * PeriodFilter Component
 * Allows selection between different time periods for earnings display
 */
const PeriodFilter: React.FC<{
  selectedPeriod: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  testID?: string;
}> = ({ selectedPeriod, onPeriodChange, testID = 'period-filter' }) => {
  const periods: Array<{ label: string; value: PeriodType }> = [
    { label: 'Today', value: 'today' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Year', value: 'year' },
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
            accessible
            accessibilityLabel={`Filter by ${item.label}`}
            accessibilityRole="button"
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
 * Export Button Component
 */
const ExportButton: React.FC<{
  period: PeriodType;
  onExportCSV: () => void;
  onExportPDF: () => void;
  isLoading?: boolean;
  testID?: string;
}> = ({ period, onExportCSV, onExportPDF, isLoading = false, testID = 'export-button' }) => {
  return (
    <View style={styles.exportContainer} testID={testID}>
      <TouchableOpacity
        style={[styles.exportButton, isLoading && styles.exportButtonDisabled]}
        onPress={onExportCSV}
        disabled={isLoading}
        testID={`${testID}-csv`}
        accessible
        accessibilityLabel="Export earnings as CSV"
        accessibilityRole="button"
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.exportButtonText}>CSV</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.exportButton, styles.exportButtonPDF, isLoading && styles.exportButtonDisabled]}
        onPress={onExportPDF}
        disabled={isLoading}
        testID={`${testID}-pdf`}
        accessible
        accessibilityLabel="Export earnings as PDF"
        accessibilityRole="button"
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.exportButtonText}>PDF</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

/**
 * Mock data generator for earnings
 */
const generateMockEarnings = (period: PeriodType): EarningsSummaryData => {
  const baseGross =
    period === 'today' ? 85.5 : period === 'week' ? 487.25 : period === 'month' ? 1950 : 24000;
  const gross = baseGross + (Math.random() * 10 - 5); // Add some variance
  const fees = gross * 0.15; // 15% platform fee
  const net = gross - fees;

  return {
    gross: Math.max(0, gross), // Ensure non-negative
    fees,
    net: Math.max(0, net),
    previousPeriod: {
      gross: gross * 0.92,
      net: net * 0.92,
    },
  };
};

const generateMockStats = (period: PeriodType): DeliveryStatistics => {
  const stats: Record<PeriodType, { count: number; distance: number; time: number }> = {
    today: { count: 8, distance: 42, time: 35 },
    week: { count: 45, distance: 250, time: 33 },
    month: { count: 180, distance: 1000, time: 32 },
    year: { count: 2000, distance: 12000, time: 31 },
  };

  const { count, distance, time } = stats[period];

  return {
    count,
    totalDistance: distance,
    averageTime: time,
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
  const earningsState = useAppSelector((state) => state.earnings);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setLocalPeriod] = useState<PeriodType>('week');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(fetchStatsAsync()),
        dispatch(fetchEarningsSummary(selectedPeriod)),
        dispatch(fetchEarningsTransactions(selectedPeriod)),
        dispatch(fetchBonusOpportunities()),
      ]);
    } catch (error) {
      console.error('Failed to load earnings data:', error);
      Alert.alert(
        'Error',
        'Failed to load earnings data. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [dispatch, selectedPeriod]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const handlePeriodChange = useCallback((period: PeriodType) => {
    setLocalPeriod(period);
    dispatch(setSelectedPeriod(period));
  }, [dispatch]);

  const handleExportCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      const csvContent = await earningsService.exportReport(selectedPeriod, 'csv');
      await Share.share({
        message: csvContent,
        title: `Earnings Report - ${selectedPeriod}`,
        url: `data:text/csv;base64,${btoa(csvContent)}`,
      });
    } catch (error) {
      Alert.alert(
        'Export Failed',
        `Failed to export CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(false);
    }
  }, [selectedPeriod]);

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      const pdfContent = await earningsService.exportReport(selectedPeriod, 'pdf');
      await Share.share({
        message: 'Earnings Report PDF',
        title: `Earnings Report - ${selectedPeriod}`,
        url: `data:application/pdf;base64,${pdfContent}`,
      });
    } catch (error) {
      Alert.alert(
        'Export Failed',
        `Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(false);
    }
  }, [selectedPeriod]);

  // Get data for selected period
  const getEarningsData = (): EarningsSummaryData => {
    const mockData = generateMockEarnings(selectedPeriod);
    // Handle zero earnings edge case - should display $0.00, not error state
    return mockData.gross === 0 ? { gross: 0, fees: 0, net: 0 } : mockData;
  };

  const getStatsData = (): DeliveryStatistics => {
    const mockData = generateMockStats(selectedPeriod);
    return mockData;
  };

  const getBonusData = (): BonusItem[] => {
    return generateMockBonuses();
  };

  // Show loading state
  if (!stats && earningsState.loading) {
    return (
      <View style={[styles.container, styles.centerContent]} testID="earnings-screen-loading">
        <ActivityIndicator size="large" color="#007AFF" testID="earnings-loading-spinner" />
        <Text style={styles.loadingText} testID="earnings-screen-loading-text">
          Loading earnings data...
        </Text>
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
        <Text style={styles.subtitle} testID="earnings-screen-subtitle">
          Track your deliveries and bonuses
        </Text>
      </View>

      {/* Period Filter */}
      <PeriodFilter
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
        testID="earnings-period-filter"
      />

      {/* Earnings Summary */}
      <EarningsSummaryCard
        data={earningsData}
        period={(selectedPeriod === 'today' ? 'day' : selectedPeriod) as 'day' | 'week' | 'month' | 'custom'}
        testID="earnings-summary"
      />

      {/* Delivery Statistics */}
      <DeliveryStatsCard
        data={statsData}
        period={(selectedPeriod === 'today' ? 'day' : selectedPeriod) as 'day' | 'week' | 'month' | 'custom'}
        testID="delivery-stats"
      />

      {/* Active Bonuses */}
      <BonusProgressCard
        bonuses={bonusData}
        testID="bonus-progress"
      />

      {/* Export Buttons */}
      <ExportButton
        period={selectedPeriod}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        isLoading={isExporting}
        testID="earnings-export"
      />

      {/* Additional Info */}
      <View style={styles.infoContainer} testID="earnings-info-container">
        <Text style={styles.infoText} testID="earnings-info-text">
          Tip: Complete deliveries on time to unlock bonus rewards!
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
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
  exportContainer: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  exportButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#28A745',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  exportButtonPDF: {
    backgroundColor: '#DC3545',
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
