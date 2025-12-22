/**
 * Medication Order Screen
 * Create and manage medication orders for patients
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { MedicationOrderScreenProps } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import {
  initializeOrderForm,
  addOrder,
  setSubmittingOrder,
  clearOrderForm,
  setOrderFormErrors,
} from '../../store/medicationSlice';
import { MedicationOrderForm } from '../../components/MedicationOrderForm';
import { MedicationSelectionModal } from '../../components/MedicationSelectionModal';
import {
  validateMedicationOrder,
  createMedicationOrder,
} from '../../services/medicationOrderService';

const MedicationOrderScreen: React.FC<MedicationOrderScreenProps> = ({
  route,
  navigation,
}) => {
  const { patientId, patientName } = route.params;
  const dispatch = useAppDispatch();
  const { activeOrders, currentOrderForm, isSubmittingOrder } = useAppSelector(
    (state) => state.medication
  );
  const { nurse } = useAppSelector((state) => state.auth);

  const [selectedUrgency, setSelectedUrgency] = useState<'routine' | 'urgent' | 'stat'>('routine');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isMedicationModalVisible, setIsMedicationModalVisible] = useState(false);

  const handleCreateOrder = useCallback(() => {
    dispatch(initializeOrderForm(patientId));
    setIsFormVisible(true);
  }, [dispatch, patientId]);

  const handleMedicationSelect = useCallback(
    (medication: {
      medicationId: string;
      name: string;
      dosage: string;
      quantity: number;
    }) => {
      if (!currentOrderForm) return;

      const existingIndex = currentOrderForm.medications.findIndex(
        (m) => m.medicationId === medication.medicationId
      );

      let updatedMedications;
      if (existingIndex >= 0) {
        updatedMedications = [...currentOrderForm.medications];
        updatedMedications[existingIndex] = medication;
      } else {
        updatedMedications = [...currentOrderForm.medications, medication];
      }

      dispatch(
        updateOrderFormMedications(updatedMedications)
      );
      setIsMedicationModalVisible(false);
    },
    [currentOrderForm, dispatch]
  );

  const handleSubmitOrder = useCallback(
    async (formData: {
      patientId: string;
      medications: {
        medicationId: string;
        name: string;
        quantity: number;
        dosage: string;
      }[];
      urgency: 'routine' | 'urgent' | 'stat';
      notes?: string;
    }) => {
      try {
        // Validate form
        const validationErrors = validateMedicationOrder(formData);
        if (validationErrors.length > 0) {
          const errorMap: Record<string, string> = {};
          validationErrors.forEach((error) => {
            errorMap[error.field] = error.message;
          });
          dispatch(setOrderFormErrors(errorMap));
          Alert.alert('Validation Error', 'Please fix the errors in the form');
          return;
        }

        dispatch(setSubmittingOrder(true));

        // Create order through API
        const order = await createMedicationOrder(
          formData,
          nurse?.firstName ? `${nurse.firstName} ${nurse.lastName}` : 'Unknown Nurse',
          'PHARMACY-001'
        );

        // Update Redux store
        dispatch(addOrder(order));
        dispatch(clearOrderForm());
        setIsFormVisible(false);

        Alert.alert('Success', 'Medication order submitted successfully', [
          {
            text: 'View Order',
            onPress: () => {
              navigation.goBack();
            },
          },
          {
            text: 'Create Another',
            onPress: () => {
              dispatch(initializeOrderForm(patientId));
            },
          },
        ]);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create order';
        Alert.alert('Error', errorMessage);
      } finally {
        dispatch(setSubmittingOrder(false));
      }
    },
    [dispatch, nurse, navigation, patientId]
  );

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      pending: '#ffc107',
      processing: '#17a2b8',
      ready: '#28a745',
      delivered: '#6c757d',
    };
    return colors[status] || '#999';
  };

  const filteredOrders = activeOrders.filter(
    (order) => order.patientId === patientId && order.urgency === selectedUrgency
  );

  if (isFormVisible && currentOrderForm) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => {
              setIsFormVisible(false);
              dispatch(clearOrderForm());
            }}
          >
            <Text style={styles.headerBackButton}>{'<'} Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Order</Text>
          <View style={styles.headerSpacer} />
        </View>

        <MedicationOrderForm
          patientId={patientId}
          onSubmit={handleSubmitOrder}
          isSubmitting={isSubmittingOrder}
        />

        <TouchableOpacity
          style={styles.addMedicationButton}
          onPress={() => setIsMedicationModalVisible(true)}
          disabled={isSubmittingOrder}
        >
          <Text style={styles.addMedicationButtonText}>Add from Inventory</Text>
        </TouchableOpacity>

        <MedicationSelectionModal
          visible={isMedicationModalVisible}
          onSelect={handleMedicationSelect}
          onClose={() => setIsMedicationModalVisible(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerBackButton}>{'<'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Orders for {patientName}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <TouchableOpacity style={styles.createButton} onPress={handleCreateOrder}>
        <Text style={styles.createButtonText}>+ Create New Order</Text>
      </TouchableOpacity>

      <View style={styles.filterContainer}>
        {(['routine', 'urgent', 'stat'] as const).map((urgency) => (
          <TouchableOpacity
            key={urgency}
            style={[
              styles.filterButton,
              selectedUrgency === urgency && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedUrgency(urgency)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedUrgency === urgency && styles.filterButtonTextActive,
              ]}
            >
              {urgency.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isSubmittingOrder && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Submitting order...</Text>
        </View>
      )}

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.orderItem}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderTitle}>Order {item.id}</Text>
                <Text style={styles.orderSubtitle}>
                  {item.medications.length} medication(s)
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) },
                ]}
              >
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            <View style={styles.orderDetails}>
              <Text style={styles.orderDetail}>Ordered: {item.orderedAt}</Text>
              {item.estimatedDeliveryTime && (
                <Text style={styles.orderDetail}>
                  Est. Delivery: {item.estimatedDeliveryTime}
                </Text>
              )}
              {item.notes && (
                <Text style={styles.orderDetail} numberOfLines={1}>
                  Notes: {item.notes}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No orders with {selectedUrgency} urgency
          </Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerBackButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 50,
  },
  createButton: {
    backgroundColor: '#007AFF',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginBottom: 15,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  orderItem: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  orderSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  orderDetails: {
    gap: 6,
  },
  orderDetail: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
    fontSize: 14,
  },
  addMedicationButton: {
    backgroundColor: '#34C759',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addMedicationButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

// Import the missing action
import { updateOrderFormMedications } from '../../store/medicationSlice';

export default MedicationOrderScreen;
