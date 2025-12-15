/**
 * EarningsSummaryCard Component
 * Displays earnings breakdown: gross, fees, and net earnings
 * Includes period comparison functionality
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

export interface EarningsSummaryData {
  gross: number;
  fees: number;
  net: number;
  previousPeriod?: {
    gross: number;
    net: number;
  };
}

export interface EarningsSummaryCardProps {
  data: EarningsSummaryData;
  period: 'day' | 'week' | 'month' | 'custom';
  style?: ViewStyle;
  testID?: string;
}

/**
 * EarningsSummaryCard Component
 * Shows gross earnings, fees deducted, and net earnings with comparison
 */
export const EarningsSummaryCard: React.FC<EarningsSummaryCardProps> = ({
  data,
  period,
  style,
  testID = 'earnings-summary-card',
}) => {
  const getPercentageChange = (current: number, previous: number): number => {
    if (previous === 0) {return 0;}
    return ((current - previous) / previous) * 100;
  };

  const getChangeColor = (change: number): string => {
    if (change > 0) {return '#28A745';}
    if (change < 0) {return '#DC3545';}
    return '#666';
  };

  const getChangeIcon = (change: number): string => {
    if (change > 0) {return '↑';}
    if (change < 0) {return '↓';}
    return '→';
  };

  const feePercentage = data.gross > 0 ? (data.fees / data.gross) * 100 : 0;

  const netChange = data.previousPeriod
    ? getPercentageChange(data.net, data.previousPeriod.net)
    : 0;

  const netChangeColor = getChangeColor(netChange);

  return (
    <View style={[styles.card, style]} testID={testID}>
      <Text style={styles.cardTitle} testID={`${testID}-title`}>
        Earnings Breakdown
      </Text>

      {/* Gross Earnings */}
      <View style={styles.earningRow} testID={`${testID}-gross-row`}>
        <View style={styles.earningLeft}>
          <Text style={styles.earningLabel} testID={`${testID}-gross-label`}>
            Gross Earnings
          </Text>
          <Text style={styles.earningDescription} testID={`${testID}-gross-description`}>
            Total before fees
          </Text>
        </View>
        <Text style={styles.earningValuePositive} testID={`${testID}-gross-value`}>
          CHF {data.gross.toFixed(2)}
        </Text>
      </View>

      {/* Fees */}
      <View style={styles.earningRow} testID={`${testID}-fees-row`}>
        <View style={styles.earningLeft}>
          <Text style={styles.earningLabel} testID={`${testID}-fees-label`}>
            Platform Fees
          </Text>
          <Text style={styles.earningDescription} testID={`${testID}-fees-description`}>
            {feePercentage.toFixed(1)}% of gross
          </Text>
        </View>
        <Text style={styles.earningValueNegative} testID={`${testID}-fees-value`}>
          -CHF {data.fees.toFixed(2)}
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} testID={`${testID}-divider`} />

      {/* Net Earnings */}
      <View style={styles.earningRow} testID={`${testID}-net-row`}>
        <View style={styles.earningLeft}>
          <Text style={styles.earningLabelNet} testID={`${testID}-net-label`}>
            Net Earnings
          </Text>
          <Text style={styles.earningDescription} testID={`${testID}-net-description`}>
            Your take-home
          </Text>
        </View>
        <View style={styles.earningValueContainer}>
          <Text style={styles.earningValueNet} testID={`${testID}-net-value`}>
            CHF {data.net.toFixed(2)}
          </Text>
          {data.previousPeriod && netChange !== 0 && (
            <Text
              style={[styles.changePercentage, { color: netChangeColor }]}
              testID={`${testID}-change-percentage`}
            >
              {getChangeIcon(netChange)} {Math.abs(netChange).toFixed(1)}%
            </Text>
          )}
        </View>
      </View>

      {/* Comparison Message */}
      {data.previousPeriod && netChange !== 0 && (
        <View style={styles.comparisonContainer} testID={`${testID}-comparison`}>
          <Text style={[styles.comparisonText, { color: netChangeColor }]}>
            {netChange > 0
              ? `You earned CHF ${Math.abs(data.net - data.previousPeriod.net).toFixed(2)} more than last ${period}`
              : `You earned CHF ${Math.abs(data.net - data.previousPeriod.net).toFixed(2)} less than last ${period}`}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  earningRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  earningLeft: {
    flex: 1,
  },
  earningLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  earningLabelNet: {
    fontSize: 14,
    fontWeight: '700',
    color: '#28A745',
    marginBottom: 4,
  },
  earningDescription: {
    fontSize: 12,
    color: '#999',
  },
  earningValueContainer: {
    alignItems: 'flex-end',
  },
  earningValuePositive: {
    fontSize: 16,
    fontWeight: '700',
    color: '#28A745',
  },
  earningValueNegative: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC3545',
  },
  earningValueNet: {
    fontSize: 20,
    fontWeight: '700',
    color: '#28A745',
  },
  changePercentage: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  comparisonContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  comparisonText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default EarningsSummaryCard;
