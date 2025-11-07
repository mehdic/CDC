/**
 * T123: Create Prescription Screen
 * Main screen for doctors to create and send prescriptions
 *
 * Features:
 * - Patient selection
 * - Pharmacy selection
 * - Multiple medication items
 * - Drug search with AI
 * - Dosage configuration
 * - Notes/instructions
 * - Validation before sending
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { Patient, Pharmacy, PrescriptionItem, Prescription, PrescriptionSource } from '../types';
import { theme } from '../App';

// Components
import PatientSelector from '../components/PatientSelector';
import PharmacySelector from '../components/PharmacySelector';
import DrugSearch from '../components/DrugSearch';
import DosagePicker from '../components/DosagePicker';

type CreatePrescriptionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'CreatePrescription'
>;

interface Props {
  navigation: CreatePrescriptionScreenNavigationProp;
}

const CreatePrescriptionScreen: React.FC<Props> = ({ navigation }) => {
  const [patient, setPatient] = useState<Patient | undefined>();
  const [pharmacy, setPharmacy] = useState<Pharmacy | undefined>();
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [currentMedication, setCurrentMedication] = useState<string>('');
  const [currentRxNormCode, setCurrentRxNormCode] = useState<string | undefined>();
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  // Handle drug selection from search
  const handleDrugSelect = (drugName: string, rxNormCode?: string) => {
    setCurrentMedication(drugName);
    setCurrentRxNormCode(rxNormCode);
  };

  // Handle dosage update
  const handleDosageUpdate = (dosageData: Partial<PrescriptionItem>) => {
    // Auto-add or update item when dosage is complete
    if (
      dosageData.medication_name &&
      dosageData.dosage &&
      dosageData.frequency &&
      dosageData.duration
    ) {
      const newItem: PrescriptionItem = {
        medication_name: dosageData.medication_name,
        medication_rxnorm_code: currentRxNormCode,
        dosage: dosageData.dosage!,
        frequency: dosageData.frequency!,
        duration: dosageData.duration,
        quantity: dosageData.quantity,
        form: dosageData.form,
      };

      if (editingItemIndex !== null) {
        // Update existing item
        const updatedItems = [...items];
        updatedItems[editingItemIndex] = newItem;
        setItems(updatedItems);
      } else {
        // Add new item
        setItems([...items, newItem]);
      }

      // Reset form
      setCurrentMedication('');
      setCurrentRxNormCode(undefined);
      setEditingItemIndex(null);
    }
  };

  // Remove medication item
  const handleRemoveItem = (index: number) => {
    Alert.alert('Remove Medication', 'Remove this medication from prescription?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const updatedItems = items.filter((_, i) => i !== index);
          setItems(updatedItems);
        },
      },
    ]);
  };

  // Edit medication item
  const handleEditItem = (index: number) => {
    const item = items[index];
    setCurrentMedication(item.medication_name);
    setCurrentRxNormCode(item.medication_rxnorm_code);
    setEditingItemIndex(index);
  };

  // Validate form
  const validateForm = (): string | null => {
    if (!patient) return 'Please select a patient';
    if (!pharmacy) return 'Please select a pharmacy';
    if (items.length === 0) return 'Please add at least one medication';
    return null;
  };

  // Handle continue to confirmation
  const handleContinue = () => {
    const error = validateForm();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    // Create prescription object
    const prescription: Prescription = {
      pharmacy_id: pharmacy!.id,
      patient_id: patient!.id,
      prescribing_doctor_id: 'current-doctor-id', // TODO: Get from auth context
      source: PrescriptionSource.DOCTOR_DIRECT,
      items: items,
      prescribed_date: new Date(),
      notes: notes,
    };

    // Navigate to confirmation screen
    navigation.navigate('SendConfirmation', { prescription });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.title}>Create New Prescription</Text>

        {/* Patient Selection */}
        <PatientSelector
          selectedPatient={patient}
          onSelect={setPatient}
          onClear={() => setPatient(undefined)}
        />

        {/* Pharmacy Selection */}
        <PharmacySelector
          selectedPharmacy={pharmacy}
          onSelect={setPharmacy}
          onClear={() => setPharmacy(undefined)}
        />

        {/* Medications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medications</Text>

          {/* Added Medications List */}
          {items.length > 0 && (
            <View style={styles.itemsList}>
              {items.map((item, index) => (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemName}>{item.medication_name}</Text>
                    <Text style={styles.itemDetails}>
                      {item.dosage} • {item.frequency}
                    </Text>
                    {item.duration && (
                      <Text style={styles.itemDuration}>Duration: {item.duration}</Text>
                    )}
                    {item.quantity && (
                      <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                    )}
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      onPress={() => handleEditItem(index)}
                      style={styles.itemActionButton}
                    >
                      <Text style={styles.itemActionText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleRemoveItem(index)}
                      style={styles.itemActionButton}
                    >
                      <Text style={styles.itemActionText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Add Medication Form */}
          <View style={styles.addMedicationForm}>
            <Text style={styles.formLabel}>
              {editingItemIndex !== null ? 'Edit Medication' : 'Add Medication'}
            </Text>

            {/* Drug Search */}
            <DrugSearch
              onSelectDrug={handleDrugSelect}
              patientContext={
                patient
                  ? {
                      patient_id: patient.id,
                      conditions: patient.medical_conditions,
                      current_medications: items.map((i) => i.medication_name),
                    }
                  : undefined
              }
            />

            {/* Dosage Picker (shown when medication is selected) */}
            {currentMedication && (
              <View style={styles.dosagePickerContainer}>
                <Text style={styles.selectedMedicationLabel}>
                  Selected: {currentMedication}
                </Text>
                <DosagePicker
                  medicationName={currentMedication}
                  onUpdate={handleDosageUpdate}
                />
              </View>
            )}
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Special instructions, patient context, etc."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!patient || !pharmacy || items.length === 0) && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!patient || !pharmacy || items.length === 0}
        >
          <Text style={styles.continueButtonText}>Continue to Confirmation</Text>
        </TouchableOpacity>

        {/* Validation Hints */}
        {(!patient || !pharmacy || items.length === 0) && (
          <View style={styles.validationHints}>
            {!patient && <Text style={styles.hintText}>• Select a patient</Text>}
            {!pharmacy && <Text style={styles.hintText}>• Select a pharmacy</Text>}
            {items.length === 0 && <Text style={styles.hintText}>• Add at least one medication</Text>}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  content: {
    padding: theme.spacing.md,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  itemsList: {
    marginBottom: theme.spacing.md,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: 8,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    ...theme.typography.body1,
    fontWeight: '600',
    color: theme.colors.text,
  },
  itemDetails: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  itemDuration: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  itemQuantity: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemActionButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  itemActionText: {
    fontSize: 18,
  },
  addMedicationForm: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  formLabel: {
    ...theme.typography.body1,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  dosagePickerContainer: {
    marginTop: theme.spacing.md,
  },
  selectedMedicationLabel: {
    ...theme.typography.body1,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.md,
    ...theme.typography.body1,
    backgroundColor: theme.colors.background,
    minHeight: 100,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  continueButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  continueButtonText: {
    ...theme.typography.body1,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  validationHints: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  hintText: {
    ...theme.typography.body2,
    color: theme.colors.warning,
    marginBottom: theme.spacing.xs,
  },
});

export default CreatePrescriptionScreen;
