/**
 * Patient Medications Screen - View patient's current medications and schedule
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loadPatientMedications } from '../../store/slices/medicationSlice';
import { AppDispatch, RootState } from '../../store';
import { Medication } from '../../types';
import { format } from 'date-fns';

const PatientMedicationsScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { patientId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const { medications, loading } = useSelector((state: RootState) => state.medications);
  const { selectedPatient } = useSelector((state: RootState) => state.patients);

  useEffect(() => {
    if (patientId) {
      dispatch(loadPatientMedications(patientId));
    }
  }, [patientId, dispatch]);

  const handleRecordAdministration = (medication: Medication) => {
    navigation.navigate('Administration', { medication, patientId });
  };

  const handleOrderMedication = () => {
    navigation.navigate('MedicationOrder', { patientId });
  };

  const renderMedication = ({ item }: { item: Medication }) => (
    <View style={styles.medicationCard}>
      <View style={styles.medicationHeader}>
        <View style={styles.medicationInfo}>
          <Text style={styles.medicationName}>{item.name}</Text>
          {item.genericName && (
            <Text style={styles.genericName}>{item.genericName}</Text>
          )}
          <Text style={styles.dosage}>
            {item.dosage} {item.unit} - {item.frequency}
          </Text>
          <Text style={styles.route}>Route: {item.route}</Text>
        </View>
        <View style={[styles.statusBadge, item.status === 'active' ? styles.activeStatus : styles.inactiveStatus]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      {item.instructions && (
        <Text style={styles.instructions}>{item.instructions}</Text>
      )}

      <View style={styles.schedule}>
        <Text style={styles.scheduleTitle}>Administration Schedule</Text>
        {item.administrationSchedule.slice(0, 3).map((schedule, index) => (
          <View key={index} style={styles.scheduleItem}>
            <Text style={styles.scheduleTime}>
              {format(new Date(schedule.scheduledTime), 'HH:mm')}
            </Text>
            <View style={[styles.statusDot, schedule.administered ? styles.administeredDot : styles.pendingDot]} />
            <Text style={styles.scheduleStatus}>
              {schedule.administered ? 'Administered' : 'Pending'}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.administerButton}
        onPress={() => handleRecordAdministration(item)}
      >
        <Text style={styles.administerButtonText}>Record Administration</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
        <Text style={styles.loadingText}>Loading medications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {selectedPatient && (
        <View style={styles.header}>
          <Text style={styles.patientName}>
            {selectedPatient.firstName} {selectedPatient.lastName}
          </Text>
          <Text style={styles.patientMrn}>MRN: {selectedPatient.mrn}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.orderButton}
        onPress={handleOrderMedication}
      >
        <Text style={styles.orderButtonText}>+ Order New Medication</Text>
      </TouchableOpacity>

      {medications.length > 0 ? (
        <FlatList
          data={medications}
          renderItem={renderMedication}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No medications found for this patient</Text>
        </View>
      )}
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
    borderBottomColor: '#E1E8ED',
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  patientMrn: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  orderButton: {
    backgroundColor: '#27AE60',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  medicationCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  genericName: {
    fontSize: 14,
    color: '#7F8C8D',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  dosage: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 2,
  },
  route: {
    fontSize: 12,
    color: '#95A5A6',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    height: 28,
  },
  activeStatus: {
    backgroundColor: '#27AE60',
  },
  inactiveStatus: {
    backgroundColor: '#95A5A6',
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  instructions: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  schedule: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  scheduleTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    width: 60,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  administeredDot: {
    backgroundColor: '#27AE60',
  },
  pendingDot: {
    backgroundColor: '#F39C12',
  },
  scheduleStatus: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  administerButton: {
    backgroundColor: '#3498DB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  administerButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#95A5A6',
    textAlign: 'center',
  },
});

export default PatientMedicationsScreen;
