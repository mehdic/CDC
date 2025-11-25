/**
 * Delivery Detail Screen
 * Full delivery information with package details and acceptance workflow
 */

import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { acceptDeliveryAsync, setActiveDelivery } from '../../store/deliverySlice';
import { DeliveryRequest, SpecialHandling } from '../../types/delivery';

export const DeliveryDetailScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { deliveryId } = route.params;
  const dispatch = useAppDispatch();
  const { requests } = useAppSelector((state) => state.delivery);

  const delivery = requests.find((r) => r.id === deliveryId);

  if (!delivery) {
    return (
      <View style={styles.container}>
        <Text>Delivery not found</Text>
      </View>
    );
  }

  const handleAccept = async () => {
    Alert.alert('Accept Delivery', 'Do you want to accept this delivery?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: async () => {
          try {
            await dispatch(acceptDeliveryAsync(delivery.id)).unwrap();
            dispatch(setActiveDelivery(delivery));
            Alert.alert('Success', 'Delivery accepted!');
            navigation.navigate('Map');
          } catch (error: any) {
            Alert.alert('Error', error || 'Failed to accept delivery');
          }
        },
      },
    ]);
  };

  const getSpecialHandlingIcon = (handling: SpecialHandling) => {
    const icons: Record<SpecialHandling, string> = {
      cold_chain: '❄️',
      narcotics: '⚠️',
      signature_required: '✍️',
      id_verification: '🆔',
      time_sensitive: '⏱️',
    };
    return icons[handling] || '📦';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patient Information</Text>
        <Text style={styles.patientName}>{delivery.patient.name}</Text>
        <Text style={styles.phone}>{delivery.patient.phone}</Text>
        <Text style={styles.address}>
          {delivery.patient.address.street}
          {'\n'}
          {delivery.patient.address.postalCode} {delivery.patient.address.city}
          {'\n'}
          {delivery.patient.address.canton}
        </Text>
        {delivery.patient.availabilityWindow && (
          <Text style={styles.availability}>
            Available: {new Date(delivery.patient.availabilityWindow.start).toLocaleTimeString()} -{' '}
            {new Date(delivery.patient.availabilityWindow.end).toLocaleTimeString()}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Distance:</Text>
          <Text style={styles.value}>{delivery.distance.toFixed(1)} km</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Estimated Duration:</Text>
          <Text style={styles.value}>{delivery.estimatedDuration} min</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Payment Method:</Text>
          <Text style={styles.value}>{delivery.paymentMethod}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Priority:</Text>
          <Text style={[styles.value, styles.priority]}>{delivery.priority.toUpperCase()}</Text>
        </View>
      </View>

      {delivery.packages.map((pkg, idx) => (
        <View key={pkg.id} style={styles.section}>
          <Text style={styles.sectionTitle}>Package {idx + 1}</Text>
          <Text style={styles.qrCode}>QR: {pkg.qrCode}</Text>

          {pkg.specialHandling.length > 0 && (
            <View style={styles.specialHandling}>
              {pkg.specialHandling.map((handling) => (
                <View key={handling} style={styles.handlingBadge}>
                  <Text style={styles.handlingText}>
                    {getSpecialHandlingIcon(handling)} {handling.replace('_', ' ')}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.medicationsTitle}>Medications:</Text>
          {pkg.medications.map((med) => (
            <View key={med.id} style={styles.medication}>
              <Text style={styles.medName}>{med.name}</Text>
              <Text style={styles.medDetails}>
                {med.quantity}x - {med.dosage}
              </Text>
              {med.isControlledSubstance && (
                <Text style={styles.controlledSubstance}>⚠️ Controlled Substance</Text>
              )}
              {med.requiresColdChain && <Text style={styles.coldChain}>❄️ Requires Cold Chain</Text>}
            </View>
          ))}
        </View>
      ))}

      {delivery.specialInstructions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <Text style={styles.instructions}>{delivery.specialInstructions}</Text>
        </View>
      )}

      {delivery.status === 'pending' || delivery.status === 'assigned' ? (
        <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
          <Text style={styles.acceptButtonText}>Accept Delivery</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.viewMapButton}
          onPress={() => navigation.navigate('Map')}
        >
          <Text style={styles.viewMapButtonText}>View on Map</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  section: { backgroundColor: '#FFF', marginBottom: 16, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  patientName: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  phone: { fontSize: 16, color: '#007AFF', marginBottom: 8 },
  address: { fontSize: 14, color: '#666', lineHeight: 20 },
  availability: { fontSize: 12, color: '#28A745', marginTop: 8, fontWeight: '600' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  label: { fontSize: 14, color: '#666' },
  value: { fontSize: 14, fontWeight: '600', color: '#333' },
  priority: { color: '#FF9800' },
  qrCode: { fontSize: 12, color: '#666', marginBottom: 12, fontFamily: 'monospace' },
  specialHandling: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  handlingBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  handlingText: { fontSize: 12, color: '#856404', fontWeight: '600' },
  medicationsTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  medication: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  medName: { fontSize: 14, fontWeight: '600', color: '#333' },
  medDetails: { fontSize: 12, color: '#666', marginTop: 2 },
  controlledSubstance: { fontSize: 12, color: '#DC3545', marginTop: 4, fontWeight: '600' },
  coldChain: { fontSize: 12, color: '#17A2B8', marginTop: 4, fontWeight: '600' },
  instructions: { fontSize: 14, color: '#666', lineHeight: 20, fontStyle: 'italic' },
  acceptButton: {
    backgroundColor: '#28A745',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  viewMapButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewMapButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});

export default DeliveryDetailScreen;
