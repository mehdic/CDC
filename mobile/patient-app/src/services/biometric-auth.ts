/**
 * Biometric Authentication Service
 * Handles FaceID/TouchID authentication for iOS and Android
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import RNKeychain from 'react-native-keychain';

/**
 * Biometric type
 */
export type BiometricType = 'FaceID' | 'TouchID' | 'BiometricPrompt' | null;

/**
 * Authentication result
 */
export interface AuthenticationResult {
  success: boolean;
  biometricType?: BiometricType;
  error?: string;
}

/**
 * Credentials
 */
export interface StoredCredentials {
  username: string;
  password: string;
}

/**
 * Biometric Authentication Service
 * Provides biometric authentication capabilities for iOS and Android
 */
export class BiometricAuthService {
  private static instance: BiometricAuthService;
  private biometricAvailable: BiometricType = null;
  private biometricEnabled = false;

  private constructor() {
    this.initializeBiometric();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): BiometricAuthService {
    if (!BiometricAuthService.instance) {
      BiometricAuthService.instance = new BiometricAuthService();
    }
    return BiometricAuthService.instance;
  }

  /**
   * Initialize biometric detection
   */
  private async initializeBiometric(): Promise<void> {
    try {
      // Check if biometric is available on the device
      const biometricType = await this.detectBiometricType();
      this.biometricAvailable = biometricType;

      // Check if biometric is enabled in app settings
      const enabled = await AsyncStorage.getItem('biometric_enabled');
      this.biometricEnabled = enabled === 'true';

      console.log(`Biometric detected: ${biometricType}, enabled: ${this.biometricEnabled}`);
    } catch (error) {
      console.error('Error initializing biometric:', error);
    }
  }

  /**
   * Detect available biometric type on device
   */
  private async detectBiometricType(): Promise<BiometricType> {
    try {
      // Check what biometric is available
      const type = await RNKeychain.getSupportedBiometryType();

      if (!type) {
        return null;
      }

      if (Platform.OS === 'ios') {
        // On iOS, check if it's Face ID or Touch ID
        // This requires native code to be fully accurate
        return 'FaceID';
      } else if (Platform.OS === 'android') {
        return 'BiometricPrompt';
      }

      return null;
    } catch (error) {
      console.error('Error detecting biometric type:', error);
      return null;
    }
  }

  /**
   * Check if biometric is available on device
   */
  async isBiometricAvailable(): Promise<boolean> {
    try {
      await this.initializeBiometric();
      return this.biometricAvailable !== null;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  /**
   * Get available biometric type
   */
  getBiometricType(): BiometricType {
    return this.biometricAvailable;
  }

  /**
   * Check if biometric authentication is enabled
   */
  isBiometricEnabled(): boolean {
    return this.biometricEnabled;
  }

  /**
   * Enable biometric authentication
   */
  async enableBiometric(username: string, password: string): Promise<boolean> {
    try {
      if (!this.biometricAvailable) {
        throw new Error('Biometric not available on this device');
      }

      // Store credentials securely in Keychain
      await RNKeychain.setGenericPassword(username, password, {
        service: 'metapharm_patient_app',
        storage: RNKeychain.STORAGE_TYPE.KC,
        accessControl: RNKeychain.ACCESS_CONTROL.BIOMETRY_ANY,
      });

      // Update biometric enabled flag
      await AsyncStorage.setItem('biometric_enabled', 'true');
      this.biometricEnabled = true;

      return true;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      throw error;
    }
  }

  /**
   * Disable biometric authentication
   */
  async disableBiometric(): Promise<void> {
    try {
      // Remove stored credentials from Keychain
      await RNKeychain.resetGenericPassword({
        service: 'metapharm_patient_app',
      });

      // Update biometric enabled flag
      await AsyncStorage.setItem('biometric_enabled', 'false');
      this.biometricEnabled = false;
    } catch (error) {
      console.error('Error disabling biometric:', error);
      throw error;
    }
  }

  /**
   * Authenticate using biometric
   */
  async authenticate(): Promise<AuthenticationResult> {
    try {
      if (!this.biometricAvailable) {
        return {
          success: false,
          error: 'Biometric not available on this device',
        };
      }

      if (!this.biometricEnabled) {
        return {
          success: false,
          error: 'Biometric authentication not enabled',
        };
      }

      // Get stored credentials from Keychain
      const credentials = await RNKeychain.getGenericPassword({
        service: 'metapharm_patient_app',
      });

      if (!credentials) {
        return {
          success: false,
          error: 'No stored credentials found',
        };
      }

      // Credentials were successfully retrieved with biometric authentication
      return {
        success: true,
        biometricType: this.biometricAvailable,
      };
    } catch (error) {
      console.error('Error during biometric authentication:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get stored credentials after successful biometric authentication
   */
  async getStoredCredentials(): Promise<StoredCredentials | null> {
    try {
      const credentials = await RNKeychain.getGenericPassword({
        service: 'metapharm_patient_app',
      });

      if (credentials) {
        return {
          username: credentials.username,
          password: credentials.password,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting stored credentials:', error);
      return null;
    }
  }

  /**
   * Update stored credentials
   */
  async updateStoredCredentials(
    username: string,
    password: string
  ): Promise<void> {
    try {
      if (!this.biometricEnabled) {
        throw new Error('Biometric authentication not enabled');
      }

      await RNKeychain.setGenericPassword(username, password, {
        service: 'metapharm_patient_app',
        storage: RNKeychain.STORAGE_TYPE.KC,
        accessControl: RNKeychain.ACCESS_CONTROL.BIOMETRY_ANY,
      });
    } catch (error) {
      console.error('Error updating stored credentials:', error);
      throw error;
    }
  }

  /**
   * Clear all biometric data
   */
  async clearBiometricData(): Promise<void> {
    try {
      await RNKeychain.resetGenericPassword({
        service: 'metapharm_patient_app',
      });
      await AsyncStorage.removeItem('biometric_enabled');
      this.biometricEnabled = false;
    } catch (error) {
      console.error('Error clearing biometric data:', error);
    }
  }
}

export default BiometricAuthService.getInstance();
