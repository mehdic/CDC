/**
 * Prescription Upload Screen
 * Allows patients to upload prescription images via camera or gallery
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { CameraCapture } from '../components/CameraCapture';
import { openImagePicker } from '../components/ImagePicker';
import { uploadPrescription, transcribePrescription, selectUploading, selectUploadProgress } from '../store/prescriptionSlice';

export const PrescriptionUploadScreen: React.FC = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [uploadedPrescriptionId, setUploadedPrescriptionId] = useState<string | null>(null);

  const dispatch = useDispatch();
  const navigation = useNavigation();
  const uploading = useSelector(selectUploading);
  const uploadProgress = useSelector(selectUploadProgress);

  /**
   * Handle camera capture
   */
  const handleCameraCapture = (imageUri: string) => {
    setSelectedImageUri(imageUri);
    setShowCamera(false);
  };

  /**
   * Handle gallery selection
   */
  const handleGallerySelect = () => {
    openImagePicker({
      onSelect: (imageUri) => {
        setSelectedImageUri(imageUri);
      },
      onCancel: () => {
        console.log('Image selection cancelled');
      },
      onError: (error) => {
        console.error('Image selection error:', error);
      },
    });
  };

  /**
   * Upload the selected prescription image
   */
  const handleUpload = async () => {
    if (!selectedImageUri) {
      Alert.alert('Erreur', 'Veuillez sélectionner une image', [{ text: 'OK' }]);
      return;
    }

    try {
      // TODO: Get actual patient ID from auth context
      const patientId = 'mock-patient-id';

      // Upload prescription
      const result = await dispatch(
        uploadPrescription({ imageUri: selectedImageUri, patientId }) as any
      );

      if (uploadPrescription.fulfilled.match(result)) {
        const prescription = result.payload;
        setUploadedPrescriptionId(prescription.id);

        // Trigger transcription
        await dispatch(transcribePrescription(prescription.id) as any);

        Alert.alert(
          'Succès',
          'Votre ordonnance a été téléchargée avec succès. La transcription est en cours.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to prescription detail screen
                navigation.navigate('PrescriptionDetail' as never, { prescriptionId: prescription.id } as never);
              },
            },
          ]
        );
      } else {
        throw new Error(result.payload as string);
      }
    } catch (error: any) {
      Alert.alert(
        'Erreur',
        error.message || 'Une erreur est survenue lors du téléchargement',
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Clear selection and start over
   */
  const handleClear = () => {
    setSelectedImageUri(null);
    setUploadedPrescriptionId(null);
  };

  // Show camera if requested
  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Télécharger une ordonnance</Text>
          <Text style={styles.subtitle}>
            Prenez une photo ou sélectionnez une image de votre ordonnance
          </Text>
        </View>

        {/* Image preview */}
        {selectedImageUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>✕ Changer l'image</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>📄</Text>
            <Text style={styles.placeholderText}>
              Aucune image sélectionnée
            </Text>
          </View>
        )}

        {/* Action buttons */}
        {!selectedImageUri ? (
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cameraButton]}
              onPress={() => setShowCamera(true)}
            >
              <Text style={styles.buttonIcon}>📷</Text>
              <Text style={styles.buttonText}>Prendre une photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.galleryButton]}
              onPress={handleGallerySelect}
            >
              <Text style={styles.buttonIcon}>🖼️</Text>
              <Text style={styles.buttonText}>Choisir de la galerie</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadContainer}>
            <TouchableOpacity
              style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
              onPress={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <ActivityIndicator color="#FFF" size="small" />
                  <Text style={styles.uploadButtonText}>
                    Téléchargement... {uploadProgress}%
                  </Text>
                </>
              ) : (
                <Text style={styles.uploadButtonText}>
                  Télécharger l'ordonnance
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Conseils pour une meilleure qualité:</Text>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionBullet}>•</Text>
            <Text style={styles.instructionText}>
              Assurez-vous que l'ordonnance est bien éclairée
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionBullet}>•</Text>
            <Text style={styles.instructionText}>
              Évitez les reflets et les ombres
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionBullet}>•</Text>
            <Text style={styles.instructionText}>
              Placez l'ordonnance à plat sur une surface
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={styles.instructionBullet}>•</Text>
            <Text style={styles.instructionText}>
              Vérifiez que le texte est lisible avant de télécharger
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  previewContainer: {
    marginBottom: 24,
  },
  previewImage: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  clearButton: {
    marginTop: 12,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  placeholderContainer: {
    height: 300,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  buttonsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  cameraButton: {
    backgroundColor: '#3B82F6',
  },
  galleryButton: {
    backgroundColor: '#8B5CF6',
  },
  buttonIcon: {
    fontSize: 24,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadContainer: {
    marginBottom: 32,
  },
  uploadButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  instructionBullet: {
    color: '#3B82F6',
    fontSize: 16,
    marginRight: 8,
    fontWeight: '700',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default PrescriptionUploadScreen;
