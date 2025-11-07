/**
 * Image Picker Component
 * Allows users to select prescription images from device gallery
 */

import React from 'react';
import {
  Alert,
  Platform,
} from 'react-native';
import { launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

interface ImagePickerOptions {
  onSelect: (imageUri: string) => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
}

/**
 * Request photo library permission
 */
const requestPhotoLibraryPermission = async (): Promise<boolean> => {
  try {
    const permission = Platform.select({
      ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
      android: Platform.Version >= 33
        ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
        : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
    });

    if (!permission) {
      return false;
    }

    const result = await request(permission);

    if (result === RESULTS.GRANTED) {
      return true;
    }

    if (result === RESULTS.DENIED || result === RESULTS.BLOCKED) {
      Alert.alert(
        'Permission requise',
        'L\'accès à la galerie est nécessaire pour sélectionner des photos de vos ordonnances.',
        [{ text: 'OK' }]
      );
      return false;
    }

    return false;
  } catch (error) {
    console.error('Error requesting photo library permission:', error);
    return false;
  }
};

/**
 * Open image picker to select prescription image from gallery
 */
export const openImagePicker = async ({
  onSelect,
  onCancel,
  onError,
}: ImagePickerOptions): Promise<void> => {
  try {
    // Request permission
    const hasPermission = await requestPhotoLibraryPermission();
    if (!hasPermission) {
      onCancel?.();
      return;
    }

    // Launch image library
    const response: ImagePickerResponse = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 2048,
      maxHeight: 2048,
      includeBase64: false,
      selectionLimit: 1,
    });

    // Handle response
    if (response.didCancel) {
      onCancel?.();
      return;
    }

    if (response.errorCode) {
      const errorMessage = getErrorMessage(response.errorCode);
      onError?.(errorMessage);
      Alert.alert('Erreur', errorMessage, [{ text: 'OK' }]);
      return;
    }

    if (response.assets && response.assets.length > 0) {
      const asset: Asset = response.assets[0];

      if (!asset.uri) {
        onError?.('Aucune image sélectionnée');
        Alert.alert(
          'Erreur',
          'Impossible de récupérer l\'image sélectionnée.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Validate image
      const validationError = validateImage(asset);
      if (validationError) {
        onError?.(validationError);
        Alert.alert('Erreur', validationError, [{ text: 'OK' }]);
        return;
      }

      // Success - return image URI
      onSelect(asset.uri);
    } else {
      onError?.('Aucune image sélectionnée');
      Alert.alert(
        'Erreur',
        'Aucune image n\'a été sélectionnée.',
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    console.error('Error picking image:', error);
    const errorMessage = 'Une erreur est survenue lors de la sélection de l\'image.';
    onError?.(errorMessage);
    Alert.alert('Erreur', errorMessage, [{ text: 'OK' }]);
  }
};

/**
 * Validate selected image
 */
const validateImage = (asset: Asset): string | null => {
  // Check file size (max 10MB)
  const maxSizeBytes = 10 * 1024 * 1024;
  if (asset.fileSize && asset.fileSize > maxSizeBytes) {
    return 'L\'image est trop volumineuse (max 10 MB). Veuillez sélectionner une image plus petite.';
  }

  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (asset.type && !validTypes.includes(asset.type)) {
    return 'Format d\'image non supporté. Veuillez sélectionner un fichier JPEG ou PNG.';
  }

  // Check dimensions (min 200x200)
  const minDimension = 200;
  if (asset.width && asset.height) {
    if (asset.width < minDimension || asset.height < minDimension) {
      return 'L\'image est trop petite. Veuillez sélectionner une image de meilleure qualité.';
    }
  }

  return null;
};

/**
 * Get user-friendly error message
 */
const getErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'camera_unavailable':
      return 'La caméra n\'est pas disponible sur cet appareil.';
    case 'permission':
      return 'Permission refusée. Veuillez autoriser l\'accès à la galerie dans les paramètres.';
    case 'others':
    default:
      return 'Une erreur est survenue lors de la sélection de l\'image.';
  }
};

// Export as default for convenience
export default {
  open: openImagePicker,
};
