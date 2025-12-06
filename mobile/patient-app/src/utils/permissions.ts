/**
 * Permissions Utility
 * Handles permission requests for iOS and Android
 * Supports camera, location, storage, microphone, etc.
 */

import { Platform, Alert } from 'react-native';
import { PERMISSIONS, RESULTS, check, request } from 'react-native-permissions';

/**
 * Permission types
 */
export enum PermissionType {
  CAMERA = 'CAMERA',
  PHOTO_LIBRARY = 'PHOTO_LIBRARY',
  LOCATION = 'LOCATION',
  MICROPHONE = 'MICROPHONE',
  CONTACTS = 'CONTACTS',
  CALENDAR = 'CALENDAR',
}

/**
 * Permission status
 */
export enum PermissionStatus {
  GRANTED = 'GRANTED',
  DENIED = 'DENIED',
  BLOCKED = 'BLOCKED',
  NOT_DETERMINED = 'NOT_DETERMINED',
}

/**
 * Permissions Utility Class
 */
export class PermissionsUtil {
  /**
   * Get permission for the specific platform
   */
  private static getPermissionForPlatform(
    permissionType: PermissionType
  ): any {
    const platformPermissions = {
      ios: {
        [PermissionType.CAMERA]: PERMISSIONS.IOS.CAMERA,
        [PermissionType.PHOTO_LIBRARY]: PERMISSIONS.IOS.PHOTO_LIBRARY,
        [PermissionType.LOCATION]:
          PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
        [PermissionType.MICROPHONE]: PERMISSIONS.IOS.MICROPHONE,
        [PermissionType.CONTACTS]: PERMISSIONS.IOS.CONTACTS,
        [PermissionType.CALENDAR]: PERMISSIONS.IOS.CALENDARS,
      },
      android: {
        [PermissionType.CAMERA]: PERMISSIONS.ANDROID.CAMERA,
        [PermissionType.PHOTO_LIBRARY]:
          PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
        [PermissionType.LOCATION]:
          PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        [PermissionType.MICROPHONE]: PERMISSIONS.ANDROID.RECORD_AUDIO,
        [PermissionType.CONTACTS]: PERMISSIONS.ANDROID.READ_CONTACTS,
        [PermissionType.CALENDAR]: PERMISSIONS.ANDROID.READ_CALENDAR,
      },
    };

    const platformKey = Platform.OS === 'ios' ? 'ios' : 'android';
    return platformPermissions[platformKey][permissionType];
  }

  /**
   * Check if permission is granted
   */
  static async checkPermission(
    permissionType: PermissionType
  ): Promise<PermissionStatus> {
    try {
      const permission = this.getPermissionForPlatform(permissionType);
      const result = await check(permission);

      switch (result) {
        case RESULTS.GRANTED:
          return PermissionStatus.GRANTED;
        case RESULTS.DENIED:
          return PermissionStatus.DENIED;
        case RESULTS.BLOCKED:
          return PermissionStatus.BLOCKED;
        case RESULTS.UNAVAILABLE:
          return PermissionStatus.NOT_DETERMINED;
        case RESULTS.LIMITED:
          return PermissionStatus.GRANTED; // Limited permission is still usable
        default:
          return PermissionStatus.NOT_DETERMINED;
      }
    } catch (error) {
      console.error(`Error checking ${permissionType} permission:`, error);
      return PermissionStatus.NOT_DETERMINED;
    }
  }

  /**
   * Request permission from user
   */
  static async requestPermission(
    permissionType: PermissionType
  ): Promise<PermissionStatus> {
    try {
      const permission = this.getPermissionForPlatform(permissionType);
      const result = await request(permission);

      switch (result) {
        case RESULTS.GRANTED:
          return PermissionStatus.GRANTED;
        case RESULTS.DENIED:
          return PermissionStatus.DENIED;
        case RESULTS.BLOCKED:
          return PermissionStatus.BLOCKED;
        default:
          return PermissionStatus.NOT_DETERMINED;
      }
    } catch (error) {
      console.error(`Error requesting ${permissionType} permission:`, error);
      return PermissionStatus.DENIED;
    }
  }

  /**
   * Check and request permission if needed
   */
  static async checkAndRequestPermission(
    permissionType: PermissionType
  ): Promise<boolean> {
    try {
      const status = await this.checkPermission(permissionType);

      if (status === PermissionStatus.GRANTED) {
        return true;
      }

      if (status === PermissionStatus.NOT_DETERMINED) {
        const result = await this.requestPermission(permissionType);
        return result === PermissionStatus.GRANTED;
      }

      if (status === PermissionStatus.BLOCKED) {
        // Permission is blocked - show message to user
        Alert.alert(
          'Permission Denied',
          `${permissionType} permission is blocked. Please enable it in settings.`,
          [{ text: 'OK' }]
        );
        return false;
      }

      return false;
    } catch (error) {
      console.error('Error checking and requesting permission:', error);
      return false;
    }
  }

  /**
   * Check multiple permissions
   */
  static async checkMultiplePermissions(
    permissionTypes: PermissionType[]
  ): Promise<Record<PermissionType, PermissionStatus>> {
    const results: Record<PermissionType, PermissionStatus> = {} as any;

    for (const permissionType of permissionTypes) {
      results[permissionType] = await this.checkPermission(permissionType);
    }

    return results;
  }

  /**
   * Request multiple permissions
   */
  static async requestMultiplePermissions(
    permissionTypes: PermissionType[]
  ): Promise<Record<PermissionType, PermissionStatus>> {
    const results: Record<PermissionType, PermissionStatus> = {} as any;

    for (const permissionType of permissionTypes) {
      results[permissionType] = await this.requestPermission(permissionType);
    }

    return results;
  }

  /**
   * Check if camera permission is granted
   */
  static async hasCameraPermission(): Promise<boolean> {
    const status = await this.checkPermission(PermissionType.CAMERA);
    return status === PermissionStatus.GRANTED;
  }

  /**
   * Check if location permission is granted
   */
  static async hasLocationPermission(): Promise<boolean> {
    const status = await this.checkPermission(PermissionType.LOCATION);
    return status === PermissionStatus.GRANTED;
  }

  /**
   * Check if photo library permission is granted
   */
  static async hasPhotoLibraryPermission(): Promise<boolean> {
    const status = await this.checkPermission(PermissionType.PHOTO_LIBRARY);
    return status === PermissionStatus.GRANTED;
  }

  /**
   * Check if microphone permission is granted
   */
  static async hasMicrophonePermission(): Promise<boolean> {
    const status = await this.checkPermission(PermissionType.MICROPHONE);
    return status === PermissionStatus.GRANTED;
  }

  /**
   * Open app settings (to allow manual permission change)
   */
  static openAppSettings(): void {
    try {
      // For iOS and Android, use react-native-app-settings
      // This is a placeholder - actual implementation would use a library
      console.log('Opening app settings...');
    } catch (error) {
      console.error('Error opening app settings:', error);
    }
  }
}

export default PermissionsUtil;
