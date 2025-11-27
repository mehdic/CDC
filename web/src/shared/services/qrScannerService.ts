/**
 * QR Scanner Service
 * Provides abstraction layer for QR code scanning functionality
 * Supports multiple barcode formats: QR, Code128, EAN-13, etc.
 */

export interface QRScanResult {
  code: string;
  format: string;
  timestamp: number;
  rawResult?: Record<string, unknown>;
}

export interface QRScannerConfig {
  fps: number;
  qrbox: { width: number; height: number };
  aspectRatio: number;
  showTorch: boolean;
  showZoom: boolean;
}

/**
 * Abstract interface for camera provider
 * Allows for different implementations (real camera, mock, etc.)
 */
export interface ICameraProvider {
  initialize(containerId: string, config: QRScannerConfig): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  clear(): Promise<void>;
  toggleTorch(): Promise<void>;
  setZoom(level: number): Promise<void>;
  isAvailable(): Promise<boolean>;
}

/**
 * QRScanner service that handles scanning operations
 */
export class QRScannerService {
  private cameraProvider: ICameraProvider;
  private isScanning: boolean = false;
  private onScanCallback: ((result: QRScanResult) => void) | null = null;
  private onErrorCallback: ((error: unknown) => void) | null = null;

  constructor(cameraProvider: ICameraProvider) {
    this.cameraProvider = cameraProvider;
  }

  /**
   * Initialize the QR scanner with specified container and configuration
   */
  async initialize(containerId: string, config?: Partial<QRScannerConfig>): Promise<void> {
    const defaultConfig: QRScannerConfig = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      showTorch: true,
      showZoom: true,
      ...config,
    };

    await this.cameraProvider.initialize(containerId, defaultConfig);
  }

  /**
   * Start scanning for QR codes
   */
  async startScanning(
    onScan: (result: QRScanResult) => void,
    onError?: (error: unknown) => void
  ): Promise<void> {
    if (this.isScanning) {
      throw new Error('Scanner is already running');
    }

    this.onScanCallback = onScan;
    this.onErrorCallback = onError || null;
    this.isScanning = true;

    try {
      await this.cameraProvider.start();
    } catch (error) {
      this.isScanning = false;
      throw error;
    }
  }

  /**
   * Stop scanning
   */
  async stopScanning(): Promise<void> {
    if (!this.isScanning) {
      return;
    }

    this.isScanning = false;
    this.onScanCallback = null;
    this.onErrorCallback = null;

    try {
      await this.cameraProvider.stop();
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    await this.stopScanning();
    try {
      await this.cameraProvider.clear();
    } catch (error) {
      console.warn('Error cleaning up scanner:', error);
    }
  }

  /**
   * Check if scanner is currently scanning
   */
  isActive(): boolean {
    return this.isScanning;
  }

  /**
   * Toggle torch/flashlight
   */
  async toggleTorch(): Promise<void> {
    await this.cameraProvider.toggleTorch();
  }

  /**
   * Set zoom level (0-1)
   */
  async setZoom(level: number): Promise<void> {
    if (level < 0 || level > 1) {
      throw new Error('Zoom level must be between 0 and 1');
    }
    await this.cameraProvider.setZoom(level);
  }

  /**
   * Check if camera is available
   */
  async isCameraAvailable(): Promise<boolean> {
    return this.cameraProvider.isAvailable();
  }

  /**
   * Trigger a scan result (for testing/manual entry)
   */
  triggerScanResult(code: string, format: string = 'QR_CODE'): void {
    if (!this.onScanCallback) {
      console.warn('No scan callback registered');
      return;
    }

    const result: QRScanResult = {
      code,
      format,
      timestamp: Date.now(),
    };

    this.onScanCallback(result);
  }

  /**
   * Trigger an error (for testing)
   */
  triggerError(error: unknown): void {
    if (!this.onErrorCallback) {
      console.warn('No error callback registered');
      return;
    }
    this.onErrorCallback(error);
  }
}
