/**
 * ScanHistory Component
 * Displays list of recent QR code scans with status
 *
 * Features:
 * - Chronological scan history
 * - Status badges (verified/failed)
 * - Location and timestamp info
 * - Clear history action
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';

import type { ScanHistoryEntry } from '../types/scanner';

export interface ScanHistoryProps {
  readonly entries: readonly ScanHistoryEntry[];
  readonly onClear?: () => void;
  readonly onSelectEntry?: (entry: ScanHistoryEntry) => void;
}

/**
 * Status badge component
 */
const StatusBadge: React.FC<{ status: ScanHistoryEntry['status'] }> = ({ status }) => {
  const badgeStyle = useMemo(
    () =>
      status === 'verified'
        ? { backgroundColor: '#ECFDF5', borderColor: '#059669' }
        : status === 'failed'
          ? { backgroundColor: '#FEF2F2', borderColor: '#DC2626' }
          : { backgroundColor: '#FEF3C7', borderColor: '#FBBF24' },
    [status]
  );

  const textStyle = useMemo(
    () =>
      status === 'verified'
        ? '#059669'
        : status === 'failed'
          ? '#DC2626'
          : '#92400E',
    [status]
  );

  const label = status === 'verified' ? 'Verified' : status === 'failed' ? 'Failed' : 'Pending';

  return (
    <View style={[styles.statusBadge, badgeStyle]}>
      <Text style={[styles.statusBadgeText, { color: textStyle }]}>{label}</Text>
    </View>
  );
};

/**
 * Single scan history entry component
 */
const ScanHistoryItem: React.FC<{
  readonly entry: ScanHistoryEntry;
  readonly onPress?: () => void;
}> = ({ entry, onPress }) => {
  const scannedAtDate = useMemo(() => new Date(entry.scannedAt), [entry.scannedAt]);

  const formattedTime = useMemo(() => {
    const now = new Date();
    const diffMs = now.getTime() - scannedAtDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    return scannedAtDate.toLocaleDateString();
  }, [scannedAtDate]);

  return (
    <TouchableOpacity style={styles.historyItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.historyItemContent}>
        <View style={styles.historyItemHeader}>
          <Text style={styles.qrCodeText}>{entry.packageQrCode.substring(0, 20)}...</Text>
          <StatusBadge status={entry.status} />
        </View>

        <Text style={styles.timestampText}>{formattedTime}</Text>

        {entry.verificationMessage && (
          <Text style={[styles.messageText, entry.status === 'failed' && styles.messageTextError]}>
            {entry.verificationMessage}
          </Text>
        )}

        {entry.location && (
          <Text style={styles.locationText}>
            📍 {entry.location.latitude.toFixed(4)}, {entry.location.longitude.toFixed(4)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

/**
 * ScanHistory Component
 * Shows chronological list of scans
 */
export const ScanHistory: React.FC<ScanHistoryProps> = ({ entries, onClear, onSelectEntry }) => {
  const isEmpty = entries.length === 0;

  const verifiedCount = useMemo(() => entries.filter(e => e.status === 'verified').length, [entries]);
  const failedCount = useMemo(() => entries.filter(e => e.status === 'failed').length, [entries]);
  const pendingCount = useMemo(() => entries.filter(e => e.status === 'pending').length, [entries]);

  return (
    <View style={styles.container}>
      {/* Header with stats */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Scan History</Text>

        {!isEmpty && (
          <View style={styles.statsContainer}>
            {verifiedCount > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Verified</Text>
                <Text style={[styles.statValue, { color: '#059669' }]}>{verifiedCount}</Text>
              </View>
            )}
            {failedCount > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Failed</Text>
                <Text style={[styles.statValue, { color: '#DC2626' }]}>{failedCount}</Text>
              </View>
            )}
            {pendingCount > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Pending</Text>
                <Text style={[styles.statValue, { color: '#FBBF24' }]}>{pendingCount}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Empty state */}
      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Scans Yet</Text>
          <Text style={styles.emptyMessage}>Scanned packages will appear here</Text>
        </View>
      ) : (
        <>
          {/* History list */}
          <FlatList
            data={entries}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <ScanHistoryItem entry={item} onPress={() => onSelectEntry?.(item)} />
            )}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
          />

          {/* Clear button */}
          {onClear && (
            <TouchableOpacity style={styles.clearButton} onPress={onClear}>
              <Text style={styles.clearButtonText}>Clear History</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },

  // List
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  historyItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyItemContent: {
    gap: 6,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qrCodeText: {
    fontSize: 13,
    color: '#111827',
    fontFamily: 'Menlo',
    fontWeight: '500',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  timestampText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  messageText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
    lineHeight: 16,
  },
  messageTextError: {
    color: '#DC2626',
  },
  locationText: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'Menlo',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Clear button
  clearButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
});
