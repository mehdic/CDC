/**
 * Administration Log Screen
 * Display medication administration history with filtering and search
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  SectionList,
  Modal,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import {
  loadAdministrationHistory,
  setSortBy,
  clearFilters,
} from '../../store/administrationSlice';
import { MedicationAdministration } from '../../types';

const AdministrationLogScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    administrations,
    filteredAdministrations,
    loading,
    error,
    filterPatientId,
    filterMedicationId,
    sortBy,
  } = useSelector((state: RootState) => state.administration);
  const { nurse } = useSelector((state: RootState) => state.auth);

  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MedicationAdministration | null>(null);

  useEffect(() => {
    if (nurse?.id) {
      loadHistory();
    }
  }, [nurse?.id]);

  const loadHistory = useCallback(async (): Promise<void> => {
    if (!nurse) return;
    try {
      // Load history for current nurse's patients (in real implementation)
      // For now, we'll just load all available
      await dispatch(loadAdministrationHistory(nurse.id)).unwrap();
    } catch (error) {
      console.error('Failed to load administration history:', error);
    }
  }, [dispatch, nurse]);

  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    try {
      await loadHistory();
    } finally {
      setRefreshing(false);
    }
  }, [loadHistory]);

  const handleSearch = useCallback((text: string): void => {
    setSearchText(text);
  }, []);

  const getFilteredData = (): MedicationAdministration[] => {
    let data = [...filteredAdministrations];
    if (searchText) {
      data = data.filter(
        (item) =>
          item.medicationId.toLowerCase().includes(searchText.toLowerCase()) ||
          item.patientId.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    return data;
  };

  const groupByDate = (
    data: MedicationAdministration[]
  ): Array<{
    title: string;
    data: MedicationAdministration[];
  }> => {
    const grouped: {
      [key: string]: MedicationAdministration[];
    } = {};

    data.forEach((item) => {
      const date = new Date(item.administeredAt);
      const dateKey = date.toLocaleDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    });

    return Object.entries(grouped)
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([title, items]) => ({
        title,
        data: items,
      }));
  };

  const renderAdministrationItem = ({
    item,
  }: {
    item: MedicationAdministration;
  }): React.ReactElement => (
    <TouchableOpacity
      style={styles.logItem}
      onPress={() => setSelectedItem(item)}
    >
      <View style={styles.itemHeader}>
        <Text style={styles.medicationName}>{item.id}</Text>
        {item.barcodeVerified && (
          <Text style={styles.verifiedBadge}>✓ Verified</Text>
        )}
      </View>
      <Text style={styles.itemDetail}>Dosage: {item.dosage}</Text>
      <Text style={styles.itemDetail}>Route: {item.route.toUpperCase()}</Text>
      <Text style={styles.itemDetail}>
        Time: {new Date(item.administeredAt).toLocaleTimeString()}
      </Text>
      {item.sideEffects && item.sideEffects.length > 0 && (
        <View style={styles.sideEffectsWarning}>
          <Text style={styles.sideEffectsText}>
            Side Effects: {item.sideEffects.join(', ')}
          </Text>
        </View>
      )}
      {item.witnessed && (
        <Text style={styles.witnessText}>Witnessed by: {item.witnessedBy}</Text>
      )}
      {item.notes && (
        <Text style={styles.notesText}>Notes: {item.notes}</Text>
      )}
    </TouchableOpacity>
  );

  const renderSectionHeader = ({
    section: { title },
  }: {
    section: { title: string };
  }): React.ReactElement => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const renderDetailsModal = (): React.ReactElement | null => {
    if (!selectedItem) return null;
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.detailsOverlay}>
          <View style={styles.detailsCard}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedItem(null)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>

            <Text style={styles.detailsTitle}>Administration Details</Text>

            <View style={styles.detailsContent}>
              <DetailRow label="Medication ID" value={selectedItem.id} />
              <DetailRow label="Patient ID" value={selectedItem.patientId} />
              <DetailRow label="Dosage" value={selectedItem.dosage} />
              <DetailRow label="Route" value={selectedItem.route} />
              <DetailRow
                label="Administered At"
                value={new Date(selectedItem.administeredAt).toLocaleString()}
              />
              <DetailRow label="Administered By" value={selectedItem.administeredBy} />
              <DetailRow
                label="Barcode Verified"
                value={selectedItem.barcodeVerified ? 'Yes' : 'No'}
              />
              {selectedItem.witnessed && (
                <DetailRow label="Witnessed By" value={selectedItem.witnessedBy || 'N/A'} />
              )}
              {selectedItem.sideEffects && selectedItem.sideEffects.length > 0 && (
                <DetailRow
                  label="Side Effects"
                  value={selectedItem.sideEffects.join(', ')}
                />
              )}
              {selectedItem.notes && (
                <DetailRow label="Notes" value={selectedItem.notes} />
              )}
            </View>

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setSelectedItem(null)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading && administrations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  const filteredData = getFilteredData();
  const groupedData = groupByDate(filteredData);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Administration Log</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Text style={styles.filterButtonText}>⚙ Filter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search medication or patient..."
          placeholderTextColor="#95A5A6"
          value={searchText}
          onChangeText={handleSearch}
        />
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {(filterPatientId || filterMedicationId) && (
        <View style={styles.activeFilters}>
          <Text style={styles.filterTag}>Filters Active</Text>
          <TouchableOpacity onPress={() => dispatch(clearFilters())}>
            <Text style={styles.clearFiltersText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {groupedData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No administration records found</Text>
        </View>
      ) : (
        <SectionList
          sections={groupedData}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderAdministrationItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#3498DB']}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {renderDetailsModal()}

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        currentSort={sortBy}
        onSortChange={(sort) => {
          dispatch(setSortBy(sort));
          setShowFilterModal(false);
        }}
      />
    </View>
  );
};

interface DetailRowProps {
  readonly label: string;
  readonly value: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

interface FilterModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly currentSort: 'date' | 'medication' | 'patient';
  readonly onSortChange: (sort: 'date' | 'medication' | 'patient') => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  currentSort,
  onSortChange,
}) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.filterModalOverlay}>
      <View style={styles.filterModalContent}>
        <Text style={styles.filterModalTitle}>Sort By</Text>

        {(['date', 'medication', 'patient'] as const).map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.filterOption,
              currentSort === option && styles.filterOptionSelected,
            ]}
            onPress={() => onSortChange(option)}
          >
            <Text
              style={[
                styles.filterOptionText,
                currentSort === option && styles.filterOptionTextSelected,
              ]}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.filterModalCloseButton} onPress={onClose}>
          <Text style={styles.filterModalCloseButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#FFF',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  filterButton: {
    backgroundColor: '#3498DB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  filterButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  searchContainer: {
    backgroundColor: '#FFF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#DDE2E8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FAFBFC',
    color: '#2C3E50',
  },
  errorBanner: {
    backgroundColor: '#E74C3C',
    padding: 12,
  },
  errorText: {
    color: '#FFF',
    fontSize: 14,
  },
  activeFilters: {
    backgroundColor: '#D4EDDA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterTag: {
    color: '#155724',
    fontWeight: '600',
  },
  clearFiltersText: {
    color: '#155724',
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#95A5A6',
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  sectionHeader: {
    backgroundColor: '#ECF0F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  logItem: {
    backgroundColor: '#FFF',
    padding: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
    flex: 1,
  },
  verifiedBadge: {
    backgroundColor: '#27AE60',
    color: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  itemDetail: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
  },
  sideEffectsWarning: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 6,
  },
  sideEffectsText: {
    color: '#856404',
    fontSize: 12,
    fontWeight: '600',
  },
  witnessText: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
    fontStyle: 'italic',
  },
  notesText: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
  },
  // Details modal
  detailsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  detailsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    minWidth: '85%',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
    marginTop: 8,
  },
  detailsContent: {
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#2C3E50',
  },
  closeModalButton: {
    backgroundColor: '#3498DB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  // Filter modal
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#FFF',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    minHeight: 240,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F5F7FA',
  },
  filterOptionSelected: {
    backgroundColor: '#3498DB',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  filterOptionTextSelected: {
    color: '#FFF',
    fontWeight: '700',
  },
  filterModalCloseButton: {
    backgroundColor: '#27AE60',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  filterModalCloseButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AdministrationLogScreen;
