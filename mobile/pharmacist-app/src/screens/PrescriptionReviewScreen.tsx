/**
 * Prescription Review Screen
 * Full prescription review with AI transcription editor, safety warnings, and approve/reject actions
 * T107 - User Story 1: Prescription Processing & Validation
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPrescriptionDetails,
  validatePrescription,
  approvePrescription,
  rejectPrescription,
} from '../store/queueSlice';
import TranscriptionEditor from '../components/TranscriptionEditor';
import InteractionWarnings from '../components/InteractionWarnings';
import { LowConfidenceFieldsSummary } from '../components/ConfidenceWarning';
import PrescriptionActions from '../components/PrescriptionActions';

// ============================================================================
// Types
// ============================================================================

export interface PrescriptionReviewScreenProps {
  route: any;
  navigation: any;
}

// ============================================================================
// Component
// ============================================================================

export const PrescriptionReviewScreen: React.FC<PrescriptionReviewScreenProps> = ({
  route,
  navigation,
}) => {
  const { prescriptionId } = route.params;
  const dispatch = useDispatch();

  const { selectedPrescription, validationResult, loading } = useSelector(
    (state: any) => state.queue
  );

  useEffect(() => {
    loadPrescription();
  }, [prescriptionId]);

  const loadPrescription = async () => {
    await dispatch(fetchPrescriptionDetails(prescriptionId) as any);
    // Auto-trigger validation
    await dispatch(validatePrescription(prescriptionId) as any);
  };

  const handleApprove = async (prescriptionId: string, pharmacistId: string, notes?: string) => {
    await dispatch(approvePrescription({ prescriptionId, data: { pharmacistId, notes } }) as any);
    navigation.goBack();
  };

  const handleReject = async (
    prescriptionId: string,
    pharmacistId: string,
    reason: string,
    notifyDoctor?: boolean,
    notifyPatient?: boolean
  ) => {
    await dispatch(
      rejectPrescription({
        prescriptionId,
        data: {
          pharmacistId,
          rejection_reason: reason,
          notify_doctor: notifyDoctor,
          notify_patient: notifyPatient,
        },
      }) as any
    );
    navigation.goBack();
  };

  const handleMessageDoctor = () => {
    if (selectedPrescription?.prescribing_doctor_id) {
      navigation.navigate('DoctorMessage', {
        prescriptionId: selectedPrescription.id,
        doctorId: selectedPrescription.prescribing_doctor_id,
      });
    }
  };

  const handleItemUpdate = (itemId: string, field: string, value: string) => {
    // Handle real-time item field update
    console.log('Update item field:', { itemId, field, value });
  };

  const handleItemCorrect = (itemId: string, corrections: any) => {
    // Handle item correction submission
    console.log('Correct item:', { itemId, corrections });
  };

  if (loading.queue || !selectedPrescription) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading prescription...</Text>
      </View>
    );
  }

  const hasLowConfidenceFields = selectedPrescription.items?.some((item: any) =>
    [item.medication_confidence, item.dosage_confidence, item.frequency_confidence].some(
      (c) => c !== null && c < 80
    )
  );

  const hasCriticalIssues = validationResult?.safety_checks.has_critical_issues || false;

  const lowConfidenceFields = selectedPrescription.items
    ?.flatMap((item: any) => {
      const fields = [];
      if (item.medication_confidence !== null && item.medication_confidence < 80) {
        fields.push({
          fieldName: 'Medication Name',
          value: item.medication_name,
          confidence: item.medication_confidence,
        });
      }
      if (item.dosage_confidence !== null && item.dosage_confidence < 80) {
        fields.push({
          fieldName: 'Dosage',
          value: item.dosage,
          confidence: item.dosage_confidence,
        });
      }
      if (item.frequency_confidence !== null && item.frequency_confidence < 80) {
        fields.push({
          fieldName: 'Frequency',
          value: item.frequency,
          confidence: item.frequency_confidence,
        });
      }
      return fields;
    })
    .filter(Boolean) || [];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Prescription Image */}
        {selectedPrescription.image_url && (
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>Original Prescription</Text>
            <Image
              source={{ uri: selectedPrescription.image_url }}
              style={styles.prescriptionImage}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Low Confidence Fields Summary */}
        {lowConfidenceFields.length > 0 && (
          <LowConfidenceFieldsSummary lowConfidenceFields={lowConfidenceFields} />
        )}

        {/* Safety Warnings */}
        {validationResult && (
          <InteractionWarnings
            drugInteractions={validationResult.safety_checks.drug_interactions}
            allergyWarnings={validationResult.safety_checks.allergy_warnings}
            contraindications={validationResult.safety_checks.contraindications}
          />
        )}

        {/* AI Transcription Editor */}
        <View style={styles.section}>
          <TranscriptionEditor
            items={selectedPrescription.items || []}
            onItemUpdate={handleItemUpdate}
            onItemCorrect={handleItemCorrect}
          />
        </View>
      </ScrollView>

      {/* Action Buttons (Fixed Footer) */}
      <PrescriptionActions
        prescriptionId={selectedPrescription.id}
        pharmacistId="current-pharmacist-id" // TODO: Get from auth state
        hasCriticalIssues={hasCriticalIssues}
        hasLowConfidenceFields={hasLowConfidenceFields}
        onApprove={handleApprove}
        onReject={handleReject}
        onMessageDoctor={handleMessageDoctor}
        disabled={loading.approval || loading.rejection}
      />
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imageSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  prescriptionImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
});

export default PrescriptionReviewScreen;
