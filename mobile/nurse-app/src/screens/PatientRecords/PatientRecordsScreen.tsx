/**
 * Patient Records Screen
 * Displays pharmacy patient records that nurses have access to
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { nurseApiClient } from '../../services/nurseApiClient';
import { PatientRecord } from '../../types';
import { PatientRecordsScreenProps } from '../../navigation/types';

export const PatientRecordsScreen = ({
  route,
}: PatientRecordsScreenProps) => {
  const { patientId, patientName } = route.params;
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRecords = async () => {
    try {
      const data = await nurseApiClient.getPatientRecords(patientId);
      setRecords(data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecords();
    setRefreshing(false);
  };

  const requestAccess = async (recordId: string) => {
    try {
      await nurseApiClient.requestRecordAccess(patientId, recordId);
      Alert.alert('Success', 'Access request sent to patient');
      await loadRecords();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to request access');
    }
  };

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'prescription':
        return '💊';
      case 'lab_result':
        return '🔬';
      case 'visit_note':
        return '📋';
      case 'medication_history':
        return '📜';
      case 'allergy':
        return '⚠️';
      default:
        return '📄';
    }
  };

  const renderRecord = ({ item }: { item: PatientRecord }) => (
    <View style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <View style={styles.recordTitleRow}>
          <Text style={styles.recordIcon}>{getRecordIcon(item.type)}</Text>
          <Text style={styles.recordType}>{item.type.replace('_', ' ').toUpperCase()}</Text>
        </View>
        {item.accessGranted ? (
          <View style={styles.accessBadge}>
            <Text style={styles.accessBadgeText}>✓ Access</Text>
          </View>
        ) : (
          <View style={[styles.accessBadge, styles.noAccessBadge]}>
            <Text style={styles.noAccessBadgeText}>No Access</Text>
          </View>
        )}
      </View>

      <Text style={styles.recordDescription}>{item.description}</Text>
      <Text style={styles.recordProvider}>Provider: {item.provider}</Text>
      <Text style={styles.recordDate}>{new Date(item.date).toLocaleDateString()}</Text>

      {!item.accessGranted && (
        <TouchableOpacity
          style={styles.requestButton}
          onPress={() => requestAccess(item.id)}
        >
          <Text style={styles.requestButtonText}>Request Access</Text>
        </TouchableOpacity>
      )}

      {item.accessGranted && item.attachments && item.attachments.length > 0 && (
        <View style={styles.attachmentsSection}>
          <Text style={styles.attachmentsTitle}>Attachments:</Text>
          {item.attachments.map((attachment, index) => (
            <Text key={index} style={styles.attachmentItem}>
              • {attachment}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
        <Text style={styles.loadingText}>Loading patient records...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{patientName}'s Records</Text>
        <Text style={styles.headerSubtitle}>Pharmacy Patient Records</Text>
      </View>

      <FlatList
        data={records}
        renderItem={renderRecord}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No records available</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7F8C8D',
  },
  header: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DDE2E8',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  list: {
    padding: 16,
  },
  recordCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DDE2E8',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  recordType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498DB',
  },
  accessBadge: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  accessBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  noAccessBadge: {
    backgroundColor: '#95A5A6',
  },
  noAccessBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  recordDescription: {
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 8,
  },
  recordProvider: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  recordDate: {
    fontSize: 14,
    color: '#95A5A6',
  },
  requestButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  requestButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  attachmentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#DDE2E8',
  },
  attachmentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  attachmentItem: {
    fontSize: 13,
    color: '#7F8C8D',
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#95A5A6',
    fontStyle: 'italic',
  },
});

export default PatientRecordsScreen;
