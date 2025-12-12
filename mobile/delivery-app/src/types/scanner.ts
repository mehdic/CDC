/**
 * QR Scanner Type Definitions
 * Types for QR code scanning, verification, and history
 */

/**
 * Camera permission status
 */
export type CameraPermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable' | 'checking';

/**
 * Scan result from API verification
 */
export interface ScanVerificationResult {
  readonly valid: boolean;
  readonly deliveryId: string;
  readonly packageId: string;
  readonly expectedPackageId?: string;
  readonly matchesDelivery: boolean;
  readonly package?: {
    readonly id: string;
    readonly deliveryId: string;
    readonly medications: Array<{
      readonly id: string;
      readonly name: string;
      readonly quantity: number;
    }>;
    readonly specialHandling: string[];
  };
  readonly errors?: readonly string[];
}

/**
 * Scan event recorded for delivery
 */
export interface ScanEvent {
  readonly id: string;
  readonly deliveryId: string;
  readonly packageQrCode: string;
  readonly patientIdScanned?: string;
  readonly timestamp: string;
  readonly location: {
    readonly latitude: number;
    readonly longitude: number;
  };
  readonly verified: boolean;
  readonly verificationResult?: ScanVerificationResult;
  readonly notes?: string;
}

/**
 * Scan history entry for UI display
 */
export interface ScanHistoryEntry {
  readonly id: string;
  readonly packageQrCode: string;
  readonly scannedAt: string;
  readonly status: 'verified' | 'failed' | 'pending';
  readonly verificationMessage?: string;
  readonly location?: {
    readonly latitude: number;
    readonly longitude: number;
  };
}

/**
 * Package verification state in UI
 */
export interface PackageVerificationState {
  readonly status: 'idle' | 'scanning' | 'verifying' | 'verified' | 'failed';
  readonly qrCode?: string;
  readonly result?: ScanVerificationResult;
  readonly error?: string;
  readonly isLoading: boolean;
}

/**
 * Scanner hook return type
 */
export interface UseScanReturn {
  readonly scannedCode: string | null;
  readonly verificationState: PackageVerificationState;
  readonly history: readonly ScanHistoryEntry[];
  readonly handleScan: (qrCode: string) => Promise<void>;
  readonly handleRescan: () => void;
  readonly clearHistory: () => void;
}

/**
 * Patient ID scan for controlled substances
 */
export interface PatientIdScan {
  readonly patientId: string;
  readonly scannedAt: string;
  readonly verified: boolean;
}
