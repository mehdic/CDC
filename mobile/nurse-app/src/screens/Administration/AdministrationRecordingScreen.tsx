/**
 * Administration Recording Screen
 * Allows nurses to record medication administration with barcode verification
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
  Switch,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { nurseApiClient } from '../../services/nurseApiClient';
import { Medication } from '../../types';

interface AdministrationRecordingScreenProps {
  navigation: any;
  route: {
    params: {
      patientId: string;
      medicationId?: string;
      scheduledTime?: string;
    };
  };
}

export const AdministrationRecordingScreen: React.FC<AdministrationRecordingScreenProps> = ({
  navigation,
  route,
}) => {
  const { patientId, medicationId, scheduledTime } = route.params;
  const { nurse } = useSelector((state: RootState) => state.auth);

  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedMedicationId, setSelectedMedicationId] = useState(medicationId || '');
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [dosage, setDosage] = useState('');
  const [administrationRoute, setAdministrationRoute] = useState('');
  const [notes, setNotes] = useState('');
  const [barcodeVerified, setBarcodeVerified] = useState(false);
  const [witnessed, setWitnessed] = useState(false);
  const [witnessName, setWitnessName] = useState('');
  const [sideEffects, setSideEffects] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMeds, setLoadingMeds] = useState(true);

  useEffect(() => {
    loadPatientMedications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const loadPatientMedications = async () => {
    try {
      const meds = await nurseApiClient.getPatientMedications(patientId);
      setMedications(meds.filter((m) => m.status === 'active'));
    } catch (error) {
      Alert.alert('Error', 'Failed to load medications');
    } finally {
      setLoadingMeds(false);
    }
  };

  const openBarcodeScanner = () => {
    navigation.navigate('BarcodeScanner', {
      patientId,
      onScan: handleBarcodeScanned,
    });
  };

  const handleBarcodeScanned = async (barcode: string) => {
    try {
      const result = await nurseApiClient.verifyMedicationBarcode(barcode, patientId);
      if (result.valid) {
        setBarcodeVerified(true);
        setSelectedMedicationId(result.medicationId);
        Alert.alert('Success', 'Medication verified successfully');
      } else {
        Alert.alert('Error', result.message || 'Invalid medication barcode');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Barcode verification failed');
    }
  };

  const validateAdministration = (): boolean => {
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

  const recordAdministration = async () => {
    if (!validateAdministration() || !nurse) {return;}

    setLoading(true);
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
        sideEffects: sideEffects ? sideEffects.split(',').map((s) => s.trim()) : undefined,
        witnessed,
        witnessedBy: witnessed ? witnessName : undefined,
      };

      await nurseApiClient.recordAdministration(administrationData);

      Alert.alert(
        'Success',
        'Administration recorded successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to record administration');
    } finally {
      setLoading(false);
    }
  };

  if (loadingMeds) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
        <Text style={styles.loadingText}>Loading medications...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medication</Text>

        <TouchableOpacity style={styles.scanButton} onPress={openBarcodeScanner}>
          <Text style={styles.scanButtonText}>
            {barcodeVerified ? '✓ Scan Another Barcode' : '📷 Scan Barcode'}
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
                    selectedMedicationId === med.id && styles.medOptionTextSelected,
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
            <Text style={styles.medDetailText}>Generic: {selectedMedication.genericName || 'N/A'}</Text>
            <Text style={styles.medDetailText}>Frequency: {selectedMedication.frequency}</Text>
            <Text style={styles.medDetailText}>Instructions: {selectedMedication.instructions || 'None'}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Administration Details</Text>

        <TextInput
          style={styles.input}
          placeholder="Dosage *"
          value={dosage}
          onChangeText={setDosage}
        />

        <Text style={styles.label}>Route of Administration *</Text>
        <View style={styles.routeButtons}>
          {(['oral', 'iv', 'im', 'subcutaneous', 'topical'] as const).map((r) => (
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
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety & Monitoring</Text>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Witnessed Administration</Text>
          <Switch value={witnessed} onValueChange={setWitnessed} />
        </View>

        {witnessed && (
          <TextInput
            style={styles.input}
            placeholder="Witness Name *"
            value={witnessName}
            onChangeText={setWitnessName}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Side Effects (comma-separated, optional)"
          value={sideEffects}
          onChangeText={setSideEffects}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={recordAdministration}
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
  },
  textArea: {
    height: 80,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 8,
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
});

export default AdministrationRecordingScreen;
