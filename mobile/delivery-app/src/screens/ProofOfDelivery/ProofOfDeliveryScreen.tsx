/**
 * Proof of Delivery Screen
 * Captures signature, photo, and delivery confirmation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

import { PhotoCapture } from '../../components/PhotoCapture';
import { SignatureCapture } from '../../components/SignatureCapture';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import proofOfDeliveryService from '../../services/proofOfDeliveryService';
import { updateDeliveryStatusAsync } from '../../store/deliverySlice';
import { ProofOfDelivery } from '../../types/delivery';

export interface ProofOfDeliveryScreenProps {
  navigation: any;
  route: any;
}

export const ProofOfDeliveryScreen: React.FC<ProofOfDeliveryScreenProps> = ({
  navigation,
  route,
}) => {
  const { deliveryId } = route.params;
  const dispatch = useAppDispatch();
  const { currentLocation, isOnline } = useAppSelector((state) => state.delivery);

  const [signatureUri, setSignatureUri] = useState<string>('');
  const [photoUri, setPhotoUri] = useState<string>('');
  const [idPhotoUri, setIdPhotoUri] = useState<string>('');
  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!currentLocation) {
      Alert.alert(
        'Location Required',
        'GPS location is required for proof of delivery. Please enable location services.',
        [{ text: 'OK' }]
      );
    }
  }, [currentLocation]);

  const handleSignatureCapture = (signature: string) => {
    setSignatureUri(signature);
  };

  const handleSignatureClear = () => {
    setSignatureUri('');
  };

  const handlePhotoCapture = (photoUri: string) => {
    setPhotoUri(photoUri);
  };

  const handleIdPhotoCapture = (idUri: string) => {
    setIdPhotoUri(idUri);
  };

  const validateForm = (): boolean => {
    if (!signatureUri) {
      Alert.alert('Required Field', 'Signature is required for proof of delivery');
      return false;
    }

    if (!photoUri) {
      Alert.alert('Required Field', 'Please take a photo of the delivery');
      return false;
    }

    if (!recipientName.trim()) {
      Alert.alert('Required Field', 'Please enter recipient name');
      return false;
    }

    if (!currentLocation) {
      Alert.alert('Location Required', 'GPS location is required for proof of delivery');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Create proof with metadata
      const proof: ProofOfDelivery = proofOfDeliveryService.createProof(
        deliveryId,
        currentLocation!,
        {
          signatureImage: signatureUri || undefined,
          photoImage: photoUri,
          idVerificationImage: idPhotoUri || undefined,
          recipientName: recipientName.trim(),
          notes: notes.trim() || undefined,
        }
      );

      // Submit proof (will queue if offline)
      const result = await proofOfDeliveryService.submitProof(deliveryId, proof, isOnline);

      if (result.success) {
        // Update delivery status
        await dispatch(
          updateDeliveryStatusAsync({
            id: deliveryId,
            status: 'delivered',
            location: currentLocation || undefined,
          })
        ).unwrap();

        // Show appropriate success message
        const message = result.queued
          ? 'Delivery marked as complete. Proof will be uploaded when online.'
          : 'Delivery completed successfully!';

        Alert.alert('Success', message, [
          {
            text: 'OK',
            onPress: () => navigation.navigate('DeliveryList'),
          },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to submit proof of delivery');
      }
    } catch (error: any) {
      console.error('Submit proof error:', error);
      Alert.alert('Error', error.message || 'Failed to submit proof of delivery');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Proof of Delivery</Text>

      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            📡 You're offline. Proof will be queued for upload.
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.label}>
          Recipient Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={recipientName}
          onChangeText={setRecipientName}
          placeholder="Enter recipient name"
          testID="recipient-name-input"
        />
      </View>

      <View style={styles.section}>
        <PhotoCapture
          onCapture={handlePhotoCapture}
          label="Delivery Photo"
          required={true}
          capturedUri={photoUri}
        />
      </View>

      <View style={styles.section}>
        <SignatureCapture onCapture={handleSignatureCapture} onClear={handleSignatureClear} />
      </View>

      <View style={styles.section}>
        <PhotoCapture
          onCapture={handleIdPhotoCapture}
          label="ID Verification (if required)"
          required={false}
          capturedUri={idPhotoUri}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional notes..."
          multiline
          numberOfLines={4}
          testID="notes-input"
        />
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          📍 GPS: {currentLocation ? 'Enabled' : 'Waiting for location...'}
        </Text>
        <Text style={styles.infoText}>🕒 {new Date().toLocaleString()}</Text>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
        testID="submit-button"
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.submitButtonText}>Complete Delivery</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  offlineBanner: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  offlineText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#DC3545',
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  infoSection: {
    backgroundColor: '#E9ECEF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    color: '#495057',
    marginBottom: 4,
  },
  submitButton: {
    backgroundColor: '#28A745',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProofOfDeliveryScreen;
