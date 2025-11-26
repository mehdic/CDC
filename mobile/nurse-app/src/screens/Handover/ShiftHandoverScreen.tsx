/**
 * Shift Handover Screen
 * Create and view shift handover notes between nurses
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { nurseApiClient } from '../../services/nurseApiClient';
import { HandoverNote } from '../../types';

export const ShiftHandoverScreen: React.FC = () => {
  const { nurse } = useSelector((state: RootState) => state.auth);
  const [showCreate, setShowCreate] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState<HandoverNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [shiftTo, setShiftTo] = useState('');
  const [summary, setSummary] = useState('');
  const [observations, setObservations] = useState('');
  const [concerns, setConcerns] = useState('');
  const [planOfCare, setPlanOfCare] = useState('');
  const [medicationsGiven, setMedicationsGiven] = useState('');
  const [pendingMedications, setPendingMedications] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);

  useEffect(() => {
    loadHandoverNotes();
  }, []);

  const loadHandoverNotes = async () => {
    try {
      const data = await nurseApiClient.getHandoverNotes();
      setHandoverNotes(data);
    } catch (error) {
      console.error('Failed to load handover notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!patientId || !patientName) {
      Alert.alert('Error', 'Please enter patient information');
      return false;
    }
    if (!summary) {
      Alert.alert('Error', 'Please enter handover summary');
      return false;
    }
    if (!shiftTo) {
      Alert.alert('Error', 'Please specify incoming shift');
      return false;
    }
    return true;
  };

  const createHandoverNote = async () => {
    if (!validateForm() || !nurse) {return;}

    try {
      const noteData = {
        patientId,
        patientName,
        shiftFrom: nurse.shiftSchedule?.currentShift?.id || 'Current Shift',
        shiftTo,
        handoverFrom: nurse.id,
        date: new Date().toISOString(),
        summary,
        medicationsGiven: medicationsGiven.split(',').map((m) => m.trim()),
        pendingMedications: pendingMedications.split(',').map((m) => m.trim()),
        observations,
        concerns: concerns.split(',').map((c) => c.trim()).filter(Boolean),
        planOfCare,
        followUpRequired,
        acknowledged: false,
      };

      await nurseApiClient.createHandoverNote(noteData);

      Alert.alert('Success', 'Handover note created successfully');

      // Reset form
      setPatientId('');
      setPatientName('');
      setShiftTo('');
      setSummary('');
      setObservations('');
      setConcerns('');
      setPlanOfCare('');
      setMedicationsGiven('');
      setPendingMedications('');
      setFollowUpRequired(false);
      setShowCreate(false);

      await loadHandoverNotes();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create handover note');
    }
  };

  const acknowledgeHandover = async (noteId: string) => {
    try {
      await nurseApiClient.acknowledgeHandover(noteId);
      Alert.alert('Success', 'Handover acknowledged');
      await loadHandoverNotes();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to acknowledge');
    }
  };

  const renderHandoverNote = ({ item }: { item: HandoverNote }) => (
    <View style={styles.noteCard}>
      <View style={styles.noteHeader}>
        <Text style={styles.patientName}>{item.patientName}</Text>
        {item.acknowledged ? (
          <View style={styles.acknowledgedBadge}>
            <Text style={styles.acknowledgedText}>✓ Acknowledged</Text>
          </View>
        ) : (
          <View style={[styles.acknowledgedBadge, styles.pendingBadge]}>
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        )}
      </View>

      <Text style={styles.noteDate}>
        {new Date(item.date).toLocaleDateString()} - {item.shiftFrom} → {item.shiftTo}
      </Text>

      <View style={styles.noteSection}>
        <Text style={styles.noteSectionTitle}>Summary:</Text>
        <Text style={styles.noteSectionText}>{item.summary}</Text>
      </View>

      {item.observations && (
        <View style={styles.noteSection}>
          <Text style={styles.noteSectionTitle}>Observations:</Text>
          <Text style={styles.noteSectionText}>{item.observations}</Text>
        </View>
      )}

      {item.concerns && item.concerns.length > 0 && (
        <View style={styles.noteSection}>
          <Text style={styles.noteSectionTitle}>Concerns:</Text>
          {item.concerns.map((concern, index) => (
            <Text key={index} style={styles.bulletItem}>• {concern}</Text>
          ))}
        </View>
      )}

      {item.pendingMedications && item.pendingMedications.length > 0 && (
        <View style={styles.noteSection}>
          <Text style={styles.noteSectionTitle}>Pending Medications:</Text>
          {item.pendingMedications.map((med, index) => (
            <Text key={index} style={styles.bulletItem}>• {med}</Text>
          ))}
        </View>
      )}

      {!item.acknowledged && (
        <TouchableOpacity
          style={styles.acknowledgeButton}
          onPress={() => acknowledgeHandover(item.id)}
        >
          <Text style={styles.acknowledgeButtonText}>Acknowledge Handover</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
        <Text style={styles.loadingText}>Loading handover notes...</Text>
      </View>
    );
  }

  if (showCreate) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={() => setShowCreate(false)}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.formTitle}>Create Handover Note</Text>
          <TouchableOpacity onPress={createHandoverNote}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Patient Name *"
            value={patientName}
            onChangeText={setPatientName}
          />
          <TextInput
            style={styles.input}
            placeholder="Patient ID *"
            value={patientId}
            onChangeText={setPatientId}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shift Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Incoming Shift *"
            value={shiftTo}
            onChangeText={setShiftTo}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Handover Summary *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Brief summary of patient status and care"
            value={summary}
            onChangeText={setSummary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medications</Text>
          <TextInput
            style={styles.input}
            placeholder="Medications Given (comma-separated)"
            value={medicationsGiven}
            onChangeText={setMedicationsGiven}
          />
          <TextInput
            style={styles.input}
            placeholder="Pending Medications (comma-separated)"
            value={pendingMedications}
            onChangeText={setPendingMedications}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observations</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Patient observations, vitals, behavior"
            value={observations}
            onChangeText={setObservations}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Concerns & Follow-up</Text>
          <TextInput
            style={styles.input}
            placeholder="Concerns (comma-separated)"
            value={concerns}
            onChangeText={setConcerns}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Plan of Care"
            value={planOfCare}
            onChangeText={setPlanOfCare}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shift Handover</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreate(true)}
        >
          <Text style={styles.createButtonText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={handoverNotes}
        renderItem={renderHandoverNote}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No handover notes</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowCreate(true)}
            >
              <Text style={styles.emptyButtonText}>Create First Handover Note</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7F8C8D',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DDE2E8',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
  },
  createButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  noteCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DDE2E8',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  acknowledgedBadge: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  acknowledgedText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: '#F39C12',
  },
  pendingText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  noteDate: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 12,
  },
  noteSection: {
    marginTop: 12,
  },
  noteSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  noteSectionText: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 20,
  },
  bulletItem: {
    fontSize: 14,
    color: '#2C3E50',
    marginLeft: 8,
    marginBottom: 2,
  },
  acknowledgeButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  acknowledgeButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DDE2E8',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  cancelButton: {
    fontSize: 16,
    color: '#95A5A6',
  },
  saveButton: {
    fontSize: 16,
    color: '#3498DB',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFF',
    padding: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
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
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ShiftHandoverScreen;
