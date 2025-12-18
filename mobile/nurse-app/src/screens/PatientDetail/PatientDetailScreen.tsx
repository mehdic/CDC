/**
 * Patient Detail Screen
 * View patient details, allergies, and current medications
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

import { useAppSelector } from '../../hooks/useRedux';

const PatientDetailScreen: React.FC = () => {
  const { selectedPatient } = useAppSelector((state) => state.patient);

  if (!selectedPatient) {
    return (
      <View style={styles.container}>
        <Text>No patient selected</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patient Information</Text>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>
          {selectedPatient.firstName} {selectedPatient.lastName}
        </Text>
        <Text style={styles.label}>Date of Birth:</Text>
        <Text style={styles.value}>{selectedPatient.dateOfBirth}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Allergies</Text>
        {selectedPatient.allergies.length > 0 ? (
          selectedPatient.allergies.map((allergy, index) => (
            <Text key={index} style={styles.allergyItem}>
              {allergy}
            </Text>
          ))
        ) : (
          <Text style={styles.emptyText}>No known allergies</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Medications</Text>
        {selectedPatient.currentMedications?.length > 0 ? (
          selectedPatient.currentMedications.map((med) => (
            <View key={med.id} style={styles.medicationItem}>
              <Text style={styles.medicationName}>{med.name}</Text>
              <Text style={styles.medicationDosage}>{med.dosage}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No current medications</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    marginBottom: 8,
  },
  allergyItem: {
    padding: 10,
    backgroundColor: '#fff3cd',
    borderRadius: 6,
    marginBottom: 8,
    color: '#856404',
  },
  medicationItem: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
  },
  medicationDosage: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
  },
});

export default PatientDetailScreen;
