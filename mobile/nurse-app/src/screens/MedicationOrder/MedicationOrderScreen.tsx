/**
 * Medication Order Screen
 * Allows nurses to create medication orders for patients
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { nurseApiClient } from '../../services/nurseApiClient';
import { OrderMedication } from '../../types';
import { MedicationOrderScreenProps } from '../../navigation/types';

export const MedicationOrderScreen = ({
  navigation,
  route,
}: MedicationOrderScreenProps) => {
  const { patientId, patientName } = route.params;
  const { nurse } = useSelector((state: RootState) => state.auth);

  const [medications, setMedications] = useState<OrderMedication[]>([
    {
      medicationId: '',
      name: '',
      dosage: '',
      quantity: 1,
      prescriptionId: '',
      validated: false,
    },
  ]);
  const [urgency, setUrgency] = useState<'routine' | 'urgent' | 'stat'>('routine');
  const [pharmacyId, setPharmacyId] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [requiredBy, setRequiredBy] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const addMedication = () => {
    setMedications([
      ...medications,
      {
        medicationId: '',
        name: '',
        dosage: '',
        quantity: 1,
        prescriptionId: '',
        validated: false,
      },
    ]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: string, value: any) => {
    const updated = medications.map((med, i) => {
      if (i === index) {
        return { ...med, [field]: value };
      }
      return med;
    });
    setMedications(updated);
  };

  const validateOrder = (): boolean => {
    if (!pharmacyId || !pharmacyName) {
      Alert.alert('Error', 'Please select a pharmacy');
      return false;
    }

    if (medications.length === 0) {
      Alert.alert('Error', 'Please add at least one medication');
      return false;
    }

    for (const med of medications) {
      if (!med.name || !med.dosage || !med.quantity || !med.prescriptionId) {
        Alert.alert('Error', 'Please fill in all medication details');
        return false;
      }
    }

    return true;
  };

  const submitOrder = async () => {
    if (!validateOrder() || !nurse) {
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        patientId,
        patientName,
        nurseId: nurse.id,
        nurseName: `${nurse.firstName} ${nurse.lastName}`,
        pharmacyId,
        pharmacyName,
        medications,
        urgency,
        requiredBy: requiredBy || undefined,
        notes: notes || undefined,
        status: 'pending' as const,
      };

      const order = await nurseApiClient.createMedicationOrder(orderData);

      Alert.alert(
        'Success',
        `Order #${order.id} created successfully`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patient Information</Text>
        <Text style={styles.patientName}>{patientName}</Text>
        <Text style={styles.patientId}>MRN: {patientId}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pharmacy</Text>
        <TextInput
          style={styles.input}
          placeholder="Pharmacy Name"
          value={pharmacyName}
          onChangeText={setPharmacyName}
        />
        <TextInput
          style={styles.input}
          placeholder="Pharmacy ID"
          value={pharmacyId}
          onChangeText={setPharmacyId}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Urgency</Text>
        <View style={styles.urgencyButtons}>
          {(['routine', 'urgent', 'stat'] as const).map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.urgencyButton,
                urgency === level && styles.urgencyButtonActive,
                level === 'stat' && styles.statButton,
              ]}
              onPress={() => setUrgency(level)}
            >
              <Text
                style={[
                  styles.urgencyButtonText,
                  urgency === level && styles.urgencyButtonTextActive,
                ]}
              >
                {level.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Medications</Text>
          <TouchableOpacity onPress={addMedication} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {medications.map((med, index) => (
          <View key={index} style={styles.medicationCard}>
            <View style={styles.medicationHeader}>
              <Text style={styles.medicationIndex}>#{index + 1}</Text>
              {medications.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeMedication(index)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Medication Name *"
              value={med.name}
              onChangeText={(value) => updateMedication(index, 'name', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Dosage (e.g., 500mg) *"
              value={med.dosage}
              onChangeText={(value) => updateMedication(index, 'dosage', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Quantity *"
              keyboardType="numeric"
              value={String(med.quantity)}
              onChangeText={(value) =>
                updateMedication(index, 'quantity', parseInt(value, 10) || 1)
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Prescription ID *"
              value={med.prescriptionId}
              onChangeText={(value) => updateMedication(index, 'prescriptionId', value)}
            />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Information</Text>
        <TextInput
          style={styles.input}
          placeholder="Required By (optional)"
          value={requiredBy}
          onChangeText={setRequiredBy}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={submitOrder}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.submitButtonText}>Create Order</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  section: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#34495E',
    marginBottom: 4,
  },
  patientId: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDE2E8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#FAFBFC',
  },
  textArea: {
    height: 100,
  },
  urgencyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  urgencyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDE2E8',
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  urgencyButtonActive: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  statButton: {
    borderColor: '#E74C3C',
  },
  urgencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  urgencyButtonTextActive: {
    color: '#FFF',
  },
  addButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  medicationCard: {
    borderWidth: 1,
    borderColor: '#DDE2E8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#FAFBFC',
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicationIndex: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498DB',
  },
  removeButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  removeButtonText: {
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#27AE60',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#95A5A6',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MedicationOrderScreen;
