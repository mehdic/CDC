/**
 * useBiometricAuth Hook
 * Custom hook for biometric authentication
 */

import { useEffect, useState, useCallback } from 'react';

import BiometricAuthService, {
  BiometricType,
  AuthenticationResult,
  StoredCredentials,
} from '../services/biometric-auth';

interface UseBiometricAuthReturn {
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  biometricType: BiometricType;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  enableBiometric: (username: string, password: string) => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  authenticate: () => Promise<boolean>;
  getStoredCredentials: () => Promise<StoredCredentials | null>;
  clearBiometricData: () => Promise<void>;
}

/**
 * Hook for managing biometric authentication
 */
export const useBiometricAuth = (): UseBiometricAuthReturn => {
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize biometric
  useEffect(() => {
    const initialize = async () => {
      try {
        const available = await BiometricAuthService.isBiometricAvailable();
        setBiometricAvailable(available);

        if (available) {
          const type = BiometricAuthService.getBiometricType();
          setBiometricType(type);

          const enabled = BiometricAuthService.isBiometricEnabled();
          setBiometricEnabled(enabled);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    initialize();
  }, []);

  // Enable biometric
  const enableBiometric = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const success = await BiometricAuthService.enableBiometric(
          username,
          password
        );
        setBiometricEnabled(success);
        return success;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Disable biometric
  const disableBiometric = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await BiometricAuthService.disableBiometric();
      setBiometricEnabled(false);
      setIsAuthenticated(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Authenticate
  const authenticate = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const result: AuthenticationResult =
        await BiometricAuthService.authenticate();

      if (result.success) {
        setIsAuthenticated(true);
        return true;
      } else {
        setError(result.error || 'Authentication failed');
        return false;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get stored credentials
  const getStoredCredentials = useCallback(
    async (): Promise<StoredCredentials | null> => {
      try {
        setError(null);
        return await BiometricAuthService.getStoredCredentials();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        return null;
      }
    },
    []
  );

  // Clear biometric data
  const clearBiometricData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await BiometricAuthService.clearBiometricData();
      setBiometricEnabled(false);
      setIsAuthenticated(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    biometricAvailable,
    biometricEnabled,
    biometricType,
    isAuthenticated,
    isLoading,
    error,
    enableBiometric,
    disableBiometric,
    authenticate,
    getStoredCredentials,
    clearBiometricData,
  };
};
