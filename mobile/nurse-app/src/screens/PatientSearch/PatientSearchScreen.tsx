/**
 * Patient Search Screen
 * Search for patients by name, ID, or room number
 */

import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { setSelectedPatient } from '../../store/patientSlice';

const PatientSearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { searchResults } = useAppSelector((state) => state.patient);
  const [searchQuery, setSearchQuery] = useState('');

  const handlePatientSelect = (patient: any) => {
    dispatch(setSelectedPatient(patient));
    navigation.navigate('PatientDetail' as never);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patient Search</Text>
      
      <TextInput
        style={styles.searchInput}
        placeholder="Search by name, ID, or room number"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.patientItem}
            onPress={() => handlePatientSelect(item)}
          >
            <Text style={styles.patientName}>
              {item.firstName} {item.lastName}
            </Text>
            <Text style={styles.patientInfo}>ID: {item.id}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No patients found</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  patientItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  patientInfo: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
  },
});

export default PatientSearchScreen;
