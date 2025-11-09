/**
 * Patient Medical Record Sidebar Component - Pharmacist App
 * Displays patient medical history during video consultation
 * Task: T164
 * FR-024: Pharmacists MUST be able to access patient medical records in sidebar during active video consultations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  teleconsultationService,
  PatientMedicalRecord,
} from '../services/teleconsultationService';

interface PatientRecordSidebarProps {
  patientId: string;
  visible: boolean;
  onClose?: () => void;
}

const PatientRecordSidebar: React.FC<PatientRecordSidebarProps> = ({
  patientId,
  visible,
  onClose,
}) => {
  const [medicalRecord, setMedicalRecord] = useState<PatientMedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('allergies');

  useEffect(() => {
    if (visible && patientId) {
      loadMedicalRecord();
    }
  }, [visible, patientId]);

  const loadMedicalRecord = async () => {
    try {
      setLoading(true);
      const record = await teleconsultationService.getPatientRecord(patientId);
      setMedicalRecord(record);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load patient medical record');
      console.error('Load medical record error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading medical record...</Text>
      </View>
    );
  }

  if (!medicalRecord) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No medical record available</Text>
      </View>
    );
  }

  const renderSectionButton = (section: string, label: string, count: number) => {
    const isActive = activeSection === section;
    return (
      <TouchableOpacity
        key={section}
        style={[styles.sectionButton, isActive && styles.sectionButtonActive]}
        onPress={() => setActiveSection(section)}
        testID={`section-${section}-button`}
      >
        <Text style={[styles.sectionButtonText, isActive && styles.sectionButtonTextActive]}>
          {label}
        </Text>
        <View style={[styles.sectionBadge, isActive && styles.sectionBadgeActive]}>
          <Text
            style={[styles.sectionBadgeText, isActive && styles.sectionBadgeTextActive]}
            testID={`${section}-count-badge`}
          >
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Patient Medical Record</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Section Tabs */}
      <View style={styles.sectionTabs}>
        {renderSectionButton('allergies', 'Allergies', medicalRecord.allergies.length)}
        {renderSectionButton('conditions', 'Conditions', medicalRecord.chronic_conditions.length)}
        {renderSectionButton('medications', 'Medications', medicalRecord.current_medications.length)}
        {renderSectionButton('history', 'History', medicalRecord.prescription_history.length)}
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Allergies Section */}
        {activeSection === 'allergies' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Allergies</Text>
            {medicalRecord.allergies.length === 0 ? (
              <Text style={styles.noDataText}>No known allergies</Text>
            ) : (
              medicalRecord.allergies.map((allergy, index) => (
                <View key={index} style={styles.allergyItem}>
                  <View style={styles.allergyIcon}>
                    <Text style={styles.allergyIconText}>⚠</Text>
                  </View>
                  <Text style={styles.allergyText}>{allergy}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Chronic Conditions Section */}
        {activeSection === 'conditions' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chronic Conditions</Text>
            {medicalRecord.chronic_conditions.length === 0 ? (
              <Text style={styles.noDataText}>No chronic conditions recorded</Text>
            ) : (
              medicalRecord.chronic_conditions.map((condition, index) => (
                <View key={index} style={styles.conditionItem}>
                  <Text style={styles.conditionText}>{condition}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Current Medications Section */}
        {activeSection === 'medications' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Medications</Text>
            {medicalRecord.current_medications.length === 0 ? (
              <Text style={styles.noDataText}>No current medications</Text>
            ) : (
              medicalRecord.current_medications.map((medication, index) => (
                <View key={index} style={styles.medicationCard}>
                  <Text style={styles.medicationName}>{medication.name}</Text>
                  <View style={styles.medicationDetails}>
                    <View style={styles.medicationDetailRow}>
                      <Text style={styles.medicationLabel}>Dosage:</Text>
                      <Text style={styles.medicationValue}>{medication.dosage}</Text>
                    </View>
                    <View style={styles.medicationDetailRow}>
                      <Text style={styles.medicationLabel}>Frequency:</Text>
                      <Text style={styles.medicationValue}>{medication.frequency}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Prescription History Section */}
        {activeSection === 'history' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prescription History</Text>
            {medicalRecord.prescription_history.length === 0 ? (
              <Text style={styles.noDataText}>No prescription history</Text>
            ) : (
              medicalRecord.prescription_history.map((prescription) => (
                <View key={prescription.id} style={styles.historyCard}>
                  <Text style={styles.historyMedication}>{prescription.medication_name}</Text>
                  <Text style={styles.historyDate}>
                    {new Date(prescription.prescribed_date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.historyDoctor}>{prescription.prescribing_doctor}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Warning Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ⓘ Patient health information is confidential (HIPAA/GDPR compliant)
        </Text>
      </View>
    </View>
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  sectionTabs: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sectionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  sectionButtonActive: {
    backgroundColor: '#007AFF',
  },
  sectionButtonText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
    marginRight: 4,
  },
  sectionButtonTextActive: {
    color: '#fff',
  },
  sectionBadge: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sectionBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  sectionBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000',
  },
  sectionBadgeTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  allergyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  allergyIcon: {
    marginRight: 12,
  },
  allergyIconText: {
    fontSize: 20,
  },
  allergyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  conditionItem: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  conditionText: {
    fontSize: 14,
    color: '#000',
  },
  medicationCard: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  medicationDetails: {
    marginTop: 4,
  },
  medicationDetailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  medicationLabel: {
    fontSize: 14,
    color: '#666',
    width: 80,
  },
  medicationValue: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  historyCard: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyMedication: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  historyDoctor: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    padding: 12,
    backgroundColor: '#F9F9F9',
  },
  footerText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
});

export default PatientRecordSidebar;
