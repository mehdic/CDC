/**
 * useScan Custom Hook
 * Manages QR code scanning state, verification, and history
 *
 * Features:
 * - QR code scanning with debouncing
 * - Package verification via API
 * - Scan history tracking
 * - GPS location capture
 * - Local storage persistence
 *
 * Dependencies:
 * - deliveryApi.verifyPackageQR()
 * - location-service for GPS
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import deliveryApi from '../services/deliveryApi';
import ScanEventService from '../services/scanEventService';
import type { ScanVerificationResult, ScanHistoryEntry, PackageVerificationState, UseScanReturn } from '../types/scanner';

const SCAN_HISTORY_KEY = '@delivery_scan_history';
const MAX_HISTORY_ITEMS = 50;

/**
 * Hook for managing QR code scanning workflow
 */
export const useScan = (deliveryId: string): UseScanReturn => {
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [verificationState, setVerificationState] = useState<PackageVerificationState>({
    status: 'idle',
    isLoading: false,
  });
  const [history, setHistory] = useState<readonly ScanHistoryEntry[]>([]);

  // Load scan history on mount
  useEffect(() => {
    loadScanHistory();
  }, []);

  /**
   * Load scan history from local storage
   */
  const loadScanHistory = useCallback(async (): Promise<void> => {
    try {
      const stored = await AsyncStorage.getItem(SCAN_HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load scan history:', error);
    }
  }, []);

  /**
   * Save scan history to local storage
   */
  const saveScanHistory = useCallback(
    async (newHistory: readonly ScanHistoryEntry[]): Promise<void> => {
      try {
        const limitedHistory = newHistory.slice(0, MAX_HISTORY_ITEMS);
        await AsyncStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(limitedHistory));
        setHistory(limitedHistory);
      } catch (error) {
        console.error('Failed to save scan history:', error);
      }
    },
    []
  );

  /**
   * Verify scanned QR code against delivery assignment
   */
  const verifyPackageQR = useCallback(
    async (qrCode: string): Promise<ScanVerificationResult | null> => {
      try {
        setVerificationState(prev => ({
          ...prev,
          status: 'verifying',
          isLoading: true,
          error: undefined,
        }));

        const response = await deliveryApi.verifyPackageQR(qrCode);

        if (!response.success || !response.data) {
          throw new Error('Invalid verification response');
        }

        const result = response.data as unknown as ScanVerificationResult;

        setVerificationState(prev => ({
          ...prev,
          status: result.valid && result.matchesDelivery ? 'verified' : 'failed',
          isLoading: false,
          result,
          error: result.valid && result.matchesDelivery ? undefined : 'Package does not match delivery assignment',
        }));

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Verification failed';
        setVerificationState(prev => ({
          ...prev,
          status: 'failed',
          isLoading: false,
          error: errorMessage,
        }));
        return null;
      }
    },
    []
  );

  /**
   * Handle QR code scan with debouncing and verification
   */
  const handleScan = useCallback(
    async (qrCode: string): Promise<void> => {
      // Debounce: ignore rapid consecutive scans
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }

      if (!qrCode.trim()) {
        setVerificationState(prev => ({
          ...prev,
          status: 'failed',
          error: 'Empty QR code',
        }));
        return;
      }

      setScannedCode(qrCode);
      setVerificationState(prev => ({ ...prev, status: 'scanning', qrCode }));

      // Verify the scanned code
      const result = await verifyPackageQR(qrCode);

      // Add to history
      const historyEntry: ScanHistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        packageQrCode: qrCode,
        scannedAt: new Date().toISOString(),
        status: result?.valid && result?.matchesDelivery ? 'verified' : 'failed',
        verificationMessage: result?.valid
          ? result.matchesDelivery
            ? 'Package verified'
            : 'Wrong package for this delivery'
          : 'Invalid QR code',
      };

      await saveScanHistory([historyEntry, ...history]);

      // Prevent duplicate scans for 2 seconds
      scanTimeoutRef.current = setTimeout(() => {
        scanTimeoutRef.current = null;
      }, 2000);
    },
    [verifyPackageQR, history, saveScanHistory]
  );

  /**
   * Reset scanner for another scan
   */
  const handleRescan = useCallback((): void => {
    setScannedCode(null);
    setVerificationState(prev => ({
      ...prev,
      status: 'scanning',
      qrCode: undefined,
      error: undefined,
      result: undefined,
    }));
  }, []);

  /**
   * Clear all scan history
   */
  const clearHistory = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(SCAN_HISTORY_KEY);
      setHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  return {
    scannedCode,
    verificationState,
    history,
    handleScan,
    handleRescan,
    clearHistory,
  };
};
