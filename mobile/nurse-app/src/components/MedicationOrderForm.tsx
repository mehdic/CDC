/**
 * Medication Order Form Component
 * Form for creating and managing medication orders
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import {
  updateOrderFormMedications,
  updateOrderFormUrgency,
  updateOrderFormNotes,
} from '../store/medicationSlice';

interface MedicationOrderFormProps {
  onSubmit: (formData: {
    patientId: string;
    medications: {
      medicationId: string;
      name: string;
      quantity: number;
      dosage: string;
    }[];
    urgency: 'routine' | 'urgent' | 'stat';
    notes?: string;
  }) => void;
  isSubmitting: boolean;
}

export const MedicationOrderForm: React.FC<MedicationOrderFormProps> = ({
  onSubmit,
  isSubmitting,
}) => {
  const dispatch = useAppDispatch();
  const { currentOrderForm, orderFormErrors } = useAppSelector(
    (state) => state.medication
  );

  const [medicationName, setMedicationName] = useState('');
  const [medicationDosage, setMedicationDosage] = useState('');
  const [medicationQuantity, setMedicationQuantity] = useState('');

  const handleAddMedication = () => {
    if (!medicationName.trim()) {
      Alert.alert('Validation', 'Please enter medication name');
      return;
    }
    if (!medicationDosage.trim()) {
      Alert.alert('Validation', 'Please enter dosage');
      return;
    }
    if (!medicationQuantity.trim() || isNaN(Number(medicationQuantity))) {
      Alert.alert('Validation', 'Please enter valid quantity');
      return;
    }

    const newMedication = {
      medicationId: `med-${Date.now()}`,
      name: medicationName,
      dosage: medicationDosage,
      quantity: parseInt(medicationQuantity, 10),
    };

    const currentMedications = currentOrderForm?.medications || [];
    dispatch(updateOrderFormMedications([...currentMedications, newMedication]));

    setMedicationName('');
    setMedicationDosage('');
    setMedicationQuantity('');
  };

  const handleRemoveMedication = (index: number) => {
    const updatedMedications =
      currentOrderForm?.medications.filter((_, i) => i !== index) || [];
    dispatch(updateOrderFormMedications(updatedMedications));
  };

  const handleUrgencyChange = (urgency: 'routine' | 'urgent' | 'stat') => {
    dispatch(updateOrderFormUrgency(urgency));
  };

  const handleNotesChange = (text: string) => {
    dispatch(updateOrderFormNotes(text));
  };

  const handleSubmit = () => {
    if (!currentOrderForm) {
      Alert.alert('Error', 'Form not initialized');
      return;
    }

    onSubmit(currentOrderForm);
  };

  if (!currentOrderForm) {
    return <ActivityIndicator size="large" color="#007AFF" />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medication Selection</Text>

        <View style={styles.medicationInput}>
          <TextInput
            style={styles.input}
            placeholder="Medication Name"
            value={medicationName}
            onChangeText={setMedicationName}
            editable={!isSubmitting}
          />
          <TextInput
            style={styles.input}
            placeholder="Dosage (e.g., 500mg)"
            value={medicationDosage}
            onChangeText={setMedicationDosage}
            editable={!isSubmitting}
          />
          <TextInput
            style={styles.input}
            placeholder="Quantity"
            value={medicationQuantity}
            onChangeText={setMedicationQuantity}
            keyboardType="numeric"
            editable={!isSubmitting}
          />
          <TouchableOpacity
            style={[styles.addButton, isSubmitting && styles.disabled]}
            onPress={handleAddMedication}
            disabled={isSubmitting}
          >
            <Text style={styles.addButtonText}>Add Medication</Text>
          </TouchableOpacity>
        </View>

        {orderFormErrors.medications && (
          <Text style={styles.errorText}>{orderFormErrors.medications}</Text>
        )}

        <View style={styles.medicationList}>
          {currentOrderForm.medications.map((med, index) => (
            <View key={index} style={styles.medicationItem}>
              <View style={styles.medicationItemContent}>
                <Text style={styles.medicationName}>{med.name}</Text>
                <Text style={styles.medicationDosage}>
                  {med.dosage} x {med.quantity}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveMedication(index)}
                disabled={isSubmitting}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Urgency Level</Text>
        <View style={styles.urgencyContainer}>
          {(['routine', 'urgent', 'stat'] as const).map((urgency) => (
            <TouchableOpacity
              key={urgency}
              style={[
                styles.urgencyButton,
                currentOrderForm.urgency === urgency &&
                  styles.urgencyButtonActive,
              ]}
              onPress={() => handleUrgencyChange(urgency)}
              disabled={isSubmitting}
            >
              <Text
                style={[
                  styles.urgencyButtonText,
                  currentOrderForm.urgency === urgency &&
                    styles.urgencyButtonTextActive,
                ]}
              >
                {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Special Instructions</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Add any special instructions or notes"
          value={currentOrderForm.notes || ''}
          onChangeText={handleNotesChange}
          multiline
          numberOfLines={4}
          editable={!isSubmitting}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.disabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Order</Text>
        )}
      </TouchableOpacity>

      <View style={styles.spacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  medicationInput: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  notesInput: {
    minHeight: 80,
  },
  addButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  medicationList: {
    marginTop: 15,
  },
  medicationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  medicationItemContent: {
    flex: 1,
  },
  medicationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  medicationDosage: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  urgencyContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  urgencyButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  urgencyButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  urgencyButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  urgencyButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 10,
    marginBottom: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginBottom: 10,
  },
  spacing: {
    height: 20,
  },
});

export default MedicationOrderForm;
