/**
 * Tests for Scan Event Service
 * Covers event recording, storage, retrieval, and statistics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanEventService } from '../scanEventService';
import type { ScanEvent } from '../../types/scanner';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('ScanEventService', () => {
  const mockDeliveryId = 'DEL001';
  const mockPackageQrCode = 'METAPHARM-PKG-DEL001-PKG0001-0711';
  const mockLocation = { latitude: 46.9479, longitude: 7.4474 };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordScanEvent', () => {
    it('should record a new scan event', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const event = await ScanEventService.recordScanEvent({
        deliveryId: mockDeliveryId,
        packageQrCode: mockPackageQrCode,
        location: mockLocation,
        verified: true,
      });

      expect(event).toBeDefined();
      expect(event.deliveryId).toBe(mockDeliveryId);
      expect(event.packageQrCode).toBe(mockPackageQrCode);
      expect(event.verified).toBe(true);
      expect(event.timestamp).toBeDefined();
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should record scan event with patient ID', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const patientId = 'PAT123456';
      const event = await ScanEventService.recordScanEvent({
        deliveryId: mockDeliveryId,
        packageQrCode: mockPackageQrCode,
        patientIdScanned: patientId,
        location: mockLocation,
        verified: true,
      });

      expect(event.patientIdScanned).toBe(patientId);
    });

    it('should record failed scan event', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const event = await ScanEventService.recordScanEvent({
        deliveryId: mockDeliveryId,
        packageQrCode: mockPackageQrCode,
        location: mockLocation,
        verified: false,
      });

      expect(event.verified).toBe(false);
    });

    it('should use default location when not provided', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const event = await ScanEventService.recordScanEvent({
        deliveryId: mockDeliveryId,
        packageQrCode: mockPackageQrCode,
        verified: true,
      });

      expect(event.location).toEqual({ latitude: 0, longitude: 0 });
    });
  });

  describe('getScanEventsByDelivery', () => {
    it('should retrieve scan events for specific delivery', async () => {
      const mockEvents: ScanEvent[] = [
        {
          id: 'event1',
          deliveryId: mockDeliveryId,
          packageQrCode: mockPackageQrCode,
          timestamp: new Date().toISOString(),
          location: mockLocation,
          verified: true,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockEvents));

      const events = await ScanEventService.getScanEventsByDelivery(mockDeliveryId);

      expect(events).toHaveLength(1);
      expect(events[0].deliveryId).toBe(mockDeliveryId);
    });

    it('should return empty array when no events found', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const events = await ScanEventService.getScanEventsByDelivery(mockDeliveryId);

      expect(events).toEqual([]);
    });

    it('should filter events by delivery ID', async () => {
      const mockEvents: ScanEvent[] = [
        {
          id: 'event1',
          deliveryId: mockDeliveryId,
          packageQrCode: mockPackageQrCode,
          timestamp: new Date().toISOString(),
          location: mockLocation,
          verified: true,
        },
        {
          id: 'event2',
          deliveryId: 'DEL002',
          packageQrCode: 'METAPHARM-PKG-DEL002-PKG0002-0712',
          timestamp: new Date().toISOString(),
          location: mockLocation,
          verified: true,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockEvents));

      const events = await ScanEventService.getScanEventsByDelivery(mockDeliveryId);

      expect(events).toHaveLength(1);
      expect(events[0].deliveryId).toBe(mockDeliveryId);
    });
  });

  describe('updateScanEvent', () => {
    it('should update existing scan event', async () => {
      const originalEvent: ScanEvent = {
        id: 'event1',
        deliveryId: mockDeliveryId,
        packageQrCode: mockPackageQrCode,
        timestamp: new Date().toISOString(),
        location: mockLocation,
        verified: false,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify([originalEvent]));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const updated = await ScanEventService.updateScanEvent('event1', {
        verified: true,
        patientIdScanned: 'PAT123456',
      });

      expect(updated).toBeDefined();
      expect(updated?.verified).toBe(true);
      expect(updated?.patientIdScanned).toBe('PAT123456');
    });

    it('should return null when event not found', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify([]));

      const result = await ScanEventService.updateScanEvent('nonexistent', { verified: true });

      expect(result).toBeNull();
    });
  });

  describe('deleteScanEvent', () => {
    it('should delete scan event', async () => {
      const mockEvents: ScanEvent[] = [
        {
          id: 'event1',
          deliveryId: mockDeliveryId,
          packageQrCode: mockPackageQrCode,
          timestamp: new Date().toISOString(),
          location: mockLocation,
          verified: true,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockEvents));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await ScanEventService.deleteScanEvent('event1');

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should return false when event not found', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify([]));

      const result = await ScanEventService.deleteScanEvent('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('isPackageAlreadyScanned', () => {
    it('should return true when package was already scanned and verified', async () => {
      const mockEvents: ScanEvent[] = [
        {
          id: 'event1',
          deliveryId: mockDeliveryId,
          packageQrCode: mockPackageQrCode,
          timestamp: new Date().toISOString(),
          location: mockLocation,
          verified: true,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockEvents));

      const result = await ScanEventService.isPackageAlreadyScanned(mockDeliveryId, mockPackageQrCode);

      expect(result).toBe(true);
    });

    it('should return false when package not scanned', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify([]));

      const result = await ScanEventService.isPackageAlreadyScanned(mockDeliveryId, mockPackageQrCode);

      expect(result).toBe(false);
    });

    it('should return false when package scanned but not verified', async () => {
      const mockEvents: ScanEvent[] = [
        {
          id: 'event1',
          deliveryId: mockDeliveryId,
          packageQrCode: mockPackageQrCode,
          timestamp: new Date().toISOString(),
          location: mockLocation,
          verified: false,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockEvents));

      const result = await ScanEventService.isPackageAlreadyScanned(mockDeliveryId, mockPackageQrCode);

      expect(result).toBe(false);
    });
  });

  describe('getPatientIdScans', () => {
    it('should retrieve only scans with patient ID', async () => {
      const mockEvents: ScanEvent[] = [
        {
          id: 'event1',
          deliveryId: mockDeliveryId,
          packageQrCode: mockPackageQrCode,
          patientIdScanned: 'PAT123456',
          timestamp: new Date().toISOString(),
          location: mockLocation,
          verified: true,
        },
        {
          id: 'event2',
          deliveryId: mockDeliveryId,
          packageQrCode: mockPackageQrCode,
          timestamp: new Date().toISOString(),
          location: mockLocation,
          verified: true,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockEvents));

      const patientIdScans = await ScanEventService.getPatientIdScans(mockDeliveryId);

      expect(patientIdScans).toHaveLength(1);
      expect(patientIdScans[0].patientIdScanned).toBe('PAT123456');
    });
  });

  describe('getScanStatistics', () => {
    it('should return accurate scan statistics', async () => {
      const now = new Date();
      const mockEvents: ScanEvent[] = [
        {
          id: 'event1',
          deliveryId: mockDeliveryId,
          packageQrCode: mockPackageQrCode,
          timestamp: new Date(now.getTime() - 60000).toISOString(),
          location: mockLocation,
          verified: true,
        },
        {
          id: 'event2',
          deliveryId: mockDeliveryId,
          packageQrCode: 'METAPHARM-PKG-DEL001-PKG0002-0712',
          timestamp: new Date(now.getTime() - 30000).toISOString(),
          location: mockLocation,
          verified: false,
        },
        {
          id: 'event3',
          deliveryId: mockDeliveryId,
          packageQrCode: 'METAPHARM-PKG-DEL001-PKG0003-0713',
          patientIdScanned: 'PAT123456',
          timestamp: now.toISOString(),
          location: mockLocation,
          verified: true,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockEvents));

      const stats = await ScanEventService.getScanStatistics(mockDeliveryId);

      expect(stats.totalScans).toBe(3);
      expect(stats.verifiedScans).toBe(2);
      expect(stats.failedScans).toBe(1);
      expect(stats.patientIdScans).toBe(1);
      expect(stats.timeRange.firstScan).toBeDefined();
      expect(stats.timeRange.lastScan).toBeDefined();
    });

    it('should return empty statistics for delivery with no scans', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify([]));

      const stats = await ScanEventService.getScanStatistics(mockDeliveryId);

      expect(stats.totalScans).toBe(0);
      expect(stats.verifiedScans).toBe(0);
      expect(stats.failedScans).toBe(0);
      expect(stats.patientIdScans).toBe(0);
      expect(stats.timeRange.firstScan).toBeNull();
      expect(stats.timeRange.lastScan).toBeNull();
    });
  });

  describe('clearAllScanEvents', () => {
    it('should clear all scan events', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValueOnce(undefined);

      await ScanEventService.clearAllScanEvents();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@delivery_scan_events');
    });
  });

  describe('error handling', () => {
    it('should handle storage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      const events = await ScanEventService.getScanEventsByDelivery(mockDeliveryId);

      expect(events).toEqual([]);
    });

    it('should throw error on save failure', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Save failed'));

      await expect(
        ScanEventService.recordScanEvent({
          deliveryId: mockDeliveryId,
          packageQrCode: mockPackageQrCode,
          verified: true,
        })
      ).rejects.toThrow();
    });
  });
});
