/**
 * Adverse Reactions Screen
 * Allows nurses to report adverse medication reactions with photo attachments
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
  FlatList,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { nurseApiClient } from '../../services/nurseApiClient';
import { AdverseReactionsScreenProps } from '../../navigation/types';
import { useADRForm } from '../../hooks/useADRForm';
import {
  setSubmitting,
  setError,
  setSuccessMessage,
  addSubmittedReport,
} from '../../store/adrSlice';
import {
  validateADRForm,
  getSeverityColor,
  isCriticalSeverity,
} from '../../utils/adrValidation';
import { createPhotoFile } from '../../utils/photoHandler';

export const AdverseReactionsScreen = ({
  navigation,
  route,
}: AdverseReactionsScreenProps) => {
  const { patientId, patientName, medicationId: initialMedId, medicationName: initialMedName } = route.params;
  const dispatch = useDispatch();
  const { nurse } = useSelector((state: RootState) => state.auth);
  const { isSubmitting: reduxSubmitting } = useSelector((state: RootState) => state.adr);
  const {
    formData,
    errors,
    isValid,
    isCritical,
    initForm,
    updateField,
    toggleSymptom,
    addPhoto,
    removePhoto,
    validateForm,
  } = useADRForm();

  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [suggestedSymptoms] = useState([
    'Rash',
    'Itching',
    'Swelling',
    'Difficulty breathing',
    'Nausea',
    'Vomiting',
    'Fever',
    'Dizziness',
    'Headache',
    'Chest pain',
    'Rapid heartbeat',
    'Tremor',
    'Confusion',
  ]);

  // Initialize form on mount
  useEffect(() => {
    initForm({
      patientId,
      patientName,
      medicationId: initialMedId,
      medicationName: initialMedName,
    });
  }, [patientId, patientName, initialMedId, initialMedName, initForm]);

  const submitReport = async () => {
    if (!validateForm() || !nurse || !formData) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setLocalSubmitting(true);
    dispatch(setSubmitting(true));

    try {
      const reportData = {
        patientId: formData.patientId,
        medicationId: formData.medicationId,
        medicationName: formData.medicationName,
        reactionType: formData.reactionType,
        severity: formData.severity,
        symptoms: formData.symptoms || [],
        onsetTime: formData.onsetTime,
        reportedBy: nurse.id,
        actionTaken: formData.actionTaken,
        resolved: false,
        notes: formData.notes || undefined,
      };

      const response = await nurseApiClient.reportAdverseReaction(reportData);

      dispatch(addSubmittedReport(response));
      dispatch(setSuccessMessage('Adverse reaction reported successfully'));

      // Show alert based on severity
      const severity = formData.severity;
      const isCriticalAlert = isCriticalSeverity(severity);

      Alert.alert(
        isCriticalAlert ? 'CRITICAL REPORT SUBMITTED' : 'Success',
        isCriticalAlert
          ? 'This critical reaction has been reported to the prescribing physician and pharmacy for immediate action.'
          : 'Adverse reaction reported successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to submit report';
      dispatch(setError(errorMessage));
      Alert.alert('Error', errorMessage);
    } finally {
      setLocalSubmitting(false);
      dispatch(setSubmitting(false));
    }
  };

  const handlePhotoSelect = () => {
    // This would typically open an image picker
    // For now, we'll show a placeholder alert
    Alert.alert(
      'Photo Attachment',
      'Image picker integration would be implemented here',
      [{ text: 'OK' }]
    );
  };

  if (!formData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    );
  }

  const isSubmitting = localSubmitting || reduxSubmitting;

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, isCritical && styles.headerCritical]}>
        <Text style={styles.headerTitle}>Report Adverse Reaction</Text>
        <Text style={styles.headerSubtitle}>Patient: {formData.patientName}</Text>
        {isCritical && (
          <View style={styles.criticalBadge}>
            <Text style={styles.criticalBadgeText}>CRITICAL SEVERITY</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medication Information</Text>
        <TextInput
          style={[styles.input, errors.medicationName && styles.inputError]}
          placeholder="Medication Name *"
          value={formData.medicationName || ''}
          onChangeText={(value) => updateField('medicationName', value)}
        />
        {errors.medicationName && (
          <Text style={styles.errorText}>{errors.medicationName}</Text>
        )}

        <TextInput
          style={[styles.input, errors.medicationId && styles.inputError]}
          placeholder="Medication ID *"
          value={formData.medicationId || ''}
          onChangeText={(value) => updateField('medicationId', value)}
        />
        {errors.medicationId && (
          <Text style={styles.errorText}>{errors.medicationId}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reaction Details</Text>
        <TextInput
          style={[styles.input, errors.reactionType && styles.inputError]}
          placeholder="Reaction Type (e.g., Allergic, Side Effect) *"
          value={formData.reactionType || ''}
          onChangeText={(value) => updateField('reactionType', value)}
        />
        {errors.reactionType && (
          <Text style={styles.errorText}>{errors.reactionType}</Text>
        )}

        <Text style={styles.label}>Severity Level *</Text>
        <View style={styles.severityButtons}>
          {([
            { value: 'mild', label: 'MILD' },
            { value: 'moderate', label: 'MODERATE' },
            { value: 'severe', label: 'SEVERE' },
            { value: 'life_threatening', label: 'LIFE THREATENING' },
          ] as const).map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.severityButton,
                formData.severity === level.value && {
                  backgroundColor: getSeverityColor(level.value),
                },
              ]}
              onPress={() => updateField('severity', level.value)}
            >
              <Text
                style={[
                  styles.severityButtonText,
                  formData.severity === level.value && styles.severityButtonTextActive,
                ]}
              >
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Select Symptoms *</Text>
        <View style={styles.symptomsGrid}>
          {suggestedSymptoms.map((symptom) => (
            <TouchableOpacity
              key={symptom}
              style={[
                styles.symptomButton,
                formData.symptoms?.includes(symptom) && styles.symptomButtonActive,
              ]}
              onPress={() => toggleSymptom(symptom)}
            >
              <Text
                style={[
                  styles.symptomButtonText,
                  formData.symptoms?.includes(symptom) && styles.symptomButtonTextActive,
                ]}
              >
                {symptom}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.symptoms && (
          <Text style={styles.errorText}>{errors.symptoms}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Action & Response</Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.actionTaken && styles.inputError]}
          placeholder="Action Taken *"
          value={formData.actionTaken || ''}
          onChangeText={(value) => updateField('actionTaken', value)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        {errors.actionTaken && (
          <Text style={styles.errorText}>{errors.actionTaken}</Text>
        )}

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Additional Notes (optional)"
          value={formData.notes || ''}
          onChangeText={(value) => updateField('notes', value)}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photo Attachments</Text>
        <TouchableOpacity
          style={styles.attachPhotoButton}
          onPress={handlePhotoSelect}
        >
          <Text style={styles.attachPhotoButtonText}>+ Add Photo</Text>
        </TouchableOpacity>
        {formData.photoAttachments && formData.photoAttachments.length > 0 && (
          <View style={styles.photosContainer}>
            <Text style={styles.photosCount}>
              {formData.photoAttachments.length} photo(s) attached
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.warningBox, isCritical && styles.warningBoxCritical]}>
        <Text style={styles.warningIcon}>{isCritical ? '🚨' : '⚠️'}</Text>
        <Text style={styles.warningText}>
          {isCritical
            ? 'This critical reaction will be reported immediately to the prescribing physician and pharmacy.'
            : 'This report will be sent to the prescribing physician and pharmacy for review.'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled, isCritical && styles.submitButtonCritical]}
        onPress={submitReport}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
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
  headerCritical: {
    backgroundColor: '#FFEBEE',
    borderBottomColor: '#C0392B',
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
  criticalBadge: {
    backgroundColor: '#C0392B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  criticalBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
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
  inputError: {
    borderColor: '#E74C3C',
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 12,
    marginBottom: 12,
    fontWeight: '500',
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
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  symptomButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDE2E8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  symptomButtonActive: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  symptomButtonText: {
    fontSize: 13,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  symptomButtonTextActive: {
    color: '#FFF',
  },
  attachPhotoButton: {
    borderWidth: 2,
    borderColor: '#3498DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  attachPhotoButtonText: {
    color: '#3498DB',
    fontSize: 16,
    fontWeight: '600',
  },
  photosContainer: {
    backgroundColor: '#E8F4F8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  photosCount: {
    color: '#16A085',
    fontSize: 14,
    fontWeight: '500',
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
  warningBoxCritical: {
    backgroundColor: '#FFCDD2',
    borderColor: '#C0392B',
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
  submitButtonCritical: {
    backgroundColor: '#C0392B',
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
