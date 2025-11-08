/**
 * Prescription List Screen
 * Displays all prescriptions for the patient with filtering and search
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
  SafeAreaView,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import {
  fetchPrescriptions,
  refreshPrescriptions,
  loadMorePrescriptions,
  selectPrescriptions,
  selectLoading,
  selectPagination,
} from '../store/prescriptionSlice';
import { Prescription, PrescriptionStatus } from '@metapharm/api-types';
import PrescriptionStatusBadge from '../components/PrescriptionStatusBadge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const PrescriptionListScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);

  const dispatch = useDispatch();
  const navigation = useNavigation();

  const prescriptions = useSelector(selectPrescriptions);
  const loading = useSelector(selectLoading);
  const pagination = useSelector(selectPagination);

  // TODO: Get actual patient ID from auth context
  const patientId = 'mock-patient-id';

  /**
   * Load prescriptions on mount
   */
  useEffect(() => {
    handleLoadPrescriptions();
  }, []);

  /**
   * Load prescriptions
   */
  const handleLoadPrescriptions = () => {
    dispatch(fetchPrescriptions({ patientId, page: 1, limit: 20 }) as any);
  };

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(refreshPrescriptions({ patientId }) as any);
    setRefreshing(false);
  };

  /**
   * Load more prescriptions (pagination)
   */
  const handleLoadMore = () => {
    if (!loading && pagination.hasMore) {
      dispatch(loadMorePrescriptions({ patientId }) as any);
    }
  };

  /**
   * Navigate to prescription detail
   */
  const handlePrescriptionPress = (prescription: Prescription) => {
    navigation.navigate('PrescriptionDetail' as never, { prescriptionId: prescription.id } as never);
  };

  /**
   * Navigate to upload screen
   */
  const handleUploadPress = () => {
    navigation.navigate('PrescriptionUpload' as never);
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMM yyyy', { locale: fr });
    } catch (error) {
      return dateString;
    }
  };

  /**
   * Render prescription item
   */
  const renderPrescriptionItem = ({ item }: { item: Prescription }) => (
    <TouchableOpacity
      style={styles.prescriptionCard}
      onPress={() => handlePrescriptionPress(item)}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {item.thumbnailUrl || item.imageUrl ? (
          <Image
            source={{ uri: item.thumbnailUrl || item.imageUrl }}
            style={styles.thumbnail}
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Text style={styles.thumbnailIcon}>📄</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          <PrescriptionStatusBadge status={item.status} size="small" />
        </View>

        {item.prescribingDoctorName && (
          <Text style={styles.doctor}>Dr. {item.prescribingDoctorName}</Text>
        )}

        {item.transcriptionData?.medications && item.transcriptionData.medications.length > 0 ? (
          <View style={styles.medications}>
            <Text style={styles.medicationsLabel}>Médicaments:</Text>
            {item.transcriptionData.medications.slice(0, 2).map((med, index) => (
              <Text key={index} style={styles.medicationName}>
                • {med.medicationName}
              </Text>
            ))}
            {item.transcriptionData.medications.length > 2 && (
              <Text style={styles.moreText}>
                +{item.transcriptionData.medications.length - 2} autre(s)
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.noMedications}>Transcription en attente...</Text>
        )}
      </View>

      {/* Chevron */}
      <View style={styles.chevronContainer}>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>Aucune ordonnance</Text>
      <Text style={styles.emptyText}>
        Vous n'avez pas encore d'ordonnances. Commencez par en télécharger une!
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleUploadPress}>
        <Text style={styles.emptyButtonText}>Télécharger une ordonnance</Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Render footer (loading more indicator)
   */
  const renderFooter = () => {
    if (!loading || !pagination.hasMore) {
      return null;
    }

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Ordonnances</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPress}>
          <Text style={styles.uploadButtonText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {loading && prescriptions.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <FlatList
          data={prescriptions}
          renderItem={renderPrescriptionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            prescriptions.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  uploadButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  listEmpty: {
    flex: 1,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  prescriptionCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  thumbnailContainer: {
    marginRight: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailIcon: {
    fontSize: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  doctor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  medications: {
    marginTop: 4,
  },
  medicationsLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  medicationName: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  moreText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    marginTop: 2,
  },
  noMedications: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  chevronContainer: {
    justifyContent: 'center',
    marginLeft: 8,
  },
  chevron: {
    fontSize: 24,
    color: '#D1D5DB',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PrescriptionListScreen;
