/**
 * Pharmacy Records Screen
 * Access patient pharmacy records, medication history, allergies, and interactions
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { usePharmacyRecords } from '../../hooks/usePharmacyRecords';
import {
  formatDate,
  formatDateTime,
  getMedicationDispensingSummary,
  getAllergiesFromRecords,
  getInteractionsFromRecords,
  getRecentMedicationHistory,
  hasCriticalInteractions,
  sortMedicationHistoryByDate,
} from '../../utils/pharmacyRecordUtils';

type PharmacyRecordsScreenRouteProp = RouteProp<
  { PharmacyRecords: { patientId: string; patientName: string } },
  'PharmacyRecords'
>;

const PharmacyRecordsScreen: React.FC = () => {
  const route = useRoute<PharmacyRecordsScreenRouteProp>();
  const { patientId, patientName } = route.params || { patientId: '', patientName: 'Patient' };

  const nurse = useSelector((state: RootState) => state.auth?.nurse);
  const [activeTab, setActiveTab] = useState<'overview' | 'medications' | 'allergies' | 'interactions'>(
    'overview'
  );

  const { records, selectedRecord, loading, error, loadRecords, clearErrorMessage } =
    usePharmacyRecords(patientId);

  // Load records on mount
  useEffect(() => {
    if (patientId && nurse?.id) {
      loadRecords(
        patientId,
        'View pharmacy patient records for medication history and allergy information',
        nurse.id
      ).catch((err) => {
        console.error('Failed to load records:', err);
        Alert.alert('Error', 'Failed to load pharmacy records. Please try again.');
      });
    }
  }, [patientId, nurse?.id, loadRecords]);

  // Calculate summaries
  const medicationSummary = useMemo(() => getMedicationDispensingSummary(records), [records]);
  const allergies = useMemo(() => getAllergiesFromRecords(records), [records]);
  const interactions = useMemo(() => getInteractionsFromRecords(records), [records]);
  const recentMedications = useMemo(
    () => (selectedRecord ? getRecentMedicationHistory(selectedRecord.medicationHistory, 10) : []),
    [selectedRecord]
  );

  const hasCritical = hasCriticalInteractions(interactions);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading pharmacy records...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Error Loading Records</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={clearErrorMessage}>
          <Text style={styles.retryButtonText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (records.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>No Pharmacy Records Found</Text>
        <Text style={styles.emptyText}>
          No pharmacy records available for {patientName}. Contact the pharmacy to ensure records
          are synchronized.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Pharmacy Records</Text>
        <Text style={styles.subtitle}>{patientName}</Text>
      </View>

      {/* Critical Alert */}
      {hasCritical && (
        <View style={styles.alertBox}>
          <Text style={styles.alertIcon}>⚠️</Text>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Critical Interactions Found</Text>
            <Text style={styles.alertText}>
              Review medication interactions before administering medications
            </Text>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['overview', 'medications', 'allergies', 'interactions'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab as typeof activeTab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <View style={styles.content}>
          {/* Summary Cards */}
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{medicationSummary.totalMedicationsDispensed}</Text>
              <Text style={styles.summaryLabel}>Medications</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{medicationSummary.pharmacies}</Text>
              <Text style={styles.summaryLabel}>Pharmacies</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{medicationSummary.recentMedications}</Text>
              <Text style={styles.summaryLabel}>Recent (30 days)</Text>
            </View>
          </View>

          {/* Pharmacy Info */}
          {selectedRecord && (
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Current Pharmacy</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{selectedRecord.pharmacyName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last Updated:</Text>
                <Text style={styles.infoValue}>{formatDateTime(selectedRecord.lastUpdated)}</Text>
              </View>
            </View>
          )}

          {/* Recent Medications */}
          {recentMedications.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Medications</Text>
              {recentMedications.slice(0, 3).map((med) => (
                <View key={med.medicationId} style={styles.medicationItem}>
                  <View style={styles.medicationHeader}>
                    <Text style={styles.medicationName}>{med.name}</Text>
                    <Text style={styles.medicationDate}>{formatDate(med.dispensedDate)}</Text>
                  </View>
                  <Text style={styles.medicationQuantity}>
                    Quantity: {med.quantity} units
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {activeTab === 'medications' && (
        <View style={styles.content}>
          {selectedRecord && selectedRecord.medicationHistory.length > 0 ? (
            <View>
              <Text style={styles.sectionTitle}>Medication History</Text>
              <FlatList
                scrollEnabled={false}
                data={sortMedicationHistoryByDate(selectedRecord.medicationHistory)}
                keyExtractor={(item) => item.medicationId + item.dispensedDate}
                renderItem={({ item }) => (
                  <View style={styles.medicationItem}>
                    <View style={styles.medicationHeader}>
                      <Text style={styles.medicationName}>{item.name}</Text>
                      <Text style={styles.medicationDate}>{formatDate(item.dispensedDate)}</Text>
                    </View>
                    <Text style={styles.medicationQuantity}>
                      Quantity: {item.quantity} units
                    </Text>
                  </View>
                )}
              />
            </View>
          ) : (
            <Text style={styles.emptyText}>No medication history available</Text>
          )}
        </View>
      )}

      {activeTab === 'allergies' && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Known Allergies</Text>
          {allergies.length > 0 ? (
            <View>
              {allergies.map((allergy, index) => (
                <View key={index} style={styles.allergyItem}>
                  <Text style={styles.allergyIcon}>🚫</Text>
                  <Text style={styles.allergyText}>{allergy}</Text>
                </View>
              ))}
              <View style={styles.warningBox}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningText}>
                  Always verify allergies before prescribing or administering medications
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>No allergies recorded</Text>
          )}
        </View>
      )}

      {activeTab === 'interactions' && (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Drug Interactions</Text>
          {interactions.length > 0 ? (
            <View>
              {interactions.map((interaction, index) => (
                <View
                  key={index}
                  style={[
                    styles.interactionItem,
                    interaction.toLowerCase().includes('critical') && styles.criticalInteraction,
                  ]}
                >
                  <Text style={styles.interactionIcon}>
                    {interaction.toLowerCase().includes('critical') ? '⛔' : 'ℹ️'}
                  </Text>
                  <Text style={styles.interactionText}>{interaction}</Text>
                </View>
              ))}
              <View style={styles.warningBox}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningText}>
                  Consult the pharmacist before administering medications to resolve interactions
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>No interactions recorded</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  alertBox: {
    flexDirection: 'row',
    margin: 16,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  alertIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#856404',
  },
  alertText: {
    fontSize: 12,
    color: '#856404',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#007AFF',
  },
  content: {
    padding: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'right',
  },
  medicationItem: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  medicationDate: {
    fontSize: 12,
    color: '#999',
  },
  medicationQuantity: {
    fontSize: 12,
    color: '#666',
  },
  allergyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  allergyIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  allergyText: {
    fontSize: 14,
    color: '#d32f2f',
    fontWeight: '600',
    flex: 1,
  },
  interactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  criticalInteraction: {
    borderLeftColor: '#d32f2f',
    backgroundColor: '#ffebee',
  },
  interactionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  interactionText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    lineHeight: 18,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
    flex: 1,
    lineHeight: 16,
  },
});

export default PharmacyRecordsScreen;
