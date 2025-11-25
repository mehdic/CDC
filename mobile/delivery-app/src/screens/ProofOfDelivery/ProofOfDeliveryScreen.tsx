/**
 * Proof of Delivery Screen
 * Captures signature, photo, and delivery confirmation
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Image } from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { submitProofOfDeliveryAsync, updateDeliveryStatusAsync } from '../../store/deliverySlice';
import { ProofOfDelivery } from '../../types/delivery';

export const ProofOfDeliveryScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { deliveryId } = route.params;
  const dispatch = useAppDispatch();
  const { currentLocation } = useAppSelector((state) => state.delivery);
  const [signatureUri, setSignatureUri] = useState<string>('');
  const [photoUri, setPhotoUri] = useState<string>('');
  const [idPhotoUri, setIdPhotoUri] = useState<string>('');
  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const takePhoto = async (type: 'delivery' | 'id') => {
    const result = await launchCamera({
      mediaType: 'photo',
      cameraType: 'back',
      quality: 0.8,
    });

    if (result.assets && result.assets[0].uri) {
      if (type === 'delivery') {
        setPhotoUri(result.assets[0].uri);
      } else {
        setIdPhotoUri(result.assets[0].uri);
      }
    }
  };

  const handleSubmit = async () => {
    if (!photoUri) {
      Alert.alert('Error', 'Please take a photo of the delivery');
      return;
    }

    if (!recipientName.trim()) {
      Alert.alert('Error', 'Please enter recipient name');
      return;
    }

    setSubmitting(true);

    const proof: ProofOfDelivery = {
      deliveryId,
      photoImage: photoUri,
      signatureImage: signatureUri || undefined,
      idVerificationImage: idPhotoUri || undefined,
      recipientName,
      notes: notes || undefined,
      timestamp: new Date().toISOString(),
      location: currentLocation!,
    };

    try {
      await dispatch(submitProofOfDeliveryAsync({ deliveryId, proof })).unwrap();
      await dispatch(
        updateDeliveryStatusAsync({
          id: deliveryId,
          status: 'delivered',
          location: currentLocation || undefined,
        })
      );

      Alert.alert('Success', 'Delivery completed!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('DeliveryList'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to submit proof of delivery');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Proof of Delivery</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Recipient Name *</Text>
        <TextInput
          style={styles.input}
          value={recipientName}
          onChangeText={setRecipientName}
          placeholder="Enter recipient name"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Delivery Photo *</Text>
        {photoUri ? (
          <View>
            <Image source={{ uri: photoUri }} style={styles.preview} />
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={() => takePhoto('delivery')}
            >
              <Text style={styles.retakeButtonText}>Retake Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={() => takePhoto('delivery')}
          >
            <Text style={styles.cameraButtonText}>📷 Take Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>ID Verification (if required)</Text>
        {idPhotoUri ? (
          <View>
            <Image source={{ uri: idPhotoUri }} style={styles.preview} />
            <TouchableOpacity style={styles.retakeButton} onPress={() => takePhoto('id')}>
              <Text style={styles.retakeButtonText}>Retake Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.cameraButton} onPress={() => takePhoto('id')}>
            <Text style={styles.cameraButtonText}>📷 Take ID Photo</Text>
          </TouchableOpacity>
        )}
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
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.submitButtonText}>
          {submitting ? 'Submitting...' : 'Complete Delivery'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  section: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  cameraButton: {
    backgroundColor: '#007AFF',
    padding: 40,
    borderRadius: 8,
    alignItems: 'center',
  },
  cameraButtonText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  preview: { width: '100%', height: 200, borderRadius: 8, marginBottom: 12 },
  retakeButton: {
    backgroundColor: '#6C757D',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retakeButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  submitButton: {
    backgroundColor: '#28A745',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: { backgroundColor: '#999' },
  submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});

export default ProofOfDeliveryScreen;
