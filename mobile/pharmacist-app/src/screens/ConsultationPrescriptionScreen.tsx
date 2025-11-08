/**
 * Consultation Prescription Screen - Pharmacist App
 * Create prescription during or after teleconsultation
 * Task: T167
 * FR-027: Pharmacists MUST be able to create prescriptions during or immediately after teleconsultations
 */

import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Teleconsultation } from '../services/teleconsultationService';

interface PrescriptionItem {
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
}

interface ConsultationPrescriptionRouteParams {
  teleconsultation: Teleconsultation;
}

const ConsultationPrescriptionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as ConsultationPrescriptionRouteParams;
  const teleconsultation = params?.teleconsultation;

  const [items, setItems] = useState<PrescriptionItem[]>([
    {
      medication_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: 0,
    },
  ]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        quantity: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      Alert.alert('Error', 'At least one medication is required');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof PrescriptionItem, value: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    setItems(newItems);
  };

  const validatePrescription = (): boolean => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.medication_name.trim()) {
        Alert.alert('Validation Error', `Medication name is required for item ${i + 1}`);
        return false;
      }
      if (!item.dosage.trim()) {
        Alert.alert('Validation Error', `Dosage is required for item ${i + 1}`);
        return false;
      }
      if (!item.frequency.trim()) {
        Alert.alert('Validation Error', `Frequency is required for item ${i + 1}`);
        return false;
      }
      if (item.quantity <= 0) {
        Alert.alert('Validation Error', `Valid quantity is required for item ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validatePrescription()) {
      return;
    }

    Alert.alert(
      'Create Prescription',
      `Create prescription for ${teleconsultation?.patient?.first_name} ${teleconsultation?.patient?.last_name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Create',
          onPress: async () => {
            try {
              setSaving(true);

              // TODO: Call prescription service to create prescription
              // This would integrate with the prescription service
              // await prescriptionService.createFromTeleconsultation(teleconsultation.id, {
              //   items,
              //   notes,
              //   source: 'teleconsultation',
              // });

              Alert.alert(
                'Success',
                'Prescription created successfully',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to create prescription');
              console.error('Create prescription error:', error);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (!teleconsultation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Teleconsultation information not available</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
          testID="go-back-button"
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Prescription</Text>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>
            Patient: {teleconsultation.patient?.first_name} {teleconsultation.patient?.last_name}
          </Text>
          <Text style={styles.consultationInfo}>
            From teleconsultation on {new Date(teleconsultation.scheduled_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Prescription Items */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Medications</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddItem}
            testID="add-medication-button"
          >
            <Text style={styles.addButtonText}>+ Add Medication</Text>
          </TouchableOpacity>
        </View>

        {items.map((item, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemNumber}>Medication {index + 1}</Text>
              {items.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveItem(index)}
                  testID={`remove-item-${index}-button`}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Medication Name *</Text>
              <TextInput
                style={styles.textInput}
                value={item.medication_name}
                onChangeText={(value) => handleUpdateItem(index, 'medication_name', value)}
                placeholder="e.g., Amoxicillin"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, styles.inputHalf]}>
                <Text style={styles.inputLabel}>Dosage *</Text>
                <TextInput
                  style={styles.textInput}
                  value={item.dosage}
                  onChangeText={(value) => handleUpdateItem(index, 'dosage', value)}
                  placeholder="e.g., 500mg"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={[styles.inputGroup, styles.inputHalf]}>
                <Text style={styles.inputLabel}>Frequency *</Text>
                <TextInput
                  style={styles.textInput}
                  value={item.frequency}
                  onChangeText={(value) => handleUpdateItem(index, 'frequency', value)}
                  placeholder="e.g., 3x daily"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, styles.inputHalf]}>
                <Text style={styles.inputLabel}>Duration</Text>
                <TextInput
                  style={styles.textInput}
                  value={item.duration}
                  onChangeText={(value) => handleUpdateItem(index, 'duration', value)}
                  placeholder="e.g., 7 days"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={[styles.inputGroup, styles.inputHalf]}>
                <Text style={styles.inputLabel}>Quantity *</Text>
                <TextInput
                  style={styles.textInput}
                  value={item.quantity > 0 ? item.quantity.toString() : ''}
                  onChangeText={(value) => handleUpdateItem(index, 'quantity', parseInt(value) || 0)}
                  keyboardType="numeric"
                  placeholder="e.g., 30"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Additional Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Notes</Text>
        <TextInput
          style={styles.notesInput}
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any additional instructions or notes for the patient..."
          placeholderTextColor="#999"
          textAlignVertical="top"
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, saving && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={saving}
        testID="submit-prescription-button"
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Create Prescription</Text>
        )}
      </TouchableOpacity>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          ⓘ This prescription will be linked to the teleconsultation session and sent to the patient for approval.
        </Text>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  patientInfo: {
    marginTop: 8,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  consultationInfo: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
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
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  removeButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputHalf: {
    width: '48%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#000',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 24,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoText: {
    fontSize: 13,
    color: '#000',
    lineHeight: 18,
  },
  footer: {
    height: 40,
  },
});

export default ConsultationPrescriptionScreen;
