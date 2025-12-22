/**
 * Photo Handling Utilities
 * Manages photo selection, validation, and processing for ADR reporting
 */

import { Platform } from 'react-native';

export interface PhotoFile {
  id: string;
  uri: string;
  fileName: string;
  type: string;
  size: number;
}

/**
 * Generates a unique ID for a photo
 * @returns Unique photo ID
 */
export function generatePhotoId(): string {
  return `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validates photo file
 * @param file - The photo file to validate
 * @returns Validation result with error message if invalid
 */
export function validatePhotoFile(file: any): {
  valid: boolean;
  error?: string;
} {
  // Check if file exists
  if (!file) {
    return { valid: false, error: 'No photo selected' };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size && file.size > maxSize) {
    return {
      valid: false,
      error: 'Photo size must be less than 10MB',
    };
  }

  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (file.type && !validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only JPEG and PNG photos are supported',
    };
  }

  return { valid: true };
}

/**
 * Creates a photo file object from selected image
 * @param imageResult - The image result from image picker
 * @returns PhotoFile object or null if invalid
 */
export function createPhotoFile(imageResult: any): PhotoFile | null {
  if (!imageResult || !imageResult.uri) {
    return null;
  }

  const fileName =
    imageResult.fileName ||
    imageResult.name ||
    `photo_${Date.now()}.${imageResult.type === 'image/png' ? 'png' : 'jpg'}`;

  const photoFile: PhotoFile = {
    id: generatePhotoId(),
    uri: imageResult.uri,
    fileName,
    type: imageResult.type || 'image/jpeg',
    size: imageResult.size || 0,
  };

  const validation = validatePhotoFile(photoFile);
  if (!validation.valid) {
    return null;
  }

  return photoFile;
}

/**
 * Formats file size for display
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Gets the appropriate permissions for photo picker based on platform
 * @returns Platform-specific permissions configuration
 */
export function getPhotoPickerPermissions(): string[] {
  if (Platform.OS === 'ios') {
    return ['photo', 'photoLibrary'];
  }
  return ['android.permission.READ_EXTERNAL_STORAGE'];
}

/**
 * Gets platform-specific photo options
 * @returns Photo picker options for the platform
 */
export function getPhotoPickerOptions(): any {
  return {
    mediaType: 'photo',
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1920,
    includeBase64: false,
    includeExtra: true,
  };
}

/**
 * Checks if a photo can be edited
 * @param photoFile - The photo file to check
 * @returns true if photo is editable
 */
export function isPhotoEditable(photoFile: PhotoFile): boolean {
  return photoFile.type === 'image/jpeg' || photoFile.type === 'image/png';
}
