/**
 * Handover Note Form Component
 * Form for creating shift handover notes
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ShiftHandoverNote, Patient } from '../types/nurse';

export interface HandoverNoteFormProps {
  nurse: { id: string; firstName: string; lastName: string };
  patients: Patient[];
  shift: 'day' | 'night';
  onSubmit: (note: Omit<ShiftHandoverNote, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface PatientNote {
  patientId: string;
  patientName: string;
  status: string;
  criticalNotes: string;
  pendingTasks: string[];
}

export const HandoverNoteForm: React.FC<HandoverNoteFormProps> = ({
  nurse,
  patients,
  shift,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [selectedPatients, setSelectedPatients] = useState<PatientNote[]>([]);
  const [generalNotes, setGeneralNotes] = useState<string>('');
  const [currentPatientNote, setCurrentPatientNote] = useState<Partial<PatientNote>>({
    pendingTasks: [],
  });
  const [showPatientForm, setShowPatientForm] = useState<boolean>(false);

  const handleAddPatient = () => {
    if (
      !currentPatientNote.patientId ||
      !currentPatientNote.patientName ||
      !currentPatientNote.status ||
      !currentPatientNote.criticalNotes
    ) {
      Alert.alert('Error', 'Please fill in all patient details');
      return;
    }

    const newPatientNote: PatientNote = {
      patientId: currentPatientNote.patientId || '',
      patientName: currentPatientNote.patientName || '',
      status: currentPatientNote.status || '',
      criticalNotes: currentPatientNote.criticalNotes || '',
      pendingTasks: currentPatientNote.pendingTasks || [],
    };

    setSelectedPatients([...selectedPatients, newPatientNote]);
    setCurrentPatientNote({ pendingTasks: [] });
    setShowPatientForm(false);
  };

  const handleRemovePatient = (patientId: string) => {
    setSelectedPatients(selectedPatients.filter((p) => p.patientId !== patientId));
  };

  const handleAddPendingTask = (task: string) => {
    if (task.trim()) {
      setCurrentPatientNote({
        ...currentPatientNote,
        pendingTasks: [...(currentPatientNote.pendingTasks || []), task],
      });
    }
  };

  const handleRemovePendingTask = (index: number) => {
    const tasks = [...(currentPatientNote.pendingTasks || [])];
    tasks.splice(index, 1);
    setCurrentPatientNote({
      ...currentPatientNote,
      pendingTasks: tasks,
    });
  };

  const handleSubmit = async () => {
    if (selectedPatients.length === 0) {
      Alert.alert('Error', 'Please add at least one patient');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    const note: Omit<ShiftHandoverNote, 'id' | 'createdAt'> = {
      fromNurse: nurse.id,
      shift,
      date: today,
      patients: selectedPatients,
      generalNotes: generalNotes || undefined,
    };

    try {
      await onSubmit(note);
      Alert.alert('Success', 'Handover note created successfully');
      setSelectedPatients([]);
      setGeneralNotes('');
      setCurrentPatientNote({ pendingTasks: [] });
    } catch (error) {
      Alert.alert('Error', 'Failed to create handover note');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Shift Handover Note</Text>
        <Text style={styles.subtitle}>
          {nurse.firstName} {nurse.lastName} - {shift.toUpperCase()} shift
        </Text>
      </View>

      {/* Selected Patients */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patients ({selectedPatients.length})</Text>
        {selectedPatients.map((patient) => (
          <View key={patient.patientId} style={styles.patientCard}>
            <View style={styles.patientHeader}>
              <Text style={styles.patientName}>{patient.patientName}</Text>
              <TouchableOpacity onPress={() => handleRemovePatient(patient.patientId)}>
                <Text style={styles.removeButton}>Remove</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.patientDetail}>Status: {patient.status}</Text>
            <Text style={styles.patientDetail}>Critical: {patient.criticalNotes}</Text>
            {patient.pendingTasks && patient.pendingTasks.length > 0 && (
              <View>
                <Text style={styles.tasksLabel}>Pending Tasks:</Text>
                {patient.pendingTasks.map((task, index) => (
                  <Text key={index} style={styles.taskItem}>
                    • {task}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity
          style={styles.addPatientButton}
          onPress={() => setShowPatientForm(!showPatientForm)}
        >
          <Text style={styles.addPatientButtonText}>
            {showPatientForm ? '- Hide Patient Form' : '+ Add Patient'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Patient Form */}
      {showPatientForm && (
        <View style={styles.section}>
          <Text style={styles.formTitle}>Add Patient Details</Text>

          <Text style={styles.label}>Select Patient</Text>
          <ScrollView style={styles.patientSelectList} horizontal={false}>
            {patients.map((patient) => (
              <TouchableOpacity
                key={patient.id}
                style={[
                  styles.patientOption,
                  currentPatientNote.patientId === patient.id && styles.patientOptionSelected,
                ]}
                onPress={() =>
                  setCurrentPatientNote({
                    ...currentPatientNote,
                    patientId: patient.id,
                    patientName: `${patient.firstName} ${patient.lastName}`,
                  })
                }
              >
                <Text
                  style={[
                    styles.patientOptionText,
                    currentPatientNote.patientId === patient.id && styles.patientOptionTextSelected,
                  ]}
                >
                  {patient.firstName} {patient.lastName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Status</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Stable, Critical, Improving"
            value={currentPatientNote.status || ''}
            onChangeText={(text) =>
              setCurrentPatientNote({ ...currentPatientNote, status: text })
            }
          />

          <Text style={styles.label}>Critical Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter critical information about the patient"
            multiline
            numberOfLines={4}
            value={currentPatientNote.criticalNotes || ''}
            onChangeText={(text) =>
              setCurrentPatientNote({ ...currentPatientNote, criticalNotes: text })
            }
          />

          <TouchableOpacity style={styles.addButton} onPress={handleAddPatient}>
            <Text style={styles.addButtonText}>Add This Patient</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* General Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any general notes about the shift..."
          multiline
          numberOfLines={4}
          value={generalNotes}
          onChangeText={setGeneralNotes}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={isLoading}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Creating...' : 'Create Handover'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#212529',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#212529',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#495057',
  },
  input: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#212529',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  patientCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  removeButton: {
    color: '#dc3545',
    fontSize: 12,
    fontWeight: '600',
  },
  patientDetail: {
    fontSize: 13,
    color: '#495057',
    marginBottom: 4,
  },
  tasksLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#495057',
    marginTop: 8,
    marginBottom: 4,
  },
  taskItem: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 8,
    marginBottom: 2,
  },
  addPatientButton: {
    backgroundColor: '#e7f3ff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addPatientButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  patientSelectList: {
    marginBottom: 12,
    maxHeight: 200,
  },
  patientOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  patientOptionSelected: {
    backgroundColor: '#e7f3ff',
    borderColor: '#007AFF',
  },
  patientOptionText: {
    fontSize: 14,
    color: '#495057',
  },
  patientOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#495057',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HandoverNoteForm;
