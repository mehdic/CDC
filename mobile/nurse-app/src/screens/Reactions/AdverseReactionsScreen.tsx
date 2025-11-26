/**
 * Adverse Reactions Screen
 * Allows nurses to report adverse medication reactions
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

interface AdverseReactionsScreenProps {
  navigation: any;
  route: {
    params: {
      patientId: string;
      patientName: string;
      medicationId?: string;
      medicationName?: string;
    };
  };
}

export const AdverseReactionsScreen: React.FC<AdverseReactionsScreenProps> = ({
  navigation,
  route,
}) => {
  const { patientId, patientName, medicationId: initialMedId, medicationName: initialMedName } = route.params;
  const { nurse } = useSelector((state: RootState) => state.auth);

  const [medicationId, setMedicationId] = useState(initialMedId || '');
  const [medicationName, setMedicationName] = useState(initialMedName || '');
  const [reactionType, setReactionType] = useState('');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe' | 'life_threatening'>('mild');
  const [symptoms, setSymptoms] = useState('');
  const [onsetTime] = useState(new Date().toISOString());
  const [actionTaken, setActionTaken] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    if (!medicationId || !medicationName) {
      Alert.alert('Error', 'Please specify the medication');
      return false;
    }

    if (!reactionType) {
      Alert.alert('Error', 'Please specify the reaction type');
      return false;
    }

    if (!symptoms) {
      Alert.alert('Error', 'Please describe the symptoms');
      return false;
    }

    if (!actionTaken) {
      Alert.alert('Error', 'Please describe the action taken');
      return false;
    }

    return true;
  };

  const submitReport = async () => {
    if (!validateForm() || !nurse) {return;}

    setLoading(true);
    try {
      const reportData = {
        patientId,
        medicationId,
        medicationName,
        reactionType,
        severity,
        symptoms: symptoms.split(',').map((s) => s.trim()),
        onsetTime,
        reportedBy: nurse.id,
        actionTaken,
        resolved: false,
        notes: notes || undefined,
      };

      await nurseApiClient.reportAdverseReaction(reportData);

      Alert.alert(
        'Success',
        'Adverse reaction reported successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Report Adverse Reaction</Text>
        <Text style={styles.headerSubtitle}>Patient: {patientName}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medication Information</Text>
        <TextInput
          style={styles.input}
          placeholder="Medication Name *"
          value={medicationName}
          onChangeText={setMedicationName}
        />
        <TextInput
          style={styles.input}
          placeholder="Medication ID *"
          value={medicationId}
          onChangeText={setMedicationId}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reaction Details</Text>
        <TextInput
          style={styles.input}
          placeholder="Reaction Type (e.g., Allergic, Side Effect) *"
          value={reactionType}
          onChangeText={setReactionType}
        />

        <Text style={styles.label}>Severity Level *</Text>
        <View style={styles.severityButtons}>
          {([
            { value: 'mild', label: 'MILD', color: '#F39C12' },
            { value: 'moderate', label: 'MODERATE', color: '#E67E22' },
            { value: 'severe', label: 'SEVERE', color: '#E74C3C' },
            { value: 'life_threatening', label: 'LIFE THREATENING', color: '#C0392B' },
          ] as const).map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.severityButton,
                severity === level.value && { backgroundColor: level.color },
              ]}
              onPress={() => setSeverity(level.value)}
            >
              <Text
                style={[
                  styles.severityButtonText,
                  severity === level.value && styles.severityButtonTextActive,
                ]}
              >
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Symptoms (comma-separated) *"
          value={symptoms}
          onChangeText={setSymptoms}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Action & Response</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Action Taken *"
          value={actionTaken}
          onChangeText={setActionTaken}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Additional Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.warningBox}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={styles.warningText}>
          This report will be sent to the prescribing physician and pharmacy for immediate review.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={submitReport}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Report</Text>
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
  header: {
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
  headerSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFF',
    padding: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 8,
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
  severityButtons: {
    marginBottom: 12,
  },
  severityButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDE2E8',
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  severityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
    textAlign: 'center',
  },
  severityButtonTextActive: {
    color: '#FFF',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3CD',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F39C12',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
  },
  submitButton: {
    backgroundColor: '#E74C3C',
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

export default AdverseReactionsScreen;
