/**
 * Tests for useScan Hook
 * Covers QR scanning, verification, history management, and event recording
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, act } from '@testing-library/react-native';

import ScanEventService from '../../services/scanEventService';
import { useScan } from '../useScan';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../services/scanEventService');
jest.mock('../../services/deliveryApi');

describe('useScan Hook', () => {
  const mockDeliveryId = 'DEL001';

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (ScanEventService.recordScanEvent as jest.Mock).mockResolvedValue({
      id: 'event1',
      deliveryId: mockDeliveryId,
      timestamp: new Date().toISOString(),
    });
  });

  it('should be importable and initialized', () => {
    const { result } = renderHook(() => useScan(mockDeliveryId));

    expect(result.current).toBeDefined();
    expect(result.current.scannedCode).toBeNull();
    expect(result.current.verificationState.status).toBe('idle');
    expect(result.current.history).toEqual([]);
  });

  it('should manage scan history correctly', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const { result } = renderHook(() => useScan(mockDeliveryId));

    await act(async () => {
      await result.current.handleScan('METAPHARM-PKG-DEL001-PKG0001-0711');
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@delivery_scan_history',
      expect.any(String)
    );
  });

  it('should handle empty QR code', async () => {
    const { result } = renderHook(() => useScan(mockDeliveryId));

    await act(async () => {
      await result.current.handleScan('');
    });

    expect(result.current.verificationState.status).toBe('failed');
    expect(result.current.verificationState.error).toContain('Empty');
  });

  it('should clear history', async () => {
    const { result } = renderHook(() => useScan(mockDeliveryId));

    await act(async () => {
      await result.current.clearHistory();
    });

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@delivery_scan_history');
  });

  it('should handle scan event recording errors gracefully', async () => {
    const { result } = renderHook(() => useScan(mockDeliveryId));

    // First set up the error scenario
    (ScanEventService.recordScanEvent as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

    await act(async () => {
      // Should not throw even if event recording fails
      await result.current.handleScan('METAPHARM-PKG-DEL001-PKG0001-0711');
    });

    // Verify that history was still recorded despite event error
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@delivery_scan_history',
      expect.any(String)
    );
  });
});
