/**
 * Patient Search Screen
 * Search for patients by name, ID, DOB, or room number
 * Includes filtering and sorting functionality
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SectionList,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import {
  setSelectedPatient,
  setSearchQuery,
  setSearchFilters,
  setAllPatients,
} from '../../store/patientSlice';
import {
  searchPatients,
  getActiveMedicationsCount,
  getLastVisitDate,
} from '../../utils/patientSearchUtils';
import { Patient } from '../../types/nurse';

const PatientSearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const {
    searchQuery,
    recentPatients,
    allPatients,
    isSearching,
  } = useAppSelector((state) => state.patient);

  const [showFilters, setShowFilters] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string | undefined>(undefined);
  const [selectedMedicationStatus, setSelectedMedicationStatus] = useState<
    'active' | 'inactive' | 'all'
  >('all');
  const [selectedSort, setSelectedSort] = useState<'name' | 'room' | 'recent'>('name');

  // Mock data for demonstration - in real app, fetch from API
  useEffect(() => {
    if (allPatients.length === 0) {
      const mockPatients: Patient[] = [
        {
          id: 'P001',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1960-05-15',
          roomNumber: '101',
          allergies: ['Penicillin'],
          chronicConditions: ['Hypertension'],
          currentMedications: [
            {
              id: 'M1',
              name: 'Lisinopril',
              dosage: '10mg',
              frequency: 'daily',
              route: 'oral',
              startDate: '2024-01-01',
              prescribedBy: 'Dr. Smith',
            },
          ],
          admissionDate: '2024-12-01',
        },
        {
          id: 'P002',
          firstName: 'Jane',
          lastName: 'Smith',
          dateOfBirth: '1970-08-22',
          roomNumber: '102',
          allergies: [],
          chronicConditions: ['Diabetes'],
          currentMedications: [
            {
              id: 'M2',
              name: 'Metformin',
              dosage: '500mg',
              frequency: 'twice daily',
              route: 'oral',
              startDate: '2024-06-15',
              prescribedBy: 'Dr. Johnson',
            },
            {
              id: 'M3',
              name: 'Lisinopril',
              dosage: '10mg',
              frequency: 'daily',
              route: 'oral',
              startDate: '2024-08-01',
              prescribedBy: 'Dr. Smith',
            },
          ],
          admissionDate: '2024-11-15',
        },
        {
          id: 'P003',
          firstName: 'Robert',
          lastName: 'Brown',
          dateOfBirth: '1945-03-10',
          roomNumber: '201',
          allergies: ['Aspirin'],
          chronicConditions: ['Heart Disease', 'Atrial Fibrillation'],
          currentMedications: [
            {
              id: 'M4',
              name: 'Warfarin',
              dosage: '5mg',
              frequency: 'daily',
              route: 'oral',
              startDate: '2024-07-01',
              prescribedBy: 'Dr. Wilson',
            },
          ],
          admissionDate: '2024-12-05',
        },
        {
          id: 'P004',
          firstName: 'Emma',
          lastName: 'Wilson',
          dateOfBirth: '1985-11-30',
          roomNumber: '103',
          allergies: [],
          chronicConditions: [],
          currentMedications: [],
          admissionDate: '2024-12-10',
        },
        {
          id: 'P005',
          firstName: 'Michael',
          lastName: 'Johnson',
          dateOfBirth: '1955-07-12',
          roomNumber: '104',
          allergies: ['NSAIDs'],
          chronicConditions: ['Arthritis'],
          currentMedications: [
            {
              id: 'M5',
              name: 'Acetaminophen',
              dosage: '500mg',
              frequency: 'as needed',
              route: 'oral',
              startDate: '2024-11-01',
              prescribedBy: 'Dr. Brown',
            },
          ],
          admissionDate: '2024-12-08',
        },
      ];
      dispatch(setAllPatients(mockPatients));
    }
  }, [dispatch, allPatients.length]);

  // Calculate filtered results
  const filteredResults = useMemo(() => {
    return searchPatients(allPatients, searchQuery, {
      unit: selectedUnit,
      medicationStatus: selectedMedicationStatus,
      sortBy: selectedSort,
    });
  }, [allPatients, searchQuery, selectedUnit, selectedMedicationStatus, selectedSort]);

  // Organize data into sections (Recent if available, then Search Results)
  const sections = useMemo(() => {
    const sectionData = [];

    if (!searchQuery && recentPatients.length > 0) {
      sectionData.push({
        title: 'Recent Patients',
        data: recentPatients,
        isRecent: true,
      });
    }

    if (filteredResults.length > 0) {
      sectionData.push({
        title: searchQuery ? 'Search Results' : 'All Patients',
        data: filteredResults,
        isRecent: false,
      });
    }

    return sectionData;
  }, [searchQuery, recentPatients, filteredResults]);

  const handlePatientSelect = (patient: Patient) => {
    dispatch(setSelectedPatient(patient));
    navigation.navigate('PatientDetail' as never);
  };

  const handleSearchChange = (text: string) => {
    dispatch(setSearchQuery(text));
  };

  const handleApplyFilters = () => {
    dispatch(
      setSearchFilters({
        unit: selectedUnit,
        medicationStatus: selectedMedicationStatus,
        sortBy: selectedSort,
      })
    );
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setSelectedUnit(undefined);
    setSelectedMedicationStatus('all');
    setSelectedSort('name');
    dispatch(setSearchQuery(''));
    dispatch(
      setSearchFilters({
        unit: undefined,
        medicationStatus: 'all',
        sortBy: 'name',
      })
    );
  };

  const PatientItem = ({ item }: { item: Patient }) => {
    const activeMeds = getActiveMedicationsCount(item);
    const lastVisit = getLastVisitDate(item);

    return (
      <TouchableOpacity
        style={styles.patientItem}
        onPress={() => handlePatientSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.patientHeaderRow}>
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderText}>
              {item.firstName.charAt(0)}{item.lastName.charAt(0)}
            </Text>
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>
              {item.firstName} {item.lastName}
            </Text>
            <Text style={styles.patientId}>ID: {item.id}</Text>
          </View>
        </View>

        <View style={styles.patientDetailsRow}>
          {item.roomNumber && (
            <View style={styles.detailBadge}>
              <Text style={styles.detailBadgeText}>
                {item.roomNumber}
              </Text>
            </View>
          )}
          <View style={styles.detailBadge}>
            <Text style={styles.detailBadgeText}>
              {activeMeds} med{activeMeds !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.detailBadge}>
            <Text style={styles.detailBadgeText}>{lastVisit}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const FilterPanel = () => (
    <ScrollView style={styles.filterPanel}>
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Unit/Ward</Text>
        {['1', '2', '3', '4'].map((unit) => (
          <TouchableOpacity
            key={unit}
            style={[
              styles.filterOption,
              selectedUnit === unit && styles.filterOptionActive,
            ]}
            onPress={() => setSelectedUnit(selectedUnit === unit ? undefined : unit)}
          >
            <Text
              style={[
                styles.filterOptionText,
                selectedUnit === unit && styles.filterOptionTextActive,
              ]}
            >
              {`Unit ${unit}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Medication Status</Text>
        {(['all', 'active', 'inactive'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterOption,
              selectedMedicationStatus === status && styles.filterOptionActive,
            ]}
            onPress={() => setSelectedMedicationStatus(status)}
          >
            <Text
              style={[
                styles.filterOptionText,
                selectedMedicationStatus === status && styles.filterOptionTextActive,
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Sort By</Text>
        {(['name', 'room', 'recent'] as const).map((sort) => (
          <TouchableOpacity
            key={sort}
            style={[
              styles.filterOption,
              selectedSort === sort && styles.filterOptionActive,
            ]}
            onPress={() => setSelectedSort(sort)}
          >
            <Text
              style={[
                styles.filterOptionText,
                selectedSort === sort && styles.filterOptionTextActive,
              ]}
            >
              {sort.charAt(0).toUpperCase() + sort.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterActions}>
        <TouchableOpacity
          style={styles.filterButtonSecondary}
          onPress={handleResetFilters}
        >
          <Text style={styles.filterButtonSecondaryText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButtonPrimary}
          onPress={handleApplyFilters}
        >
          <Text style={styles.filterButtonPrimaryText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patient Search</Text>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, ID, DOB, or room"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterButtonIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {showFilters && <FilterPanel />}

      {isSearching && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {!isSearching && sections.length > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => item.id + index}
          renderItem={({ item }) => <PatientItem item={item} />}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          stickySectionHeadersEnabled={true}
        />
      ) : !isSearching ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'No patients found matching your search'
              : 'No patients available'}
          </Text>
          {searchQuery && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => dispatch(setSearchQuery(''))}
            >
              <Text style={styles.clearSearchButtonText}>Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    color: '#333',
  },
  searchBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonIcon: {
    fontSize: 24,
  },
  filterPanel: {
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    maxHeight: 300,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterOptionActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
  },
  filterOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  filterButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  filterButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonPrimary: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  filterButtonPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    color: '#666',
  },
  patientItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  patientHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  photoPlaceholderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  patientId: {
    fontSize: 13,
    color: '#999',
  },
  patientDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailBadge: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  detailBadgeText: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  clearSearchButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  clearSearchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PatientSearchScreen;
