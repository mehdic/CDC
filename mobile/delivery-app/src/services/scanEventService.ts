/**
 * Scan Event Service
 * Manages recording of QR code scans with timestamps and GPS location
 *
 * Features:
 * - Record scan events with metadata
 * - Capture GPS coordinates
 * - Track patient ID scans for controlled substances
 * - Persist events to local storage
 * - Sync events to backend API
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ScanEvent, ScanVerificationResult } from '../types/scanner';

const SCAN_EVENTS_KEY = '@delivery_scan_events';
const MAX_EVENTS = 100;

/**
 * GPS Location coordinates
 */
interface GPSLocation {
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracy?: number;
  readonly altitude?: number;
}

/**
 * Scan event creation input
 */
export interface CreateScanEventInput {
  readonly deliveryId: string;
  readonly packageQrCode: string;
  readonly patientIdScanned?: string;
  readonly location?: GPSLocation;
  readonly verified: boolean;
  readonly verificationResult?: ScanVerificationResult;
  readonly notes?: string;
}

/**
 * Scan Event Service
 * Manages QR code scan recording and event persistence
 */
export class ScanEventService {
  /**
   * Record a new scan event
   */
  static async recordScanEvent(input: CreateScanEventInput): Promise<ScanEvent> {
    const event: ScanEvent = {
      id: this.generateEventId(),
      deliveryId: input.deliveryId,
      packageQrCode: input.packageQrCode,
      patientIdScanned: input.patientIdScanned,
      timestamp: new Date().toISOString(),
      location: input.location || { latitude: 0, longitude: 0 },
      verified: input.verified,
      verificationResult: input.verificationResult,
      notes: input.notes,
    };

    // Store in local persistence
    await this.saveScanEvent(event);

    // Queue for backend sync (if offline, will retry later)
    // This is handled by offlineQueueService in the actual implementation
    return event;
  }

  /**
   * Save scan event to local storage
   */
  private static async saveScanEvent(event: ScanEvent): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(SCAN_EVENTS_KEY);
      const events: ScanEvent[] = stored ? JSON.parse(stored) : [];

      // Add new event at the beginning
      const updated = [event, ...events].slice(0, MAX_EVENTS);

      await AsyncStorage.setItem(SCAN_EVENTS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save scan event:', error);
      throw error;
    }
  }

  /**
   * Get all scan events for a delivery
   */
  static async getScanEventsByDelivery(deliveryId: string): Promise<readonly ScanEvent[]> {
    try {
      const stored = await AsyncStorage.getItem(SCAN_EVENTS_KEY);
      const events: ScanEvent[] = stored ? JSON.parse(stored) : [];

      return events.filter(e => e.deliveryId === deliveryId);
    } catch (error) {
      console.error('Failed to retrieve scan events:', error);
      return [];
    }
  }

  /**
   * Get all scan events
   */
  static async getAllScanEvents(): Promise<readonly ScanEvent[]> {
    try {
      const stored = await AsyncStorage.getItem(SCAN_EVENTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to retrieve all scan events:', error);
      return [];
    }
  }

  /**
   * Get scan event by ID
   */
  static async getScanEventById(eventId: string): Promise<ScanEvent | null> {
    try {
      const events = await this.getAllScanEvents();
      return events.find(e => e.id === eventId) || null;
    } catch (error) {
      console.error('Failed to retrieve scan event:', error);
      return null;
    }
  }

  /**
   * Update scan event (e.g., add patient ID after initial scan)
   */
  static async updateScanEvent(eventId: string, updates: Partial<ScanEvent>): Promise<ScanEvent | null> {
    try {
      const stored = await AsyncStorage.getItem(SCAN_EVENTS_KEY);
      const events: ScanEvent[] = stored ? JSON.parse(stored) : [];

      const index = events.findIndex(e => e.id === eventId);
      if (index === -1) {
        return null;
      }

      const updated = { ...events[index], ...updates, id: events[index].id, timestamp: events[index].timestamp };
      events[index] = updated;

      await AsyncStorage.setItem(SCAN_EVENTS_KEY, JSON.stringify(events));

      return updated;
    } catch (error) {
      console.error('Failed to update scan event:', error);
      throw error;
    }
  }

  /**
   * Delete scan event
   */
  static async deleteScanEvent(eventId: string): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(SCAN_EVENTS_KEY);
      const events: ScanEvent[] = stored ? JSON.parse(stored) : [];

      const filtered = events.filter(e => e.id !== eventId);

      if (filtered.length === events.length) {
        return false; // Event not found
      }

      await AsyncStorage.setItem(SCAN_EVENTS_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Failed to delete scan event:', error);
      throw error;
    }
  }

  /**
   * Clear all scan events
   */
  static async clearAllScanEvents(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SCAN_EVENTS_KEY);
    } catch (error) {
      console.error('Failed to clear scan events:', error);
      throw error;
    }
  }

  /**
   * Get verified scans count for delivery
   */
  static async getVerifiedScansCount(deliveryId: string): Promise<number> {
    const events = await this.getScanEventsByDelivery(deliveryId);
    return events.filter(e => e.verified).length;
  }

  /**
   * Get failed scans for delivery
   */
  static async getFailedScans(deliveryId: string): Promise<readonly ScanEvent[]> {
    const events = await this.getScanEventsByDelivery(deliveryId);
    return events.filter(e => !e.verified);
  }

  /**
   * Check if package was already scanned in delivery
   */
  static async isPackageAlreadyScanned(deliveryId: string, packageQrCode: string): Promise<boolean> {
    const events = await this.getScanEventsByDelivery(deliveryId);
    return events.some(e => e.packageQrCode === packageQrCode && e.verified);
  }

  /**
   * Get patient ID scans for delivery (controlled substances)
   */
  static async getPatientIdScans(deliveryId: string): Promise<readonly ScanEvent[]> {
    const events = await this.getScanEventsByDelivery(deliveryId);
    return events.filter(e => e.patientIdScanned);
  }

  /**
   * Generate unique event ID
   */
  private static generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Export scan events for audit trail
   */
  static async exportScanEventsForDelivery(deliveryId: string): Promise<string> {
    const events = await this.getScanEventsByDelivery(deliveryId);
    return JSON.stringify(events, null, 2);
  }

  /**
   * Get scan statistics for delivery
   */
  static async getScanStatistics(deliveryId: string): Promise<{
    readonly totalScans: number;
    readonly verifiedScans: number;
    readonly failedScans: number;
    readonly patientIdScans: number;
    readonly timeRange: {
      readonly firstScan: string | null;
      readonly lastScan: string | null;
    };
  }> {
    const events = await this.getScanEventsByDelivery(deliveryId);

    const verifiedScans = events.filter(e => e.verified).length;
    const failedScans = events.filter(e => !e.verified).length;
    const patientIdScans = events.filter(e => e.patientIdScanned).length;

    const sortedByTime = [...events].sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    return {
      totalScans: events.length,
      verifiedScans,
      failedScans,
      patientIdScans,
      timeRange: {
        firstScan: sortedByTime.length > 0 ? sortedByTime[0].timestamp : null,
        lastScan: sortedByTime.length > 0 ? sortedByTime[sortedByTime.length - 1].timestamp : null,
      },
    };
  }
}

export default ScanEventService;
