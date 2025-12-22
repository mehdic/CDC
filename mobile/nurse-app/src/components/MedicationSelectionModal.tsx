/**
 * Medication Selection Modal
 * Modal for selecting medications from available inventory
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { fetchAvailableMedications } from '../services/medicationOrderService';

interface Medication {
  id: string;
  name: string;
  dosageOptions: string[];
  route: 'oral' | 'IV' | 'IM' | 'topical' | 'other';
  contraindications?: string[];
}

interface MedicationSelectionModalProps {
  visible: boolean;
  onSelect: (medication: {
    medicationId: string;
    name: string;
    dosage: string;
    quantity: number;
  }) => void;
  onClose: () => void;
}

export const MedicationSelectionModal: React.FC<
  MedicationSelectionModalProps
> = ({ visible, onSelect, onClose }) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(
    null
  );
  const [selectedDosage, setSelectedDosage] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadMedications();
    }
  }, [visible]);

  const loadMedications = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAvailableMedications();
      setMedications(data);
      setFilteredMedications(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load medications');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = medications.filter((med) =>
      med.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredMedications(filtered);
  };

  const handleSelectMedication = (medication: Medication) => {
    setSelectedMedication(medication);
    setSelectedDosage(medication.dosageOptions[0] || '');
    setQuantity('1');
  };

  const handleConfirmSelection = () => {
    if (!selectedMedication) {
      Alert.alert('Error', 'Please select a medication');
      return;
    }

    if (!selectedDosage) {
      Alert.alert('Error', 'Please select a dosage');
      return;
    }

    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    onSelect({
      medicationId: selectedMedication.id,
      name: selectedMedication.name,
      dosage: selectedDosage,
      quantity: parseInt(quantity, 10),
    });

    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSelectedMedication(null);
    setSelectedDosage('');
    setQuantity('1');
    setSearchQuery('');
    setFilteredMedications(medications);
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  if (selectedMedication) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Selection</Text>

            <View style={styles.selectedMedicationInfo}>
              <Text style={styles.selectedMedicationName}>
                {selectedMedication.name}
              </Text>
              <Text style={styles.medicationRoute}>
                Route: {selectedMedication.route.toUpperCase()}
              </Text>

              {selectedMedication.contraindications &&
                selectedMedication.contraindications.length > 0 && (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningTitle}>Contraindications:</Text>
                    {selectedMedication.contraindications.map(
                      (contraindication, index) => (
                        <Text key={index} style={styles.warningText}>
                          • {contraindication}
                        </Text>
                      )
                    )}
                  </View>
                )}
            </View>

            <View style={styles.confirmationFields}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Dosage</Text>
                <View style={styles.dosageContainer}>
                  {selectedMedication.dosageOptions.map((dosage, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dosageOption,
                        selectedDosage === dosage &&
                          styles.dosageOptionActive,
                      ]}
                      onPress={() => setSelectedDosage(dosage)}
                    >
                      <Text
                        style={[
                          styles.dosageOptionText,
                          selectedDosage === dosage &&
                            styles.dosageOptionTextActive,
                        ]}
                      >
                        {dosage}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Quantity</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholder="Enter quantity"
                />
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmSelection}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Medication</Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search medications..."
            value={searchQuery}
            onChangeText={handleSearch}
            editable={!isLoading}
          />

          {isLoading ? (
            <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
          ) : (
            <FlatList
              data={filteredMedications}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.medicationOption}
                  onPress={() => handleSelectMedication(item)}
                >
                  <View style={styles.medicationOptionContent}>
                    <Text style={styles.medicationOptionName}>{item.name}</Text>
                    <Text style={styles.medicationOptionDetails}>
                      Route: {item.route.toUpperCase()} |{' '}
                      {item.dosageOptions.length} dosage options
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No medications found</Text>
              }
              scrollEnabled
            />
          )}

          <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    paddingTop: 20,
    paddingHorizontal: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 15,
    fontSize: 14,
  },
  loader: {
    marginVertical: 40,
  },
  medicationOption: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  medicationOptionContent: {
    flex: 1,
  },
  medicationOptionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  medicationOptionDetails: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 30,
    color: '#999',
  },
  closeButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 15,
  },
  closeButtonText: {
    color: '#999',
    fontWeight: '600',
    fontSize: 14,
  },
  selectedMedicationInfo: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  selectedMedicationName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  medicationRoute: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 6,
  },
  warningText: {
    fontSize: 11,
    color: '#856404',
    marginBottom: 4,
  },
  confirmationFields: {
    marginBottom: 20,
  },
  field: {
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dosageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dosageOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  dosageOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dosageOptionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dosageOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#999',
    fontWeight: '600',
    fontSize: 14,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default MedicationSelectionModal;
