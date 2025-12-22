/**
 * Administration Recording Screen
 * Comprehensive medication administration recording with safety checks
 * - Barcode scanning for medication verification
 * - Dosage validation
 * - Patient confirmation
 * - Side effects reporting
 * - Witnessed administration
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  Modal,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import {
  recordMedicationAdministration,
  verifyMedicationBarcode,
  validateDosage,
  clearError,
} from '../../store/administrationSlice';
import { nurseApiClient } from '../../services/nurseApiClient';
import { Medication, Patient } from '../../types';
import { AdministrationRecordingScreenProps } from '../../navigation/types';

/**
 * Component for patient confirmation before administration
 */
const PatientConfirmation: React.FC<{
  patient: Patient | null;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ patient, onConfirm, onCancel }) => {
  const [confirmed, setConfirmed] = useState(false);

  if (!patient) return null;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.confirmationOverlay}>
        <View style={styles.confirmationCard}>
          <Text style={styles.confirmationTitle}>Confirm Patient Identity</Text>

          <View style={styles.patientInfo}>
            <Text style={styles.infoLabel}>Patient Name:</Text>
            <Text style={styles.infoValue}>
              {patient.firstName} {patient.lastName}
            </Text>

            <Text style={styles.infoLabel}>Date of Birth:</Text>
            <Text style={styles.infoValue}>
              {new Date(patient.dateOfBirth).toLocaleDateString()}
            </Text>

            {patient.roomNumber && (
              <>
                <Text style={styles.infoLabel}>Room Number:</Text>
                <Text style={styles.infoValue}>{patient.roomNumber}</Text>
              </>
            )}

            {patient.mrn && (
              <>
                <Text style={styles.infoLabel}>MRN:</Text>
                <Text style={styles.infoValue}>{patient.mrn}</Text>
              </>
            )}
          </View>

          <View style={styles.confirmationCheckbox}>
            <Switch
              value={confirmed}
              onValueChange={setConfirmed}
              trackColor={{ false: '#DDD', true: '#27AE60' }}
              thumbColor={confirmed ? '#27AE60' : '#999'}
            />
            <Text style={styles.confirmationText}>
              I confirm this is the correct patient
            </Text>
          </View>

          <View style={styles.confirmationButtonContainer}>
            <TouchableOpacity
              style={[styles.confirmationButton, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmationButton,
                confirmed ? styles.confirmButton : styles.confirmButtonDisabled,
              ]}
              disabled={!confirmed}
              onPress={onConfirm}
            >
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Main Administration Recording Screen Component
 */
export const AdministrationRecordingScreen: React.FC<AdministrationRecordingScreenProps> = ({
  navigation,
  route,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { patientId, medicationId, scheduledTime } = route.params || {};

  // Redux state
  const { nurse } = useSelector((state: RootState) => state.auth);
  const { loading, error } = useSelector(
    (state: RootState) => state.administration
  );

  // Local state
  const [medications, setMedications] = useState<Medication[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [selectedMedicationId, setSelectedMedicationId] = useState(medicationId || '');
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(
    null
  );
  const [dosage, setDosage] = useState('');
  const [administrationRoute, setAdministrationRoute] = useState<
    'oral' | 'iv' | 'im' | 'subcutaneous' | 'topical' | 'inhalation' | 'other'
  >('oral');
  const [notes, setNotes] = useState('');
  const [barcodeVerified, setBarcodeVerified] = useState(false);
  const [witnessed, setWitnessed] = useState(false);
  const [witnessName, setWitnessName] = useState('');
  const [sideEffects, setSideEffects] = useState('');
  const [loadingMeds, setLoadingMeds] = useState(true);
  const [showPatientConfirmation, setShowPatientConfirmation] = useState<boolean>(false);
  const [dosageValid, setDosageValid] = useState(true);

  // Load medications and patient data
  useEffect(() => {
    loadPatientData();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
  }, [patientId]);

  // Update selected medication when ID changes
  useEffect(() => {
    if (selectedMedicationId) {
      const med = medications.find((m) => m.id === selectedMedicationId);
      if (med) {
        setSelectedMedication(med);
        setDosage(med.dosage);
        setAdministrationRoute(med.route);
      }
    }
  }, [selectedMedicationId, medications]);

  /**
   * Load patient medications and details
   */
  const loadPatientData = async (): Promise<void> => {
    if (!patientId) return;
    try {
      const [meds, patientData] = await Promise.all([
        nurseApiClient.getPatientMedications(patientId),
        nurseApiClient.getPatient(patientId),
      ]);
      setMedications(meds.filter((m) => m.status === 'active'));
      setPatient(patientData);
    } catch {
      Alert.alert('Error', 'Failed to load patient data');
    } finally {
      setLoadingMeds(false);
    }
  };

  /**
   * Navigate to barcode scanner
   */
  const openBarcodeScanner = useCallback((): void => {
    navigation.navigate('BarcodeScanner', {
      patientId,
      onScan: handleBarcodeScanned,
    });
  }, [navigation, patientId]);

  /**
   * Handle barcode scanned
   */
  const handleBarcodeScanned = useCallback(
    async (barcode: string): Promise<void> => {
      try {
        const result = await dispatch(
          verifyMedicationBarcode({ barcode, patientId: patientId || '' })
        ).unwrap();
        if (result.valid) {
          setBarcodeVerified(true);
          setSelectedMedicationId(result.medicationId);
          Alert.alert('Success', 'Medication verified successfully');
        } else {
          Alert.alert(
            'Error',
            result.message || 'Invalid medication barcode'
          );
        }
      } catch {
        Alert.alert('Error', 'Barcode verification failed');
      }
    },
    [dispatch, patientId]
  );

  /**
   * Validate dosage
   */
  const validateDosageValue = useCallback(async (): Promise<void> => {
    if (!selectedMedicationId || !dosage || !patientId) return;
    try {
      const result = await dispatch(
        validateDosage({
          medicationId: selectedMedicationId,
          dosage,
          patientId,
        })
      ).unwrap();
      setDosageValid(result.valid);
      if (!result.valid) {
        Alert.alert('Warning', result.message || 'Dosage may be outside normal range');
      }
    } catch (err: unknown) {
      console.warn('Dosage validation error:', err);
    }
  }, [dispatch, selectedMedicationId, dosage, patientId]);

  /**
   * Validate form before submission
   */
  const validateAdministration = (): boolean => {
    if (!patientId) {
      Alert.alert('Error', 'Patient ID is missing');
      return false;
    }

    if (!selectedMedicationId) {
      Alert.alert('Error', 'Please select a medication');
      return false;
    }

    if (!dosage) {
      Alert.alert('Error', 'Please enter dosage');
      return false;
    }

    if (!administrationRoute) {
      Alert.alert('Error', 'Please select administration route');
      return false;
    }

    if (witnessed && !witnessName) {
      Alert.alert('Error', 'Please enter witness name');
      return false;
    }

    return true;
  };

  /**
   * Handle patient confirmation
   */
  const handlePatientConfirmed = (): void => {
    setShowPatientConfirmation(false);
    recordAdministration();
  };

  /**
   * Record medication administration
   */
  const recordAdministration = async (): Promise<void> => {
    if (!validateAdministration() || !nurse || !patientId) {
      return;
    }

    try {
      const administrationData = {
        patientId,
        medicationId: selectedMedicationId,
        scheduledTime: scheduledTime || new Date().toISOString(),
        administeredAt: new Date().toISOString(),
        administeredBy: nurse.id,
        dosage,
        route: administrationRoute,
        notes: notes || undefined,
        barcodeVerified,
        sideEffects: sideEffects
          ? sideEffects.split(',').map((s) => s.trim())
          : undefined,
        witnessed,
        witnessedBy: witnessed ? witnessName : undefined,
      };

      await dispatch(
        recordMedicationAdministration(administrationData)
      ).unwrap();

      Alert.alert('Success', 'Administration recorded successfully', [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (err: unknown) {
      const errorMessage = typeof err === 'string' ? err : 'Failed to record administration';
      Alert.alert('Error', errorMessage);
    }
  };

  /**
   * Handle submit button press
   */
  const handleSubmit = (): void => {
    if (!validateAdministration()) {
      return;
    }
    setShowPatientConfirmation(true);
  };

  if (loadingMeds) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
        <Text style={styles.loadingText}>Loading medications...</Text>
      </View>
    );
  }

  const routeOptions: readonly (
    | 'oral'
    | 'iv'
    | 'im'
    | 'subcutaneous'
    | 'topical'
    | 'inhalation'
    | 'other'
  )[] = [
    'oral',
    'iv',
    'im',
    'subcutaneous',
    'topical',
    'inhalation',
  ];

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Error Display */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={() => dispatch(clearError())}
              style={styles.closeError}
            >
              <Text style={styles.closeErrorText}>×</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Patient Information */}
        {patient && (
          <View style={styles.patientSection}>
            <Text style={styles.sectionTitle}>Patient</Text>
            <View style={styles.infoBox}>
              <View style={styles.infoBo}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>
                  {patient.firstName} {patient.lastName}
                </Text>
              </View>
              {patient.roomNumber && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Room:</Text>
                  <Text style={styles.infoValue}>{patient.roomNumber}</Text>
                </View>
              )}
              {patient.allergies.length > 0 && (
                <View style={[styles.infoRow, styles.allergyWarning]}>
                  <Text style={styles.allergyLabel}>
                    Allergies: {patient.allergies.join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Medication Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medication</Text>

          <TouchableOpacity
            style={styles.scanButton}
            onPress={openBarcodeScanner}
          >
            <Text style={styles.scanButtonText}>
              {barcodeVerified ? '✓ Verify Another Barcode' : '📷 Scan Barcode'}
            </Text>
          </TouchableOpacity>

          {barcodeVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Barcode Verified</Text>
            </View>
          )}

          <View style={styles.picker}>
            <Text style={styles.pickerLabel}>Select Medication:</Text>
            {medications.length === 0 ? (
              <Text style={styles.noMeds}>No active medications for this patient</Text>
            ) : (
              medications.map((med) => (
                <TouchableOpacity
                  key={med.id}
                  style={[
                    styles.medOption,
                    selectedMedicationId === med.id && styles.medOptionSelected,
                  ]}
                  onPress={() => setSelectedMedicationId(med.id)}
                >
                  <Text
                    style={[
                      styles.medOptionText,
                      selectedMedicationId === med.id &&
                        styles.medOptionTextSelected,
                    ]}
                  >
                    {med.name} - {med.dosage}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {selectedMedication && (
            <View style={styles.medDetails}>
              <Text style={styles.medDetailText}>
                Generic: {selectedMedication.genericName || 'N/A'}
              </Text>
              <Text style={styles.medDetailText}>
                Frequency: {selectedMedication.frequency}
              </Text>
              <Text style={styles.medDetailText}>
                Instructions: {selectedMedication.instructions || 'None'}
              </Text>
            </View>
          )}
        </View>

        {/* Administration Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Administration Details</Text>

          <TextInput
            style={styles.input}
            placeholder="Dosage *"
            value={dosage}
            onChangeText={setDosage}
            onBlur={validateDosageValue}
            placeholderTextColor="#95A5A6"
          />
          {!dosageValid && (
            <Text style={styles.warningText}>⚠ Dosage outside normal range</Text>
          )}

          <Text style={styles.label}>Route of Administration *</Text>
          <View style={styles.routeButtons}>
            {routeOptions.map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.routeButton,
                  administrationRoute === r && styles.routeButtonActive,
                ]}
                onPress={() => setAdministrationRoute(r)}
              >
                <Text
                  style={[
                    styles.routeButtonText,
                    administrationRoute === r && styles.routeButtonTextActive,
                  ]}
                >
                  {r.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#95A5A6"
          />
        </View>

        {/* Safety & Monitoring */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety & Monitoring</Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Witnessed Administration</Text>
            <Switch
              value={witnessed}
              onValueChange={setWitnessed}
              trackColor={{ false: '#DDD', true: '#27AE60' }}
              thumbColor={witnessed ? '#27AE60' : '#999'}
            />
          </View>

          {witnessed && (
            <TextInput
              style={styles.input}
              placeholder="Witness Name *"
              value={witnessName}
              onChangeText={setWitnessName}
              placeholderTextColor="#95A5A6"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Side Effects (comma-separated, optional)"
            value={sideEffects}
            onChangeText={setSideEffects}
            placeholderTextColor="#95A5A6"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>Record Administration</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Patient Confirmation Modal */}
      <PatientConfirmation
        patient={patient}
        onConfirm={handlePatientConfirmed}
        onCancel={() => setShowPatientConfirmation(false)}
      />
    </>
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
  errorBanner: {
    backgroundColor: '#E74C3C',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFF',
    fontSize: 14,
    flex: 1,
  },
  closeError: {
    padding: 4,
  },
  closeErrorText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  patientSection: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB',
  },
  infoBox: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 6,
  },
  infoBo: {
    marginBottom: 8,
  },
  infoRow: {
    marginTop: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  allergyWarning: {
    backgroundColor: '#FFF3CD',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  allergyLabel: {
    fontSize: 13,
    color: '#856404',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
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
    color: '#2C3E50',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#E67E22',
    marginBottom: 8,
    marginTop: -4,
    fontWeight: '500',
  },
  scanButton: {
    backgroundColor: '#3498DB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  verifiedBadge: {
    backgroundColor: '#27AE60',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  verifiedText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  picker: {
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 8,
  },
  noMeds: {
    fontSize: 14,
    color: '#95A5A6',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  medOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDE2E8',
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#FAFBFC',
  },
  medOptionSelected: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  medOptionText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  medOptionTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  medDetails: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  medDetailText: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  routeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  routeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDE2E8',
    backgroundColor: '#FFF',
  },
  routeButtonActive: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  routeButtonText: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  routeButtonTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#2C3E50',
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
  // Patient confirmation modal styles
  confirmationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  confirmationCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    minWidth: '80%',
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
    textAlign: 'center',
  },
  patientInfo: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  confirmationCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  confirmationText: {
    fontSize: 14,
    color: '#2C3E50',
    marginLeft: 12,
    flex: 1,
  },
  confirmationButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#95A5A6',
  },
  confirmButton: {
    backgroundColor: '#27AE60',
  },
  confirmButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdministrationRecordingScreen;
