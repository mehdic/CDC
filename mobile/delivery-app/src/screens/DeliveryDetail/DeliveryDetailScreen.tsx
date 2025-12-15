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
      <View
        style={styles.container}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLiveRegion="assertive"
      >
        <Text accessible={true} accessibilityLabel="Delivery not found">
          Delivery not found
        </Text>
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
    <ScrollView
      style={styles.container}
      accessible={true}
      accessibilityLabel={`Delivery details for ${delivery.patient.name}`}
    >
      <View
        style={styles.section}
        accessible={true}
        accessibilityLabel="Patient information section"
      >
        <Text
          style={styles.sectionTitle}
          accessible={true}
          accessibilityRole="header"
        >
          Patient Information
        </Text>
        <Text
          style={styles.patientName}
          accessible={true}
          accessibilityLabel={`Patient name: ${delivery.patient.name}`}
        >
          {delivery.patient.name}
        </Text>
        <Text
          style={styles.phone}
          accessible={true}
          accessibilityLabel={`Phone: ${delivery.patient.phone}`}
        >
          {delivery.patient.phone}
        </Text>
        <Text
          style={styles.address}
          accessible={true}
          accessibilityLabel={`Address: ${delivery.patient.address.street}, ${delivery.patient.address.postalCode} ${delivery.patient.address.city}, ${delivery.patient.address.canton}`}
        >
          {delivery.patient.address.street}
          {'\n'}
          {delivery.patient.address.postalCode} {delivery.patient.address.city}
          {'\n'}
          {delivery.patient.address.canton}
        </Text>
        {delivery.patient.availabilityWindow && (
          <Text
            style={styles.availability}
            accessible={true}
            accessibilityLabel={`Patient availability: from ${new Date(delivery.patient.availabilityWindow.start).toLocaleTimeString()} to ${new Date(delivery.patient.availabilityWindow.end).toLocaleTimeString()}`}
          >
            Available: {new Date(delivery.patient.availabilityWindow.start).toLocaleTimeString()} -{' '}
            {new Date(delivery.patient.availabilityWindow.end).toLocaleTimeString()}
          </Text>
        )}
      </View>

      <View
        style={styles.section}
        accessible={true}
        accessibilityLabel="Delivery information section"
      >
        <Text
          style={styles.sectionTitle}
          accessible={true}
          accessibilityRole="header"
        >
          Delivery Information
        </Text>
        <View style={styles.infoRow}>
          <Text
            style={styles.label}
            accessible={true}
            accessibilityLabel="Distance label"
          >
            Distance:
          </Text>
          <Text
            style={styles.value}
            accessible={true}
            accessibilityLabel={`Distance: ${delivery.distance.toFixed(1)} kilometers`}
          >
            {delivery.distance.toFixed(1)} km
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text
            style={styles.label}
            accessible={true}
            accessibilityLabel="Estimated duration label"
          >
            Estimated Duration:
          </Text>
          <Text
            style={styles.value}
            accessible={true}
            accessibilityLabel={`Estimated duration: ${delivery.estimatedDuration} minutes`}
          >
            {delivery.estimatedDuration} min
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text
            style={styles.label}
            accessible={true}
            accessibilityLabel="Payment method label"
          >
            Payment Method:
          </Text>
          <Text
            style={styles.value}
            accessible={true}
            accessibilityLabel={`Payment method: ${delivery.paymentMethod}`}
          >
            {delivery.paymentMethod}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text
            style={styles.label}
            accessible={true}
            accessibilityLabel="Priority label"
          >
            Priority:
          </Text>
          <Text
            style={[styles.value, styles.priority]}
            accessible={true}
            accessibilityLabel={`Priority level: ${delivery.priority}`}
          >
            {delivery.priority.toUpperCase()}
          </Text>
        </View>
      </View>

      {delivery.packages.map((pkg, idx) => (
        <View
          key={pkg.id}
          style={styles.section}
          accessible={true}
          accessibilityLabel={`Package ${idx + 1}`}
        >
          <Text
            style={styles.sectionTitle}
            accessible={true}
            accessibilityRole="header"
          >
            Package {idx + 1}
          </Text>
          <Text
            style={styles.qrCode}
            accessible={true}
            accessibilityLabel={`QR code: ${pkg.qrCode}`}
          >
            QR: {pkg.qrCode}
          </Text>

          {pkg.specialHandling.length > 0 && (
            <View
              style={styles.specialHandling}
              accessible={true}
              accessibilityRole="list"
              accessibilityLabel="Special handling requirements"
            >
              {pkg.specialHandling.map((handling) => (
                <View
                  key={handling}
                  style={styles.handlingBadge}
                  accessible={true}
                  accessibilityLabel={handling.replace('_', ' ')}
                >
                  <Text style={styles.handlingText}>
                    {getSpecialHandlingIcon(handling)} {handling.replace('_', ' ')}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Text
            style={styles.medicationsTitle}
            accessible={true}
            accessibilityRole="header"
          >
            Medications:
          </Text>
          {pkg.medications.map((med) => (
            <View
              key={med.id}
              style={styles.medication}
              accessible={true}
              accessibilityLabel={`Medication: ${med.name}`}
            >
              <Text
                style={styles.medName}
                accessible={true}
                accessibilityLabel={`Medication name: ${med.name}`}
              >
                {med.name}
              </Text>
              <Text
                style={styles.medDetails}
                accessible={true}
                accessibilityLabel={`Quantity: ${med.quantity}, Dosage: ${med.dosage}`}
              >
                {med.quantity}x - {med.dosage}
              </Text>
              {med.isControlledSubstance && (
                <Text
                  style={styles.controlledSubstance}
                  accessible={true}
                  accessibilityLabel="Warning: Controlled substance"
                >
                  ⚠️ Controlled Substance
                </Text>
              )}
              {med.requiresColdChain && (
                <Text
                  style={styles.coldChain}
                  accessible={true}
                  accessibilityLabel="Warning: Requires cold chain"
                >
                  ❄️ Requires Cold Chain
                </Text>
              )}
            </View>
          ))}
        </View>
      ))}

      {delivery.specialInstructions && (
        <View
          style={styles.section}
          accessible={true}
          accessibilityLabel="Special instructions section"
        >
          <Text
            style={styles.sectionTitle}
            accessible={true}
            accessibilityRole="header"
          >
            Special Instructions
          </Text>
          <Text
            style={styles.instructions}
            accessible={true}
            accessibilityLabel={`Special instructions: ${delivery.specialInstructions}`}
            accessibilityLiveRegion="polite"
          >
            {delivery.specialInstructions}
          </Text>
        </View>
      )}

      {delivery.status === 'pending' || delivery.status === 'assigned' ? (
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={handleAccept}
          accessible={true}
          accessibilityLabel="Accept delivery button"
          accessibilityHint={`Double tap to accept this delivery for ${delivery.patient.name}`}
          accessibilityRole="button"
        >
          <Text style={styles.acceptButtonText}>Accept Delivery</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.viewMapButton}
          onPress={() => navigation.navigate('Map')}
          accessible={true}
          accessibilityLabel="View on map button"
          accessibilityHint="Double tap to view this delivery location on the map"
          accessibilityRole="button"
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
