/**
 * Prescription Queue Screen
 * Displays list of pending/in-review prescriptions for pharmacist review
 * T106 - User Story 1: Prescription Processing & Validation
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchPrescriptionQueue, setFilters } from '../store/queueSlice';
import { Prescription, PrescriptionStatus } from '../services/prescriptionService';
import { ConfidenceWarning } from '../components/ConfidenceWarning';

// ============================================================================
// Types
// ============================================================================

export interface PrescriptionQueueScreenProps {
  navigation: any;
}

// ============================================================================
// Component
// ============================================================================

export const PrescriptionQueueScreen: React.FC<PrescriptionQueueScreenProps> = ({
  navigation,
}) => {
  const dispatch = useDispatch();
  const { prescriptions, loading, filters, pagination, error } = useSelector(
    (state: any) => state.queue
  );

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadQueue();
  }, [filters]);

  const loadQueue = async () => {
    await dispatch(fetchPrescriptionQueue() as any);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadQueue();
    setRefreshing(false);
  };

  const handlePrescriptionPress = (prescription: Prescription) => {
    navigation.navigate('PrescriptionReview', { prescriptionId: prescription.id });
  };

  const getStatusColor = (status: PrescriptionStatus) => {
    switch (status) {
      case PrescriptionStatus.PENDING:
        return '#F59E0B'; // Yellow
      case PrescriptionStatus.IN_REVIEW:
        return '#3B82F6'; // Blue
      case PrescriptionStatus.CLARIFICATION_NEEDED:
        return '#EF4444'; // Red
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: PrescriptionStatus) => {
    switch (status) {
      case PrescriptionStatus.PENDING:
        return 'Pending';
      case PrescriptionStatus.IN_REVIEW:
        return 'In Review';
      case PrescriptionStatus.CLARIFICATION_NEEDED:
        return 'Needs Clarification';
      default:
        return status;
    }
  };

  const renderPrescriptionCard = ({ item }: { item: Prescription }) => {
    const hasLowConfidence = item.ai_confidence_score !== null && item.ai_confidence_score < 80;
    const hasSafetyWarnings =
      (item.drug_interactions && item.drug_interactions.length > 0) ||
      (item.allergy_warnings && item.allergy_warnings.length > 0) ||
      (item.contraindications && item.contraindications.length > 0);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handlePrescriptionPress(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Icon name="file-document-outline" size={24} color="#3B82F6" />
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Rx #{item.id.substring(0, 8)}</Text>
              <Text style={styles.cardSubtitle}>
                {new Date(item.created_at).toLocaleDateString()} •{' '}
                {new Date(item.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}
          >
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Icon name="account-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              Patient: {item.patient?.first_name || 'N/A'}
            </Text>
          </View>
          {item.prescribing_doctor && (
            <View style={styles.infoRow}>
              <Icon name="doctor" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                Dr. {item.prescribing_doctor?.last_name || 'N/A'}
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Icon name="pill" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              {item.items?.length || 0} medication{item.items?.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Warnings Section */}
        <View style={styles.warningsSection}>
          {hasLowConfidence && (
            <View style={styles.warningBadge}>
              <Icon name="alert" size={14} color="#D97706" />
              <Text style={styles.warningBadgeText}>
                Low Confidence ({Math.round(item.ai_confidence_score!)}%)
              </Text>
            </View>
          )}
          {hasSafetyWarnings && (
            <View style={[styles.warningBadge, styles.criticalBadge]}>
              <Icon name="alert-octagon" size={14} color="#DC2626" />
              <Text style={[styles.warningBadgeText, styles.criticalBadgeText]}>
                Safety Warnings
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.viewDetailsText}>Tap to review</Text>
          <Icon name="chevron-right" size={20} color="#3B82F6" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="check-circle-outline" size={64} color="#10B981" />
      <Text style={styles.emptyStateTitle}>All caught up!</Text>
      <Text style={styles.emptyStateText}>
        No prescriptions pending review at this time
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="clipboard-list-outline" size={28} color="#1F2937" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Prescription Queue</Text>
            <Text style={styles.headerSubtitle}>
              {pagination.total_items} pending review
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            /* TODO: Open filter modal */
          }}
        >
          <Icon name="filter-variant" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Icon name="alert-circle" size={18} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Queue List */}
      {loading.queue && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading queue...</Text>
        </View>
      ) : (
        <FlatList
          data={prescriptions}
          renderItem={renderPrescriptionCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  filterButton: {
    padding: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 6,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#991B1B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
  },
  warningsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  criticalBadge: {
    backgroundColor: '#FEE2E2',
  },
  warningBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 4,
  },
  criticalBadgeText: {
    color: '#991B1B',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default PrescriptionQueueScreen;
